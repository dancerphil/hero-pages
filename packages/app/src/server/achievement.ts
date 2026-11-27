import { Hono } from 'hono';
import { parseOptions, pickChoices, titleKey, validateQuestions, type AchievementDetail, type FeedQuestion, type QuestionInput, type QuestionRow } from '@/shared/achievementModel';
import { requireRole, requireUser, type AppEnv } from './session';
import { createAchievement, findByTitle, mergeAchievement, upsertQuestion } from './achievementStore';

export const achievementRoutes = new Hono<AppEnv>()
    .get('/', requireUser, async (c) => {
        const { results } = await c.env.DB.prepare(
            `SELECT a.id AS achievementId, a.title AS achievementTitle, q.tier, q.prompt, q.kind, q.options
             FROM question q JOIN achievement a ON a.id = q.achievement_id
             WHERE NOT EXISTS (
               SELECT 1 FROM user_achievement ua WHERE ua.question_id = q.id AND ua.user_id = ?
             )
             ORDER BY RANDOM() LIMIT 20`,
        )
            .bind(c.get('user').id)
            .all<Omit<FeedQuestion, 'choices'> & { options: string | null }>();
        return c.json(
            results.map(({ options, ...row }) => {
                const parsed = parseOptions(options);
                return { ...row, choices: parsed && pickChoices(parsed) };
            }) satisfies FeedQuestion[],
        );
    })
    .get('/by-name/:name', requireUser, async (c) => {
        const achievement = await findByTitle(c.env.DB, c.req.param('name'));
        if (!achievement) return c.json({ error: '成就不存在' }, 404);
        return c.json(achievement);
    })
    .get('/titles', requireUser, async (c) => {
        const { results } = await c.env.DB.prepare('SELECT id, title FROM achievement ORDER BY title').all<{
            id: number;
            title: string;
        }>();
        return c.json(results);
    })
    .post('/', requireUser, async (c) => {
        const { title, questions } = await c.req.json<{ title: string; questions: QuestionInput[] }>();
        const error = validateQuestions(questions);
        if (error) return c.json({ error }, 400);
        const result = await createAchievement(c.env.DB, { title, creatorId: c.get('user').id, questions });
        return c.json(result);
    })
    .get('/:id', requireUser, async (c) => {
        const id = Number(c.req.param('id'));
        const achievement = await c.env.DB.prepare(
            `SELECT a.id, a.title, u.username AS creator
             FROM achievement a JOIN user u ON u.id = a.creator_id WHERE a.id = ?`,
        )
            .bind(id)
            .first<{ id: number; title: string; creator: string }>();
        if (!achievement) return c.json({ error: '成就不存在' }, 404);
        const { results: aliases } = await c.env.DB.prepare(
            'SELECT name FROM achievement_alias WHERE achievement_id = ? AND name_key != ?',
        )
            .bind(id, titleKey(achievement.title))
            .all<{ name: string }>();
        const { results } = await c.env.DB.prepare(
            `SELECT q.id, q.tier, q.prompt, q.criteria, q.kind, q.options,
                    EXISTS (SELECT 1 FROM user_achievement ua WHERE ua.question_id = q.id AND ua.user_id = ?) AS unlocked
             FROM question q WHERE q.achievement_id = ?`,
        )
            .bind(c.get('user').id, id)
            .all<QuestionRow & { unlocked: number }>();
        return c.json({
            ...achievement,
            aliases: aliases.map(alias => alias.name),
            questions: results.map((row) => {
                const options = parseOptions(row.options);
                return {
                    tier: row.tier,
                    prompt: row.prompt,
                    kind: row.kind,
                    unlocked: row.unlocked === 1,
                    choices: options && pickChoices(options),
                };
            }),
        } satisfies AchievementDetail);
    })
    .get('/:id/edit', requireUser, async (c) => {
        const id = Number(c.req.param('id'));
        const achievement = await c.env.DB.prepare('SELECT title FROM achievement WHERE id = ?')
            .bind(id)
            .first<{ title: string }>();
        if (!achievement) return c.json({ error: '成就不存在' }, 404);
        const { results } = await c.env.DB.prepare(
            'SELECT tier, prompt, criteria, kind, options FROM question WHERE achievement_id = ?',
        )
            .bind(id)
            .all<Omit<QuestionRow, 'id'>>();
        return c.json({
            title: achievement.title,
            questions: results.map(row => ({ ...row, options: parseOptions(row.options) })) satisfies QuestionInput[],
        });
    })
    .put('/:id', requireUser, async (c) => {
        const id = Number(c.req.param('id'));
        const { title, questions } = await c.req.json<{ title: string; questions: QuestionInput[] }>();
        const error = validateQuestions(questions);
        if (error) return c.json({ error }, 400);
        const owner = await findByTitle(c.env.DB, title);
        if (owner && owner.id !== id) return c.json({ error: '已有同名成就，请使用合并' }, 400);
        await c.env.DB.batch([
            c.env.DB.prepare(`UPDATE achievement SET title = ?, updated_at = datetime('now') WHERE id = ?`).bind(title, id),
            c.env.DB.prepare(
                `INSERT OR IGNORE INTO achievement_alias (name_key, name, achievement_id) VALUES (?, ?, ?)`,
            ).bind(titleKey(title), title, id),
            c.env.DB.prepare(
                `DELETE FROM question WHERE achievement_id = ? AND tier NOT IN (${questions.map(() => '?').join(', ')})`,
            ).bind(id, ...questions.map(question => question.tier)),
            ...questions.map(question => upsertQuestion({ db: c.env.DB, achievementId: id, question })),
        ]);
        return c.json({ id });
    })
    .post('/:id/merge', requireRole('admin'), async (c) => {
        const sourceId = Number(c.req.param('id'));
        const { targetId } = await c.req.json<{ targetId: number }>();
        if (sourceId === targetId) return c.json({ error: '不能合并到自己' }, 400);
        await mergeAchievement(c.env.DB, { sourceId, targetId });
        return c.json({ id: targetId });
    })
    .delete('/:id', requireRole('admin'), async (c) => {
        await c.env.DB.prepare('DELETE FROM achievement WHERE id = ?').bind(Number(c.req.param('id'))).run();
        return c.json({ ok: true });
    });

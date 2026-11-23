import { Hono } from 'hono';
import { requireUser, type AppEnv } from '@hero-pages/account/server';
import { type MineUnlock, parseOptions, pickChoices } from '@/shared/achievementModel';
import type { AnswerRecord, UserPage } from '@/shared/user';

export const userRoutes = new Hono<AppEnv>()
    .get('/:uid/answers', requireUser, async (c) => {
        if (c.get('user').uid !== c.req.param('uid')) return c.json({ error: '无权限' }, 403);
        const { results } = await c.env.DB.prepare(
            `SELECT ua.id, a.id AS achievementId, a.title, q.tier, q.prompt, q.kind, q.options,
                    ua.answer, ua.passed, ua.created_at AS createdAt
             FROM user_answer ua
             JOIN question q ON q.id = ua.question_id
             JOIN achievement a ON a.id = q.achievement_id
             WHERE ua.user_id = ?
             ORDER BY ua.created_at DESC, ua.id DESC`,
        )
            .bind(c.get('user').id)
            .all<Omit<AnswerRecord, 'choices' | 'passed'> & { options: string | null; passed: number }>();
        return c.json(
            results.map(({ options, passed, ...row }) => {
                const parsed = parseOptions(options);
                return { ...row, passed: passed === 1, choices: parsed && pickChoices(parsed) };
            }) satisfies AnswerRecord[],
        );
    })
    .get('/:uid', async (c) => {
        const user = await c.env.DB.prepare('SELECT id, uid, username FROM user WHERE uid = ?')
            .bind(c.req.param('uid'))
            .first<{ id: number; uid: string; username: string }>();
        if (!user) return c.json({ error: '用户不存在' }, 404);
        const { results } = await c.env.DB.prepare(
            `SELECT q.id AS questionId, a.id AS achievementId, a.title, q.tier, ua.unlocked_at AS unlockedAt,
                (SELECT COUNT(*) FROM user_achievement x WHERE x.question_id = q.id) AS rarity
         FROM user_achievement ua
         JOIN question q ON q.id = ua.question_id
         JOIN achievement a ON a.id = q.achievement_id
         WHERE ua.user_id = ?
         ORDER BY ua.unlocked_at DESC`,
        )
            .bind(user.id)
            .all<MineUnlock>();
        return c.json({ uid: user.uid, username: user.username, unlocks: results } satisfies UserPage);
    });

export async function mergeUser(c: { env: Env }, input: { from: number; to: number }) {
    await c.env.DB.batch([
        c.env.DB.prepare('UPDATE achievement SET creator_id = ? WHERE creator_id = ?').bind(input.to, input.from),
        c.env.DB.prepare(
            `INSERT OR IGNORE INTO user_achievement (user_id, question_id, unlocked_at)
             SELECT ?, question_id, unlocked_at FROM user_achievement WHERE user_id = ?`,
        ).bind(input.to, input.from),
        c.env.DB.prepare('DELETE FROM user WHERE id = ?').bind(input.from),
    ]);
}

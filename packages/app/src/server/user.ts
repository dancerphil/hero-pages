import { Hono } from 'hono';
import { requireUser, type AppEnv } from '@hero-pages/account/server';
import { type MineUnlock, parseOptions, pickChoices } from '@/shared/achievementModel';
import type { AnswerRecord, UserPage } from '@/shared/user';

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const avatarKey = (userId: number) => `avatar/${userId}`;

export const userRoutes = new Hono<AppEnv>()
    .put('/me/avatar', requireUser, async (c) => {
        const { avatar } = await c.req.parseBody();
        if (!(avatar instanceof File) || !AVATAR_TYPES.includes(avatar.type) || avatar.size > MAX_AVATAR_BYTES) {
            return c.json({ error: '请上传 2MB 以内的 JPG / PNG / WebP 图片' }, 400);
        }
        await c.env.IMAGES.put(avatarKey(c.get('user').id), avatar, { httpMetadata: { contentType: avatar.type } });
        await c.env.DB.prepare(`UPDATE user SET avatar_updated_at = datetime('now') WHERE id = ?`)
            .bind(c.get('user').id)
            .run();
        return c.json({ ok: true });
    })
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
    .get('/:uid/avatar', async (c) => {
        const user = await c.env.DB.prepare('SELECT id FROM user WHERE uid = ? AND avatar_updated_at IS NOT NULL')
            .bind(c.req.param('uid'))
            .first<{ id: number }>();
        if (!user) return c.json({ error: '头像不存在' }, 404);
        const object = await c.env.IMAGES.get(avatarKey(user.id));
        if (!object) return c.json({ error: '头像不存在' }, 404);
        return new Response(object.body, {
            headers: {
                'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    })
    .get('/:uid', async (c) => {
        const user = await c.env.DB.prepare('SELECT id, uid, username, avatar_updated_at AS avatarUpdatedAt FROM user WHERE uid = ?')
            .bind(c.req.param('uid'))
            .first<{ id: number; uid: string; username: string; avatarUpdatedAt: string | null }>();
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
        return c.json({
            uid: user.uid,
            username: user.username,
            avatarUpdatedAt: user.avatarUpdatedAt,
            unlocks: results,
        } satisfies UserPage);
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

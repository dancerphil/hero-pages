import { Hono } from 'hono';
import type { NovelRow } from '@/shared/novel';
import { requireUser, type AppEnv } from './session';

export const novelRoutes = new Hono<AppEnv>()
    .get('/', requireUser, async (c) => {
        const { results } = await c.env.DB.prepare('SELECT uuid, name, paragraph, updated_at AS updatedAt FROM novel WHERE user_id = ?')
            .bind(c.get('user').id)
            .all<NovelRow>();
        return c.json(results);
    })
    .post('/', requireUser, async (c) => {
        const { uuid, name, text, paragraph, updatedAt } = await c.req.json<NovelRow & { text: string }>();
        const userId = c.get('user').id;
        const textKey = `novels/${userId}/${uuid}`;
        await c.env.IMAGES.put(textKey, text, { httpMetadata: { contentType: 'text/plain; charset=utf-8' } });
        await c.env.DB.prepare('INSERT INTO novel (user_id, uuid, name, text_key, paragraph, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(userId, uuid, name, textKey, paragraph, updatedAt)
            .run();
        return c.json({ ok: true });
    })
    .get('/:uuid/text', requireUser, async (c) => {
        const row = await c.env.DB.prepare('SELECT text_key FROM novel WHERE uuid = ? AND user_id = ?')
            .bind(c.req.param('uuid'), c.get('user').id)
            .first<{ text_key: string }>();
        if (!row) return c.json({ error: '小说不存在' }, 404);
        const object = await c.env.IMAGES.get(row.text_key);
        if (!object) return c.json({ error: '正文不存在' }, 404);
        return c.json({ text: await object.text() });
    })
    .patch('/:uuid', requireUser, async (c) => {
        const { name, paragraph, updatedAt } = await c.req.json<NovelRow>();
        const row = await c.env.DB.prepare(
            'UPDATE novel SET name = ?, paragraph = ?, updated_at = ? WHERE uuid = ? AND user_id = ? RETURNING uuid',
        )
            .bind(name, paragraph, updatedAt, c.req.param('uuid'), c.get('user').id)
            .first();
        if (!row) return c.json({ error: '小说不存在' }, 404);
        return c.json({ ok: true });
    });

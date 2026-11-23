import { Hono } from 'hono';
import { requireUser, type AppEnv } from '@hero-pages/account/server';
import type { NovelDetail, NovelRow } from '@/shared/novel';

const NOVEL_COLUMNS = 'id, name, created_at AS createdAt';

export const novelRoutes = new Hono<AppEnv>()
    .get('/', requireUser, async (c) => {
        const { results } = await c.env.DB.prepare(`SELECT ${NOVEL_COLUMNS} FROM novel WHERE user_id = ? ORDER BY id`)
            .bind(c.get('user').id)
            .all<NovelRow>();
        return c.json(results);
    })
    .post('/', requireUser, async (c) => {
        const { name, text } = await c.req.json<{ name: string; text: string }>();
        const textKey = `novels/${c.get('user').id}/${crypto.randomUUID()}`;
        await c.env.IMAGES.put(textKey, text, { httpMetadata: { contentType: 'text/plain; charset=utf-8' } });
        const novel = await c.env.DB.prepare(`INSERT INTO novel (user_id, name, text_key) VALUES (?, ?, ?) RETURNING ${NOVEL_COLUMNS}`)
            .bind(c.get('user').id, name, textKey)
            .first<NovelRow>();
        return c.json(novel);
    })
    .get('/:id', requireUser, async (c) => {
        const row = await c.env.DB.prepare('SELECT id, name, paragraph, text_key FROM novel WHERE id = ? AND user_id = ?')
            .bind(c.req.param('id'), c.get('user').id)
            .first<{ id: number; name: string; paragraph: number; text_key: string }>();
        if (!row) return c.json({ error: '小说不存在' }, 404);
        const object = await c.env.IMAGES.get(row.text_key);
        if (!object) return c.json({ error: '正文不存在' }, 404);
        return c.json({
            id: row.id,
            name: row.name,
            paragraph: row.paragraph,
            text: await object.text(),
        } satisfies NovelDetail);
    })
    .patch('/:id', requireUser, async (c) => {
        const { name, paragraph } = await c.req.json<{ name?: string; paragraph?: number }>();
        const row = await c.env.DB.prepare(
            `UPDATE novel SET name = COALESCE(?, name), paragraph = COALESCE(?, paragraph)
             WHERE id = ? AND user_id = ? RETURNING ${NOVEL_COLUMNS}`,
        )
            .bind(name ?? null, paragraph ?? null, c.req.param('id'), c.get('user').id)
            .first<NovelRow>();
        if (!row) return c.json({ error: '小说不存在' }, 404);
        return c.json(row);
    });

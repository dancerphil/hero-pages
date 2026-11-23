import { Hono } from 'hono';
import { requireUser, type AppEnv } from '@hero-pages/account/server';
import type { LevelRow } from '@/shared/level';

const LEVEL_COLUMNS = 'id, name, rows, cols, created_at AS createdAt';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const isSide = (value: number) => Number.isSafeInteger(value) && value >= 2 && value <= 10;

export const levelRoutes = new Hono<AppEnv>()
    .get('/', requireUser, async (c) => {
        const { results } = await c.env.DB.prepare(`SELECT ${LEVEL_COLUMNS} FROM level WHERE user_id = ? ORDER BY id DESC`)
            .bind(c.get('user').id)
            .all<LevelRow>();
        return c.json(results);
    })
    .post('/', requireUser, async (c) => {
        const { image, name, cols, rows } = await c.req.parseBody();
        if (!(image instanceof File) || !IMAGE_TYPES.includes(image.type) || image.size > MAX_IMAGE_BYTES) {
            return c.json({ error: '请上传 10MB 以内的 JPG / PNG / WebP 图片' }, 400);
        }
        if (typeof name !== 'string' || !name.trim()) return c.json({ error: '请填写关卡名称' }, 400);
        const colCount = Number(cols);
        const rowCount = Number(rows);
        if (!isSide(colCount) || !isSide(rowCount)) return c.json({ error: '列数和行数需为 2–10 的整数' }, 400);

        const imageKey = `${c.get('user').id}/${crypto.randomUUID()}`;
        await c.env.IMAGES.put(imageKey, image, { httpMetadata: { contentType: image.type } });
        const level = await c.env.DB.prepare(
            `INSERT INTO level (user_id, name, image_key, rows, cols) VALUES (?, ?, ?, ?, ?) RETURNING ${LEVEL_COLUMNS}`,
        )
            .bind(c.get('user').id, name.trim(), imageKey, rowCount, colCount)
            .first<LevelRow>();
        return c.json(level);
    })
    .get('/:id', requireUser, async (c) => {
        const level = await c.env.DB.prepare(`SELECT ${LEVEL_COLUMNS} FROM level WHERE id = ? AND user_id = ?`)
            .bind(c.req.param('id'), c.get('user').id)
            .first<LevelRow>();
        if (!level) return c.json({ error: '关卡不存在' }, 404);
        return c.json(level);
    })
    .get('/:id/image', requireUser, async (c) => {
        const row = await c.env.DB.prepare('SELECT image_key FROM level WHERE id = ? AND user_id = ?')
            .bind(c.req.param('id'), c.get('user').id)
            .first<{ image_key: string }>();
        if (!row) return c.json({ error: '关卡不存在' }, 404);
        const object = await c.env.IMAGES.get(row.image_key);
        if (!object) return c.json({ error: '图片不存在' }, 404);
        return new Response(object.body, {
            headers: {
                'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
                'Cache-Control': 'private, max-age=86400',
            },
        });
    })
    .delete('/:id', requireUser, async (c) => {
        const row = await c.env.DB.prepare('DELETE FROM level WHERE id = ? AND user_id = ? RETURNING image_key')
            .bind(c.req.param('id'), c.get('user').id)
            .first<{ image_key: string }>();
        if (!row) return c.json({ error: '关卡不存在' }, 404);
        await c.env.IMAGES.delete(row.image_key);
        return c.json({ ok: true });
    });

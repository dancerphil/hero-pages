import { Hono } from 'hono';
import { requireRole, type AppEnv, type UserRole } from '@hero-pages/account/server';
import type { AdminUserRow } from '@/shared/user';
import type { AdminNovelRow } from '@/shared/novel';

const ROLES: UserRole[] = ['admin', 'vip', 'user'];

export const adminRoutes = new Hono<AppEnv>()
    .get('/users', requireRole('admin'), async (c) => {
        const { results } = await c.env.DB.prepare('SELECT id, uid, username, email, role, created_at AS createdAt FROM user ORDER BY id')
            .all<AdminUserRow>();
        return c.json(results);
    })
    .patch('/users/:id', requireRole('admin'), async (c) => {
        const { role } = await c.req.json<{ role: UserRole }>();
        if (Number(c.req.param('id')) === c.get('user').id) return c.json({ error: '不能修改自己的角色' }, 400);
        if (!ROLES.includes(role)) return c.json({ error: '角色无效' }, 400);
        const row = await c.env.DB.prepare(
            `UPDATE user SET role = ? WHERE id = ? RETURNING id, uid, username, email, role, created_at AS createdAt`,
        )
            .bind(role, c.req.param('id'))
            .first<AdminUserRow>();
        if (!row) return c.json({ error: '用户不存在' }, 404);
        return c.json(row);
    })
    .get('/novels', requireRole('admin'), async (c) => {
        const { results } = await c.env.DB.prepare(
            `SELECT novel.uuid, novel.name, novel.paragraph, novel.created_at AS createdAt, user.username, user.uid
             FROM novel JOIN user ON user.id = novel.user_id ORDER BY novel.created_at`,
        )
            .all<AdminNovelRow>();
        return c.json(results);
    });

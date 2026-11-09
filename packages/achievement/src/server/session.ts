import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { randomToken } from './crypto';

export interface AppEnv {
    Bindings: Env;
    Variables: { user: UserRow };
}

export interface UserRow {
    id: number;
    uid: string;
    username: string;
    email: string | null;
    is_admin: number;
}

const SESSION_COOKIE = 'session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;

export async function findSessionUser(c: Context<AppEnv>) {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (!sessionId) return null;
    return c.env.DB.prepare(
        `SELECT user.id, user.uid, user.username, user.email, user.is_admin
         FROM session JOIN user ON user.id = session.user_id
         WHERE session.id = ? AND session.expires_at > datetime('now')`,
    )
        .bind(sessionId)
        .first<UserRow>();
}

export async function createSession(c: Context<AppEnv>, userId: number) {
    const sessionId = randomToken();
    await c.env.DB.prepare(`INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
        .bind(sessionId, userId)
        .run();
    setCookie(c, SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: SESSION_SECONDS,
    });
}

export async function deleteSession(c: Context<AppEnv>) {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (sessionId) await c.env.DB.prepare('DELETE FROM session WHERE id = ?').bind(sessionId).run();
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
    const user = await findSessionUser(c);
    if (!user) return c.json({ error: '未登录' }, 401);
    c.set('user', user);
    await next();
});

import { Hono } from 'hono';
import { hashPassword, randomDigits, verifyPassword } from './crypto';
import { consumeEmailCode, sendEmailCode, type CodePurpose } from './emailCode';
import { createSession, deleteSession, findSessionUser, requireUser, type AppEnv, type UserRow } from './session';
import { mergeUser } from './user';

const USER_COLUMNS = 'id, uid, username, email, is_admin';
const UID_PATTERN = /^[\w-]{3,32}$/;

export const authRoutes = new Hono<AppEnv>()
    .post('/device-login', async (c) => {
        const { deviceId } = await c.req.json<{ deviceId: string }>();
        let user = await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM user WHERE device_id = ?`)
            .bind(deviceId)
            .first<UserRow>();
        user ??= await c.env.DB.prepare(
            `INSERT INTO user (uid, username, device_id) VALUES (?, ?, ?) RETURNING ${USER_COLUMNS}`,
        )
            .bind(crypto.randomUUID(), `游客${randomDigits(4)}`, deviceId)
            .first<UserRow>();
        if (!user) throw new Error('游客用户创建失败');
        await createSession(c, user.id);
        return c.json(user);
    })
    .post('/email-codes', async (c) => {
        const { email, purpose } = await c.req.json<{ email: string; purpose: CodePurpose }>();
        const exists = await c.env.DB.prepare('SELECT 1 FROM user WHERE email = ?').bind(email).first();
        if (purpose === 'register' && exists) return c.json({ error: '邮箱已注册' }, 409);
        if (purpose === 'reset' && !exists) return c.json({ error: '邮箱未注册' }, 404);

        const cooling = await c.env.DB.prepare(
            `SELECT 1 FROM email_code WHERE email = ? AND purpose = ? AND created_at > datetime('now', '-60 seconds')`,
        )
            .bind(email, purpose)
            .first();
        if (cooling) return c.json({ error: '发送过于频繁，请 60 秒后再试' }, 429);
        await sendEmailCode(c, { email, purpose });
        return c.json({ ok: true });
    })
    .post('/register', async (c) => {
        const { email, code, password } = await c.req.json<{ email: string; code: string; password: string }>();
        if (!(await consumeEmailCode(c, { email, purpose: 'register', code }))) {
            return c.json({ error: '验证码错误或已过期' }, 400);
        }
        const passwordHash = await hashPassword(password);
        const username = email.split('@')[0];
        const current = await findSessionUser(c);

        const user =
            current?.email === null
                ? await c.env.DB.prepare(
                        `UPDATE user SET username = ?, email = ?, password_hash = ?, device_id = NULL
                       WHERE id = ? RETURNING ${USER_COLUMNS}`,
                    )
                        .bind(username, email, passwordHash, current.id)
                        .first<UserRow>()
                : await c.env.DB.prepare(
                        `INSERT INTO user (uid, username, email, password_hash) VALUES (?, ?, ?, ?) RETURNING ${USER_COLUMNS}`,
                    )
                        .bind(crypto.randomUUID(), username, email, passwordHash)
                        .first<UserRow>();
        if (!user) throw new Error('用户创建失败');
        await createSession(c, user.id);
        return c.json(user);
    })
    .post('/login', async (c) => {
        const { email, password } = await c.req.json<{ email: string; password: string }>();
        const account = await c.env.DB.prepare('SELECT id, password_hash FROM user WHERE email = ?')
            .bind(email)
            .first<{ id: number; password_hash: string }>();
        if (!account || !(await verifyPassword({ password, stored: account.password_hash }))) {
            return c.json({ error: '邮箱或密码错误' }, 401);
        }
        const current = await findSessionUser(c);
        if (current?.email === null) await mergeUser(c, { from: current.id, to: account.id });
        await createSession(c, account.id);
        return c.json(await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM user WHERE id = ?`).bind(account.id).first());
    })
    .post('/password-reset', async (c) => {
        const { email, code, password } = await c.req.json<{ email: string; code: string; password: string }>();
        if (!(await consumeEmailCode(c, { email, purpose: 'reset', code }))) {
            return c.json({ error: '验证码错误或已过期' }, 400);
        }
        const account = await c.env.DB.prepare('SELECT id FROM user WHERE email = ?')
            .bind(email)
            .first<{ id: number }>();
        if (!account) return c.json({ error: '邮箱未注册' }, 404);
        await c.env.DB.batch([
            c.env.DB.prepare('UPDATE user SET password_hash = ? WHERE id = ?').bind(await hashPassword(password), account.id),
            c.env.DB.prepare('DELETE FROM session WHERE user_id = ?').bind(account.id),
        ]);
        await createSession(c, account.id);
        return c.json(await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM user WHERE id = ?`).bind(account.id).first());
    })
    .post('/logout', async (c) => {
        await deleteSession(c);
        return c.json({ ok: true });
    })
    .get('/me', requireUser, c => c.json(c.get('user')))
    .patch('/me', requireUser, async (c) => {
        const { username } = await c.req.json<{ username: string }>();
        const user = await c.env.DB.prepare(`UPDATE user SET username = ? WHERE id = ? RETURNING ${USER_COLUMNS}`)
            .bind(username, c.get('user').id)
            .first<UserRow>();
        return c.json(user);
    })
    .patch('/me/uid', requireUser, async (c) => {
        const { uid } = await c.req.json<{ uid: string }>();
        if (!UID_PATTERN.test(uid)) return c.json({ error: 'ID 需为 3–32 位字母、数字、下划线或连字符' }, 400);
        const owner = await c.env.DB.prepare('SELECT id FROM user WHERE uid = ?').bind(uid).first<{ id: number }>();
        if (owner) return c.json({ error: '该 ID 已被占用' }, 409);
        const user = await c.env.DB.prepare(`UPDATE user SET uid = ? WHERE id = ? RETURNING ${USER_COLUMNS}`)
            .bind(uid, c.get('user').id)
            .first<UserRow>();
        return c.json(user);
    });

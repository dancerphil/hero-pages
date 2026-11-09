import { randomDigits } from './crypto';
import { sendEmail } from './email';

export type CodePurpose = 'register' | 'reset';

export async function consumeEmailCode(c: { env: Env }, input: { email: string; purpose: CodePurpose; code: string }) {
    const row = await c.env.DB.prepare(
        `DELETE FROM email_code
         WHERE email = ? AND purpose = ? AND code = ? AND expires_at > datetime('now')
         RETURNING 1`,
    )
        .bind(input.email, input.purpose, input.code)
        .first();
    return row !== null;
}

export async function sendEmailCode(c: { env: Env }, input: { email: string; purpose: CodePurpose }) {
    const code = randomDigits(6);
    await c.env.DB.prepare(
        `INSERT INTO email_code (email, purpose, code, expires_at) VALUES (?, ?, ?, datetime('now', '+10 minutes'))
         ON CONFLICT (email, purpose) DO UPDATE SET
           code = excluded.code, expires_at = excluded.expires_at, created_at = datetime('now')`,
    )
        .bind(input.email, input.purpose, code)
        .run();

    const title = input.purpose === 'register' ? '注册验证码' : '重置密码验证码';
    await sendEmail(c, {
        to: input.email,
        subject: `成就 ${title}`,
        text: `你的${title}是 ${code}，10 分钟内有效。`,
    });
}

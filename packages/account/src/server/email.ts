export async function sendEmail(c: { env: Env }, input: { to: string; subject: string; text: string }) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${(c.env as Env & { RESEND_API_KEY: string }).RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: c.env.EMAIL_FROM, ...input, to: [input.to] }),
    });
    if (!response.ok) throw new Error(`发送邮件失败：${await response.text()}`);
}

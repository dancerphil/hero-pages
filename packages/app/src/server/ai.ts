import { Hono } from 'hono';
import { requireUser, type AppEnv } from './session';

export const aiRoutes = new Hono<AppEnv>().all('/deepseek/*', requireUser, (c) => {
    const path = c.req.path.replace('/api/ai/deepseek', '');
    return fetch(`https://api.deepseek.com${path}`, {
        method: c.req.method,
        headers: {
            'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: c.req.raw.body,
    });
});

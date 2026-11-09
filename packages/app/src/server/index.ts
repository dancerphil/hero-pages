import { createAuthRoutes, type AppEnv, type MergeUser } from '@hero-pages/account/server';
import { Hono } from 'hono';
import { achievementRoutes } from './achievement';
import { answerRoutes } from './answer';
import { generateRoutes } from './generate';
import { levelRoutes } from './level';
import { mergeUser, userRoutes } from './user';

const mergeAllUsers: MergeUser = async (c, input) => {
    await c.env.DB.prepare('UPDATE level SET user_id = ? WHERE user_id = ?').bind(input.to, input.from).run();
    await mergeUser(c, input);
};

const app = new Hono<AppEnv>();

app.get('/api/health', c => c.json({ ok: true }));
app.route('/api/auth', createAuthRoutes({ mergeUser: mergeAllUsers }));
app.route('/api/users', userRoutes);
app.route('/api/achievements', generateRoutes);
app.route('/api/achievements', achievementRoutes);
app.route('/api/achievements', answerRoutes);
app.route('/api/levels', levelRoutes);

export default app;

import { Hono } from 'hono';
import { achievementRoutes } from './achievement';
import { answerRoutes } from './answer';
import { authRoutes } from './auth';
import { generateRoutes } from './generate';
import type { AppEnv } from './session';
import { userRoutes } from './user';

const app = new Hono<AppEnv>();

app.get('/api/health', c => c.json({ ok: true }));
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/achievements', generateRoutes);
app.route('/api/achievements', achievementRoutes);
app.route('/api/achievements', answerRoutes);

export default app;

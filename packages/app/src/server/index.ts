import { createAuthRoutes, type AppEnv, type MergeUser } from '@hero-pages/account/server';
import { Hono } from 'hono';
import { achievementRoutes } from './achievement';
import { aiRoutes } from './ai';
import { answerRoutes } from './answer';
import { gameRoutes } from './gameRoute';
import { generateRoutes } from './generate';
import { levelRoutes } from './level';
import { novelRoutes } from './novel';
import { mergeUser, userRoutes } from './user';

// eslint-disable-next-line hero-u/no-reexport
export { GameRoom } from './gameRoom';
// eslint-disable-next-line hero-u/no-reexport
export { GameLobby } from './gameLobby';

const mergeAllUsers: MergeUser = async (c, input) => {
    await c.env.DB.batch([
        c.env.DB.prepare('UPDATE level SET user_id = ? WHERE user_id = ?').bind(input.to, input.from),
        c.env.DB.prepare('UPDATE novel SET user_id = ? WHERE user_id = ?').bind(input.to, input.from),
    ]);
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
app.route('/api/novels', novelRoutes);
app.route('/api/games', gameRoutes);
app.route('/api/ai', aiRoutes);

export default app;

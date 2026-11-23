import { Hono } from 'hono';
import type { GameType } from '@hero-pages/games-core';
import { requireUser, type AppEnv } from '@hero-pages/account/server';
import { LOBBY_NAME } from './gameLobby';
import { GAME_MODULES } from './gameRoomState';

const ROOM_ID_LENGTH = 6;

export const gameRoutes = new Hono<AppEnv>()
    .post('/rooms', requireUser, async (c) => {
        const { game, ai } = await c.req.json<{ game: GameType; ai: boolean }>();
        if (!GAME_MODULES[game]) return c.json({ error: '游戏不存在' }, 400);
        const id = crypto.randomUUID().replaceAll('-', '').slice(0, ROOM_ID_LENGTH).toUpperCase();
        const stub = c.env.GAME_ROOM.get(c.env.GAME_ROOM.idFromName(id));
        const response = await stub.fetch(new Request('https://room/init', { method: 'POST', body: JSON.stringify({ id, game, ai }) }));
        if (!response.ok) return response;
        return c.json({ id });
    })
    .get('/rooms/:id/ws', requireUser, (c) => {
        const user = c.get('user');
        const stub = c.env.GAME_ROOM.get(c.env.GAME_ROOM.idFromName(c.req.param('id')));
        const url = `https://room/ws?userId=${user.id}&nickname=${encodeURIComponent(user.username)}`;
        return stub.fetch(new Request(url, { headers: c.req.raw.headers }));
    })
    .get('/lobby/ws', requireUser, (c) => {
        const lobby = c.env.GAME_LOBBY.get(c.env.GAME_LOBBY.idFromName(LOBBY_NAME));
        return lobby.fetch(new Request('https://lobby/ws', { headers: c.req.raw.headers }));
    });

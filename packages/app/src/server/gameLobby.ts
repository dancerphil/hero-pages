import { DurableObject } from 'cloudflare:workers';
import type { LobbyRoom } from '@hero-pages/games-core';

export const LOBBY_NAME = 'lobby';

// Cloudflare Durable Object 必须是 class
// eslint-disable-next-line hero-u/no-class-declaration
export class GameLobby extends DurableObject<Env> {
    private broadcast(rooms: Record<string, LobbyRoom>) {
        const message = JSON.stringify(Object.values(rooms));
        for (const ws of this.ctx.getWebSockets()) ws.send(message);
    }

    async fetch(request: Request) {
        const url = new URL(request.url);
        let rooms = (await this.ctx.storage.get<Record<string, LobbyRoom>>('rooms')) ?? {};
        if (url.pathname === '/update') {
            const { id, room } = await request.json<{ id: string; room: LobbyRoom | null }>();
            if (room) rooms[id] = room;
            else rooms = Object.fromEntries(Object.entries(rooms).filter(([key]) => key !== id));
            await this.ctx.storage.put('rooms', rooms);
            this.broadcast(rooms);
            return Response.json({ ok: true });
        }
        const { 0: client, 1: server } = new WebSocketPair();
        this.ctx.acceptWebSocket(server);
        server.send(JSON.stringify(Object.values(rooms)));
        return new Response(null, { status: 101, webSocket: client });
    }
}

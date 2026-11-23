import { DurableObject } from 'cloudflare:workers';
import type { GameType, RoomView } from '@hero-pages/games-core';
import { LOBBY_NAME } from './gameLobby';
import { AI_SEAT, hasAi, lobbyRoomOf, moduleOf, seatOf, settle, start, type RoomState } from './gameRoomState';

// Cloudflare Durable Object 必须是 class
// eslint-disable-next-line hero-u/no-class-declaration
export class GameRoom extends DurableObject<Env> {
    private async save(room: RoomState) {
        await this.ctx.storage.put('room', room);
        const lobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(LOBBY_NAME));
        const body = JSON.stringify({ id: room.id, room: lobbyRoomOf(room) });
        await lobby.fetch(new Request('https://lobby/update', { method: 'POST', body }));
    }

    private broadcast(room: RoomState) {
        const mod = moduleOf(room);
        for (const ws of this.ctx.getWebSockets()) {
            const { userId } = ws.deserializeAttachment() as { userId: number };
            const seat = seatOf(room, userId);
            const yourSeat = seat === -1 ? null : seat;
            const view: RoomView<unknown> = {
                game: room.game,
                status: room.status,
                yourSeat,
                seats: room.seats.map(item => item?.nickname ?? null) as RoomView<unknown>['seats'],
                rematch: room.rematch,
                winner: room.winner,
                wins: room.wins,
                draws: room.draws,
                view: room.status === 'waiting' ? null : mod.view(room.state, yourSeat),
            };
            ws.send(JSON.stringify(view));
        }
    }

    async fetch(request: Request) {
        const url = new URL(request.url);
        if (url.pathname === '/init') {
            if (await this.ctx.storage.get('room')) return Response.json({ error: '房间已存在' }, { status: 409 });
            const { id, game, ai } = await request.json<{ id: string; game: GameType; ai: boolean }>();
            const room: RoomState = {
                id,
                game,
                status: 'waiting',
                seats: [null, ai ? AI_SEAT : null],
                rematch: [false, false],
                winner: null,
                wins: [0, 0],
                draws: 0,
                state: null,
            };
            await this.save(room);
            return Response.json({ ok: true });
        }

        const room = await this.ctx.storage.get<RoomState>('room');
        if (!room) return Response.json({ error: '房间不存在' }, { status: 404 });
        const userId = Number(url.searchParams.get('userId'));
        const nickname = url.searchParams.get('nickname') ?? '';
        if (seatOf(room, userId) === -1) {
            const free = room.seats.indexOf(null);
            if (free !== -1) {
                room.seats[free] = { userId, nickname };
                if (room.seats.every(seat => seat !== null)) start(room);
                await this.save(room);
            }
        }

        const { 0: client, 1: server } = new WebSocketPair();
        server.serializeAttachment({ userId });
        this.ctx.acceptWebSocket(server);
        this.broadcast(room);
        return new Response(null, { status: 101, webSocket: client });
    }

    override async webSocketMessage(ws: WebSocket, message: string) {
        const { userId } = ws.deserializeAttachment() as { userId: number };
        const room = await this.ctx.storage.get<RoomState>('room');
        if (!room) throw new Error('房间状态丢失');
        const { type, move } = JSON.parse(message) as { type: 'move' | 'rematch' | 'add_ai'; move?: unknown };
        const seat = seatOf(room, userId);
        if (type === 'move') {
            if (seat === -1 || room.status !== 'playing' || !moduleOf(room).move(room.state, seat, move)) {
                ws.send(JSON.stringify({ error: '无效操作' }));
                return;
            }
            settle(room);
        }
        else if (type === 'rematch') {
            if (seat === -1 || room.status !== 'ended') {
                ws.send(JSON.stringify({ error: '无效操作' }));
                return;
            }
            room.rematch[seat] = true;
            if (room.rematch.every(Boolean) || hasAi(room)) start(room);
        }
        else if (type === 'add_ai') {
            if (seat !== 0 || room.status !== 'waiting' || room.seats[1] !== null) {
                ws.send(JSON.stringify({ error: '无效操作' }));
                return;
            }
            room.seats[1] = AI_SEAT;
            start(room);
        }
        await this.save(room);
        this.broadcast(room);
    }
}

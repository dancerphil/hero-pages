import { emperorSlave, mineTexas, nine, stance, ticTacToe, type GameModule, type GameType, type LobbyRoom, type RoomStatus } from '@hero-pages/games-core';

type Module = GameModule<unknown, unknown, unknown>;

export const GAME_MODULES: Partial<Record<GameType, Module>> = {
    'tic-tac-toe': ticTacToe,
    'nine': nine,
    'emperor-slave': emperorSlave,
    'mine-texas': mineTexas,
    'stance': stance,
};

export interface Seat {
    userId: number | null;
    nickname: string;
}

export interface RoomState {
    id: string;
    game: GameType;
    status: RoomStatus;
    seats: [Seat | null, Seat | null];
    rematch: [boolean, boolean];
    winner: number | 'draw' | null;
    wins: [number, number];
    draws: number;
    state: unknown;
}

export const AI_SEAT: Seat = { userId: null, nickname: 'AI' };

export const moduleOf = (room: RoomState) => {
    const mod = GAME_MODULES[room.game];
    if (!mod) throw new Error(`未实现的游戏：${room.game}`);
    return mod;
};

export const seatOf = (room: RoomState, userId: number) => room.seats.findIndex(seat => seat?.userId === userId);

export const hasAi = (room: RoomState) => room.seats.some(seat => seat?.userId === null);

const finish = (room: RoomState) => {
    room.status = 'ended';
    const result = moduleOf(room).result(room.state);
    room.winner = result;
    if (result === 'draw') room.draws++;
    else room.wins[result]++;
};

export const settle = (room: RoomState) => {
    const mod = moduleOf(room);
    room.seats.forEach((seat, index) => {
        if (seat?.userId === null && !mod.isOver(room.state) && mod.needsMove(room.state, index)) {
            const move = mod.ai(room.state, index);
            if (move !== null) mod.move(room.state, index, move);
        }
    });
    if (mod.isOver(room.state)) finish(room);
};

export const start = (room: RoomState) => {
    room.status = 'playing';
    room.rematch = [false, false];
    room.winner = null;
    room.state = moduleOf(room).init(room.state ?? undefined);
    settle(room);
};

export const lobbyRoomOf = (room: RoomState): LobbyRoom | null => {
    if (room.status === 'ended' || hasAi(room)) return null;
    return {
        id: room.id,
        game: room.game,
        status: room.status,
        seats: room.seats.map(seat => seat?.nickname ?? null) as LobbyRoom['seats'],
    };
};

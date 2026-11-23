export type GameType = 'tic-tac-toe' | 'emperor-slave' | 'nine' | 'mine-texas' | 'stance' | 'boss/blast' | 'boss/tornado' | 'boss/thunder' | 'boss/spacetime' | 'boss/tidal' | 'boss/siege' | 'poetry-heart' | 'gomoku' | 'anti-gomoku';

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface GameModule<S, M, V> {
    init(previous?: S): S;
    needsMove(state: S, seat: number): boolean;
    move(state: S, seat: number, move: M): boolean;
    ai(state: S, seat: number): M | null;
    isOver(state: S): boolean;
    result(state: S): number | 'draw';
    view(state: S, seat: number | null): V;
}

export interface RoomView<V> {
    game: GameType;
    status: RoomStatus;
    yourSeat: number | null;
    seats: [string | null, string | null];
    rematch: [boolean, boolean];
    winner: number | 'draw' | null;
    wins: [number, number];
    draws: number;
    view: V | null;
}

export interface LobbyRoom {
    id: string;
    game: GameType;
    status: RoomStatus;
    seats: [string | null, string | null];
}

export type AntiGomokuPlayer = 'black' | 'white';

export interface AntiGomokuState {
    board: (AntiGomokuPlayer | null)[];
    currentTurn: AntiGomokuPlayer;
    ended: boolean;
    winner: AntiGomokuPlayer | null;
    losingLine: number[] | null;
    lastMove: number | null;
}

export type AntiGomokuMessage =
    | { type: 'move'; row: number; col: number; player: AntiGomokuPlayer }
    | { type: 'game_over'; winner: AntiGomokuPlayer | null; losingLine: number[] | null }
    | { type: 'spectating' | 'spectate_update'; state: AntiGomokuState };

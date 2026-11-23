import { getAiMove } from './ai/tic-tac-toe-ai.js';
import type { GameModule } from './room.js';

export type Player = 'X' | 'O';
export type Board = (Player | null)[];

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

const ROLES: Player[] = ['X', 'O'];

export const createBoard = (): Board => Array.from({ length: 9 }, (): null => null);

export const getWinLine = (board: Board): number[] | null =>
    WIN_LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) ?? null;

export const getWinner = (board: Board): Player | null => {
    const line = getWinLine(board);
    return line ? board[line[0]] : null;
};

export interface TicTacToeState {
    board: Board;
    currentTurn: Player;
}

export interface TicTacToeView {
    board: Board;
    currentTurn: Player;
    winner: Player | 'draw' | null;
}

const isOver = (state: TicTacToeState) => getWinner(state.board) !== null || state.board.every(cell => cell !== null);

const needsMove = (state: TicTacToeState, seat: number) => ROLES[seat] === state.currentTurn && !isOver(state);

export const ticTacToe: GameModule<TicTacToeState, number, TicTacToeView> = {
    init: () => ({ board: createBoard(), currentTurn: 'X' }),
    needsMove,
    move(state, seat, position) {
        if (!needsMove(state, seat) || state.board[position] !== null) return false;
        state.board[position] = state.currentTurn;
        state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
        return true;
    },
    ai(state, seat) {
        return getAiMove({ board: state.board, currentTurn: state.currentTurn, role: ROLES[seat] })?.position ?? null;
    },
    isOver,
    result: (state) => {
        const winner = getWinner(state.board);
        return winner === null ? 'draw' : ROLES.indexOf(winner);
    },
    view: state => ({
        board: state.board,
        currentTurn: state.currentTurn,
        winner: getWinner(state.board) ?? (state.board.every(cell => cell !== null) ? 'draw' : null),
    }),
};

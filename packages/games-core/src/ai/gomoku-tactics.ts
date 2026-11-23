import type { GomokuBoard, GomokuPlayer } from './gomoku.js';
import { checkWinAt, neighbors, other, tacticalCandidates, winningPoints } from './gomoku-board.js';

const canForce = ({ board, player, depth, anchors }: { board: GomokuBoard; player: GomokuPlayer; depth: number; anchors: number[] | null }): boolean => {
    const opp = other(player);
    const cands = anchors?.length ? neighbors({ anchors, radius: 2, board }) : tacticalCandidates(board);
    for (const m of cands) {
        board[m] = player;
        if (checkWinAt({ board, pos: m, player })) {
            board[m] = null;
            return true;
        }
        const threats = winningPoints(board, player);
        if (threats.length === 0) {
            board[m] = null;
            continue;
        }
        if (threats.length >= 2) {
            const win = winningPoints(board, opp).length === 0;
            board[m] = null;
            if (win) return true;
            continue;
        }
        if (depth <= 1 || winningPoints(board, opp).length > 0) {
            board[m] = null;
            continue;
        }
        const o = threats[0];
        board[o] = opp;
        if (winningPoints(board, opp).length > 0) {
            board[o] = null;
            board[m] = null;
            continue;
        }
        const ok = canForce({ board, player, depth: depth - 1, anchors: [m, o, ...threats] });
        board[o] = null;
        board[m] = null;
        if (ok) return true;
    }
    return false;
};

const findForcingWin = (board: GomokuBoard, player: GomokuPlayer): number | null => {
    const opp = other(player);
    const winners: number[] = [];
    for (const m1 of tacticalCandidates(board)) {
        board[m1] = player;
        if (checkWinAt({ board, pos: m1, player })) {
            board[m1] = null;
            winners.push(m1);
            continue;
        }
        const threats = winningPoints(board, player);
        if (threats.length === 0) {
            board[m1] = null;
            continue;
        }
        if (threats.length >= 2) {
            if (winningPoints(board, opp).length === 0) winners.push(m1);
            board[m1] = null;
            continue;
        }
        if (winningPoints(board, opp).length > 0) {
            board[m1] = null;
            continue;
        }
        const o1 = threats[0];
        board[o1] = opp;
        if (winningPoints(board, opp).length > 0) {
            board[o1] = null;
            board[m1] = null;
            continue;
        }
        if (canForce({ board, player, depth: 2, anchors: [m1, o1, ...threats] })) winners.push(m1);
        board[o1] = null;
        board[m1] = null;
    }
    return winners.length ? winners[Math.floor(Math.random() * winners.length)] : null;
};

const pick = (pts: number[]) => pts[Math.floor(Math.random() * pts.length)];

export const findTacticalMove = (board: GomokuBoard, player: GomokuPlayer): number | null => {
    const wins = winningPoints(board, player);
    if (wins.length) return pick(wins);
    const blocks = winningPoints(board, other(player));
    if (blocks.length) return pick(blocks);
    return findForcingWin(board, player);
};

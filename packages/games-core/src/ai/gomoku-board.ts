import type { GomokuBoard, GomokuPlayer } from './gomoku.js';

const SIZE = 15;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const CENTER = 7 * SIZE + 7;

const idx = (r: number, c: number) => r * SIZE + c;
const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
export const other = (player: GomokuPlayer): GomokuPlayer => (player === 'black' ? 'white' : 'black');

export const checkWinAt = ({ board, pos, player }: { board: GomokuBoard; pos: number; player: GomokuPlayer }) => {
    const r = Math.floor(pos / SIZE);
    const c = pos % SIZE;
    return DIRS.some(([dr, dc]) => {
        let count = 1;
        for (const sign of [1, -1]) {
            for (let s = 1; s < 5; s++) {
                const nr = r + sign * dr * s;
                const nc = c + sign * dc * s;
                if (!inBounds(nr, nc) || board[idx(nr, nc)] !== player) break;
                count++;
            }
        }
        return count >= 5;
    });
};

export const checkWinAny = (board: GomokuBoard): GomokuPlayer | null => {
    for (let i = 0; i < board.length; i++) {
        const v = board[i];
        if (v && checkWinAt({ board, pos: i, player: v })) return v;
    }
    return null;
};

export const neighbors = ({ anchors, radius, board }: { anchors: number[]; radius: number; board: GomokuBoard }) => {
    const s = new Set<number>();
    for (const pos of anchors) {
        const r = Math.floor(pos / SIZE);
        const c = pos % SIZE;
        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (inBounds(nr, nc) && board[idx(nr, nc)] === null) s.add(idx(nr, nc));
            }
        }
    }
    return [...s];
};

const threatEmpties = (board: GomokuBoard, player: GomokuPlayer) => {
    const occupied = board.flatMap((v, i) => (v === player ? [i] : []));
    return neighbors({ anchors: occupied, radius: 1, board });
};

export const winningPoints = (board: GomokuBoard, player: GomokuPlayer) => {
    const pts: number[] = [];
    for (const p of threatEmpties(board, player)) {
        board[p] = player;
        if (checkWinAt({ board, pos: p, player })) pts.push(p);
        board[p] = null;
    }
    return pts;
};

export const tacticalCandidates = (board: GomokuBoard) => {
    const occupied = board.flatMap((v, i) => (v !== null ? [i] : []));
    const scored = neighbors({ anchors: occupied, radius: 2, board }).map((p) => {
        const r = Math.floor(p / SIZE);
        const c = p % SIZE;
        let count = 0;
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if ((dr || dc) && inBounds(nr, nc) && board[idx(nr, nc)] !== null) count += 1 / (Math.abs(dr) + Math.abs(dc));
            }
        }
        return { p, count };
    });
    scored.sort((a, b) => b.count - a.count);
    return scored.slice(0, occupied.length < 10 ? 20 : 24).map(x => x.p);
};

export const getCandidates = (board: GomokuBoard) => {
    const occupied = board.flatMap((v, i) => (v !== null ? [i] : []));
    if (occupied.length === 0) return [CENTER];
    const cand = neighbors({ anchors: occupied, radius: occupied.length === 1 ? 1 : 2, board });
    return cand.length ? cand.toSorted((a, b) => a - b) : [CENTER];
};

import type { AntiGomokuPlayer } from '../anti-gomoku.js';

export const SIZE = 15;
export const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const RISK = [0, 0, 1, 6, 36, 0];
const WINDOWS = DIRS.flatMap(([dr, dc]) => {
    const list: number[][] = [];
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (row + 4 * dr < 0 || row + 4 * dr >= SIZE || col + 4 * dc < 0 || col + 4 * dc >= SIZE) continue;
            list.push([0, 1, 2, 3, 4].map(step => (row + step * dr) * SIZE + col + step * dc));
        }
    }
    return list;
});

export const opponent = (player: AntiGomokuPlayer): AntiGomokuPlayer => (player === 'black' ? 'white' : 'black');

export const evaluate = (board: (AntiGomokuPlayer | null)[], player: AntiGomokuPlayer) => {
    const other = opponent(player);
    const empty = board.flatMap((v, pos) => (v === null ? [pos] : []));
    if (empty.length === 0) return { scores: new Map<number, number>(), value: 0 };
    const unsafe: Record<AntiGomokuPlayer, Set<number>> = { black: new Set(), white: new Set() };
    const risk: Record<AntiGomokuPlayer, number> = { black: 0, white: 0 };
    const costs = new Map(empty.map((pos): [number, number] => [pos, 0]));
    for (const window of WINDOWS) {
        const own = window.filter(pos => board[pos] === player).length;
        const opp = window.filter(pos => board[pos] === other).length;
        if (own && opp) continue;
        const holes = window.filter(pos => board[pos] === null);
        if (own) {
            risk[player] += RISK[own];
            if (own === 4) holes.forEach(pos => unsafe[player].add(pos));
            holes.forEach(pos => costs.set(pos, costs.get(pos) + RISK[own + 1] - RISK[own]));
        }
        else if (opp) {
            risk[other] += RISK[opp];
            if (opp === 4) holes.forEach(pos => unsafe[other].add(pos));
            holes.forEach(pos => costs.set(pos, costs.get(pos) + RISK[opp]));
        }
    }
    const scores = new Map([...costs]
        .filter(([pos]) => !unsafe[player].has(pos))
        .map(([pos, cost]): [number, number] => [pos, -cost]));
    if (scores.size === 0) return { scores, value: -1 };
    const safeDifference = unsafe[other].size - unsafe[player].size;
    const value = Math.tanh(0.18 * safeDifference + 0.004 * (risk[other] - risk[player]));
    return { scores, value };
};

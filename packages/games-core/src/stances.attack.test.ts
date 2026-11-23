import { describe, expect, it } from 'vitest';
import { getAttackOptions, has, p } from './stances.helpers';
import type { Pos } from './index';

describe('getAttackOptions', () => {
    describe('snake', () => {
        it('with originalPos: the two corner cells between old and new position', () => {
            // moved from (3,3) to (2,4) diagonally NE
            const opts = getAttackOptions({ name: 'snake', pos: p(2, 4), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(3, 4))).toBe(true); // originalPos.row, pos.col
            expect(has(opts, p(2, 3))).toBe(true); // pos.row, originalPos.col
        });
        it('without originalPos: L and R of player 0', () => {
            const opts = getAttackOptions({ name: 'snake', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(2, 3))).toBe(true); // L(0): north
            expect(has(opts, p(4, 3))).toBe(true); // R(0): south
        });
        it('without originalPos: L and R of player 1', () => {
            const opts = getAttackOptions({ name: 'snake', pos: p(3, 3), pi: 1 });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(4, 3))).toBe(true); // L(1): south
            expect(has(opts, p(2, 3))).toBe(true); // R(1): north
        });
    });

    describe('crane', () => {
        it('fallback F/B without originalPos (player 0)', () => {
            const opts = getAttackOptions({ name: 'crane', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(3, 4))).toBe(true); // F: east
            expect(has(opts, p(3, 2))).toBe(true); // B: west
        });
        it('direction-based: moved east → attack east and west', () => {
            const opts = getAttackOptions({ name: 'crane', pos: p(3, 4), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(3, 5))).toBe(true);
            expect(has(opts, p(3, 3))).toBe(true);
        });
        it('direction-based: moved north → attack north and south', () => {
            const opts = getAttackOptions({ name: 'crane', pos: p(2, 3), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(1, 3))).toBe(true);
            expect(has(opts, p(3, 3))).toBe(true);
        });
    });

    describe('leopard', () => {
        it('fallback F/B without originalPos (player 0)', () => {
            const opts = getAttackOptions({ name: 'leopard', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(3, 4))).toBe(true); // F: east
            expect(has(opts, p(3, 2))).toBe(true); // B: west
        });
        it('direction-based: moved east 2 steps → attack east and west', () => {
            const opts = getAttackOptions({ name: 'leopard', pos: p(3, 5), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(3, 6))).toBe(true);
            expect(has(opts, p(3, 4))).toBe(true);
        });
        it('direction-based: moved south 2 steps → attack south and north', () => {
            const opts = getAttackOptions({ name: 'leopard', pos: p(5, 3), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(6, 3))).toBe(true);
            expect(has(opts, p(4, 3))).toBe(true);
        });
    });

    describe('tiger', () => {
        it('1 selectable cell: direction extended from original pos (player 0, moved east)', () => {
            // moved from (3,3) to (3,4) — direction is east, selectable = (3,5)
            const opts = getAttackOptions({ name: 'tiger', pos: p(3, 4), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(3, 5))).toBe(true);
        });
        it('1 selectable cell: direction extended (player 1, moved west)', () => {
            // player 1 at (3,4) moved from (3,5) — direction west, selectable = (3,3)
            const opts = getAttackOptions({ name: 'tiger', pos: p(3, 4), pi: 1, originalPos: p(3, 5) });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(3, 3))).toBe(true);
        });
        it('uses forward direction when no originalPos (player 0)', () => {
            const opts = getAttackOptions({ name: 'tiger', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(3, 4))).toBe(true); // F(0) = east
        });
        it('clips when near board edge', () => {
            // moved north: from (3,3) to (2,3) — direction north, selectable = (1,3)
            const opts = getAttackOptions({ name: 'tiger', pos: p(2, 3), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(1, 3))).toBe(true);
        });
    });

    describe('dragon', () => {
        it('5×5 outer ring (16 cells) from center', () => {
            const opts = getAttackOptions({ name: 'dragon', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(16);
            expect(has(opts, p(1, 1))).toBe(true);
            expect(has(opts, p(5, 5))).toBe(true);
            expect(has(opts, p(3, 1))).toBe(true);
            // inner 3×3 excluded
            expect(has(opts, p(3, 3))).toBe(false);
            expect(has(opts, p(3, 4))).toBe(false);
            expect(has(opts, p(4, 4))).toBe(false);
        });
        it('clips out-of-bounds cells', () => {
            const opts = getAttackOptions({ name: 'dragon', pos: p(1, 1), pi: 0 });
            opts.forEach((q: Pos) => {
                expect(q.row).toBeGreaterThanOrEqual(0);
                expect(q.col).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('turtle', () => {
        it('3×3 area (9 cells) from center', () => {
            const opts = getAttackOptions({ name: 'turtle', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(9);
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    expect(has(opts, p(3 + dr, 3 + dc))).toBe(true);
                }
            }
        });
        it('clips to board at corner (0,0): 4 cells', () => {
            const opts = getAttackOptions({ name: 'turtle', pos: p(0, 0), pi: 0 });
            expect(opts).toHaveLength(4);
            [p(0, 0), p(0, 1), p(1, 0), p(1, 1)].forEach(q => expect(has(opts, q)).toBe(true));
        });
    });
});

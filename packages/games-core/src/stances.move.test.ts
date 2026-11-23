import { describe, expect, it } from 'vitest';
import { getMoveOptions, has, p } from './stances.helpers';
import type { Pos } from './index';

describe('getMoveOptions', () => {
    describe('snake', () => {
        it('4 diagonal options from center', () => {
            const opts = getMoveOptions({ name: 'snake', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(2, 2))).toBe(true);
            expect(has(opts, p(2, 4))).toBe(true);
            expect(has(opts, p(4, 2))).toBe(true);
            expect(has(opts, p(4, 4))).toBe(true);
        });
        it('clips to board at corner', () => {
            const opts = getMoveOptions({ name: 'snake', pos: p(0, 0), pi: 0 });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(1, 1))).toBe(true);
        });
    });

    describe('crane', () => {
        it('4 cardinal options from center (player 0)', () => {
            const opts = getMoveOptions({ name: 'crane', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(3, 4))).toBe(true); // F: east
            expect(has(opts, p(3, 2))).toBe(true); // B: west
            expect(has(opts, p(2, 3))).toBe(true); // L: north
            expect(has(opts, p(4, 3))).toBe(true); // R: south
        });
        it('same 4 cells from center (player 1)', () => {
            const opts = getMoveOptions({ name: 'crane', pos: p(3, 3), pi: 1 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(3, 2))).toBe(true); // F: west
            expect(has(opts, p(3, 4))).toBe(true); // B: east
            expect(has(opts, p(4, 3))).toBe(true); // L: south
            expect(has(opts, p(2, 3))).toBe(true); // R: north
        });
    });

    describe('tiger', () => {
        it('same move options as crane', () => {
            const crane = getMoveOptions({ name: 'crane', pos: p(3, 3), pi: 0 });
            const tiger = getMoveOptions({ name: 'tiger', pos: p(3, 3), pi: 0 });
            expect(tiger).toHaveLength(crane.length);
            crane.forEach((c: Pos) => expect(has(tiger, c)).toBe(true));
        });
    });

    describe('leopard', () => {
        it('2-step options from center (player 0)', () => {
            const opts = getMoveOptions({ name: 'leopard', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(3, 5))).toBe(true); // 2 east
            expect(has(opts, p(3, 1))).toBe(true); // 2 west
            expect(has(opts, p(1, 3))).toBe(true); // 2 north
            expect(has(opts, p(5, 3))).toBe(true); // 2 south
        });
        it('clips out-of-bounds 2-step at east edge (player 0)', () => {
            const opts = getMoveOptions({ name: 'leopard', pos: p(3, 6), pi: 0 });
            expect(has(opts, p(3, 8))).toBe(false);
            expect(has(opts, p(3, 4))).toBe(true);
        });
    });

    describe('dragon and turtle', () => {
        it('no move options for dragon', () => {
            expect(getMoveOptions({ name: 'dragon', pos: p(3, 3), pi: 0 })).toHaveLength(0);
        });
        it('no move options for turtle', () => {
            expect(getMoveOptions({ name: 'turtle', pos: p(3, 3), pi: 0 })).toHaveLength(0);
        });
        it('no move options for charge', () => {
            expect(getMoveOptions({ name: 'charge', pos: p(3, 3), pi: 0 })).toHaveLength(0);
        });
    });

    describe('crab', () => {
        it('4 diagonal options from center (same as snake)', () => {
            const opts = getMoveOptions({ name: 'crab', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(2, 2))).toBe(true);
            expect(has(opts, p(2, 4))).toBe(true);
            expect(has(opts, p(4, 2))).toBe(true);
            expect(has(opts, p(4, 4))).toBe(true);
        });
    });

    describe('monkey', () => {
        it('4 two-step options from center (same as leopard)', () => {
            const opts = getMoveOptions({ name: 'monkey', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(3, 5))).toBe(true);
            expect(has(opts, p(3, 1))).toBe(true);
            expect(has(opts, p(1, 3))).toBe(true);
            expect(has(opts, p(5, 3))).toBe(true);
        });
    });

    describe('ox', () => {
        it('4 cardinal options from center (same as crane)', () => {
            const opts = getMoveOptions({ name: 'ox', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(3, 4))).toBe(true);
            expect(has(opts, p(3, 2))).toBe(true);
            expect(has(opts, p(2, 3))).toBe(true);
            expect(has(opts, p(4, 3))).toBe(true);
        });
    });

    describe('dog', () => {
        it('4 cardinal options from center (same as crane)', () => {
            const opts = getMoveOptions({ name: 'dog', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(3, 4))).toBe(true);
            expect(has(opts, p(3, 2))).toBe(true);
            expect(has(opts, p(2, 3))).toBe(true);
            expect(has(opts, p(4, 3))).toBe(true);
        });
    });

    describe('dodge', () => {
        it('same 4 cardinal options as crane (player 0)', () => {
            const opts = getMoveOptions({ name: 'dodge', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(3, 4))).toBe(true);
            expect(has(opts, p(3, 2))).toBe(true);
            expect(has(opts, p(2, 3))).toBe(true);
            expect(has(opts, p(4, 3))).toBe(true);
        });
    });

    describe('horse', () => {
        it('8 L-shaped options from center', () => {
            const opts = getMoveOptions({ name: 'horse', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(8);
            [p(4, 5), p(4, 1), p(2, 5), p(2, 1), p(5, 4), p(5, 2), p(1, 4), p(1, 2)].forEach((q) => {
                expect(has(opts, q)).toBe(true);
            });
        });
        it('clips options at corner', () => {
            const opts = getMoveOptions({ name: 'horse', pos: p(0, 0), pi: 0 });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(1, 2))).toBe(true);
            expect(has(opts, p(2, 1))).toBe(true);
        });
    });
});

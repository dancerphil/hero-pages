import { describe, expect, it } from 'vitest';
import { getHitCells, has, p } from './stances.helpers';

describe('getHitCells', () => {
    describe('tiger AoE', () => {
        it('expands to 3-cell perpendicular (moved east, target one more east)', () => {
            // moved from (3,3) to (3,4) east, attack target = (3,5)
            const cells = getHitCells({ name: 'tiger', attackAt: p(3, 5), pos: p(3, 4), pi: 0, originalPos: p(3, 3) });
            expect(cells).toHaveLength(3);
            expect(has(cells, p(2, 5))).toBe(true); // perp north
            expect(has(cells, p(3, 5))).toBe(true); // center
            expect(has(cells, p(4, 5))).toBe(true); // perp south
        });
        it('expands perpendicular when moved north', () => {
            // moved from (3,3) to (2,3) north, attack target = (1,3)
            const cells = getHitCells({ name: 'tiger', attackAt: p(1, 3), pos: p(2, 3), pi: 0, originalPos: p(3, 3) });
            expect(cells).toHaveLength(3);
            expect(has(cells, p(1, 2))).toBe(true); // perp west
            expect(has(cells, p(1, 3))).toBe(true);
            expect(has(cells, p(1, 4))).toBe(true); // perp east
        });
    });

    it('dragon returns single attackAt cell', () => {
        const cells = getHitCells({ name: 'dragon', attackAt: p(1, 1), pos: p(3, 3), pi: 0 });
        expect(cells).toHaveLength(1);
        expect(has(cells, p(1, 1))).toBe(true);
    });

    it('turtle returns single attackAt cell', () => {
        const cells = getHitCells({ name: 'turtle', attackAt: p(3, 4), pos: p(3, 3), pi: 0 });
        expect(cells).toHaveLength(1);
        expect(has(cells, p(3, 4))).toBe(true);
    });

    it('other stances return single attackAt cell', () => {
        const cells = getHitCells({ name: 'crane', attackAt: p(3, 4), pos: p(3, 3), pi: 0 });
        expect(cells).toHaveLength(1);
        expect(has(cells, p(3, 4))).toBe(true);
    });

    it('returns empty when attackAt is null and stance is not auto', () => {
        const cells = getHitCells({ name: 'crane', attackAt: null, pos: p(3, 3), pi: 0 });
        expect(cells).toHaveLength(0);
    });

    describe('monkey attack', () => {
        it('hits the provided attackAt position', () => {
            const cells = getHitCells({ name: 'monkey', attackAt: p(3, 5), pos: p(3, 5), pi: 0, originalPos: p(3, 3) });
            expect(cells).toHaveLength(1);
            expect(has(cells, p(3, 5))).toBe(true);
        });
        it('falls back to landing pos when attackAt is null', () => {
            const cells = getHitCells({ name: 'monkey', attackAt: null, pos: p(3, 5), pi: 0, originalPos: p(3, 3) });
            expect(cells).toHaveLength(1);
            expect(has(cells, p(3, 5))).toBe(true);
        });
    });

    describe('ox AoE', () => {
        it('sweeps column when moved horizontally (west)', () => {
            // moved from (3,3) to (3,2), attack at (3,2): sweeps (2,2),(3,2),(4,2)
            const cells = getHitCells({ name: 'ox', attackAt: p(3, 2), pos: p(3, 2), pi: 0, originalPos: p(3, 3) });
            expect(cells).toHaveLength(3);
            expect(has(cells, p(2, 2))).toBe(true);
            expect(has(cells, p(3, 2))).toBe(true);
            expect(has(cells, p(4, 2))).toBe(true);
        });
        it('sweeps column when moved east', () => {
            const cells = getHitCells({ name: 'ox', attackAt: p(3, 4), pos: p(3, 4), pi: 0, originalPos: p(3, 3) });
            expect(cells).toHaveLength(3);
            expect(has(cells, p(2, 4))).toBe(true);
            expect(has(cells, p(3, 4))).toBe(true);
            expect(has(cells, p(4, 4))).toBe(true);
        });
        it('sweeps row when moved vertically (south)', () => {
            const cells = getHitCells({ name: 'ox', attackAt: p(4, 3), pos: p(4, 3), pi: 0, originalPos: p(3, 3) });
            expect(cells).toHaveLength(3);
            expect(has(cells, p(4, 2))).toBe(true);
            expect(has(cells, p(4, 3))).toBe(true);
            expect(has(cells, p(4, 4))).toBe(true);
        });
        it('clips at board row 0', () => {
            // moved from (0,2) to (0,3) east: column sweep clips (−1,3)
            const cells = getHitCells({ name: 'ox', attackAt: p(0, 3), pos: p(0, 3), pi: 0, originalPos: p(0, 2) });
            expect(cells).toHaveLength(2);
            expect(has(cells, p(0, 3))).toBe(true);
            expect(has(cells, p(1, 3))).toBe(true);
        });
    });
});

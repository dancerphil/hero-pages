import { describe, expect, it } from 'vitest';
import { getAttackOptions, has, p } from './stances.helpers';

describe('getAttackOptions', () => {
    describe('horse', () => {
        it('fallback F/B without originalPos (player 0)', () => {
            const opts = getAttackOptions({ name: 'horse', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(3, 4))).toBe(true); // F: east
            expect(has(opts, p(3, 2))).toBe(true); // B: west
        });
        it('direction-based: L-move (+1,+2) → primary axis east-west', () => {
            // moved from (3,3) to (4,5): dc=2 > dr=1, axis = east-west
            const opts = getAttackOptions({ name: 'horse', pos: p(4, 5), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(4, 6))).toBe(true);
            expect(has(opts, p(4, 4))).toBe(true);
        });
        it('direction-based: L-move (+2,+1) → primary axis south-north', () => {
            // moved from (3,3) to (5,4): dr=2 >= dc=1, axis = south-north
            const opts = getAttackOptions({ name: 'horse', pos: p(5, 4), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(6, 4))).toBe(true);
            expect(has(opts, p(4, 4))).toBe(true);
        });
    });

    describe('charge and dodge', () => {
        it('no attack options for charge', () => {
            expect(getAttackOptions({ name: 'charge', pos: p(3, 3), pi: 0 })).toHaveLength(0);
        });
        it('no attack options for dodge', () => {
            expect(getAttackOptions({ name: 'dodge', pos: p(3, 3), pi: 0 })).toHaveLength(0);
        });
    });

    describe('monkey', () => {
        it('1 attack option: the landing position', () => {
            const opts = getAttackOptions({ name: 'monkey', pos: p(3, 5), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(3, 5))).toBe(true);
        });
        it('without originalPos: the current pos', () => {
            const opts = getAttackOptions({ name: 'monkey', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(3, 3))).toBe(true);
        });
    });

    describe('ox', () => {
        it('1 attack option: the landing position', () => {
            const opts = getAttackOptions({ name: 'ox', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(3, 3))).toBe(true);
        });
        it('with originalPos: still just the landing position', () => {
            const opts = getAttackOptions({ name: 'ox', pos: p(3, 2), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(3, 2))).toBe(true);
        });
    });

    describe('crab', () => {
        it('3 diagonals from destination, excluding origin (moved SE)', () => {
            // moved from (3,3) to (4,4): diagonals of (4,4) excluding (3,3)
            const opts = getAttackOptions({ name: 'crab', pos: p(4, 4), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(3);
            expect(has(opts, p(3, 3))).toBe(false);
            expect(has(opts, p(3, 5))).toBe(true);
            expect(has(opts, p(5, 3))).toBe(true);
            expect(has(opts, p(5, 5))).toBe(true);
        });
        it('3 diagonals from destination, excluding origin (moved NE)', () => {
            // moved from (3,3) to (2,4): diagonals of (2,4) excluding (3,3)
            const opts = getAttackOptions({ name: 'crab', pos: p(2, 4), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(3);
            expect(has(opts, p(3, 3))).toBe(false);
            expect(has(opts, p(1, 3))).toBe(true);
            expect(has(opts, p(1, 5))).toBe(true);
            expect(has(opts, p(3, 5))).toBe(true);
        });
        it('all 4 diagonals without originalPos', () => {
            const opts = getAttackOptions({ name: 'crab', pos: p(3, 3), pi: 0 });
            expect(opts).toHaveLength(4);
            expect(has(opts, p(2, 2))).toBe(true);
            expect(has(opts, p(2, 4))).toBe(true);
            expect(has(opts, p(4, 2))).toBe(true);
            expect(has(opts, p(4, 4))).toBe(true);
        });
        it('clips out-of-bounds', () => {
            // moved from (3,5) to (4,6): diagonals of (4,6) excluding (3,5)
            const opts = getAttackOptions({ name: 'crab', pos: p(4, 6), pi: 0, originalPos: p(3, 5) });
            expect(opts).toHaveLength(1);
            expect(has(opts, p(5, 5))).toBe(true);
        });
    });

    describe('dog', () => {
        it('2 backward diagonal cells when moved west', () => {
            // moved from (3,3) to (3,2): backward=east, diagonals=(2,3) and (4,3)
            const opts = getAttackOptions({ name: 'dog', pos: p(3, 2), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(2, 3))).toBe(true);
            expect(has(opts, p(4, 3))).toBe(true);
        });
        it('2 backward diagonal cells when moved north', () => {
            // moved from (3,3) to (2,3): backward=south, diagonals=(3,2) and (3,4)
            const opts = getAttackOptions({ name: 'dog', pos: p(2, 3), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(3, 2))).toBe(true);
            expect(has(opts, p(3, 4))).toBe(true);
        });
        it('2 backward diagonal cells when moved east', () => {
            // moved from (3,3) to (3,4): backward=west, diagonals=(2,3) and (4,3)
            const opts = getAttackOptions({ name: 'dog', pos: p(3, 4), pi: 0, originalPos: p(3, 3) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(2, 3))).toBe(true);
            expect(has(opts, p(4, 3))).toBe(true);
        });
        it('clips to board edge', () => {
            // moved from (1,1) to (0,1): backward=south, diagonals=(1,0) and (1,2)
            const opts = getAttackOptions({ name: 'dog', pos: p(0, 1), pi: 0, originalPos: p(1, 1) });
            expect(opts).toHaveLength(2);
            expect(has(opts, p(1, 0))).toBe(true);
            expect(has(opts, p(1, 2))).toBe(true);
        });
    });
});

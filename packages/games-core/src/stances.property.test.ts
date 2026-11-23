import { describe, expect, it } from 'vitest';
import { isCharge, isDodge, isNoMove } from './stances.helpers';

describe('stance property helpers', () => {
    it('isNoMove: dragon, turtle, charge', () => {
        expect(isNoMove('dragon')).toBe(true);
        expect(isNoMove('turtle')).toBe(true);
        expect(isNoMove('charge')).toBe(true);
        expect(isNoMove('tiger')).toBe(false);
        expect(isNoMove('dodge')).toBe(false);
    });
    it('isDodge: dodge only', () => {
        expect(isDodge('dodge')).toBe(true);
        expect(isDodge('crane')).toBe(false);
        expect(isDodge('charge')).toBe(false);
    });
    it('isCharge: charge only', () => {
        expect(isCharge('charge')).toBe(true);
        expect(isCharge('dragon')).toBe(false);
        expect(isCharge('dodge')).toBe(false);
    });
});

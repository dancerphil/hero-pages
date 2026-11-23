import { eqPos, type Pos } from '../geometry.js';
import { shuffle } from '../shuffle.js';
import { ALL_STANCES, type StanceName } from '../stances.js';
import { stanceAttackOptions, stanceIsCharge, stanceIsDodge, stanceIsNoMove, stanceMoveOptions } from '../stance-rules.js';

export const getAiDeckSelect = (): { stances: StanceName[] } => ({ stances: shuffle([...ALL_STANCES]).slice(0, 5) });

export const getAiMove = (state: { hand: StanceName[]; positions: [Pos, Pos]; pi: number }): { card: StanceName; moveTo: Pos; attackAt: Pos | null } | null => {
    const { hand, positions, pi } = state;
    const myPos = positions[pi];
    const oppPos = positions[1 - pi];

    // Prefer moves that hit the opponent
    const shuffled = shuffle(hand);
    for (const card of shuffled) {
        if (stanceIsCharge(card)) {
            return { card, moveTo: myPos, attackAt: null };
        }
        const moveOpts = stanceIsNoMove(card) ? [myPos] : stanceMoveOptions({ card, pos: myPos, seat: pi });
        for (const moveTo of shuffle(moveOpts)) {
            if (stanceIsDodge(card)) {
                return { card, moveTo, attackAt: null };
            }
            const attackCells = stanceAttackOptions({ card, pos: moveTo, seat: pi, origin: myPos });
            if (attackCells.length === 0) {
                // Auto-attack landing position (e.g. monkey)
                if (eqPos(moveTo, oppPos)) {
                    return { card, moveTo, attackAt: null };
                }
                continue;
            }
            const hit = attackCells.find(c => c.row === oppPos.row && c.col === oppPos.col);
            if (hit) {
                return { card, moveTo, attackAt: hit };
            }
        }
    }

    // Fallback: random valid move
    const card = hand[Math.floor(Math.random() * hand.length)];
    if (stanceIsCharge(card)) {
        return { card, moveTo: myPos, attackAt: null };
    }
    const moveOpts = stanceIsNoMove(card) ? [myPos] : stanceMoveOptions({ card, pos: myPos, seat: pi });
    const moveTo = moveOpts.length > 0 ? moveOpts[Math.floor(Math.random() * moveOpts.length)] : myPos;
    if (stanceIsDodge(card)) {
        return { card, moveTo, attackAt: null };
    }
    const attackOpts = stanceAttackOptions({ card, pos: moveTo, seat: pi, origin: myPos });
    const attackAt = attackOpts.length > 0 ? attackOpts[Math.floor(Math.random() * attackOpts.length)] : null;
    return { card, moveTo, attackAt };
};

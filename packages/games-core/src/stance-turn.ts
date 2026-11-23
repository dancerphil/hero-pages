import { eqPos } from './geometry.js';
import { stanceHitCells, stanceIsCharge, stanceIsDodge } from './stance-rules.js';
import type { StanceAction, StanceState } from './stance.js';

export const resolveTurn = (state: StanceState) => {
    const [a0, a1] = state.pending as [StanceAction, StanceAction];
    state.pending = [null, null];
    const [prev0, prev1] = state.positions;
    let next0 = a0.moveTo;
    let next1 = a1.moveTo;
    if (eqPos(next0, next1)) {
        next0 = prev0;
        next1 = prev1;
    }

    const damage: [number, number] = [state.hands[0].charged ? 2 : 1, state.hands[1].charged ? 2 : 1];
    state.hands.forEach((hand) => {
        hand.charged = false;
    });

    const hits: [boolean, boolean] = [
        !stanceIsDodge(a1.card) && stanceHitCells({ card: a0.card, attackAt: a0.attackAt, pos: next0, seat: 0, origin: prev0 }).some(cell => eqPos(cell, next1)),
        !stanceIsDodge(a0.card) && stanceHitCells({ card: a1.card, attackAt: a1.attackAt, pos: next1, seat: 1, origin: prev1 }).some(cell => eqPos(cell, next0)),
    ];
    if (hits[0]) state.hp[1] -= damage[0];
    if (hits[1]) state.hp[0] -= damage[1];
    state.positions = [next0, next1];
    if (stanceIsCharge(a0.card)) state.hands[0].charged = true;
    if (stanceIsCharge(a1.card)) state.hands[1].charged = true;

    ([a0.card, a1.card] as const).forEach((card, seat) => {
        const hand = state.hands[seat];
        hand.hand = hand.hand.filter(item => item !== card);
        hand.discard.push(card);
        hand.hand.push(hand.discard.shift());
    });

    const rings = Math.floor(state.turn / 5);
    const poison: [number, number] = [0, 0];
    state.positions.forEach((pos, seat) => {
        if (Math.min(pos.row, 6 - pos.row, pos.col, 6 - pos.col) < rings) {
            state.poisonTurns[seat]++;
            if (state.poisonTurns[seat] >= 2) {
                state.hp[seat]--;
                poison[seat] = 1;
            }
        }
        else {
            state.poisonTurns[seat] = 0;
        }
    });

    state.lastTurn = { cards: [a0.card, a1.card], hits, damage, poison };
    if (state.hp[0] <= 0 || state.hp[1] <= 0) {
        state.winner = state.hp[0] <= 0 && state.hp[1] <= 0 ? 'draw' : (state.hp[0] <= 0 ? 1 : 0);
    }
    else {
        state.turn++;
    }
};

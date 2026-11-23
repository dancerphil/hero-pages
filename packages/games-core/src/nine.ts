import { getAiMove } from './ai/nine-ai.js';
import type { GameModule } from './room.js';

interface NineRound {
    round: number;
    cards: [number, number];
    gained: [number, number];
}

export interface NineState {
    round: number;
    hands: [number[], number[]];
    scores: [number, number];
    pending: [number | null, number | null];
    history: NineRound[];
    winner: number | 'draw' | null;
}

export interface NineView {
    round: number;
    scores: [number, number];
    history: NineRound[];
    winner: number | 'draw' | null;
    hand: number[] | null;
    submitted: boolean;
}

const isOver = (state: NineState) => state.winner !== null;

const needsMove = (state: NineState, seat: number) => !isOver(state) && state.pending[seat] === null;

const resolveRound = (state: NineState) => {
    const cards = state.pending as [number, number];
    state.pending = [null, null];
    const sum = cards[0] + cards[1];
    const gained: [number, number] = [cards[0] > cards[1] ? sum : 0, cards[1] > cards[0] ? sum : 0];
    state.scores = [state.scores[0] + gained[0], state.scores[1] + gained[1]];
    state.history.push({ round: state.round, cards, gained });
    if (state.round === 9) {
        if (state.scores[0] === state.scores[1]) state.winner = 'draw';
        else state.winner = state.scores[0] > state.scores[1] ? 0 : 1;
    }
    else {
        state.round++;
    }
};

export const nine: GameModule<NineState, number, NineView> = {
    init: () => ({
        round: 1,
        hands: [[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]],
        scores: [0, 0],
        pending: [null, null],
        history: [],
        winner: null,
    }),
    needsMove,
    move(state, seat, card) {
        if (!needsMove(state, seat) || !state.hands[seat].includes(card)) return false;
        state.hands[seat] = state.hands[seat].filter(item => item !== card);
        state.pending[seat] = card;
        if (state.pending[0] !== null && state.pending[1] !== null) resolveRound(state);
        return true;
    },
    ai: (state, seat) => getAiMove({ hand: state.hands[seat] })?.card ?? null,
    isOver,
    result: (state) => {
        if (state.winner === null) throw new Error('对局未结束');
        return state.winner;
    },
    view: (state, seat) => ({
        round: state.round,
        scores: state.scores,
        history: state.history,
        winner: state.winner,
        hand: seat === null ? null : state.hands[seat],
        submitted: seat !== null && state.pending[seat] !== null,
    }),
};

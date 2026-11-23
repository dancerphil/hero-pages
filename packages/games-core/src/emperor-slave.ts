import { getAiMove } from './ai/emperor-slave-ai.js';
import type { GameModule } from './room.js';

export type ESCard = 'king' | 'commoner' | 'slave';
export type ESOutcome = 'slave_wins' | 'king_wins' | 'continues';

interface Hand { king: number; commoner: number; slave: number }

interface ESRound {
    round: number;
    kingCard: ESCard;
    slaveCard: ESCard;
    outcome: ESOutcome;
}

export interface ESState {
    round: number;
    kingSeat: number;
    hands: [Hand, Hand];
    pending: [ESCard | null, ESCard | null];
    history: ESRound[];
    winner: number | null;
}

export interface ESView {
    round: number;
    kingSeat: number;
    history: ESRound[];
    winner: number | null;
    hand: Hand | null;
    submitted: boolean;
}

const freshHand = (role: 'king' | 'slave'): Hand => (role === 'king'
    ? { king: 1, commoner: 4, slave: 0 }
    : { king: 0, commoner: 4, slave: 1 });

const isOver = (state: ESState) => state.winner !== null;

const needsMove = (state: ESState, seat: number) => !isOver(state) && state.pending[seat] === null;

const resolveOutcome = (kingCard: ESCard, slaveCard: ESCard): ESOutcome => {
    if (slaveCard === 'slave' && kingCard === 'king') return 'slave_wins';
    if (kingCard === 'commoner' && slaveCard === 'slave') return 'king_wins';
    if (kingCard === 'king' && slaveCard === 'commoner') return 'king_wins';
    return 'continues';
};

const resolveRound = (state: ESState) => {
    const slaveSeat = 1 - state.kingSeat;
    const kingCard = state.pending[state.kingSeat] as ESCard;
    const slaveCard = state.pending[slaveSeat] as ESCard;
    state.pending = [null, null];
    const outcome = resolveOutcome(kingCard, slaveCard);
    state.history.push({ round: state.round, kingCard, slaveCard, outcome });
    if (outcome !== 'continues' || state.round === 5) {
        state.winner = outcome === 'slave_wins' ? slaveSeat : state.kingSeat;
    }
    else {
        state.round++;
    }
};

export const emperorSlave: GameModule<ESState, ESCard, ESView> = {
    init: (previous) => {
        const kingSeat = previous ? 1 - previous.kingSeat : 0;
        const hands: [Hand, Hand] = kingSeat === 0
            ? [freshHand('king'), freshHand('slave')]
            : [freshHand('slave'), freshHand('king')];
        return { round: 1, kingSeat, hands, pending: [null, null], history: [], winner: null };
    },
    needsMove,
    move(state, seat, card) {
        if (!needsMove(state, seat) || state.hands[seat][card] <= 0) return false;
        state.hands[seat][card]--;
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
        kingSeat: state.kingSeat,
        history: state.history,
        winner: state.winner,
        hand: seat === null ? null : state.hands[seat],
        submitted: seat !== null && state.pending[seat] !== null,
    }),
};

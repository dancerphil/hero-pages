import { getAiDeckSelect, getAiMove } from './ai/stance-ai.js';
import { eqPos, type Pos } from './geometry.js';
import type { GameModule } from './room.js';
import { shuffle } from './shuffle.js';
import { stanceAttackOptions, stanceIsNoMove, stanceMoveOptions } from './stance-rules.js';
import { resolveTurn } from './stance-turn.js';
import { ALL_STANCES, type StanceName } from './stances.js';

export interface StanceAction { card: StanceName; moveTo: Pos; attackAt: Pos | null }
export type StanceMove = StanceAction | { stances: StanceName[] };

export interface StanceHand { hand: StanceName[]; discard: StanceName[]; deckSelected: boolean; charged: boolean }

export interface StanceTurn {
    cards: [StanceName, StanceName];
    hits: [boolean, boolean];
    damage: [number, number];
    poison: [number, number];
}

export interface StanceState {
    positions: [Pos, Pos];
    hp: [number, number];
    hands: [StanceHand, StanceHand];
    pending: [StanceAction | null, StanceAction | null];
    turn: number;
    winner: number | 'draw' | null;
    poisonTurns: [number, number];
    lastTurn: StanceTurn | null;
}

export interface StanceView {
    positions: [Pos, Pos];
    hp: [number, number];
    turn: number;
    numPoisonRings: number;
    winner: number | 'draw' | null;
    submitted: boolean;
    hands: [StanceHand, StanceHand] | null;
    lastTurn: StanceTurn | null;
}

const emptyHand = (): StanceHand => ({ hand: [], discard: [], deckSelected: false, charged: false });

const inDeckPhase = (state: StanceState) => !state.hands.every(hand => hand.deckSelected);

const isOver = (state: StanceState) => state.winner !== null;

const needsMove = (state: StanceState, seat: number) => {
    if (isOver(state)) return false;
    if (inDeckPhase(state)) return !state.hands[seat].deckSelected;
    return state.pending[seat] === null;
};

const selectDeck = ({ state, seat, stances }: { state: StanceState; seat: number; stances: StanceName[] }) => {
    if (stances.length !== 5 || new Set(stances).size !== 5) return false;
    if (!stances.every(stance => ALL_STANCES.includes(stance))) return false;
    const shuffled = shuffle(stances);
    state.hands[seat] = { hand: shuffled.slice(0, 3), discard: shuffled.slice(3), deckSelected: true, charged: false };
    return true;
};

const validAction = ({ state, seat, action }: { state: StanceState; seat: number; action: StanceAction }) => {
    const { card, moveTo, attackAt } = action;
    const origin = state.positions[seat];
    if (!state.hands[seat].hand.includes(card)) return false;
    const moveOk = stanceIsNoMove(card) ? eqPos(moveTo, origin) : stanceMoveOptions({ card, pos: origin, seat }).some(pos => eqPos(pos, moveTo));
    if (!moveOk) return false;
    const attackOptions = stanceAttackOptions({ card, pos: moveTo, seat, origin });
    if (attackOptions.length === 0) return attackAt === null;
    return attackAt !== null && attackOptions.some(pos => eqPos(pos, attackAt));
};

export const stance: GameModule<StanceState, StanceMove, StanceView> = {
    init: () => ({
        positions: [{ row: 3, col: 1 }, { row: 3, col: 5 }],
        hp: [2, 2],
        hands: [emptyHand(), emptyHand()],
        pending: [null, null],
        turn: 1,
        winner: null,
        poisonTurns: [0, 0],
        lastTurn: null,
    }),
    needsMove,
    move(state, seat, move) {
        if (!needsMove(state, seat)) return false;
        if (inDeckPhase(state)) return 'stances' in move && selectDeck({ state, seat, stances: move.stances });
        if ('stances' in move || !validAction({ state, seat, action: move })) return false;
        state.pending[seat] = move;
        if (state.pending[0] !== null && state.pending[1] !== null) resolveTurn(state);
        return true;
    },
    ai: (state, seat) => {
        if (inDeckPhase(state)) return { stances: getAiDeckSelect().stances };
        return getAiMove({ hand: state.hands[seat].hand, positions: state.positions, pi: seat });
    },
    isOver,
    result: (state) => {
        if (state.winner === null) throw new Error('对局未结束');
        return state.winner;
    },
    view: (state, seat) => ({
        positions: state.positions,
        hp: state.hp,
        turn: state.turn,
        numPoisonRings: Math.floor(state.turn / 5),
        winner: state.winner,
        submitted: seat !== null && (inDeckPhase(state) ? state.hands[seat].deckSelected : state.pending[seat] !== null),
        hands: seat === null || inDeckPhase(state) ? null : state.hands,
        lastTurn: state.lastTurn,
    }),
};

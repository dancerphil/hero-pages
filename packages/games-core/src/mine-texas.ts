import { getAiMove } from './ai/mine-texas-ai.js';
import { type Card, dealHands } from './ai/poker.js';
import { evaluateBest, findBestIndices, handWinner } from './ai/poker-eval.js';
import type { GameModule } from './room.js';

export interface MineTexasSelection {
    hand: Card[];
    mine: Card;
}

export interface MineTexasRound {
    round: number;
    cards: [Card[], Card[]];
    best: [string, string];
    mine: [Card, Card];
    mineHit: [boolean, boolean];
    outcome: number | 'draw';
    gained: [number, number];
}

export interface MineTexasState {
    round: number;
    hands: [Card[], Card[]];
    selections: [MineTexasSelection | null, MineTexasSelection | null];
    scores: [number, number];
    history: MineTexasRound[];
    winner: number | null;
}

export interface MineTexasView {
    round: number;
    scores: [number, number];
    history: MineTexasRound[];
    winner: number | null;
    hands: [Card[], Card[]];
    best: [Card[], Card[]];
    submitted: boolean;
}

const WIN_SCORE = 10;
const HAND_NAMES = ['高牌', '一对', '两对', '三条', '顺子', '同花', '葫芦', '四条', '同花顺'];

const describeHand = (cards: Card[]) => HAND_NAMES[evaluateBest(cards).category] ?? '未知';

const bestOf = (cards: Card[]) => findBestIndices(cards).map(index => cards[index]);

const isOver = (state: MineTexasState) => state.winner !== null;

const needsMove = (state: MineTexasState, seat: number) => !isOver(state) && state.selections[seat] === null;

const validSelection = ({ state, seat, selection }: { state: MineTexasState; seat: number; selection: MineTexasSelection }) =>
    selection.hand.length === 5
    && new Set(selection.hand).size === 5
    && selection.hand.every(card => state.hands[seat].includes(card))
    && state.hands[1 - seat].includes(selection.mine);

const resolveRound = (state: MineTexasState) => {
    const [s0, s1] = state.selections as [MineTexasSelection, MineTexasSelection];
    state.selections = [null, null];
    const hw = handWinner(s0.hand, s1.hand);
    const outcome = hw === 0 ? 'draw' : hw - 1;
    const mineHit: [boolean, boolean] = [s1.hand.includes(s0.mine), s0.hand.includes(s1.mine)];
    const gained: [number, number] = [
        (outcome === 0 ? 1 : 0) + (mineHit[0] ? 1 : 0),
        (outcome === 1 ? 1 : 0) + (mineHit[1] ? 1 : 0),
    ];
    state.scores = [state.scores[0] + gained[0], state.scores[1] + gained[1]];
    state.history.push({
        round: state.round,
        cards: [s0.hand, s1.hand],
        best: [describeHand(s0.hand), describeHand(s1.hand)],
        mine: [s0.mine, s1.mine],
        mineHit,
        outcome,
        gained,
    });
    if (state.scores[0] >= WIN_SCORE || state.scores[1] >= WIN_SCORE) {
        state.winner = state.scores[0] > state.scores[1] ? 0 : 1;
    }
    else {
        state.round++;
        state.hands = dealHands();
    }
};

export const mineTexas: GameModule<MineTexasState, MineTexasSelection, MineTexasView> = {
    init: () => ({
        round: 1,
        hands: dealHands(),
        selections: [null, null],
        scores: [0, 0],
        history: [],
        winner: null,
    }),
    needsMove,
    move(state, seat, selection) {
        if (!needsMove(state, seat) || !validSelection({ state, seat, selection })) return false;
        state.selections[seat] = selection;
        if (state.selections[0] !== null && state.selections[1] !== null) resolveRound(state);
        return true;
    },
    ai: (state, seat) => getAiMove({ hand: state.hands[seat], opponentHand: state.hands[1 - seat] }),
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
        hands: state.hands,
        best: [bestOf(state.hands[0]), bestOf(state.hands[1])],
        submitted: seat !== null && state.selections[seat] !== null,
    }),
};

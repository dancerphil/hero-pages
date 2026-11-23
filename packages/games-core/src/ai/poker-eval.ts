import { type Card, rankOf, suitOf } from './poker.js';

interface HandEval {
    category: number;
    tiebreakers: number[];
}

export type { HandEval };

const getRankCounts = (cards: Card[]): [number, number][] => {
    const counts = new Map<number, number>();
    for (const c of cards) {
        const r = rankOf(c);
        counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    const entries = [...counts];
    entries.sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    return entries;
};

const isFlush = (cards: Card[]): boolean => {
    const s = suitOf(cards[0]);
    return cards.every(c => suitOf(c) === s);
};

const isStraight = (ranks: number[]): number[] | null => {
    const sorted = [...ranks].toSorted((a, b) => a - b);
    if (sorted[4] - sorted[0] === 4 && new Set(sorted).size === 5) { return [sorted[4]]; } // eslint-disable-line @stylistic/max-statements-per-line
    if (sorted[0] === 0 && sorted[1] === 1 && sorted[2] === 2 && sorted[3] === 3 && sorted[4] === 12) { return [3]; } // eslint-disable-line @stylistic/max-statements-per-line
    return null;
};

const generateCombos = (n: number, k: number): number[][] => {
    const result: number[][] = [];
    const comb: number[] = [];
    const build = (start: number) => {
        if (comb.length === k) { result.push([...comb]); return; } // eslint-disable-line @stylistic/max-statements-per-line
        for (let i = start; i < n; i++) { comb.push(i); build(i + 1); comb.pop(); } // eslint-disable-line @stylistic/max-statements-per-line
    };
    build(0);
    return result;
};

const FIVE_CHOOSE_FIVE = generateCombos(7, 5);

export const evaluateFive = (cards: Card[]): HandEval => {
    const ranks = cards.map(rankOf);
    const flush = isFlush(cards);
    const straight = isStraight(ranks);
    const counts = getRankCounts(cards);

    if (flush && straight) { return { category: 8, tiebreakers: straight }; } // eslint-disable-line @stylistic/max-statements-per-line
    if (counts[0][1] === 4) {
        return { category: 7, tiebreakers: [counts[0][0], counts[1][0]] };
    }
    if (counts[0][1] === 3 && counts[1][1] === 2) {
        return { category: 6, tiebreakers: [counts[0][0], counts[1][0]] };
    }
    if (flush) {
        const sorted = [...ranks].toSorted((a, b) => b - a);
        return { category: 5, tiebreakers: sorted };
    }
    if (straight) {
        return { category: 4, tiebreakers: straight };
    }
    if (counts[0][1] === 3) {
        const kickers = counts.slice(1).map(e => e[0]).toSorted((a, b) => b - a);
        return { category: 3, tiebreakers: [counts[0][0], ...kickers] };
    }
    if (counts[0][1] === 2 && counts[1][1] === 2) {
        const kicker = counts[2][0];
        const pairs = [counts[0][0], counts[1][0]].toSorted((a, b) => b - a);
        return { category: 2, tiebreakers: [...pairs, kicker] };
    }
    if (counts[0][1] === 2) {
        const kickers = counts.slice(1).map(e => e[0]).toSorted((a, b) => b - a);
        return { category: 1, tiebreakers: [counts[0][0], ...kickers] };
    }
    const sorted = [...ranks].toSorted((a, b) => b - a);
    return { category: 0, tiebreakers: sorted };
};

export const compareHands = (a: HandEval, b: HandEval): number => {
    if (a.category !== b.category) { return a.category - b.category; } // eslint-disable-line @stylistic/max-statements-per-line
    for (let i = 0; i < a.tiebreakers.length && i < b.tiebreakers.length; i++) {
        if (a.tiebreakers[i] !== b.tiebreakers[i]) { return a.tiebreakers[i] - b.tiebreakers[i]; } // eslint-disable-line @stylistic/max-statements-per-line
    }
    return 0;
};

export const evaluateBest = (cards: Card[]): HandEval => {
    if (cards.length === 5) { return evaluateFive(cards); } // eslint-disable-line @stylistic/max-statements-per-line
    let best = evaluateFive(FIVE_CHOOSE_FIVE[0].map(i => cards[i]));
    for (let idx = 1; idx < FIVE_CHOOSE_FIVE.length; idx++) {
        const five = FIVE_CHOOSE_FIVE[idx].map(i => cards[i]);
        const ev = evaluateFive(five);
        if (compareHands(ev, best) > 0) { best = ev; } // eslint-disable-line @stylistic/max-statements-per-line
    }
    return best;
};

export const handWinner = (c1: Card[], c2: Card[]): number => {
    const r = compareHands(evaluateBest(c1), evaluateBest(c2));
    if (r > 0) { return 1; } // eslint-disable-line @stylistic/max-statements-per-line
    if (r < 0) { return 2; } // eslint-disable-line @stylistic/max-statements-per-line
    return 0;
};

export const findBestIndices = (cards: Card[]): number[] => {
    let bestIdx = 0;
    let best: HandEval = evaluateFive(FIVE_CHOOSE_FIVE[0].map(i => cards[i]));
    for (let idx = 1; idx < FIVE_CHOOSE_FIVE.length; idx++) {
        const ev = evaluateFive(FIVE_CHOOSE_FIVE[idx].map(i => cards[i]));
        if (compareHands(ev, best) > 0) { best = ev; bestIdx = idx; } // eslint-disable-line @stylistic/max-statements-per-line
    }
    return FIVE_CHOOSE_FIVE[bestIdx];
};

export const rankAllCombos = (cards: Card[]): { indices: number[]; eval: HandEval }[] => {
    const results = FIVE_CHOOSE_FIVE.map(indices => ({
        indices,
        eval: evaluateFive(indices.map(i => cards[i])),
    }));
    results.sort((a, b) => compareHands(b.eval, a.eval));
    return results;
};

export const evaluateBestRemoving = (cards: Card[], excludeIdx: number): HandEval => {
    const remaining = cards.filter((_, i) => i !== excludeIdx);
    if (remaining.length < 5) { return evaluateBest(cards); } // eslint-disable-line @stylistic/max-statements-per-line
    const combos = generateCombos(remaining.length, 5);
    let best = evaluateFive(combos[0].map(i => remaining[i]));
    for (let idx = 1; idx < combos.length; idx++) {
        const ev = evaluateFive(combos[idx].map(i => remaining[i]));
        if (compareHands(ev, best) > 0) { best = ev; } // eslint-disable-line @stylistic/max-statements-per-line
    }
    return best;
};

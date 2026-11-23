export type Card = number;

export const suitOf = (c: Card): number => Math.floor(c / 13);
export const rankOf = (c: Card): number => c % 13;

export const SUITS = ['♣', '♦', '♥', '♠'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const formatCard = (c: Card): string => `${SUITS[suitOf(c)]}${RANKS[rankOf(c)]}`;

const freshDeck = (): Card[] => Array.from({ length: 52 }, (_, i) => i);

const shuffle = (deck: Card[]): Card[] => {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = d[i];
        d[i] = d[j];
        d[j] = temp;
    }
    return d;
};

export const dealHands = (): [Card[], Card[]] => {
    const deck = shuffle(freshDeck());
    return [deck.slice(0, 7), deck.slice(7, 14)];
};

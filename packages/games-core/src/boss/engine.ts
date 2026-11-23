import type { Pos } from '../geometry.js';
import type { StanceName } from '../stances.js';
import { playTurn, selectDeck } from './engine-turn.js';

interface HandState { hand: StanceName[]; discard: StanceName[]; deckSelected: boolean; pendingDoubleDamage?: boolean }

export interface BossEngineState<TExtra> {
    phase: 'deck_selection' | 'playing' | 'ended';
    positions: [Pos, Pos]; // [player, primary boss unit]
    bossUnits: Pos[];
    hp: [number, number];
    handState: HandState;
    skillIndex: number;
    turn: number;
    winner: 0 | 1 | 'draw' | null;
    extra: TExtra;
}

export interface TurnInput<TExtra> {
    skillId: string;
    extra: TExtra;
    bossUnits: Pos[];
    playerFrom: Pos;
    random: () => number;
}

export interface TurnOutput<TExtra> {
    bossUnits: Pos[];
    unitMoves: { from: Pos; to: Pos }[];
    aoe: Pos[]; // flashy area for this turn's attack animation
    hazard?: Pos[]; // persistent cells that also damage (e.g. lightning trail)
    nextExtra: TExtra;
}

export interface BossMove {
    stances?: StanceName[];
    card?: StanceName;
    moveTo?: Pos;
    attackAt?: Pos | null;
}

export type BossMessage = { type: string } & Record<string, unknown>;

export interface BossGame<TExtra> {
    initState: () => BossEngineState<TExtra>;
    handleMove(state: BossEngineState<TExtra>, message: BossMove): BossMessage | null;
}

export interface BossDefinition<TExtra> {
    bossHp: number;
    initPlayer: Pos;
    initBossUnits: Pos[];
    initExtra: () => TExtra;
    skillSequence: string[];
    resolveTurn: (input: TurnInput<TExtra>) => TurnOutput<TExtra>;
    bossTargets?: (bossUnits: Pos[]) => Pos[]; // cells the player must hit to damage the boss (default: all units)
    startExtras?: (extra: TExtra, bossUnits: Pos[]) => Record<string, unknown>;
    resultExtras?: (extra: TExtra, output: TurnOutput<TExtra>) => Record<string, unknown>;
    spectateExtras?: (extra: TExtra, bossUnits: Pos[]) => Record<string, unknown>;
    reportMissAsZeroDamage?: boolean;
}

export const createBossGame = <TExtra>(definition: BossDefinition<TExtra>): BossGame<TExtra> => {
    const initState = (): BossEngineState<TExtra> => ({
        phase: 'deck_selection',
        positions: [definition.initPlayer, definition.initBossUnits[0]],
        bossUnits: [...definition.initBossUnits],
        hp: [2, definition.bossHp],
        handState: { hand: [], discard: [], deckSelected: false },
        skillIndex: 0,
        turn: 1,
        winner: null,
        extra: definition.initExtra(),
    });

    const handleMove = (state: BossEngineState<TExtra>, message: BossMove): BossMessage | null => {
        if (state.phase === 'deck_selection') {
            return selectDeck({ state, message, definition });
        }
        if (state.phase !== 'playing') {
            return null;
        }
        return playTurn({ state, message, definition });
    };

    return { initState, handleMove };
};

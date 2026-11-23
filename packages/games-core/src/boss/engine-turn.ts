import { eqPos, type Pos } from '../geometry.js';
import { skillHitCells, type Skill, type SkillContext } from '../skill.js';
import { shuffle } from '../shuffle.js';
import { ALL_STANCES, STANCES } from '../stances.js';
import { resolvePlayerTarget } from './engine-target.js';
import type { BossDefinition, BossEngineState, BossMessage, BossMove, TurnOutput } from './engine.js';

const skillAt = <TExtra>({ definition, index }: { definition: BossDefinition<TExtra>; index: number }): string =>
    definition.skillSequence[index % definition.skillSequence.length];

export const selectDeck = <TExtra>({ state, message, definition }: { state: BossEngineState<TExtra>; message: BossMove; definition: BossDefinition<TExtra> }): BossMessage | null => {
    const stances = message.stances ?? [];
    if (stances.length !== 5 || new Set(stances).size !== 5) {
        return null;
    }
    if (!stances.every(stance => (ALL_STANCES as string[]).includes(stance))) {
        return null;
    }
    if (state.handState.deckSelected) {
        return null;
    }
    const shuffled = shuffle(stances);
    state.handState = { hand: shuffled.slice(0, 3), discard: shuffled.slice(3), deckSelected: true };
    state.phase = 'playing';
    return {
        type: 'boss_turn_start',
        turn: state.turn,
        positions: state.positions,
        hp: state.hp,
        hand: state.handState.hand,
        discard: state.handState.discard,
        bossSkill: skillAt({ definition, index: state.skillIndex }),
        ...definition.startExtras?.(state.extra, state.bossUnits),
    };
};

const resolveHits = <TExtra>({ state, definition, cardSkill, playerTo, resolvedAttackAt, attackContext, output }: {
    state: BossEngineState<TExtra>;
    definition: BossDefinition<TExtra>;
    cardSkill: Skill;
    playerTo: Pos;
    resolvedAttackAt: Pos | null;
    attackContext: SkillContext;
    output: TurnOutput<TExtra>;
}) => {
    const playerIsDodging = Boolean(cardSkill.immune);
    const playerDamage = state.handState.pendingDoubleDamage ? 2 : 1;
    state.handState.pendingDoubleDamage = false;

    const playerHitCells = skillHitCells({ skill: cardSkill, ctx: attackContext, target: resolvedAttackAt });
    const bossTargets = definition.bossTargets?.(output.bossUnits) ?? output.bossUnits;
    const iHitBoss = playerHitCells.some(cell => bossTargets.some(target => eqPos(cell, target)));
    const damageCells = output.hazard ? [...output.aoe, ...output.hazard] : output.aoe;
    const bossHitsPlayer = !playerIsDodging && damageCells.some(cell => eqPos(cell, playerTo));
    return { iHitBoss, bossHitsPlayer, playerDamage };
};

export const playTurn = <TExtra>({ state, message, definition }: { state: BossEngineState<TExtra>; message: BossMove; definition: BossDefinition<TExtra> }): BossMessage | null => {
    const { card, moveTo, attackAt } = message;
    if (!card || !state.handState.hand.includes(card)) {
        return null;
    }
    const cardSkill = STANCES[card];
    const resolved = resolvePlayerTarget({ positions: state.positions, cardSkill, moveTo, attackAt });
    if (!resolved) {
        return null;
    }
    const { playerTo, resolvedAttackAt, attackContext } = resolved;
    const playerFrom = state.positions[0];

    const skillId = skillAt({ definition, index: state.skillIndex });
    const output = definition.resolveTurn({
        skillId,
        extra: state.extra,
        bossUnits: state.bossUnits,
        playerFrom,
        random: Math.random,
    });

    const { iHitBoss, bossHitsPlayer, playerDamage } = resolveHits({ state, definition, cardSkill, playerTo, resolvedAttackAt, attackContext, output });
    if (iHitBoss) {
        state.hp[1] -= playerDamage;
    }
    if (bossHitsPlayer) {
        state.hp[0] -= 1;
    }
    state.bossUnits = output.bossUnits;
    state.positions = [playerTo, output.bossUnits[0]];
    state.extra = output.nextExtra;
    if (cardSkill.charge) {
        state.handState.pendingDoubleDamage = true;
    }

    state.handState.hand = state.handState.hand.filter(currentCard => currentCard !== card);
    state.handState.discard.push(card);
    const drawnCard = state.handState.discard.shift();
    if (drawnCard) {
        state.handState.hand.push(drawnCard);
    }

    state.skillIndex++;
    const currentTurn = state.turn;
    const gameOver = state.hp[0] <= 0 || state.hp[1] <= 0;
    if (gameOver) {
        state.winner = state.hp[0] <= 0 && state.hp[1] <= 0 ? 'draw' : (state.hp[0] <= 0 ? 1 : 0);
        state.phase = 'ended';
    }
    else {
        state.turn++;
    }

    const primaryMove = output.unitMoves[0] ?? { from: state.positions[1], to: state.positions[1] };
    return {
        type: 'boss_turn_result',
        turn: currentTurn,
        myCard: card,
        myMovedTo: playerTo,
        myMovedFrom: playerFrom,
        myAttackedAt: resolvedAttackAt,
        bossSkill: skillId,
        bossMovedFrom: primaryMove.from,
        bossMovedTo: primaryMove.to,
        bossAoe: output.aoe,
        iHitBoss,
        bossHitMe: bossHitsPlayer,
        myDamage: definition.reportMissAsZeroDamage ? (iHitBoss ? playerDamage : 0) : playerDamage,
        positions: state.positions,
        hp: state.hp,
        ...definition.resultExtras?.(state.extra, output),
        gameOver,
        winner: gameOver ? state.winner : undefined,
        ...(gameOver ? {} : {
            hand: state.handState.hand,
            discard: state.handState.discard,
            nextBossSkill: skillAt({ definition, index: state.skillIndex }),
        }),
    };
};

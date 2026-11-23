import { stanceAttackOptions, stanceHitCells, stanceMoveOptions, type Pos, type StanceName } from '@hero-pages/games-core';
import { BoardBoss } from '@/components/Board/BoardBoss';
import type { BossBattleConfig, BossBattleMessage } from './BattleBossConfig';
import type { BattleBossState } from './BattleBossState';

const getPlayerBoardProps = (props: {
    positions: [Pos, Pos];
    selectedCard: StanceName | null;
    actionStep: 'card' | 'move' | 'attack' | null;
    previewPos: Pos | null;
    animPhase: 'idle' | 'moving' | 'attacking';
    onCellClick: (pos: Pos) => void;
}) => {
    const { positions, selectedCard, actionStep, previewPos, animPhase, onCellClick } = props;
    const playerPos = positions[0];
    const nextPlayerPos = previewPos ?? playerPos;
    const isIdle = animPhase === 'idle';
    const moveHighlights = selectedCard && actionStep === 'move' ? stanceMoveOptions({ card: selectedCard, pos: playerPos, seat: 0 }) : [];
    const attackHighlights = selectedCard && actionStep === 'attack' ? stanceAttackOptions({ card: selectedCard, pos: nextPlayerPos, seat: 0, origin: playerPos }) : [];
    const attackAreaOfEffectHighlights = (selectedCard === 'tiger' || selectedCard === 'ox') && actionStep === 'attack' && attackHighlights.length >= 1
        ? stanceHitCells({ card: selectedCard, attackAt: attackHighlights[0], pos: nextPlayerPos, seat: 0, origin: playerPos })
        : [];

    return {
        playerDisplayPos: actionStep === 'attack' && previewPos ? previewPos : undefined,
        moveHighlights: isIdle ? moveHighlights : [],
        attackHighlights: isIdle ? attackHighlights : [],
        areaOfEffectHighlights: isIdle ? attackAreaOfEffectHighlights : [],
        onCellClick: isIdle ? onCellClick : undefined,
    };
};

const getSkillBoardProps = <TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>>(props: {
    config: BossBattleConfig<TBossSkill, TExtraState, TBossMessage>;
    state: BattleBossState<TBossSkill, TExtraState, TBossMessage>;
}) => {
    const { config, state } = props;
    const { positions, bossSkill, animPhase, submitted, revealedSkills, extraState } = state;
    const playerPos = positions[0];
    const bossPos = positions[1];
    const isSkillVisible = bossSkill !== null && animPhase === 'idle' && !submitted && revealedSkills.has(bossSkill);

    return {
        warningHighlights: isSkillVisible ? config.getWarningHighlights({ skill: bossSkill, bossPos, playerPos, extraState }) : [],
        directionArrows: isSkillVisible ? (config.getDirectionArrows?.(bossSkill, bossPos, playerPos, extraState) ?? []) : [],
        staticArrows: isSkillVisible ? (config.getStaticArrows?.(bossSkill, bossPos, playerPos, extraState) ?? []) : [],
    };
};

export const BattleBossBoard = <TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>>(props: {
    config: BossBattleConfig<TBossSkill, TExtraState, TBossMessage>;
    state: BattleBossState<TBossSkill, TExtraState, TBossMessage>;
    onCellClick: (pos: Pos) => void;
}) => {
    const { config, state, onCellClick } = props;
    const { positions, previewPos, actionStep, selectedCard, animPhase, submitted, bossSkill, extraState, attackDisplay, animatedBossAreaOfEffect, animatedArrows } = state;
    const playerBoardProps = getPlayerBoardProps({ positions, selectedCard, actionStep, previewPos, animPhase, onCellClick });
    const { warningHighlights, directionArrows, staticArrows } = getSkillBoardProps({ config, state });

    return (
        <BoardBoss
            positions={positions}
            {...playerBoardProps}
            warningHighlights={warningHighlights}
            directionArrows={directionArrows}
            boss2Pos={config.getBoss2Pos?.(extraState) ?? undefined}
            allBossPositions={config.getAllBossPositions?.(extraState)}
            specialHighlights={config.getSpecialHighlights?.(bossSkill, extraState, animPhase, submitted) ?? []}
            specialBackground={config.specialHighlightStyle?.background}
            specialBorder={config.specialHighlightStyle?.border}
            animatedAttacks={animPhase === 'attacking' ? attackDisplay : []}
            animatedBossAreaOfEffect={animPhase === 'attacking' ? animatedBossAreaOfEffect : []}
            arrows={animPhase === 'moving' ? animatedArrows : staticArrows}
        />
    );
};

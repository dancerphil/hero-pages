import { eqPos, stanceHitCells, type BossMove, type StanceName } from '@hero-pages/games-core';
import { actionOrange } from '@/constants/gameColors';
import type { BossBattleConfig, BossBattleMessage } from './BattleBossConfig';
import type { BattleBossState } from './BattleBossState';

export const createBattleBossTurn = <TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>>({ config, state }: {
    config: BossBattleConfig<TBossSkill, TExtraState, TBossMessage>;
    state: BattleBossState<TBossSkill, TExtraState, TBossMessage>;
}) => {
    const handleGameMessage = (msg: TBossMessage) => {
        if (msg.type === 'boss_turn_start') {
            state.setPositions(msg.positions);
            state.setHp(msg.hp);
            state.setHand(msg.hand);
            state.setDiscard(msg.discard);
            state.setBossSkill(msg.bossSkill);
            state.setExtraState(config.getExtraStateFromTurnStart(msg));
            state.setSubPhase('playing');
            state.setActionStep('card');
            state.setSubmitted(false);
            state.setLastResult(null);
            return;
        }
        if (msg.type !== 'boss_turn_result') {
            return;
        }

        const myMovedTo = msg.myMovedTo;
        const bossMovedTo = msg.bossMovedTo;
        const attacks = stanceHitCells({ card: msg.myCard, attackAt: msg.myAttackedAt ?? null, pos: myMovedTo, seat: 0, origin: msg.myMovedFrom });
        const bossAreaOfEffect = msg.bossAoe ?? [];
        const playerArrow = { from: msg.myMovedFrom, to: myMovedTo, color: '#22c55e' };
        const bossArrow = msg.bossMovedFrom && !eqPos(msg.bossMovedFrom, bossMovedTo)
            ? { from: msg.bossMovedFrom, to: bossMovedTo, color: actionOrange }
            : null;
        const boss2AnimData = config.getBoss2AnimData?.(msg) ?? null;
        const boss2Arrow = boss2AnimData && !eqPos(boss2AnimData.movedFrom, boss2AnimData.movedTo)
            ? { from: boss2AnimData.movedFrom, to: boss2AnimData.movedTo, color: actionOrange }
            : null;
        const allBossArrows = (config.getAllBossAnimData?.(msg) ?? [])
            .filter(data => !eqPos(data.movedFrom, data.movedTo))
            .map(data => ({ from: data.movedFrom, to: data.movedTo, color: actionOrange }));
        const arrows = [playerArrow, ...(bossArrow ? [bossArrow] : []), ...(boss2Arrow ? [boss2Arrow] : []), ...allBossArrows];
        const newExtraState = config.getExtraStateFromTurnResult(msg, state.extraState);

        state.setPositions([myMovedTo, bossMovedTo]);
        state.setExtraState(newExtraState);
        state.setAnimatedArrows(arrows);
        state.setAnimPhase('moving');
        setTimeout(() => {
            state.setAnimatedArrows([]);
            state.setAttackDisplay(attacks);
            state.setAnimatedBossAreaOfEffect(bossAreaOfEffect);
            state.setAnimPhase('attacking');
            setTimeout(() => {
                state.setAnimPhase('idle');
                state.setAttackDisplay([]);
                state.setAnimatedBossAreaOfEffect([]);
                state.setPositions(msg.positions);
                state.setHp(msg.hp);
                state.setLastResult({
                    myCard: msg.myCard,
                    iHitBoss: msg.iHitBoss,
                    bossHitMe: msg.bossHitMe,
                    myDamage: msg.myDamage ?? 1,
                });
                state.setLastAnimationData({
                    arrows,
                    prePositions: [msg.myMovedFrom, msg.bossMovedFrom ?? bossMovedTo],
                    myTo: myMovedTo,
                    bossTo: bossMovedTo,
                    attacks,
                    bossAreaOfEffect,
                });
                state.setRevealedSkills(prev => new Set([...prev, msg.bossSkill]));
                if (msg.gameOver) {
                    state.setSubPhase('ended');
                    if (msg.winner === 0) {
                        state.setPlayerWins(wins => wins + 1);
                    }
                    if (msg.winner === 1) {
                        state.setBossWins(wins => wins + 1);
                    }
                }
                else {
                    state.setHand(msg.hand as StanceName[]);
                    state.setDiscard(msg.discard as StanceName[]);
                    state.setBossSkill(msg.nextBossSkill);
                    state.setSubmitted(false);
                    state.setActionStep('card');
                    state.setSelectedCard(null);
                    state.setPreviewPos(null);
                }
            }, 700);
        }, 700);
    };

    const sendMove = (move: BossMove) => {
        const message = config.engine.handleMove(state.engineState.current, move);
        if (message) {
            handleGameMessage(message as TBossMessage);
        }
    };

    const replayAnimation = () => {
        if (!state.lastAnimationData || state.animPhase !== 'idle') {
            return;
        }
        const animationData = state.lastAnimationData;
        state.setPositions(animationData.prePositions);
        state.setAnimatedArrows(animationData.arrows);
        state.setAnimPhase('moving');
        setTimeout(() => {
            state.setPositions([animationData.myTo, animationData.bossTo]);
            state.setAnimatedArrows([]);
            state.setAttackDisplay(animationData.attacks);
            state.setAnimatedBossAreaOfEffect(animationData.bossAreaOfEffect);
            state.setAnimPhase('attacking');
            setTimeout(() => {
                state.setAnimPhase('idle');
                state.setAttackDisplay([]);
                state.setAnimatedBossAreaOfEffect([]);
            }, 700);
        }, 700);
    };

    return { sendMove, replayAnimation };
};

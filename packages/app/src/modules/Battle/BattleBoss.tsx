import { Button, Stack, Text } from '@mantine/core';
import { STANCE_LABELS } from '@/components/Card/CardStance';
import type { BossBattleConfig, BossBattleMessage } from './BattleBossConfig';
import { useBattleBossState } from './BattleBossState';
import { createBattleBossTurn } from './BattleBossTurn';
import { createBattleBossAction } from './BattleBossAction';
import { BattleBossDeck } from './BattleBossDeck';
import { BattleBossStatus } from './BattleBossStatus';
import { BattleBossBoard } from './BattleBossBoard';
import { BattleBossHand } from './BattleBossHand';

interface BattleBossProps<TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>> {
    config: BossBattleConfig<TBossSkill, TExtraState, TBossMessage>;
}

export const BattleBoss = <TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>>({
    config,
}: BattleBossProps<TBossSkill, TExtraState, TBossMessage>) => {
    const state = useBattleBossState(config);
    const { sendMove, replayAnimation } = createBattleBossTurn({ config, state });
    const action = createBattleBossAction({ config, state, sendMove });

    if (state.subPhase === 'deck_selection') {
        return (
            <BattleBossDeck
                deckPreset={state.deckPreset}
                editingDeck={state.editingDeck}
                deckChoice={state.deckChoice}
                onToggle={action.toggleStance}
                onSave={action.saveAndStart}
                onStart={action.startWithPreset}
                onEdit={action.editDeck}
                onCancelEdit={() => state.setEditingDeck(false)}
            />
        );
    }

    const skillLabel = state.bossSkill && config.skillLabels[state.bossSkill];
    const skillDescription = state.bossSkill !== null && state.revealedSkills.has(state.bossSkill) ? config.skillDescriptions[state.bossSkill] : '???';
    const specialStatusText = config.getSpecialStatusText?.(state.bossSkill, state.extraState, state.animPhase, state.submitted) ?? null;

    return (
        <Stack gap="sm" align="center">
            <BattleBossStatus
                bossName={config.bossName}
                bossHealth={config.bossHealth}
                hp={state.hp}
                playerWins={state.playerWins}
                bossWins={state.bossWins}
                skillLabel={skillLabel}
                skillDescription={skillDescription}
                specialStatusText={specialStatusText}
            />
            <BattleBossBoard config={config} state={state} onCellClick={action.handleCellClick} />
            {state.lastResult && (
                <Text size="sm" c="dimmed">
                    {`上回合：我出${STANCE_LABELS[state.lastResult.myCard]}`}
                    {state.lastResult.iHitBoss ? ` · 击中 Boss -${state.lastResult.myDamage}HP` : ''}
                    {state.lastResult.bossHitMe ? ' · Boss 击中我 -1HP' : ''}
                </Text>
            )}
            {state.lastAnimationData && state.animPhase === 'idle' && (
                <Button size="xs" variant="subtle" onClick={replayAnimation}>↩ 重播动画</Button>
            )}
            {state.subPhase === 'playing' && (
                <BattleBossHand
                    hand={state.hand}
                    discard={state.discard}
                    selectedCard={state.selectedCard}
                    submitted={state.submitted}
                    actionStep={state.actionStep}
                    animPhase={state.animPhase}
                    onSelect={action.selectCard}
                    onCancel={action.cancelAction}
                    onSkip={action.skipAttack}
                />
            )}
            {state.subPhase === 'ended' && (
                <Button variant="light" onClick={state.rematch}>再来一局</Button>
            )}
        </Stack>
    );
};

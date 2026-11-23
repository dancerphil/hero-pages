import { stanceAttackOptions, stanceIsCharge, stanceMoveOptions, type BossMove, type Pos, type StanceName } from '@hero-pages/games-core';
import type { BossBattleConfig, BossBattleMessage } from './BattleBossConfig';
import { saveDeckPreset, type BattleBossState } from './BattleBossState';

export const createBattleBossAction = <TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>>({ config, state, sendMove }: {
    config: BossBattleConfig<TBossSkill, TExtraState, TBossMessage>;
    state: BattleBossState<TBossSkill, TExtraState, TBossMessage>;
    sendMove: (move: BossMove) => void;
}) => {
    const toggleStance = (stance: StanceName) => {
        state.setDeckChoice((previousChoice) => {
            const nextChoice = new Set(previousChoice);
            if (nextChoice.has(stance)) {
                nextChoice.delete(stance);
            }
            else if (nextChoice.size < 5) {
                nextChoice.add(stance);
            }
            return nextChoice;
        });
    };

    const editDeck = () => {
        state.setDeckChoice(new Set(state.deckPreset));
        state.setEditingDeck(true);
    };

    const startWithPreset = () => {
        if (!state.deckPreset) {
            return;
        }
        sendMove({ stances: state.deckPreset });
    };

    const saveAndStart = () => {
        if (state.deckChoice.size !== 5) {
            return;
        }
        const deck = [...state.deckChoice];
        saveDeckPreset(config.game, deck);
        state.setDeckPreset(deck);
        state.setEditingDeck(false);
        sendMove({ stances: deck });
    };

    const selectCard = (card: StanceName) => {
        if (state.submitted || state.actionStep !== 'card') {
            return;
        }
        state.setSelectedCard(card);
        if (stanceIsCharge(card)) {
            sendMove({ card, moveTo: state.positions[0], attackAt: null });
            state.setSubmitted(true);
            state.setActionStep(null);
            return;
        }
        const moveOptions = stanceMoveOptions({ card, pos: state.positions[0], seat: 0 });
        if (moveOptions.length === 0) {
            state.setPreviewPos(state.positions[0]);
            if (stanceAttackOptions({ card, pos: state.positions[0], seat: 0, origin: state.positions[0] }).length === 0) {
                sendMove({ card, moveTo: state.positions[0], attackAt: null });
                state.setSubmitted(true);
                state.setActionStep(null);
            }
            else {
                state.setActionStep('attack');
            }
        }
        else {
            state.setActionStep('move');
        }
    };

    const handleCellClick = (pos: Pos) => {
        if (!state.selectedCard) {
            return;
        }
        if (state.actionStep === 'move') {
            state.setPreviewPos(pos);
            const attackOptions = stanceAttackOptions({ card: state.selectedCard, pos, seat: 0, origin: state.positions[0] });
            if (attackOptions.length === 0) {
                sendMove({ card: state.selectedCard, moveTo: pos, attackAt: null });
                state.setSubmitted(true);
                state.setActionStep(null);
            }
            else {
                state.setActionStep('attack');
            }
            return;
        }
        if (state.actionStep === 'attack') {
            sendMove({ card: state.selectedCard, moveTo: state.previewPos ?? state.positions[0], attackAt: pos });
            state.setSubmitted(true);
            state.setActionStep(null);
        }
    };

    const cancelAction = () => {
        state.setSelectedCard(null);
        state.setPreviewPos(null);
        state.setActionStep('card');
    };

    const skipAttack = () => {
        sendMove({ card: state.selectedCard, moveTo: state.previewPos ?? state.positions[0], attackAt: null });
        state.setSubmitted(true);
        state.setActionStep(null);
    };

    return { toggleStance, editDeck, startWithPreset, saveAndStart, selectCard, handleCellClick, cancelAction, skipAttack };
};

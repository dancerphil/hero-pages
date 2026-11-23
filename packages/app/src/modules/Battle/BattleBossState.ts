import { useCallback, useRef, useState } from 'react';
import type { Pos, StanceName } from '@hero-pages/games-core';
import type { Arrow } from '@/components/Board/BoardBoss';
import type { BossBattleConfig, BossBattleMessage, BossAnimationData } from './BattleBossConfig';

const deckPresetKey = (game: string) => `boss-deck-preset-${game}`;

const loadDeckPreset = (game: string): StanceName[] | null => {
    try {
        const saved = localStorage.getItem(deckPresetKey(game));
        return saved ? JSON.parse(saved) : null;
    }
    catch { return null; }
};

export const saveDeckPreset = (game: string, deck: StanceName[]) => {
    localStorage.setItem(deckPresetKey(game), JSON.stringify(deck));
};

export const useBattleBossState = <TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>>(config: BossBattleConfig<TBossSkill, TExtraState, TBossMessage>) => {
    const [subPhase, setSubPhase] = useState<'deck_selection' | 'playing' | 'ended'>('deck_selection');
    const [deckChoice, setDeckChoice] = useState<Set<StanceName>>(() => new Set());
    const [deckPreset, setDeckPreset] = useState<StanceName[] | null>(() => loadDeckPreset(config.game));
    const [editingDeck, setEditingDeck] = useState(() => loadDeckPreset(config.game) === null);
    const [positions, setPositions] = useState<[Pos, Pos]>([{ row: 3, col: 1 }, { row: 3, col: 5 }]);
    const [hp, setHp] = useState<[number, number]>([2, config.bossHealth]);
    const [hand, setHand] = useState<StanceName[]>([]);
    const [discard, setDiscard] = useState<StanceName[]>([]);
    const [bossSkill, setBossSkill] = useState<TBossSkill | null>(null);
    const [extraState, setExtraState] = useState<TExtraState>(config.initialExtraState);
    const [revealedSkills, setRevealedSkills] = useState<Set<TBossSkill>>(() => new Set());
    const [submitted, setSubmitted] = useState(false);
    const [lastResult, setLastResult] = useState<{ myCard: StanceName; iHitBoss: boolean; bossHitMe: boolean; myDamage: number } | null>(null);
    const [actionStep, setActionStep] = useState<'card' | 'move' | 'attack' | null>(null);
    const [selectedCard, setSelectedCard] = useState<StanceName | null>(null);
    const [previewPos, setPreviewPos] = useState<Pos | null>(null);
    const [animPhase, setAnimPhase] = useState<'idle' | 'moving' | 'attacking'>('idle');
    const [attackDisplay, setAttackDisplay] = useState<Pos[]>([]);
    const [animatedBossAreaOfEffect, setAnimatedBossAreaOfEffect] = useState<Pos[]>([]);
    const [animatedArrows, setAnimatedArrows] = useState<Arrow[]>([]);
    const [lastAnimationData, setLastAnimationData] = useState<BossAnimationData | null>(null);
    const engineState = useRef(config.engine.initState());
    const [playerWins, setPlayerWins] = useState(0);
    const [bossWins, setBossWins] = useState(0);

    const resetGame = useCallback(() => {
        setSubPhase('deck_selection');
        setDeckChoice(new Set());
        setEditingDeck(false);
        setPositions([{ row: 3, col: 1 }, { row: 3, col: 5 }]);
        setHp([2, config.bossHealth]);
        setHand([]);
        setDiscard([]);
        setBossSkill(null);
        setExtraState(config.initialExtraState);
        setRevealedSkills(new Set());
        setSubmitted(false);
        setLastResult(null);
        setActionStep(null);
        setSelectedCard(null);
        setPreviewPos(null);
        setAnimPhase('idle');
        setAttackDisplay([]);
        setAnimatedBossAreaOfEffect([]);
        setAnimatedArrows([]);
        setLastAnimationData(null);
    }, [config.bossHealth, config.initialExtraState]);

    const rematch = useCallback(() => {
        engineState.current = config.engine.initState();
        resetGame();
    }, [config.engine, resetGame]);

    return {
        subPhase, setSubPhase,
        deckChoice, setDeckChoice,
        deckPreset, setDeckPreset,
        editingDeck, setEditingDeck,
        positions, setPositions,
        hp, setHp,
        hand, setHand,
        discard, setDiscard,
        bossSkill, setBossSkill,
        extraState, setExtraState,
        revealedSkills, setRevealedSkills,
        submitted, setSubmitted,
        lastResult, setLastResult,
        actionStep, setActionStep,
        selectedCard, setSelectedCard,
        previewPos, setPreviewPos,
        animPhase, setAnimPhase,
        attackDisplay, setAttackDisplay,
        animatedBossAreaOfEffect, setAnimatedBossAreaOfEffect,
        animatedArrows, setAnimatedArrows,
        lastAnimationData, setLastAnimationData,
        engineState,
        playerWins, setPlayerWins,
        bossWins, setBossWins,
        rematch,
    };
};

export type BattleBossState<TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>> = ReturnType<typeof useBattleBossState<TBossSkill, TExtraState, TBossMessage>>;

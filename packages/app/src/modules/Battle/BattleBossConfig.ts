import type { BossGame, Pos, StanceName } from '@hero-pages/games-core';
import type { Arrow, DirectionArrow } from '@/components/Board/BoardBoss';

export interface BossBattleMessage<TBossSkill extends string> {
    type: string;
    phase?: string;
    positions?: [Pos, Pos];
    hp?: [number, number];
    hand?: StanceName[];
    discard?: StanceName[];
    turn?: number;
    bossSkill?: TBossSkill;
    nextBossSkill?: TBossSkill;
    myCard?: StanceName;
    myMovedTo?: Pos;
    myMovedFrom?: Pos;
    myAttackedAt?: Pos | null;
    bossMovedTo?: Pos;
    bossMovedFrom?: Pos;
    bossAoe?: Pos[];
    iHitBoss?: boolean;
    bossHitMe?: boolean;
    myDamage?: number;
    gameOver?: boolean;
    winner?: 0 | 1 | 'draw';
}

export interface BossAnimationData {
    arrows: Arrow[];
    prePositions: [Pos, Pos];
    myTo: Pos;
    bossTo: Pos;
    attacks: Pos[];
    bossAreaOfEffect: Pos[];
}

export interface BossBattleConfig<TBossSkill extends string, TExtraState, TBossMessage extends BossBattleMessage<TBossSkill>> {
    game: string;
    engine: BossGame<unknown>;
    bossName: string;
    bossHealth: number;
    skillLabels: Record<TBossSkill, string>;
    skillDescriptions: Record<TBossSkill, string>;
    initialExtraState: TExtraState;
    getExtraStateFromTurnStart: (msg: TBossMessage) => TExtraState;
    getExtraStateFromTurnResult: (msg: TBossMessage, currentExtraState: TExtraState) => TExtraState;
    getWarningHighlights: (args: { skill: TBossSkill; bossPos: Pos; playerPos: Pos; extraState: TExtraState }) => Pos[];
    getSpecialHighlights?: (skill: TBossSkill | null, extraState: TExtraState, animPhase: 'idle' | 'moving' | 'attacking', submitted: boolean) => Pos[];
    getSpecialStatusText?: (skill: TBossSkill | null, extraState: TExtraState, animPhase: 'idle' | 'moving' | 'attacking', submitted: boolean) => string | null;
    specialHighlightStyle?: { background: string; border: string };
    getStaticArrows?: (skill: TBossSkill | null, bossPos: Pos, playerPos: Pos, extraState: TExtraState) => Arrow[];
    getDirectionArrows?: (skill: TBossSkill, bossPos: Pos, playerPos: Pos, extraState: TExtraState) => DirectionArrow[];
    getBoss2Pos?: (extraState: TExtraState) => Pos | null;
    getBoss2AnimData?: (msg: TBossMessage) => { movedFrom: Pos; movedTo: Pos } | null;
    getAllBossPositions?: (extraState: TExtraState) => Pos[];
    getAllBossAnimData?: (msg: TBossMessage) => { movedFrom: Pos; movedTo: Pos }[];
}

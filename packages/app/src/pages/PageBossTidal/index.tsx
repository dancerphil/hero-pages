import type { Pos, StanceName } from '@hero-pages/games-core';
import { bossTidal } from '@hero-pages/games-core';
import { BattleBoss } from '@/modules/Battle/BattleBoss';
import { getDirectionArrows, getWarningHighlights, type TidalExtraState, type TidalSkill, type Wave } from './tidalAoe';

const skillLabels: Record<TidalSkill, string> = {
    destruction: '破坏',
    wave: '巨浪',
};

const skillDescriptions: Record<TidalSkill, string> = {
    destruction: '以场地中央为中心释放 3×3 外圈，后续巨浪回合依次扩散至 5×5 和 7×7 外圈',
    wave: '追加 2 股新巨浪，所有巨浪各向场地中间推进一格，毁灭之环同步扩散',
};

interface TidalGameMessage {
    type: string;
    phase?: string;
    positions?: [Pos, Pos];
    hp?: [number, number];
    hand?: StanceName[];
    discard?: StanceName[];
    turn?: number;
    bossSkill?: TidalSkill;
    nextBossSkill?: TidalSkill;
    destructionStage?: 0 | 1 | 2;
    waves?: Wave[];
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

export const PageBossTidal = () => (
    <BattleBoss<TidalSkill, TidalExtraState, TidalGameMessage>
        config={{
            game: 'boss/tidal',
            engine: bossTidal,
            bossName: '潮汐',
            bossHealth: 6,
            skillLabels,
            skillDescriptions,
            initialExtraState: { destructionStage: 0, waves: [] },
            getExtraStateFromTurnStart: msg => ({ destructionStage: msg.destructionStage ?? 0, waves: msg.waves ?? [] }),
            getExtraStateFromTurnResult: msg => ({ destructionStage: msg.destructionStage ?? 0, waves: msg.waves ?? [] }),
            getWarningHighlights,
            getDirectionArrows: (skill, _bossPos, _playerPos, extraState) => getDirectionArrows(skill, extraState),
            getSpecialStatusText: (skill, extraState, animPhase, submitted) => {
                if (animPhase !== 'idle' || submitted || skill !== 'wave') {
                    return null;
                }
                if (extraState.destructionStage === 1) {
                    return '毁灭之环本回合扩散至 5×5 外圈';
                }
                if (extraState.destructionStage === 2) {
                    return '毁灭之环本回合扩散至 7×7 外圈';
                }
                return null;
            },
        }}
    />
);

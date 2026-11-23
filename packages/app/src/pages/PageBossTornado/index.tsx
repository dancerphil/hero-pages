import type { Pos, StanceName } from '@hero-pages/games-core';
import { bossTornado } from '@hero-pages/games-core';
import { expansionBackground, expansionBorder } from '@/constants/gameColors';
import { squareRingArrows } from '@/game/aoeArrows';
import { BattleBoss } from '@/modules/Battle/BattleBoss';
import { type Boss2Skill, getBoss2WarningHighlights, ring5x5, ring7x7, whirlwindLandings } from './tornadoAoe';

const skillLabels: Record<Boss2Skill, string> = {
    'whirlwind': '旋风',
    'wind-blade': '风刃',
    'eye-of-storm': '风眼',
};

const skillDescriptions: Record<Boss2Skill, string> = {
    'whirlwind': '移动一格，以落点为中心攻击 3×3 外圈，之后持续扩散',
    'wind-blade': '原地不动，向四个斜方向释放直线攻击，旋风同时扩散为 5×5 外圈',
    'eye-of-storm': '无直接伤害，旋风扩散为 7×7 外圈',
};

interface Boss2ExtraState {
    pendingExpansion: Pos | null;
}

interface Boss2GameMessage {
    type: string;
    phase?: string;
    positions?: [Pos, Pos];
    hp?: [number, number];
    hand?: StanceName[];
    discard?: StanceName[];
    turn?: number;
    bossSkill?: Boss2Skill;
    nextBossSkill?: Boss2Skill;
    pendingExpansion?: Pos | null;
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

export const PageBossTornado = () => (
    <BattleBoss<Boss2Skill, Boss2ExtraState, Boss2GameMessage>
        config={{
            game: 'boss/tornado',
            engine: bossTornado,
            bossName: '龙卷',
            bossHealth: 6,
            skillLabels,
            skillDescriptions,
            initialExtraState: { pendingExpansion: null },
            getExtraStateFromTurnStart: message => ({ pendingExpansion: message.pendingExpansion ?? null }),
            getExtraStateFromTurnResult: message => ({ pendingExpansion: message.pendingExpansion ?? null }),
            getWarningHighlights: ({ skill, bossPos }) => getBoss2WarningHighlights(skill, bossPos),
            getDirectionArrows: (skill, bossPos, _playerPos, extraState) => {
                // The fired ring expands one radius outward next turn → arrows on each ring cell.
                if (skill === 'whirlwind') {
                    return whirlwindLandings(bossPos).flatMap(landing => squareRingArrows(landing, 1));
                }
                if (skill === 'wind-blade' && extraState.pendingExpansion) {
                    return squareRingArrows(extraState.pendingExpansion, 2);
                }
                return []; // eye-of-storm: 7×7 is terminal, no further expansion
            },
            getSpecialHighlights: (skill, extraState, animPhase, submitted) => {
                if (!extraState.pendingExpansion || animPhase !== 'idle' || submitted) {
                    return [];
                }
                return skill === 'eye-of-storm' ? ring7x7(extraState.pendingExpansion) : ring5x5(extraState.pendingExpansion);
            },
            getSpecialStatusText: (skill, extraState, animPhase, submitted) => {
                if (!extraState.pendingExpansion || animPhase !== 'idle' || submitted) {
                    return null;
                }
                return `本回合旋风扩散为${skill === 'eye-of-storm' ? '7×7' : '5×5'}外圈`;
            },
            specialHighlightStyle: { background: expansionBackground, border: expansionBorder },
        }}
    />
);

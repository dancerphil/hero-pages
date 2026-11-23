import type { Pos, StanceName } from '@hero-pages/games-core';
import { stanceAttackOptions, stanceHitCells, stanceIsNoMove, stanceMoveOptions } from '@hero-pages/games-core';
import { bossSiege } from '@hero-pages/games-core';
import { BattleBoss } from '@/modules/Battle/BattleBoss';

type SiegeSkill = 'crane' | 'tiger' | 'dragon';

const skillLabels: Record<SiegeSkill, string> = {
    crane: '鹤',
    tiger: '虎',
    dragon: '龙',
};

const skillDescriptions: Record<SiegeSkill, string> = {
    crane: '直向一步，前后攻击',
    tiger: '直向一步，前后攻击点中选一格，命中时横扫三格',
    dragon: '不移动，选择 5×5 外圈中的一格攻击',
};

const INITIAL_BOSS_POSITIONS: Pos[] = [
    // inner ring (8): 3×3 grid with 1-cell gaps, excluding center
    { row: 1, col: 1 }, { row: 1, col: 3 }, { row: 1, col: 5 },
    { row: 3, col: 1 }, { row: 3, col: 5 },
    { row: 5, col: 1 }, { row: 5, col: 3 }, { row: 5, col: 5 },
    // outer ring (12): every other cell along the 7×7 perimeter
    { row: 0, col: 0 }, { row: 0, col: 2 }, { row: 0, col: 4 }, { row: 0, col: 6 },
    { row: 2, col: 6 }, { row: 4, col: 6 },
    { row: 6, col: 6 }, { row: 6, col: 4 }, { row: 6, col: 2 }, { row: 6, col: 0 },
    { row: 4, col: 0 }, { row: 2, col: 0 },
];

interface SiegeExtraState {
    bossPositions: Pos[];
}

interface SiegeGameMessage {
    type: string;
    phase?: string;
    positions?: [Pos, Pos];
    hp?: [number, number];
    hand?: StanceName[];
    discard?: StanceName[];
    turn?: number;
    bossSkill?: SiegeSkill;
    nextBossSkill?: SiegeSkill;
    bossPositions?: Pos[];
    bossMovements?: { movedFrom: Pos; movedTo: Pos }[];
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

const dedup = (cells: Pos[]): Pos[] =>
    [...new Map(cells.map(p => [`${p.row},${p.col}`, p])).values()];

const getWarningHighlights = ({ skill, bossPos: _bossPos, playerPos: _playerPos, extraState }: { skill: SiegeSkill; bossPos: Pos; playerPos: Pos; extraState: SiegeExtraState }): Pos[] => {
    const allHitCells: Pos[] = [];
    for (const bossPos of extraState.bossPositions) {
        const moveOptions = stanceIsNoMove(skill) ? [bossPos] : stanceMoveOptions({ card: skill, pos: bossPos, seat: 1 });
        const destinations = moveOptions.length > 0 ? moveOptions : [bossPos];
        for (const movedTo of destinations) {
            const attackOptions = stanceAttackOptions({ card: skill, pos: movedTo, seat: 1, origin: bossPos });
            for (const attackAt of attackOptions) {
                allHitCells.push(...stanceHitCells({ card: skill, attackAt, pos: movedTo, seat: 1, origin: bossPos }));
            }
        }
    }
    return dedup(allHitCells);
};

export const PageBossSiege = () => (
    <BattleBoss<SiegeSkill, SiegeExtraState, SiegeGameMessage>
        config={{
            game: 'boss/siege',
            engine: bossSiege,
            bossName: '围攻',
            bossHealth: 5,
            skillLabels,
            skillDescriptions,
            initialExtraState: { bossPositions: INITIAL_BOSS_POSITIONS },
            getExtraStateFromTurnStart: msg => ({ bossPositions: msg.bossPositions ?? INITIAL_BOSS_POSITIONS }),
            getExtraStateFromTurnResult: (msg, prev) => ({ bossPositions: msg.bossPositions ?? prev.bossPositions }),
            getWarningHighlights,
            getAllBossPositions: extraState => extraState.bossPositions,
            getAllBossAnimData: msg => msg.bossMovements ?? [],
        }}
    />
);

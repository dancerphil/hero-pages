import type { Pos } from '@hero-pages/games-core';
import { bossBlast, eqPos } from '@hero-pages/games-core';
import { BattleBoss } from '@/modules/Battle/BattleBoss';

type BossSkill = 'snipe' | 'bombard' | 'burst';

const skillLabels: Record<BossSkill, string> = {
    snipe: '狙击',
    bombard: '轰击',
    burst: '爆裂',
};

const skillDescriptions: Record<BossSkill, string> = {
    snipe: '不移动，直线全行或全列 7 格攻击',
    bombard: '移动一格，向前方 3×3 范围轰击（不含落点）',
    burst: '原地不动，自身周围 3×3 范围攻击',
};

const inBoard = (pos: Pos): boolean => pos.row >= 0 && pos.row < 7 && pos.col >= 0 && pos.col < 7;

const getSquare3x3 = (center: Pos): Pos[] => {
    const cells: Pos[] = [];
    for (let rowDelta = -1; rowDelta <= 1; rowDelta++) {
        for (let colDelta = -1; colDelta <= 1; colDelta++) {
            const cell = { row: center.row + rowDelta, col: center.col + colDelta };
            if (inBoard(cell)) {
                cells.push(cell);
            }
        }
    }
    return cells;
};

const getSnipeWarning = (bossPos: Pos): Pos[] => [
    ...Array.from({ length: 7 }, (_, col) => ({ row: bossPos.row, col })),
    ...Array.from({ length: 7 }, (_, row) => ({ row, col: bossPos.col })),
];

const getBombardWarning = (bossPos: Pos): Pos[] => {
    const directions: Pos[] = [{ row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 }];
    const cells: Pos[] = [];
    for (const direction of directions) {
        const bossTo = { row: bossPos.row + direction.row, col: bossPos.col + direction.col };
        if (!inBoard(bossTo)) {
            continue;
        }
        const center = { row: bossTo.row + direction.row, col: bossTo.col + direction.col };
        cells.push(...getSquare3x3(center).filter(cell => !eqPos(cell, bossTo)));
    }
    return cells;
};

const getBossAreaOfEffectWarning = (skill: BossSkill, bossPos: Pos): Pos[] => {
    if (skill === 'snipe') return getSnipeWarning(bossPos);
    if (skill === 'bombard') return getBombardWarning(bossPos);
    return getSquare3x3(bossPos);
};

interface BossGameMessage {
    type: string;
    phase?: string;
    positions?: [Pos, Pos];
    hp?: [number, number];
    hand?: import('@hero-pages/games-core').StanceName[];
    discard?: import('@hero-pages/games-core').StanceName[];
    turn?: number;
    bossSkill?: BossSkill;
    nextBossSkill?: BossSkill;
    myCard?: import('@hero-pages/games-core').StanceName;
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

export const PageBossBlast = () => (
    <BattleBoss<BossSkill, Record<string, never>, BossGameMessage>
        config={{
            game: 'boss/blast',
            engine: bossBlast,
            bossName: '爆破',
            bossHealth: 5,
            skillLabels,
            skillDescriptions,
            initialExtraState: {},
            getExtraStateFromTurnStart: () => ({}),
            getExtraStateFromTurnResult: () => ({}),
            getWarningHighlights: ({ skill, bossPos }) => getBossAreaOfEffectWarning(skill, bossPos),
        }}
    />
);

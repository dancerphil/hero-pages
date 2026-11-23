import type { Pos } from '@hero-pages/games-core';
import type { DirectionArrow } from '@/components/Board/BoardBoss';
import { squareRingArrows } from '@/game/aoeArrows';

export type TidalSkill = 'destruction' | 'wave';

type WaveEdge = 'top' | 'bottom' | 'left' | 'right';

export interface Wave {
    edge: WaveEdge;
    position: number;
}

export interface TidalExtraState {
    destructionStage: 0 | 1 | 2;
    waves: Wave[];
}

const BOARD = 7;
const CENTER: Pos = { row: 3, col: 3 };

const ring3x3 = (): Pos[] => {
    const cells: Pos[] = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) {
                continue;
            }
            cells.push({ row: CENTER.row + dr, col: CENTER.col + dc });
        }
    }
    return cells;
};

const ring5x5 = (): Pos[] => {
    const cells: Pos[] = [];
    for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
            if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
                continue;
            }
            cells.push({ row: CENTER.row + dr, col: CENTER.col + dc });
        }
    }
    return cells;
};

const ring7x7 = (): Pos[] => {
    const cells: Pos[] = [];
    for (let dr = -3; dr <= 3; dr++) {
        for (let dc = -3; dc <= 3; dc++) {
            if (Math.abs(dr) <= 2 && Math.abs(dc) <= 2) {
                continue;
            }
            const cell = { row: CENTER.row + dr, col: CENTER.col + dc };
            if (cell.row >= 0 && cell.row < BOARD && cell.col >= 0 && cell.col < BOARD) {
                cells.push(cell);
            }
        }
    }
    return cells;
};

const getWaveCells = (wave: Wave): Pos[] => {
    if (wave.edge === 'top' || wave.edge === 'bottom') {
        return Array.from({ length: BOARD }, (_, col) => ({ row: wave.position, col }));
    }
    return Array.from({ length: BOARD }, (_, row) => ({ row, col: wave.position }));
};

const dedup = (cells: Pos[]): Pos[] =>
    [...new Map(cells.map(p => [`${p.row},${p.col}`, p])).values()];

const ALL_EDGE_CELLS: Pos[] = [
    ...Array.from({ length: BOARD }, (_, col) => ({ row: 0, col })),
    ...Array.from({ length: BOARD }, (_, col) => ({ row: BOARD - 1, col })),
    ...Array.from({ length: BOARD }, (_, row) => ({ row, col: 0 })),
    ...Array.from({ length: BOARD }, (_, row) => ({ row, col: BOARD - 1 })),
];

const waveDirection = (edge: WaveEdge): Pos => {
    if (edge === 'top') return { row: 1, col: 0 };
    if (edge === 'bottom') return { row: -1, col: 0 };
    if (edge === 'left') return { row: 0, col: 1 };
    return { row: 0, col: -1 };
};

export const getWarningHighlights = ({ skill, bossPos: _bossPos, playerPos: _playerPos, extraState }: { skill: TidalSkill; bossPos: Pos; playerPos: Pos; extraState: TidalExtraState }): Pos[] => {
    const currentWaves = extraState.waves.flatMap(getWaveCells);
    if (skill === 'destruction') {
        return dedup([...currentWaves, ...ring3x3()]);
    }
    // wave turn: existing waves keep advancing + 2 new waves from random edges (all 4 shown as possible)
    const cells = dedup([...currentWaves, ...ALL_EDGE_CELLS]);
    if (extraState.destructionStage === 1) {
        return dedup([...cells, ...ring5x5()]);
    }
    if (extraState.destructionStage === 2) {
        return dedup([...cells, ...ring7x7()]);
    }
    return cells;
};

export const getDirectionArrows = (skill: TidalSkill, extraState: TidalExtraState): DirectionArrow[] => {
    const arrows: DirectionArrow[] = [];
    if (skill === 'destruction') {
        arrows.push(...squareRingArrows(CENTER, 1));
    }
    else if (skill === 'wave' && extraState.destructionStage === 1) {
        arrows.push(...squareRingArrows(CENTER, 2));
    }
    // wave lines keep their fixed advance direction (cardinal only), one arrow per cell
    for (const wave of extraState.waves) {
        const dir = waveDirection(wave.edge);
        for (const cell of getWaveCells(wave)) {
            arrows.push({ pos: cell, dir });
        }
    }
    return arrows;
};

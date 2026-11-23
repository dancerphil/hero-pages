import type { Pos } from '@hero-pages/games-core';

export type Boss2Skill = 'whirlwind' | 'wind-blade' | 'eye-of-storm';

const inBounds = (pos: Pos): boolean => pos.row >= 0 && pos.row < 7 && pos.col >= 0 && pos.col < 7;
const addPos = (left: Pos, right: Pos): Pos => ({ row: left.row + right.row, col: left.col + right.col });
const directions: Pos[] = [{ row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 }];

// The whirlwind moves one cardinal step before striking, so every in-bounds landing is a threat.
export const whirlwindLandings = (bossPos: Pos): Pos[] => directions.map(direction => addPos(bossPos, direction)).filter(inBounds);

const ring3x3 = (center: Pos): Pos[] => {
    const cells: Pos[] = [];
    for (let rowDelta = -1; rowDelta <= 1; rowDelta++) {
        for (let colDelta = -1; colDelta <= 1; colDelta++) {
            if (rowDelta === 0 && colDelta === 0) {
                continue;
            }
            const cell = addPos(center, { row: rowDelta, col: colDelta });
            if (inBounds(cell)) {
                cells.push(cell);
            }
        }
    }
    return cells;
};

export const ring5x5 = (center: Pos): Pos[] => {
    const cells: Pos[] = [];
    for (let rowDelta = -2; rowDelta <= 2; rowDelta++) {
        for (let colDelta = -2; colDelta <= 2; colDelta++) {
            if (Math.abs(rowDelta) <= 1 && Math.abs(colDelta) <= 1) {
                continue;
            }
            const cell = addPos(center, { row: rowDelta, col: colDelta });
            if (inBounds(cell)) {
                cells.push(cell);
            }
        }
    }
    return cells;
};

export const ring7x7 = (center: Pos): Pos[] => {
    const cells: Pos[] = [];
    for (let rowDelta = -3; rowDelta <= 3; rowDelta++) {
        for (let colDelta = -3; colDelta <= 3; colDelta++) {
            if (Math.abs(rowDelta) <= 2 && Math.abs(colDelta) <= 2) {
                continue;
            }
            const cell = addPos(center, { row: rowDelta, col: colDelta });
            if (inBounds(cell)) {
                cells.push(cell);
            }
        }
    }
    return cells;
};

const fullLine = (center: Pos, direction: Pos): Pos[] => {
    if (direction.row === 0 && direction.col === 0) {
        return [center];
    }
    const cells: Pos[] = [];
    let current = center;
    while (inBounds(current)) {
        cells.push(current);
        current = addPos(current, direction);
    }
    current = addPos(center, { row: -direction.row, col: -direction.col });
    while (inBounds(current)) {
        cells.push(current);
        current = addPos(current, { row: -direction.row, col: -direction.col });
    }
    return cells;
};

const windBladeAreaOfEffect = (bossPos: Pos): Pos[] => {
    const uniqueCells = new Map<string, Pos>();
    const addCells = (cells: Pos[]) => {
        for (const cell of cells) {
            uniqueCells.set(`${cell.row},${cell.col}`, cell);
        }
    };
    addCells(fullLine(bossPos, { row: 1, col: 1 }));
    addCells(fullLine(bossPos, { row: 1, col: -1 }));
    return [...uniqueCells.values()];
};

const dedup = (cells: Pos[]): Pos[] =>
    [...new Map(cells.map(p => [`${p.row},${p.col}`, p])).values()];

export const getBoss2WarningHighlights = (skill: Boss2Skill, bossPos: Pos): Pos[] => {
    if (skill === 'eye-of-storm') {
        return [];
    }
    if (skill === 'wind-blade') {
        return windBladeAreaOfEffect(bossPos);
    }
    // whirlwind: union of the 3×3 rings around every possible landing cell
    return dedup(whirlwindLandings(bossPos).flatMap(ring3x3));
};

import { squareRing, type Pos } from '@hero-pages/games-core';
import type { DirectionArrow } from '@/components/Board/BoardBoss';

// Outward-pointing arrow on each cell of a square ring: corners point diagonally,
// edge cells point cardinally — indicating the ring will expand one radius outward.
export const squareRingArrows = (center: Pos, radius: number): DirectionArrow[] =>
    squareRing(center, radius).map((cell) => {
        const deltaRow = cell.row - center.row;
        const deltaCol = cell.col - center.col;
        return {
            pos: cell,
            dir: {
                row: Math.abs(deltaRow) === radius ? Math.sign(deltaRow) : 0,
                col: Math.abs(deltaCol) === radius ? Math.sign(deltaCol) : 0,
            },
        };
    });

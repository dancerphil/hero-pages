import { eqPos, type Pos } from '@hero-pages/games-core';
import { areaOfEffectBorder, warningBackground } from '@/constants/gameColors';
import { BoardBossCell } from './BoardBossCell';

const boardPixelSize = 7 * 40 + 6 * 2;
const boardStep = 42;

const cellCenter = (pos: Pos) => ({ x: pos.col * boardStep + 20, y: pos.row * boardStep + 20 });

export interface Arrow {
    from: Pos;
    to: Pos;
    color: string;
}

// A small arrow drawn inside a single cell, pointing in one of 8 directions.
export interface DirectionArrow {
    pos: Pos;
    dir: Pos;
}

const directionArrowColor = '#ef4444';

interface BoardBossProps {
    positions: [Pos, Pos];
    playerDisplayPos?: Pos;
    boss2Pos?: Pos;
    allBossPositions?: Pos[];
    moveHighlights?: Pos[];
    attackHighlights?: Pos[];
    areaOfEffectHighlights?: Pos[];
    warningHighlights?: Pos[];
    specialHighlights?: Pos[];
    specialBackground?: string;
    specialBorder?: string;
    animatedAttacks?: Pos[];
    animatedBossAreaOfEffect?: Pos[];
    arrows?: Arrow[];
    directionArrows?: DirectionArrow[];
    onCellClick?: (pos: Pos) => void;
}

export const BoardBoss = ({
    positions,
    playerDisplayPos,
    boss2Pos,
    allBossPositions,
    moveHighlights = [],
    attackHighlights = [],
    areaOfEffectHighlights = [],
    warningHighlights = [],
    specialHighlights = [],
    specialBackground = warningBackground,
    specialBorder = areaOfEffectBorder,
    animatedAttacks = [],
    animatedBossAreaOfEffect = [],
    arrows = [],
    directionArrows = [],
    onCellClick,
}: BoardBossProps) => {
    const cells = Array.from({ length: 49 }, (_, index) => {
        const pos = { row: Math.floor(index / 7), col: index % 7 };
        const isPlayer = eqPos(playerDisplayPos ?? positions[0], pos);
        return (
            <BoardBossCell
                key={index}
                pos={pos}
                isPlayer={isPlayer}
                isBoss={(allBossPositions ?? [positions[1], ...(boss2Pos ? [boss2Pos] : [])]).some(p => eqPos(p, pos))}
                isMove={!isPlayer && moveHighlights.some(highlight => eqPos(highlight, pos))}
                isAttack={attackHighlights.some(highlight => eqPos(highlight, pos))}
                isAreaOfEffect={areaOfEffectHighlights.some(highlight => eqPos(highlight, pos))}
                isWarning={warningHighlights.some(highlight => eqPos(highlight, pos))}
                isSpecial={specialHighlights.some(highlight => eqPos(highlight, pos))}
                isAnimated={animatedAttacks.some(highlight => eqPos(highlight, pos)) || animatedBossAreaOfEffect.some(highlight => eqPos(highlight, pos))}
                specialBackground={specialBackground}
                specialBorder={specialBorder}
                onCellClick={onCellClick}
            />
        );
    });

    return (
        <div style={{ position: 'relative', width: boardPixelSize, height: boardPixelSize }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: 2 }}>
                {cells}
            </div>
            {(arrows.length > 0 || directionArrows.length > 0) && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: boardPixelSize, height: boardPixelSize, pointerEvents: 'none' }} viewBox={`0 0 ${boardPixelSize} ${boardPixelSize}`}>
                    <defs>
                        <marker id="boss-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L8,3 z" fill="context-stroke" />
                        </marker>
                        <marker id="boss-dir-arrowhead" markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                            <path d="M0,0 L0,7 L7,3.5 z" fill="context-stroke" />
                        </marker>
                    </defs>
                    {directionArrows.map((arrow, index) => {
                        const center = cellCenter(arrow.pos);
                        const length = Math.hypot(arrow.dir.row, arrow.dir.col) || 1;
                        const unitX = arrow.dir.col / length;
                        const unitY = arrow.dir.row / length;
                        const half = 11;
                        return (
                            <line
                                key={`dir-${index}`}
                                x1={center.x - unitX * half}
                                y1={center.y - unitY * half}
                                x2={center.x + unitX * half}
                                y2={center.y + unitY * half}
                                stroke={directionArrowColor}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                markerEnd="url(#boss-dir-arrowhead)"
                            />
                        );
                    })}
                    {arrows.map((arrow, index) => {
                        const from = cellCenter(arrow.from);
                        const to = cellCenter(arrow.to);
                        const deltaX = to.x - from.x;
                        const deltaY = to.y - from.y;
                        const distance = Math.hypot(deltaX, deltaY);
                        if (distance < 1) {
                            return null;
                        }
                        const unitX = deltaX / distance;
                        const unitY = deltaY / distance;
                        const x2 = to.x - unitX * 18;
                        const y2 = to.y - unitY * 18;
                        return (
                            <line
                                key={index}
                                x1={from.x}
                                y1={from.y}
                                x2={x2}
                                y2={y2}
                                stroke={arrow.color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                markerEnd="url(#boss-arrowhead)"
                            />
                        );
                    })}
                </svg>
            )}
        </div>
    );
};

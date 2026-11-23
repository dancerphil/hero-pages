import { stanceAttackOptions, stanceHitCells, stanceMoveOptions, type Pos, type StanceName } from '@hero-pages/games-core';
import { areaOfEffectBackground, attackBackground, boardCellBackground, enemyRed, moveBackground, neutralBorder, playerBlue } from '@/constants/gameColors';

const PREVIEW_ROWS = 6;
const PREVIEW_COLS = 5;
const PREVIEW_ORIGIN: Pos = { row: 3, col: 2 };
const RULE_ORIGIN: Pos = { row: 3, col: 3 };

const eqPos = (left: Pos, right: Pos): boolean => left.row === right.row && left.col === right.col;

const pickPreviewTarget = (options: Pos[], origin: Pos): Pos | null => {
    if (options.length === 0) return null;
    const [target] = [...options].toSorted((left, right) => {
        const score = (pos: Pos): number => {
            if (pos.col === origin.col && pos.row < origin.row) return 0;
            if (pos.row < origin.row && pos.col > origin.col) return 1;
            if (pos.col > origin.col) return 2;
            if (pos.row > origin.row && pos.col > origin.col) return 3;
            if (pos.row > origin.row) return 4;
            return 5;
        };
        const scoreDiff = score(left) - score(right);
        if (scoreDiff !== 0) return scoreDiff;
        const distanceDiff = Math.abs(left.row - origin.row) + Math.abs(left.col - origin.col)
            - (Math.abs(right.row - origin.row) + Math.abs(right.col - origin.col));
        if (distanceDiff !== 0) return distanceDiff;
        return left.row - right.row || left.col - right.col;
    });
    return target;
};

const stripe = (c1: string, c2: string) => `repeating-linear-gradient(135deg, ${c1} 0 2px, ${c1} 2px 4px, ${c2} 4px 6px, ${c2} 6px 8px)`;

export function CardStancePreview(props: { stance: StanceName; seat: number }) {
    const { stance, seat } = props;
    const moveOptions = stanceMoveOptions({ card: stance, pos: RULE_ORIGIN, seat });
    const previewMove = pickPreviewTarget(moveOptions, RULE_ORIGIN);
    const boardPos = previewMove ?? RULE_ORIGIN;
    const attackOptions = stanceAttackOptions({ card: stance, pos: boardPos, seat, origin: previewMove ? RULE_ORIGIN : boardPos });
    const previewAttack = pickPreviewTarget(attackOptions, boardPos);
    const hitCells = previewAttack ? stanceHitCells({ card: stance, attackAt: previewAttack, pos: boardPos, seat, origin: previewMove ? RULE_ORIGIN : boardPos }) : [];
    const toPreviewPos = (cell: Pos): Pos => ({
        row: PREVIEW_ORIGIN.row + (cell.row - RULE_ORIGIN.row),
        col: PREVIEW_ORIGIN.col + (cell.col - RULE_ORIGIN.col),
    });

    return (
        <div
            style={{
                width: '80%',
                alignSelf: 'center',
                aspectRatio: `${PREVIEW_COLS} / ${PREVIEW_ROWS}`,
                borderRadius: 8,
                border: `1px solid ${neutralBorder}`,
                background: '#ffffff',
                padding: 4,
                boxSizing: 'border-box',
                flexShrink: 0,
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PREVIEW_COLS}, 1fr)`, gridTemplateRows: `repeat(${PREVIEW_ROWS}, 1fr)`, gap: 2, height: '100%' }}>
                {Array.from({ length: PREVIEW_ROWS * PREVIEW_COLS }, (_, index) => {
                    const pos = { row: Math.floor(index / PREVIEW_COLS), col: index % PREVIEW_COLS };
                    const isOrigin = eqPos(pos, PREVIEW_ORIGIN);
                    const isMove = moveOptions.some(option => eqPos(toPreviewPos(option), pos));
                    const isPreviewMove = previewMove ? eqPos(toPreviewPos(previewMove), pos) : false;
                    const isAttackOption = attackOptions.some(option => eqPos(toPreviewPos(option), pos));
                    const isPreviewAttack = previewAttack ? eqPos(toPreviewPos(previewAttack), pos) : false;
                    const isHit = hitCells.some(cell => eqPos(toPreviewPos(cell), pos));

                    let background = boardCellBackground;
                    if (isAttackOption) {
                        background = isMove ? stripe(moveBackground, attackBackground) : attackBackground;
                    }
                    else if (isHit) {
                        background = isMove ? stripe(moveBackground, areaOfEffectBackground) : areaOfEffectBackground;
                    }
                    else if (isMove) {
                        background = moveBackground;
                    }

                    let boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)';
                    if (isPreviewMove) boxShadow = `inset 0 0 0 2px ${playerBlue}`;
                    else if (isPreviewAttack) boxShadow = `inset 0 0 0 2px ${enemyRed}`;

                    return (
                        <div key={index} style={{ position: 'relative', borderRadius: 3, background, boxShadow }}>
                            {isOrigin && (
                                <div style={{ position: 'absolute', inset: '22%', borderRadius: '50%', background: '#0f172a' }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

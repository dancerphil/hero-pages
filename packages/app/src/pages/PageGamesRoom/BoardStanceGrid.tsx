import { eqPos, type Pos } from '@hero-pages/games-core';
import { attackBackground, boardCellBackground, enemyRed, moveBackground, neutralBorder, playerBlue, poisonBackground, poisonPurple } from '@/constants/gameColors';

export function BoardStanceGrid(props: {
    positions: [Pos, Pos];
    seat: number;
    labels: [string, string];
    poisonRings: number;
    moveHighlights: Pos[];
    attackHighlights: Pos[];
    onCellClick: (pos: Pos) => void;
}) {
    const { positions, seat, labels, poisonRings, moveHighlights, attackHighlights, onCellClick } = props;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: 2 }}>
            {Array.from({ length: 49 }, (_, index) => {
                const pos = { row: Math.floor(index / 7), col: index % 7 };
                const owner = positions.findIndex(item => eqPos(item, pos));
                const isMove = moveHighlights.some(item => eqPos(item, pos));
                const isAttack = attackHighlights.some(item => eqPos(item, pos));
                const isPoison = poisonRings > 0 && Math.min(pos.row, 6 - pos.row, pos.col, 6 - pos.col) < poisonRings;
                let background = boardCellBackground;
                let border = `1px solid ${neutralBorder}`;
                if (isPoison) {
                    background = poisonBackground;
                    border = `1px solid ${poisonPurple}`;
                }
                if (isMove) {
                    background = moveBackground;
                    border = `2px solid ${playerBlue}`;
                }
                if (isAttack) {
                    background = attackBackground;
                    border = `2px solid ${enemyRed}`;
                }
                const clickable = isMove || isAttack;
                return (
                    <div
                        key={index}
                        onClick={() => { if (clickable) onCellClick(pos); }}
                        style={{
                            width: 40,
                            height: 40,
                            background,
                            border,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: clickable ? 'pointer' : 'default',
                        }}
                    >
                        {owner !== -1 && (
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    background: owner === seat ? playerBlue : enemyRed,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#fff',
                                }}
                            >
                                {labels[owner]}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

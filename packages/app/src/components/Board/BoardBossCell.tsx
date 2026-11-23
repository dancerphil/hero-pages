import { type Pos } from '@hero-pages/games-core';
import { actionOrange, areaOfEffectBackground, areaOfEffectBorder, attackBackground, boardCellBackground, enemyRed, moveBackground, neutralBorder, playerBlue, warningBackground } from '@/constants/gameColors';

interface BoardBossCellProps {
    pos: Pos;
    isPlayer: boolean;
    isBoss: boolean;
    isMove: boolean;
    isAttack: boolean;
    isAreaOfEffect: boolean;
    isWarning: boolean;
    isSpecial: boolean;
    isAnimated: boolean;
    specialBackground: string;
    specialBorder: string;
    onCellClick?: (pos: Pos) => void;
}

const getBackground = (props: BoardBossCellProps) => {
    const { isAnimated, isAttack, isAreaOfEffect, isMove, isSpecial, isWarning, specialBackground } = props;
    if (isAnimated) return actionOrange;
    if (isAttack) return attackBackground;
    if (isAreaOfEffect) return areaOfEffectBackground;
    if (isMove) return moveBackground;
    if (isSpecial) return specialBackground;
    if (isWarning) return warningBackground;
    return boardCellBackground;
};

const getBorder = (props: BoardBossCellProps) => {
    const { isAnimated, isAttack, isAreaOfEffect, isMove, isSpecial, isWarning, specialBorder } = props;
    let border = `1px solid ${neutralBorder}`;
    if (isWarning) border = `1px solid ${areaOfEffectBorder}`;
    if (isSpecial) border = `2px solid ${specialBorder}`;
    if (isMove) border = `2px solid ${playerBlue}`;
    if (isAreaOfEffect) border = `2px solid ${areaOfEffectBorder}`;
    if (isAttack) border = `2px solid ${enemyRed}`;
    if (isAnimated) border = `2px solid ${actionOrange}`;
    return border;
};

export const BoardBossCell = (props: BoardBossCellProps) => {
    const { pos, isPlayer, isBoss, isMove, isAttack, onCellClick } = props;
    const clickable = isMove || isAttack;

    return (
        <div
            onClick={() => {
                if (clickable) {
                    onCellClick?.(pos);
                }
            }}
            style={{
                width: 40,
                height: 40,
                background: getBackground(props),
                border: getBorder(props),
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: clickable ? 'pointer' : 'default',
            }}
        >
            {isPlayer && !isBoss && <div style={{ width: 34, height: 34, borderRadius: '50%', background: playerBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>我</div>}
            {isBoss && !isPlayer && <div style={{ width: 34, height: 34, borderRadius: '50%', background: enemyRed, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>Boss</div>}
            {isPlayer && isBoss && (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: enemyRed, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: playerBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>我</div>
                </div>
            )}
        </div>
    );
};

import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { eqPos, stanceAttackOptions, stanceIsNoMove, stanceMoveOptions, type Pos, type StanceName, type StanceTurn, type StanceView } from '@hero-pages/games-core';
import { STANCE_LABELS } from '@/components/Card/CardStance';
import type { BoardStanceProps } from './BoardStance';
import { BoardStanceGrid } from './BoardStanceGrid';
import { BoardStanceHand } from './BoardStanceHand';

function getHint({ view, card, moveTo }: { view: StanceView; card: StanceName | null; moveTo: Pos | null }): string {
    if (view.submitted) return '等待对手…';
    if (!card) return '选择要打出的招式';
    if (!moveTo) return `${STANCE_LABELS[card]}：在棋盘上选择移动目标`;
    return `${STANCE_LABELS[card]}：在棋盘上选择攻击目标`;
}

function BoardStanceLastTurn({ last, seat, opponent }: { last: StanceTurn; seat: number; opponent: number }) {
    return (
        <Text size="sm" c="dimmed">
            {`上回合：我出${STANCE_LABELS[last.cards[seat]]}，对手出${STANCE_LABELS[last.cards[opponent]]}`}
            {last.hits[seat] ? ` · 我击中对手 -${last.damage[seat]}HP` : ''}
            {last.hits[opponent] ? ` · 对手击中我 -${last.damage[opponent]}HP` : ''}
            {last.poison[seat] > 0 ? ' · 我受毒圈 -1HP' : ''}
            {last.poison[opponent] > 0 ? ' · 对手受毒圈 -1HP' : ''}
        </Text>
    );
}

export function BoardStanceArena({ room, view, onMove }: BoardStanceProps) {
    const me = room.yourSeat;
    const seat = me ?? 0;
    const opponent = 1 - seat;
    const [card, setCard] = useState<StanceName | null>(null);
    const [moveTo, setMoveTo] = useState<Pos | null>(null);
    const origin = view.positions[seat];
    const canAct = me !== null && room.status === 'playing' && !view.submitted;

    const choose = (stance: StanceName, pos: Pos) => {
        if (stanceAttackOptions({ card: stance, pos, seat, origin }).length === 0) onMove({ card: stance, moveTo: pos, attackAt: null });
        else setMoveTo(pos);
    };
    const chooseCard = (stance: StanceName) => {
        setCard(stance);
        if (stanceIsNoMove(stance)) choose(stance, origin);
    };
    const moveHighlights = card && !moveTo ? stanceMoveOptions({ card, pos: origin, seat }) : [];
    const attackHighlights = card && moveTo ? stanceAttackOptions({ card, pos: moveTo, seat, origin }) : [];
    const clickCell = (pos: Pos) => {
        if (!card) return;
        if (!moveTo) {
            if (moveHighlights.some(item => eqPos(item, pos))) choose(card, pos);
        }
        else if (attackHighlights.some(item => eqPos(item, pos))) {
            onMove({ card, moveTo, attackAt: pos });
        }
    };
    const cancel = () => {
        setCard(null);
        setMoveTo(null);
    };

    const labels: [string, string] = me === null ? ['1', '2'] : (seat === 0 ? ['我', '敌'] : ['敌', '我']);
    const last = view.lastTurn;

    return (
        <Stack gap="sm" align="center">
            <Group gap="xl">
                {room.seats.map((name, index) => (
                    <Text key={index} size="sm" fw={index === seat ? 700 : 400}>{name} HP: {view.hp[index]}/2</Text>
                ))}
            </Group>
            <BoardStanceGrid
                positions={view.positions}
                seat={seat}
                labels={labels}
                poisonRings={view.numPoisonRings}
                moveHighlights={canAct ? moveHighlights : []}
                attackHighlights={canAct ? attackHighlights : []}
                onCellClick={clickCell}
            />
            {last && me !== null && <BoardStanceLastTurn last={last} seat={seat} opponent={opponent} />}
            {view.hands && me !== null && (
                <>
                    {canAct && <Text size="sm">{getHint({ view, card, moveTo })}</Text>}
                    <BoardStanceHand hand={view.hands[seat]} seat={seat} disabled={!canAct} selected={card} onChoose={chooseCard} />
                    <BoardStanceHand hand={view.hands[opponent]} seat={opponent} disabled />
                    {canAct && card && <Button size="xs" variant="subtle" onClick={cancel}>↩ 取消</Button>}
                </>
            )}
        </Stack>
    );
}

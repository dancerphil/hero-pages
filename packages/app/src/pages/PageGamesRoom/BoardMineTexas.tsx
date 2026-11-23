import { useState } from 'react';
import { Button, Group, Stack, Table, Text } from '@mantine/core';
import type { MineTexasView, RoomView } from '@hero-pages/games-core';
import { BadgePoker, formatCard, suitColor } from '@/components/Badge/BadgePoker';

interface BoardMineTexasProps {
    room: RoomView<unknown>;
    view: MineTexasView;
    onMove: (move: unknown) => void;
}

const sortCards = (cards: number[]) => [...cards].toSorted((a, b) => (b % 13) - (a % 13) || Math.floor(a / 13) - Math.floor(b / 13));

const ColoredCard = (props: { card: number; hit?: boolean }) => (
    <Text
        component="span"
        size="xs"
        c={suitColor(props.card)}
        style={props.hit ? { outline: '2px solid red', outlineOffset: 1 } : undefined}
    >
        {formatCard(props.card)}
    </Text>
);

export function BoardMineTexas({ room, view, onMove }: BoardMineTexasProps) {
    const me = room.yourSeat;
    const seat = me ?? 0;
    const opponent = 1 - seat;
    const [selected, setSelected] = useState<number[]>([]);
    const [mine, setMine] = useState<number | null>(null);
    const canPlay = me !== null && room.status === 'playing' && !view.submitted;
    const toggle = (card: number) => {
        if (selected.includes(card)) setSelected(selected.filter(item => item !== card));
        else if (selected.length < 5) setSelected([...selected, card]);
    };

    return (
        <Stack gap="md" w="100%">
            <Text fw={500} ta="center">第 {view.round} 轮 · {me === null ? `${room.seats[0]} ${view.scores[0]} : ${view.scores[1]} ${room.seats[1]}` : `你 ${view.scores[seat]} : ${view.scores[opponent]} 对手`}</Text>
            {view.history.length > 0 && (
                <Table highlightOnHover striped withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>#</Table.Th>
                            <Table.Th>{me === null ? room.seats[0] : '你'}的牌</Table.Th>
                            <Table.Th>{me === null ? room.seats[0] : '你'}设的雷</Table.Th>
                            <Table.Th>{me === null ? room.seats[1] : '对方'}设的雷</Table.Th>
                            <Table.Th>{me === null ? room.seats[1] : '对方'}的牌</Table.Th>
                            <Table.Th>得分</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {view.history.map(item => (
                            <Table.Tr key={item.round}>
                                <Table.Td>{item.round}</Table.Td>
                                <Table.Td>
                                    <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                                        {item.cards[seat].map((card, index) => <span key={card}>{index > 0 && ' '}<ColoredCard card={card} hit={item.mineHit[opponent] && item.mine[opponent] === card} /></span>)}
                                    </Text>
                                    <Text size="xs" c="dimmed">{item.best[seat]}</Text>
                                </Table.Td>
                                <Table.Td><Text size="xs"><ColoredCard card={item.mine[seat]} />{item.mineHit[seat] ? ' ✓' : ' ✗'}</Text></Table.Td>
                                <Table.Td><Text size="xs"><ColoredCard card={item.mine[opponent]} />{item.mineHit[opponent] ? ' ✓' : ' ✗'}</Text></Table.Td>
                                <Table.Td>
                                    <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                                        {item.cards[opponent].map((card, index) => <span key={card}>{index > 0 && ' '}<ColoredCard card={card} hit={item.mineHit[seat] && item.mine[seat] === card} /></span>)}
                                    </Text>
                                    <Text size="xs" c="dimmed">{item.best[opponent]}</Text>
                                </Table.Td>
                                <Table.Td><Text size="xs">{item.outcome === 'draw' ? '平' : (item.outcome === seat ? '胜' : '负')} +{item.gained[seat]}</Text></Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
            {canPlay ? (
                <Stack gap="sm" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                    <Group gap="xs" align="center">
                        <Text size="sm" fw={500}>你的牌（选 5 张）：</Text>
                        {sortCards(view.hands[seat]).map(card => (
                            <BadgePoker key={card} card={card} selected={selected.includes(card)} recommended={view.best[seat].includes(card)} onClick={() => { toggle(card); }} />
                        ))}
                    </Group>
                    <Group gap="xs" align="center">
                        <Text size="sm" fw={500}>对手的牌（选 1 张地雷）：</Text>
                        {sortCards(view.hands[opponent]).map(card => (
                            <BadgePoker key={card} card={card} selected={mine === card} recommended={view.best[opponent].includes(card)} onClick={() => { setMine(mine === card ? null : card); }} />
                        ))}
                    </Group>
                    <Button
                        disabled={selected.length !== 5 || mine === null}
                        onClick={() => { onMove({ hand: selected, mine }); }}
                    >
                        {selected.length !== 5 ? `已选 ${selected.length}/5 张` : (mine === null ? '请选地雷' : '出牌')}
                    </Button>
                </Stack>
            ) : (
                me !== null && room.status === 'playing' && <Text c="dimmed">已出牌，等待对手…</Text>
            )}
        </Stack>
    );
}

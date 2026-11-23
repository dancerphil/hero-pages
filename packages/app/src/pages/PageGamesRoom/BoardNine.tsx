import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import type { NineView, RoomView } from '@hero-pages/games-core';

interface BoardNineProps {
    room: RoomView<unknown>;
    view: NineView;
    onMove: (move: unknown) => void;
}

export function BoardNine({ room, view, onMove }: BoardNineProps) {
    const me = room.yourSeat;
    const opponent = me === 1 ? 0 : 1;
    const canPlay = room.status === 'playing' && view.hand !== null && !view.submitted;
    return (
        <Stack align="center" gap="md">
            <Text fw={500}>第 {view.round} 轮</Text>
            {view.hand && (
                view.submitted
                    ? <Text c="dimmed">已出牌，等待对手…</Text>
                    : (
                            <Group>{view.hand.map(card => (
                                <Button key={card} variant="outline" disabled={!canPlay} onClick={() => { onMove(card); }}>{card}</Button>
                            ))}
                            </Group>
                        )
            )}
            {view.history.length > 0 && (
                <Stack gap="xs">
                    {view.history.map(item => (
                        <Group key={item.round} gap="xs">
                            <Badge variant="outline">第{item.round}轮</Badge>
                            {me === null
                                ? <Text size="sm">{room.seats[0]} 出 {item.cards[0]}，{room.seats[1]} 出 {item.cards[1]}，得 {item.gained[0]}/{item.gained[1]} 分</Text>
                                : <Text size="sm">你：{item.cards[me]} vs 对手：{item.cards[opponent]}，得{item.gained[me]}分</Text>}
                        </Group>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

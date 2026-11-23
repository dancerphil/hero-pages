import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import type { ESCard, ESOutcome, ESView, RoomView } from '@hero-pages/games-core';

const CARD_LABELS: Record<ESCard, string> = { king: '国王', commoner: '平民', slave: '奴隶' };
const OUTCOME_LABELS: Record<ESOutcome, string> = { slave_wins: '奴隶方获胜', king_wins: '国王方获胜', continues: '继续' };
const CARDS: ESCard[] = ['king', 'commoner', 'slave'];

interface BoardEmperorSlaveProps {
    room: RoomView<unknown>;
    view: ESView;
    onMove: (move: unknown) => void;
}

export function BoardEmperorSlave({ room, view, onMove }: BoardEmperorSlaveProps) {
    const me = room.yourSeat;
    const isKing = me === view.kingSeat;
    const hand = view.hand;
    const canPlay = room.status === 'playing' && hand !== null && !view.submitted;
    return (
        <Stack align="center" gap="md">
            <Text fw={500}>第 {view.round} 轮{me !== null && ` · 你是${isKing ? '国王方' : '奴隶方'}`}</Text>
            {hand && (
                view.submitted
                    ? <Text c="dimmed">已出牌，等待对手…</Text>
                    : (
                            <Group>{CARDS.filter(card => hand[card] > 0).map(card => (
                                <Button key={card} variant="outline" disabled={!canPlay} onClick={() => { onMove(card); }}>
                                    {CARD_LABELS[card]} ×{hand[card]}
                                </Button>
                            ))}
                            </Group>
                        )
            )}
            {view.history.length > 0 && (
                <Stack gap="xs">
                    {view.history.map(item => (
                        <Group key={item.round} gap="xs">
                            <Badge variant="outline">第{item.round}轮</Badge>
                            <Text size="sm">
                                国王方：{CARD_LABELS[item.kingCard]}，奴隶方：{CARD_LABELS[item.slaveCard]}，{OUTCOME_LABELS[item.outcome]}
                            </Text>
                        </Group>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

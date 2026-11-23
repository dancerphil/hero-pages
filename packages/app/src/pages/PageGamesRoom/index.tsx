import { Button, CopyButton, Group, Loader, Stack, Text } from '@mantine/core';
import { useParams } from 'react-router';
import type { RoomView } from '@hero-pages/games-core';
import { GAMES } from '@/constants/games';
import { useGameSocket } from '@/hooks/useGameSocket';
import { GameBoard } from './GameBoard';

function getRematchHint({ room, me, opponent }: { room: RoomView<unknown>; me: number | null; opponent: number }): string | null {
    if (room.rematch[0] && room.rematch[1]) return '双方已准备';
    if (me !== null && room.rematch[me]) return '等待对手…';
    if (me !== null && room.rematch[opponent]) return '对手请求再来一局';
    return null;
}

export function PageGamesRoom() {
    const { roomId = '' } = useParams();
    const { data: room, closed, send } = useGameSocket<RoomView<unknown>>(`/api/games/rooms/${roomId}/ws`);

    if (!room) return closed ? <Text c="red">房间不存在</Text> : <Loader size="sm" />;

    if (room.status === 'waiting') {
        return (
            <Stack align="center" gap="md">
                <Loader size="sm" />
                <Text>等待对手加入</Text>
                <Group>
                    <Text fw={700}>房间号：{roomId}</Text>
                    <CopyButton value={roomId}>
                        {({ copied, copy }) => (
                            <Button size="xs" variant="light" onClick={copy}>{copied ? '已复制' : '复制'}</Button>
                        )}
                    </CopyButton>
                </Group>
                {room.yourSeat === 0 && <Button size="sm" onClick={() => send({ type: 'add_ai' })}>添加 AI</Button>}
            </Stack>
        );
    }

    const me = room.yourSeat;
    const opponent = me === 1 ? 0 : 1;
    const label = GAMES.find(item => item.game === room.game)?.label;
    const scoreText = me === null
        ? `${room.seats[0]} ${room.wins[0]} : ${room.wins[1]} ${room.seats[1]}`
        : `你 ${room.wins[me]} 胜 · 对手 ${room.wins[opponent]} 胜`;
    let resultText: string | null = null;
    if (room.winner === 'draw') resultText = '平局！';
    else if (room.winner !== null && room.winner === me) resultText = '你赢了！';
    else if (room.winner !== null) resultText = me === null ? `${room.seats[room.winner]} 赢了！` : `${room.seats[opponent]} 赢了！`;
    const rematchHint = getRematchHint({ room, me, opponent });

    return (
        <Stack align="center" gap="lg">
            <Text size="sm" c="dimmed">{label} · 房间号 {roomId}</Text>
            <Text size="sm" c="dimmed">{scoreText}{room.draws > 0 && ` · ${room.draws} 平`}</Text>
            {resultText && <Text size="lg" fw={700}>{resultText}</Text>}
            <GameBoard room={room} onMove={move => send({ type: 'move', move })} />
            {room.status === 'ended' && me !== null && (
                <Stack align="center" gap="xs">
                    <Button disabled={room.rematch[me]} onClick={() => send({ type: 'rematch' })}>再来一局</Button>
                    {rematchHint && <Text size="sm" c="dimmed">{rematchHint}</Text>}
                </Stack>
            )}
        </Stack>
    );
}

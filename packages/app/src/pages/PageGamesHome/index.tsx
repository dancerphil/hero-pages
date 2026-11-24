import { useState } from 'react';
import { Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import type { GameType, LobbyRoom } from '@hero-pages/games-core';
import type { UserRow } from '@hero-pages/account/client';
import { fetchApi } from '@hero-pages/account/client';
import { GAMES } from '@/constants/games';
import { useGameSocket } from '@/hooks/useGameSocket';
import { userRegion } from '@/regions/user';

export function PageGamesHome(props: { user: UserRow }) {
    const { user } = props;
    const navigate = useNavigate();
    const [username, setUsername] = useState(user.username);
    const [roomId, setRoomId] = useState('');
    const { data: rooms } = useGameSocket<LobbyRoom[]>('/api/games/lobby/ws');

    async function createRoom(game: GameType, ai: boolean) {
        const { id } = await fetchApi<{ id: string }>({ path: '/api/games/rooms', body: { game, ai } });
        navigate(`/games/room/${id}`);
    }

    async function saveUsername() {
        userRegion.set(await fetchApi<UserRow>({ path: '/api/auth/me', method: 'PATCH', body: { username } }));
    }

    return (
        <Stack>
            {GAMES.map(({ game, label }) => (
                <Group key={game}>
                    <Title order={4} w={120}>{label}</Title>
                    <Button onClick={() => createRoom(game, true)}>人机对战</Button>
                    <Button variant="light" onClick={() => createRoom(game, false)}>创建房间</Button>
                </Group>
            ))}
            <Group>
                <TextInput placeholder="房间号" value={roomId} onChange={event => setRoomId(event.currentTarget.value)} />
                <Button variant="light" onClick={() => navigate(`/games/room/${roomId.trim().toUpperCase()}`)}>加入</Button>
            </Group>
            <Stack gap="xs">
                <Title order={5}>房间列表</Title>
                {rooms?.length === 0 && <Text c="dimmed" size="sm">暂无房间</Text>}
                {rooms?.map(room => (
                    <Group key={room.id}>
                        <Text w={120}>{GAMES.find(item => item.game === room.game)?.label}</Text>
                        <Text>{room.seats.map(seat => seat ?? '空位').join(' vs ')}</Text>
                        <Text c="dimmed" size="sm">{room.status === 'waiting' ? '等待中' : '对局中'}</Text>
                        <Button size="xs" variant="light" onClick={() => navigate(`/games/room/${room.id}`)}>
                            {room.status === 'waiting' ? '加入' : '观战'}
                        </Button>
                    </Group>
                ))}
            </Stack>
            <Group align="flex-end">
                <TextInput label="昵称" value={username} onChange={event => setUsername(event.currentTarget.value)} />
                <Button variant="subtle" onClick={saveUsername}>保存</Button>
            </Group>
        </Stack>
    );
}

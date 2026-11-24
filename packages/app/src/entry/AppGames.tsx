import { useState } from 'react';
import { Button, Container, Group, Text } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import { ModalAuth } from '@hero-pages/account/client';
import { PageGamesHome } from '@/pages/PageGamesHome';
import { PageGamesRoom } from '@/pages/PageGamesRoom';
import { logout, userRegion } from '@/regions/user';

export function AppGames() {
    const user = userRegion.useValue();
    const [authOpened, setAuthOpened] = useState(false);
    const navigate = useNavigate();

    return (
        <Container size="md" px="sm">
            <Group justify="space-between" py="md" wrap="wrap">
                <Button variant="subtle" onClick={() => navigate('/games')}>游戏</Button>
                {user && (
                    <Group>
                        <Text>{user.username}</Text>
                        {user.email ? (
                            <Button variant="subtle" onClick={logout}>退出</Button>
                        ) : (
                            <Button onClick={() => setAuthOpened(true)}>登录 / 注册</Button>
                        )}
                    </Group>
                )}
            </Group>
            {user && (
                <Routes>
                    <Route index element={<PageGamesHome user={user} />} />
                    <Route path="room/:roomId" element={<PageGamesRoom />} />
                </Routes>
            )}
            <ModalAuth
                opened={authOpened}
                onClose={() => setAuthOpened(false)}
                onSuccess={(next) => {
                    userRegion.set(next);
                    setAuthOpened(false);
                }}
            />
        </Container>
    );
}

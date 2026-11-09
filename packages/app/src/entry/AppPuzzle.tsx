import { useEffect, useState } from 'react';
import { Button, Container, Group, Text } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import type { UserRow } from '@hero-pages/account/server';
import { fetchApi, loadUser, ModalAuth } from '@hero-pages/account/client';
import { PageLevels } from '@/pages/PageLevels';
import { PageNewLevel } from '@/pages/PageNewLevel';
import { PagePlay } from '@/pages/PagePlay';

export function AppPuzzle() {
    const [user, setUser] = useState<UserRow | null>(null);
    const [authOpened, setAuthOpened] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        async function load() {
            setUser(await loadUser());
        }
        load();
    }, []);

    async function logout() {
        await fetchApi({ path: '/api/auth/logout' });
        setUser(await loadUser());
    }

    return (
        <Container size="md" px="sm">
            <Group justify="space-between" py="md" wrap="wrap">
                <Group>
                    <Button variant={pathname === '/puzzle' ? 'light' : 'subtle'} onClick={() => navigate('/puzzle')}>关卡</Button>
                    <Button variant={pathname === '/puzzle/new' ? 'light' : 'subtle'} onClick={() => navigate('/puzzle/new')}>新建关卡</Button>
                </Group>
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
                    <Route index element={<PageLevels />} />
                    <Route path="new" element={<PageNewLevel />} />
                    <Route path="play/:id" element={<PagePlay />} />
                </Routes>
            )}
            <ModalAuth
                opened={authOpened}
                onClose={() => setAuthOpened(false)}
                onSuccess={(next) => {
                    setUser(next);
                    setAuthOpened(false);
                }}
            />
        </Container>
    );
}

import { useState } from 'react';
import { Button, Container, Group, Text } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { ModalAuth } from '@/components/Modal/ModalAuth';
import { PageLevels } from '@/pages/PageLevels';
import { PageNewLevel } from '@/pages/PageNewLevel';
import { PagePlay } from '@/pages/PagePlay';
import { logout, userRegion } from '@/regions/user';

export function AppPuzzle() {
    const user = userRegion.useValue();
    const [authOpened, setAuthOpened] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

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
                    userRegion.set(next);
                    setAuthOpened(false);
                }}
            />
        </Container>
    );
}

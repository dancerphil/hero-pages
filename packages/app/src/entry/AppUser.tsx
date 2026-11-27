import { useState } from 'react';
import { Button, Container, Group, Text } from '@mantine/core';
import { Navigate, Route, Routes } from 'react-router';
import { ModalAuth } from '@/components/Modal/ModalAuth';
import { PageUser } from '@/pages/PageUser';
import { logout, userRegion } from '@/regions/user';

export function AppUser() {
    const user = userRegion.useValue();
    const [authOpened, setAuthOpened] = useState(false);

    return (
        <Container>
            {user && (
                <Group justify="flex-end" py="md">
                    <Text>{user.username}</Text>
                    {user.email ? (
                        <Button variant="subtle" onClick={logout}>退出</Button>
                    ) : (
                        <Button onClick={() => setAuthOpened(true)}>登录 / 注册</Button>
                    )}
                </Group>
            )}
            {user && (
                <Routes>
                    <Route index element={<Navigate to={`/user/${user.uid}`} replace />} />
                    <Route path=":uid" element={<PageUser user={user} />} />
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

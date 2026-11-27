import { useState } from 'react';
import { Button, Container, Group, Text } from '@mantine/core';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { ModalAuth } from '@/components/Modal/ModalAuth';
import { PageMedals } from '@/pages/PageMedals';
import { logout, userRegion } from '@/regions/user';

export function AppMedals() {
    const user = userRegion.useValue();
    const [authOpened, setAuthOpened] = useState(false);
    const navigate = useNavigate();

    return (
        <Container>
            <Group justify="space-between" py="md" wrap="wrap">
                <Button variant="subtle" onClick={() => navigate('/achievement')}>成就</Button>
                {user && (
                    <Group>
                        <Button variant="subtle" color="gray" onClick={() => navigate(`/user/${user.uid}`)}>
                            <Text>{user.username}</Text>
                        </Button>
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
                    <Route index element={<Navigate to={`/medals/${user.uid}`} replace />} />
                    <Route path=":uid" element={<PageMedals user={user} />} />
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

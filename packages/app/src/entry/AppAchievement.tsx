import { useEffect, useState } from 'react';
import { Button, Container, Group, Text } from '@mantine/core';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import type { UserRow } from '@hero-pages/account/server';
import type { UserPage } from '@/server/user';
import type { Tier } from '@/shared/tier';
import { fetchApi, loadUser, ModalAuth } from '@hero-pages/account/client';
import { BadgeCount } from '@/components/Badge/BadgeCount';
import { BadgeFly } from '@/components/Badge/BadgeFly';
import { PageBatchCreate } from '@/pages/PageBatchCreate';
import { PageFeed } from '@/pages/PageFeed';
import { PageNamed } from '@/pages/PageNamed';
import { PageUser } from '@/pages/PageUser';
import { TIERS_DESC } from '@/utils/tier';

async function loadUnlocks(uid: string) {
    const page = await fetchApi<UserPage>({ path: `/api/users/${uid}`, method: 'GET' });
    return page.unlocks;
}

export function AppAchievement() {
    const [user, setUser] = useState<UserRow | null>(null);
    const [authOpened, setAuthOpened] = useState(false);
    const [unlocks, setUnlocks] = useState<UserPage['unlocks']>([]);
    const [passing, setPassing] = useState<{ tier: Tier; from: DOMRect; landed: boolean } | null>(null);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        async function load() {
            setUser(await loadUser());
        }
        load();
    }, []);

    useEffect(() => {
        async function load(uid: string) {
            setUnlocks(await loadUnlocks(uid));
        }
        if (user) load(user.uid);
    }, [user, pathname]);

    async function landPass(uid: string) {
        setPassing(prev => prev && { ...prev, landed: true });
        await new Promise(resolve => setTimeout(resolve, 800));
        setUnlocks(await loadUnlocks(uid));
        setPassing(null);
    }

    async function logout() {
        await fetchApi({ path: '/api/auth/logout' });
        setUser(await loadUser());
    }

    return (
        <Container>
            <Group justify="space-between" py="md" wrap="wrap" pos="sticky" top={0} style={{ zIndex: 100, background: 'var(--mantine-color-body)' }}>
                <Group>
                    <Button variant={pathname === '/achievement' ? 'light' : 'subtle'} onClick={() => navigate('/achievement')}>首页</Button>
                    <Button variant={pathname === '/achievement/new' ? 'light' : 'subtle'} onClick={() => navigate('/achievement/new')}>创建</Button>
                </Group>
                {user && (
                    <Group>
                        <Button variant="subtle" color="gray" onClick={() => navigate(`/achievement/user/${user.uid}`)}>
                            <Group gap="xs">
                                {TIERS_DESC.map(tier => (
                                    <BadgeCount
                                        key={tier}
                                        tier={tier}
                                        count={unlocks.filter(unlock => unlock.tier === tier).length}
                                        gain={passing?.landed && passing.tier === tier ? 1 : 0}
                                    />
                                ))}
                                <Text>{user.username}</Text>
                            </Group>
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
                    <Route
                        index
                        element={(
                            <PageFeed
                                onEdit={title => navigate(`/achievement/${encodeURIComponent(title)}?action=edit`)}
                                onPassed={(tier, from) => setPassing({ tier, from, landed: false })}
                            />
                        )}
                    />
                    <Route
                        path="user/:uid"
                        element={(
                            <PageUser
                                user={user}
                                onUserChange={setUser}
                                onAnswered={() => loadUnlocks(user.uid)}
                            />
                        )}
                    />
                    <Route path="new" element={<PageBatchCreate onDone={() => navigate('/achievement')} />} />
                    <Route path="user" element={<Navigate to="/achievement" replace />} />
                    <Route path=":name" element={<PageNamed isAdmin={Boolean(user.is_admin)} />} />
                </Routes>
            )}
            {user && passing && !passing.landed && (
                <BadgeFly tier={passing.tier} from={passing.from} onLanded={() => landPass(user.uid)} />
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

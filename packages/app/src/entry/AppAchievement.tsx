import { useEffect, useState } from 'react';
import { Button, Container, Group, Text } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { fetchApi, ModalAuth } from '@hero-pages/account/client';
import type { UserPage } from '@/shared/user';
import type { Tier } from '@/shared/tier';
import { BadgeCount } from '@/components/Badge/BadgeCount';
import { BadgeFly } from '@/components/Badge/BadgeFly';
import { PageBatchCreate } from '@/pages/PageBatchCreate';
import { PageFeed } from '@/pages/PageFeed';
import { PageNamed } from '@/pages/PageNamed';
import { TIERS_DESC } from '@/utils/tier';
import { logout, userRegion } from '@/regions/user';

async function fetchUnlocks(uid: string) {
    const page = await fetchApi<UserPage>({ path: `/api/users/${uid}`, method: 'GET' });
    return page.unlocks;
}

export function AppAchievement() {
    const user = userRegion.useValue();
    const [authOpened, setAuthOpened] = useState(false);
    const [unlocks, setUnlocks] = useState<UserPage['unlocks']>([]);
    const [passing, setPassing] = useState<{ tier: Tier; from: DOMRect; landed: boolean } | null>(null);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        async function load(uid: string) {
            setUnlocks(await fetchUnlocks(uid));
        }
        if (user) load(user.uid);
    }, [user, pathname]);

    async function landPass(uid: string) {
        setPassing(prev => prev && { ...prev, landed: true });
        await new Promise(resolve => setTimeout(resolve, 800));
        setUnlocks(await fetchUnlocks(uid));
        setPassing(null);
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
                        <Button variant="subtle" color="gray" onClick={() => navigate(`/medals/${user.uid}`)}>
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
                    <Route path="new" element={<PageBatchCreate onDone={() => navigate('/achievement')} />} />
                    <Route path=":name" element={<PageNamed isAdmin={user.role === 'admin'} />} />
                </Routes>
            )}
            {user && passing && !passing.landed && (
                <BadgeFly tier={passing.tier} from={passing.from} onLanded={() => landPass(user.uid)} />
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

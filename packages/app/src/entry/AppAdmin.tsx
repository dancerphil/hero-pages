import { Container, Tabs } from '@mantine/core';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { PageAdminNovels } from '@/pages/PageAdminNovels';
import { PageAdminUsers } from '@/pages/PageAdminUsers';
import { userRegion } from '@/regions/user';

export function AppAdmin() {
    const user = userRegion.useValue();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    if (!user) return null;
    if (user.role !== 'admin') return <Navigate to="/" replace />;

    const section = pathname.split('/')[2] ?? 'users';

    return (
        <Container>
            <Tabs
                value={section}
                onChange={(value) => {
                    if (value) navigate(`/admin/${value}`);
                }}
                py="md"
            >
                <Tabs.List>
                    <Tabs.Tab value="users">用户</Tabs.Tab>
                    <Tabs.Tab value="novels">小说</Tabs.Tab>
                </Tabs.List>
            </Tabs>
            <Routes>
                <Route index element={<Navigate to="/admin/users" replace />} />
                <Route path="users" element={<PageAdminUsers />} />
                <Route path="novels" element={<PageAdminNovels />} />
            </Routes>
        </Container>
    );
}

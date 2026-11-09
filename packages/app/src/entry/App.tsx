import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Route, Routes } from 'react-router';
import { PageHome } from '@/pages/PageHome';
import { AppAchievement } from './AppAchievement';
import { AppPuzzle } from './AppPuzzle';

export function App() {
    return (
        <MantineProvider>
            <Notifications />
            <Routes>
                <Route index element={<PageHome />} />
                <Route path="achievement/*" element={<AppAchievement />} />
                <Route path="puzzle/*" element={<AppPuzzle />} />
            </Routes>
        </MantineProvider>
    );
}

import { Suspense } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Route, Routes } from 'react-router';
import { PageBossBlast } from '@/pages/PageBossBlast';
import { PageBossSiege } from '@/pages/PageBossSiege';
import { PageBossSpacetime } from '@/pages/PageBossSpacetime';
import { PageBossThunder } from '@/pages/PageBossThunder';
import { PageBossTidal } from '@/pages/PageBossTidal';
import { PageBossTornado } from '@/pages/PageBossTornado';
import { PageHome } from '@/pages/PageHome';
import { PagePoetryHeart } from '@/pages/PagePoetryHeart';
import { AppAchievement } from './AppAchievement';
import { AppGames } from './AppGames';
import {
    PageAdAnalyzer,
    PageAge,
    PageAnnotate,
    PageAntiGomoku,
    PageAsyncAwaitCookbook,
    PageBackground,
    PageCapital,
    PageCashFlow,
    PageCategory,
    PageColor,
    PageCompact,
    PageFiveInTwo,
    PageGithubFriends,
    PageGomoku,
    PageMaze,
    PageMbti,
    PageMine,
    PageNameGenerator,
    PageOnePercent,
    PageRead,
    PageTlp,
    PageTools,
    PageTrade,
} from './AppLazyPages';
import { AppPuzzle } from './AppPuzzle';

export function App() {
    return (
        <MantineProvider>
            <Notifications />
            <Suspense fallback={null}>
                <Routes>
                    <Route index element={<PageHome />} />
                    <Route path="achievement/*" element={<AppAchievement />} />
                    <Route path="puzzle/*" element={<AppPuzzle />} />
                    <Route path="games/*" element={<AppGames />} />
                    <Route path="poetry-heart" element={<PagePoetryHeart />} />
                    <Route path="boss/blast" element={<PageBossBlast />} />
                    <Route path="boss/tornado" element={<PageBossTornado />} />
                    <Route path="boss/thunder" element={<PageBossThunder />} />
                    <Route path="boss/spacetime" element={<PageBossSpacetime />} />
                    <Route path="boss/tidal" element={<PageBossTidal />} />
                    <Route path="boss/siege" element={<PageBossSiege />} />
                    <Route path="52" element={<PageFiveInTwo />} />
                    <Route path="ad-analyzer" element={<PageAdAnalyzer />} />
                    <Route path="age" element={<PageAge />} />
                    <Route path="annotate" element={<PageAnnotate />} />
                    <Route path="anti-gomoku" element={<PageAntiGomoku />} />
                    <Route path="async-await-cookbook" element={<PageAsyncAwaitCookbook />} />
                    <Route path="background" element={<PageBackground />} />
                    <Route path="capital" element={<PageCapital />} />
                    <Route path="cash-flow" element={<PageCashFlow />} />
                    <Route path="category" element={<PageCategory />} />
                    <Route path="color" element={<PageColor />} />
                    <Route path="compact" element={<PageCompact />} />
                    <Route path="github-friends" element={<PageGithubFriends />} />
                    <Route path="gomoku" element={<PageGomoku />} />
                    <Route path="maze" element={<PageMaze />} />
                    <Route path="mbti" element={<PageMbti />} />
                    <Route path="mine" element={<PageMine />} />
                    <Route path="name-generator" element={<PageNameGenerator />} />
                    <Route path="one-percent" element={<PageOnePercent />} />
                    <Route path="read" element={<PageRead />} />
                    <Route path="tlp" element={<PageTlp />} />
                    <Route path="tools" element={<PageTools />} />
                    <Route path="trade" element={<PageTrade />} />
                </Routes>
            </Suspense>
        </MantineProvider>
    );
}

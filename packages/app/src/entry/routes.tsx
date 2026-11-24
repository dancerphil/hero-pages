import type { RouteObject } from 'react-router';
import { PageBossBlast } from '@/pages/PageBossBlast';
import { PageBossSiege } from '@/pages/PageBossSiege';
import { PageBossSpacetime } from '@/pages/PageBossSpacetime';
import { PageBossThunder } from '@/pages/PageBossThunder';
import { PageBossTidal } from '@/pages/PageBossTidal';
import { PageBossTornado } from '@/pages/PageBossTornado';
import { PageHome } from '@/pages/PageHome';
import { PagePoetryHeart } from '@/pages/PagePoetryHeart';
import { AppAchievement } from './AppAchievement';
import { AppAdmin } from './AppAdmin';
import { AppGames } from './AppGames';
import { AppMedals } from './AppMedals';
import { AppUser } from './AppUser';
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
    PageTrade,
} from './AppLazyPages';
import { AppPuzzle } from './AppPuzzle';

export const routes: RouteObject[] = [
    { index: true, element: <PageHome />, handle: { title: '张振衣' } },
    { path: 'achievement/*', element: <AppAchievement /> },
    { path: 'admin/*', element: <AppAdmin /> },
    { path: 'medals/*', element: <AppMedals /> },
    { path: 'user/*', element: <AppUser /> },
    { path: 'puzzle/*', element: <AppPuzzle /> },
    { path: 'games/*', element: <AppGames /> },
    { path: 'poetry-heart', element: <PagePoetryHeart /> },
    { path: 'boss/blast', element: <PageBossBlast /> },
    { path: 'boss/tornado', element: <PageBossTornado /> },
    { path: 'boss/thunder', element: <PageBossThunder /> },
    { path: 'boss/spacetime', element: <PageBossSpacetime /> },
    { path: 'boss/tidal', element: <PageBossTidal /> },
    { path: 'boss/siege', element: <PageBossSiege /> },
    { path: '52', element: <PageFiveInTwo />, handle: { title: '幻兽爱合成' } },
    { path: 'ad-analyzer', element: <PageAdAnalyzer />, handle: { title: 'ad-analyzer' } },
    { path: 'age', element: <PageAge />, handle: { title: 'age' } },
    { path: 'annotate', element: <PageAnnotate />, handle: { title: '数据标注' } },
    { path: 'anti-gomoku', element: <PageAntiGomoku /> },
    { path: 'async-await-cookbook', element: <PageAsyncAwaitCookbook />, handle: { title: 'async await 代码风格指南' } },
    { path: 'background', element: <PageBackground />, handle: { title: 'base64 背景图' } },
    { path: 'capital', element: <PageCapital />, handle: { title: '资本视图' } },
    { path: 'cash-flow', element: <PageCashFlow />, handle: { title: '现金流' } },
    { path: 'category', element: <PageCategory />, handle: { title: 'category' } },
    { path: 'color', element: <PageColor />, handle: { title: '颜色工具' } },
    { path: 'compact', element: <PageCompact />, handle: { title: 'compact' } },
    { path: 'github-friends', element: <PageGithubFriends />, handle: { title: 'Github Friends' } },
    { path: 'gomoku', element: <PageGomoku /> },
    { path: 'maze', element: <PageMaze />, handle: { title: '随机迷宫' } },
    { path: 'mbti', element: <PageMbti />, handle: { title: 'MBTI' } },
    { path: 'mine', element: <PageMine />, handle: { title: '扫雷' } },
    { path: 'name-generator', element: <PageNameGenerator />, handle: { title: 'name-generator' } },
    { path: 'one-percent', element: <PageOnePercent />, handle: { title: '每天百分之一' } },
    { path: 'read/:uuid?', element: <PageRead />, handle: { title: 'read' } },
    { path: 'tlp', element: <PageTlp />, handle: { title: '逻辑哲学论' } },
    { path: 'trade', element: <PageTrade />, handle: { title: 'trade agents' } },
];

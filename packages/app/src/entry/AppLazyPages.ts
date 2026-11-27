import { lazy } from 'react';

export const PageFiveInTwo = lazy(async () => {
    const m = await import('@/pages/PageFiveInTwo');
    return { default: m.PageFiveInTwo };
});
export const PageAdAnalyzer = lazy(async () => {
    const m = await import('@/pages/PageAdAnalyzer');
    return { default: m.PageAdAnalyzer };
});
export const PageAge = lazy(async () => {
    const m = await import('@/pages/PageAge');
    return { default: m.PageAge };
});
export const PageAnnotate = lazy(async () => {
    const m = await import('@/pages/PageAnnotate');
    return { default: m.PageAnnotate };
});
export const PageAntiGomoku = lazy(async () => {
    const m = await import('@/pages/PageAntiGomoku');
    return { default: m.PageAntiGomoku };
});
export const PageAsyncAwaitCookbook = lazy(async () => {
    const m = await import('@/pages/PageAsyncAwaitCookbook');
    return { default: m.PageAsyncAwaitCookbook };
});
export const PageBackground = lazy(async () => {
    const m = await import('@/pages/PageBackground');
    return { default: m.PageBackground };
});
export const PageCapital = lazy(async () => {
    const m = await import('@/pages/PageCapital');
    return { default: m.PageCapital };
});
export const PageCashFlow = lazy(async () => {
    const m = await import('@/pages/PageCashFlow');
    return { default: m.PageCashFlow };
});
export const PageMath = lazy(async () => {
    const m = await import('@/pages/PageMath');
    return { default: m.PageMath };
});
export const PageColor = lazy(async () => {
    const m = await import('@/pages/PageColor');
    return { default: m.PageColor };
});
export const PageCompact = lazy(async () => {
    const m = await import('@/pages/PageCompact');
    return { default: m.PageCompact };
});
export const PageGithubFriends = lazy(async () => {
    const m = await import('@/github-friends');
    return { default: m.PageGithubFriends };
});
export const PageGomoku = lazy(async () => {
    const m = await import('@/pages/PageGomoku');
    return { default: m.PageGomoku };
});
export const PageMaze = lazy(async () => {
    const m = await import('@/pages/PageMaze');
    return { default: m.PageMaze };
});
export const PageMbti = lazy(async () => {
    const m = await import('@/pages/PageMbti');
    return { default: m.PageMbti };
});
export const PageMine = lazy(async () => {
    const m = await import('@/mine');
    return { default: m.PageMine };
});
export const PageNameGenerator = lazy(async () => {
    const m = await import('@/pages/PageNameGenerator');
    return { default: m.PageNameGenerator };
});
export const PageOnePercent = lazy(async () => {
    const m = await import('@/pages/PageOnePercent');
    return { default: m.PageOnePercent };
});
export const PageRead = lazy(async () => {
    const m = await import('@/pages/PageRead');
    return { default: m.PageRead };
});
export const PageTlp = lazy(async () => {
    const m = await import('@/tlp');
    return { default: m.PageTlp };
});
export const PageTrade = lazy(async () => {
    const m = await import('@/pages/PageTrade');
    return { default: m.PageTrade };
});

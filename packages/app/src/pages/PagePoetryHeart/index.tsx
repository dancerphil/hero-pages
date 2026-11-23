import { useCallback, useMemo, useState } from 'react';
import { Anchor, Box, Loader, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import { canCollect, createInitialSlips, getHighlightSlipId, getUnlocks, POEM_MAP, POEMS } from '@hero-pages/games-core';
import type { Slip, PoetryHeartState } from '@hero-pages/games-core';
import { DeskPoetryHeart } from './DeskPoetryHeart';
import { StackPoetryHeart } from './StackPoetryHeart';
import { HoverPoetryHeart } from './HoverPoetryHeart';
const TOTAL = POEMS.length;

export const PagePoetryHeart = () => {
    const [desk, setDesk] = useState<PoetryHeartState>(() => ({ slips: createInitialSlips(), collected: [] }));
    const [hand, setHand] = useState<Slip[]>([]);
    const [hoverId, setHoverId] = useState<string | null>(null);
    const [collectAnim, setCollectAnim] = useState<string | null>(null);

    const unlocks = useMemo(() => getUnlocks(desk.collected.length), [desk.collected.length]);
    const highlightId = useMemo(() => getHighlightSlipId({ hand, slips: desk.slips, collectedCount: desk.collected.length }), [hand, desk.slips, desk.collected.length]);

    const hoverSlip = useMemo(() => {
        if (!hoverId) {
            return null;
        }
        return desk.slips.find((s: Slip) => s.id === hoverId) ?? hand.find((s: Slip) => s.id === hoverId) ?? null;
    }, [hoverId, desk.slips, hand]);

    const tryCollect = useCallback((nextHand: Slip[]) => {
        const pid = canCollect(nextHand);
        if (!pid) {
            return nextHand;
        }
        setCollectAnim(pid);
        setTimeout(() => setCollectAnim(null), 900);
        setDesk((prev: PoetryHeartState) => {
            if (prev.collected.includes(pid)) {
                return prev;
            }
            return { ...prev, slips: prev.slips.filter((s: Slip) => s.poemId !== pid), collected: [...prev.collected, pid] };
        });
        return [];
    }, []);

    const onPick = useCallback((slip: Slip) => {
        if (hand.length >= 4) {
            return;
        }
        setDesk((prev: PoetryHeartState) => {
            if (!prev.slips.some((s: Slip) => s.id === slip.id)) {
                return prev;
            }
            return { ...prev, slips: prev.slips.filter((s: Slip) => s.id !== slip.id) };
        });
        setHand((prev: Slip[]) => {
            const next = [...prev, slip];
            if (next.length === 4) {
                return tryCollect(next);
            }
            return next;
        });
    }, [hand.length, tryCollect]);

    const onDrop = useCallback((pt: { x: number; y: number }) => {
        if (hand.length === 0) {
            return;
        }
        const top = hand.at(-1);
        const placed: Slip = { ...top, x: pt.x, y: pt.y, r: (Math.random() - 0.5) * 16 };
        setHand((prev: Slip[]) => prev.slice(0, -1));
        setDesk((prev: PoetryHeartState) => ({ ...prev, slips: [...prev.slips, placed] }));
    }, [hand]);

    const isDone = desk.collected.length >= TOTAL;

    return (
        <Box style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#e8dcc6' }}>
            <Box style={{ position: 'absolute', top: 6, left: 10, zIndex: 9 }}>
                <Anchor component={Link} to="/" size="sm">← 返回</Anchor>
            </Box>

            <HoverPoetryHeart slip={hoverSlip} unlocks={unlocks} />

            {isDone && (
                <Box style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'center' }}>
                    <Text fw={700} size="lg" style={{ background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: 8 }}>恭喜集齐{TOTAL}首！</Text>
                </Box>
            )}

            {desk.slips.length === 0 ? (
                <Stack align="center" justify="center" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <Loader />
                    <Text c="dimmed" size="sm">同步桌面中…</Text>
                </Stack>
            ) : (
                <DeskPoetryHeart
                    slips={desk.slips}
                    highlightId={highlightId}
                    collectAnim={collectAnim}
                    showTitleDot={unlocks.title}
                    onPick={onPick}
                    onDrop={onDrop}
                    onHover={setHoverId}
                />
            )}

            <StackPoetryHeart hand={hand} />

            <Box style={{ position: 'absolute', top: 86, right: 10, zIndex: 6, maxWidth: 240, maxHeight: '44vh', overflow: 'auto', background: 'rgba(255,255,255,0.92)', padding: 8, borderRadius: 8 }}>
                <Text size="xs" fw={600}>已收纳 {desk.collected.length} / {TOTAL} {isDone && '· 已集齐'}</Text>
                {desk.collected.length > 0 ? desk.collected.map((pid: string) => {
                    const po = POEM_MAP.get(pid);
                    return <Text key={pid} size="xs" c="dimmed">· {po?.title} · {po?.author}</Text>;
                }) : <Text size="xs" c="dimmed" mt={4}>暂无</Text>}
            </Box>
        </Box>
    );
};

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, Group, Popover, Stack, TextInput, UnstyledButton } from '@mantine/core';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import { IconArrowLeft } from '@tabler/icons-react';
import type { Novel } from './db';
import { ReadSettings } from './ReadSettings';
import { progressRegion, settingsRegion } from './region';
import c from './Read.module.css';
import { findIndex, getOffsets } from './utils';

const PADDING = 16;

interface ViewNovelProps {
    novel: Novel;
    onBack: () => void;
    onRename: (novel: Novel, name: string) => void;
}

export const ViewNovel = ({ novel, onBack, onRename }: ViewNovelProps) => {
    const listRef = useRef<HTMLDivElement>(null);
    const { ref: sizeRef, width } = useElementSize<HTMLDivElement>();
    const ref = useMergedRef(sizeRef, listRef);
    const indexRef = useRef(progressRegion.get()[novel.id] ?? 0);
    const listTopRef = useRef(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewHeight, setViewHeight] = useState(window.innerHeight);
    const [expanded, setExpanded] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [draft, setDraft] = useState('');
    const { fontSize, lineHeight: lineHeightRatio, paragraphGap } = settingsRegion.useValue();

    const paragraphs = useMemo(() => novel.text.split(/\r?\n/).map(line => line.trim()).filter(Boolean), [novel.text]);

    const lineHeight = fontSize * lineHeightRatio;
    const charsPerLine = Math.max(1, Math.floor((width - PADDING * 2) / fontSize));

    const offsets = useMemo(
        () => getOffsets({ paragraphs, charsPerLine, lineHeight, paragraphGap }),
        [paragraphs, charsPerLine, lineHeight, paragraphGap],
    );

    const index = findIndex(offsets, scrollTop);
    const end = Math.min(paragraphs.length, findIndex(offsets, scrollTop + viewHeight) + 1);

    useLayoutEffect(() => {
        const el = listRef.current;
        if (!el || !width) {
            return;
        }
        listTopRef.current = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: listTopRef.current + offsets[indexRef.current] });
        setScrollTop(Math.max(0, window.scrollY - listTopRef.current));
    }, [offsets, width]);

    useEffect(() => {
        const el = listRef.current;
        if (!el) {
            return;
        }
        const observer = new ResizeObserver(() => {
            listTopRef.current = el.getBoundingClientRect().top + window.scrollY;
            setViewHeight(window.innerHeight);
        });
        observer.observe(document.documentElement);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const top = Math.max(0, window.scrollY - listTopRef.current);
            setScrollTop(top);
            const next = findIndex(offsets, top);
            if (next !== indexRef.current) {
                indexRef.current = next;
                progressRegion.set(progress => ({ ...progress, [novel.id]: next }));
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [offsets, novel.id]);

    const openRename = () => {
        setDraft(novel.name);
        setRenaming(true);
    };

    const commitRename = () => {
        const name = draft.trim();
        setRenaming(false);
        if (name && name !== novel.name) {
            onRename(novel, name);
        }
    };

    return (
        <>
            <Group className={c.bar} gap={2}>
                {expanded && (
                    <>
                        <UnstyledButton className={c.item} onClick={onBack} aria-label="返回">
                            <IconArrowLeft size={14} />
                        </UnstyledButton>
                        <ReadSettings />
                        <Popover
                            opened={renaming}
                            onChange={opened => (opened ? openRename() : commitRename())}
                            position="bottom-end"
                            withArrow
                            shadow="md"
                        >
                            <Popover.Target>
                                <UnstyledButton className={c.title} onClick={() => (renaming ? commitRename() : openRename())}>
                                    <span className={c.titleText}>{novel.name}</span>
                                </UnstyledButton>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <Stack gap={4}>
                                    <TextInput
                                        autoFocus
                                        value={draft}
                                        onChange={e => setDraft(e.currentTarget.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                commitRename();
                                            }
                                        }}
                                    />
                                    <Button size="xs" onClick={commitRename}>确认</Button>
                                </Stack>
                            </Popover.Dropdown>
                        </Popover>
                    </>
                )}
                <UnstyledButton className={c.item} onClick={() => setExpanded(!expanded)}>
                    {Math.round(index / paragraphs.length * 100)}%
                </UnstyledButton>
            </Group>
            <div ref={ref} style={{ paddingTop: offsets[index], paddingBottom: offsets[paragraphs.length] - offsets[end], paddingInline: PADDING }}>
                {paragraphs.slice(index, end).map((paragraph, i) => (
                    <p
                        key={index + i}
                        className={c.paragraph}
                        style={{ fontSize, lineHeight: `${lineHeight}px`, paddingBottom: paragraphGap }}
                    >
                        {paragraph}
                    </p>
                ))}
            </div>
        </>
    );
};

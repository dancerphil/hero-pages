import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import { fetchApi } from '@hero-pages/account/client';
import { debounce } from 'lodash-es';
import type { NovelDetail } from '@/shared/novel';
import { BarNovel } from './BarNovel';
import { settingsRegion } from './region';
import c from './Read.module.css';
import { findIndex, getOffsets } from './utils';

const PADDING = 16;

interface ViewNovelProps {
    novel: NovelDetail;
    onBack: () => void;
    onRename: (name: string) => void;
}

export const ViewNovel = ({ novel, onBack, onRename }: ViewNovelProps) => {
    const listRef = useRef<HTMLDivElement>(null);
    const { ref: sizeRef, width } = useElementSize<HTMLDivElement>();
    const ref = useMergedRef(sizeRef, listRef);
    const indexRef = useRef(novel.paragraph);
    const listTopRef = useRef(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewHeight, setViewHeight] = useState(window.innerHeight);
    const { fontSize, lineHeight: lineHeightRatio, paragraphGap } = settingsRegion.useValue();

    const paragraphs = useMemo(() => novel.text.split(/\r?\n/).map(line => line.trim()).filter(Boolean), [novel.text]);

    const saveProgress = useMemo(
        () => debounce((paragraph: number) => fetchApi({ path: `/api/novels/${novel.id}`, method: 'PATCH', body: { paragraph } }), 1000),
        [novel.id],
    );

    useEffect(() => () => {
        saveProgress.flush();
    }, [saveProgress]);

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
                saveProgress(next);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [offsets, saveProgress]);

    return (
        <>
            <BarNovel
                name={novel.name}
                percent={Math.round(index / paragraphs.length * 100)}
                onBack={onBack}
                onRename={onRename}
            />
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

import { useEffect, useEffectEvent, useRef } from 'react';
import { Box } from '@mantine/core';
import { PuzzleBoard } from '@/game/PuzzleBoard';

export function CanvasPuzzle(props: { src: string; cols: number; rows: number; onComplete: () => void }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const onComplete = useEffectEvent(props.onComplete);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const image = new Image();
        let board: PuzzleBoard | undefined;
        const observer = new ResizeObserver(([entry]) => {
            board?.resize(entry.contentRect.width, entry.contentRect.height);
        });
        image.addEventListener('load', () => {
            board = new PuzzleBoard({ canvas, image, cols: props.cols, rows: props.rows, onComplete });
            observer.observe(canvas);
        });
        image.src = props.src;
        return () => observer.disconnect();
    }, [props.src, props.cols, props.rows]);

    return (
        <Box h="70dvh">
            <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
        </Box>
    );
}

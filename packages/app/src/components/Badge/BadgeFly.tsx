import { useEffect, useRef } from 'react';
import { Card } from '@mantine/core';
import type { Tier } from '@/shared/tier';
import { BadgeTier } from '@/ui/BadgeTier';

const SIZE = 34;

export function BadgeFly(props: { tier: Tier; from: DOMRect; onLanded: () => void }) {
    const { from } = props;
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        const targetElement = document.querySelector(`[data-tier="${props.tier}"]`);
        if (!element || !targetElement) throw new Error('徽章飞行缺少起点或终点');
        const target = targetElement.getBoundingClientRect();
        const centerX = from.left + from.width / 2;
        const centerY = from.top + from.height / 2;
        const dx = target.left + target.width / 2 - centerX;
        const dy = target.top + target.height / 2 - centerY;

        const fly = async () => {
            await element.animate(
                {
                    left: `${centerX - SIZE / 2}px`,
                    top: `${centerY - SIZE / 2}px`,
                    width: `${SIZE}px`,
                    height: `${SIZE}px`,
                    borderRadius: '50%',
                },
                { duration: 400, easing: 'ease-in-out', fill: 'forwards' },
            ).finished;
            await element.animate(
                { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
                { duration: 600, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' },
            ).finished;
            props.onLanded();
        };

        fly();
        // 挂载时只播放一次动画，依赖变化不应重播
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Card
            ref={ref}
            withBorder
            padding={0}
            style={{
                position: 'fixed',
                left: from.left,
                top: from.top,
                width: from.width,
                height: from.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1000,
            }}
        >
            <BadgeTier tier={props.tier} />
        </Card>
    );
}

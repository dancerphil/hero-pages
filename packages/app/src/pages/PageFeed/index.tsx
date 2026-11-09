import { useEffect, useState } from 'react';
import { Stack, Text } from '@mantine/core';
import type { FeedQuestion } from '@/server/achievementModel';
import type { Tier } from '@/shared/tier';
import { CardQuestion } from '@/modules/Feed/CardQuestion';
import { fetchApi } from '@hero-pages/account/client';

export function PageFeed(props: { onEdit: (achievementTitle: string) => void; onPassed: (tier: Tier, from: DOMRect) => void }) {
    const [items, setItems] = useState<FeedQuestion[]>([]);
    const [openKey, setOpenKey] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setItems(await fetchApi<FeedQuestion[]>({ path: '/api/achievements', method: 'GET' }));
        }
        load();
    }, []);

    if (items.length === 0) return <Text c="dimmed">暂无可挑战的题目</Text>;

    return (
        <Stack>
            {items.map((item) => {
                const key = `${item.achievementId}-${item.tier}`;
                return (
                    <CardQuestion
                        key={key}
                        question={item}
                        open={openKey === key}
                        onOpen={() => setOpenKey(key)}
                        onEdit={() => props.onEdit(item.achievementTitle)}
                        onPassed={(from) => {
                            setItems(prev => prev.filter(current => current !== item));
                            setOpenKey(null);
                            props.onPassed(item.tier, from);
                        }}
                    />
                );
            })}
        </Stack>
    );
}

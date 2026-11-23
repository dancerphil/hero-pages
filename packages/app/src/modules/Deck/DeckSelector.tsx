import type { ReactNode } from 'react';
import { SimpleGrid, Stack, Text } from '@mantine/core';
import { ALL_STANCES, type StanceName } from '@hero-pages/games-core';
import { CardStance } from '@/components/Card/CardStance';

interface DeckSelectorProps {
    selected: Set<StanceName>;
    onToggle: (s: StanceName) => void;
    disabled?: (s: StanceName) => boolean;
    action?: ReactNode;
}

export const DeckSelector = ({ selected, onToggle, disabled, action }: DeckSelectorProps) => (
    <Stack gap="sm" maw={760} w="100%">
        <Text size="sm">选择 5 张招式组成套牌（已选 {selected.size}/5）</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
            {ALL_STANCES.map(s => (
                <CardStance
                    key={s}
                    stance={s}
                    selected={selected.has(s)}
                    disabled={disabled ? disabled(s) : !selected.has(s) && selected.size >= 5}
                    onClick={() => { onToggle(s); }}
                />
            ))}
        </SimpleGrid>
        {action}
    </Stack>
);

import { Button, Group, SimpleGrid, Stack } from '@mantine/core';
import type { StanceName } from '@hero-pages/games-core';
import { CardStance } from '@/components/Card/CardStance';
import { DeckSelector } from '@/modules/Deck/DeckSelector';

export const BattleBossDeck = (props: {
    deckPreset: StanceName[] | null;
    editingDeck: boolean;
    deckChoice: Set<StanceName>;
    onToggle: (stance: StanceName) => void;
    onSave: () => void;
    onStart: () => void;
    onEdit: () => void;
    onCancelEdit: () => void;
}) => {
    const { deckPreset, editingDeck, deckChoice, onToggle, onSave, onStart, onEdit, onCancelEdit } = props;

    if (deckPreset && !editingDeck) {
        return (
            <Stack gap="sm" maw={760} w="100%">
                <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="sm">
                    {deckPreset.map(stance => (
                        <CardStance key={stance} stance={stance} selected={false} disabled={false} onClick={() => {}} />
                    ))}
                </SimpleGrid>
                <Group gap="sm" mt="sm">
                    <Button onClick={onStart}>开始挑战</Button>
                    <Button variant="subtle" color="gray" onClick={onEdit}>修改卡组</Button>
                </Group>
            </Stack>
        );
    }
    return (
        <DeckSelector
            selected={deckChoice}
            onToggle={onToggle}
            action={(
                <Group gap="sm" mt="sm">
                    <Button disabled={deckChoice.size !== 5} onClick={onSave}>保存并开始挑战</Button>
                    {deckPreset && <Button variant="subtle" color="gray" onClick={onCancelEdit}>取消</Button>}
                </Group>
            )}
        />
    );
};

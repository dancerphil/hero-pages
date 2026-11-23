import { SimpleGrid } from '@mantine/core';
import { ALL_STANCES, type StanceHand, type StanceName } from '@hero-pages/games-core';
import { CardStance, getStanceCooldown } from '@/components/Card/CardStance';

export function BoardStanceHand(props: { hand: StanceHand; seat: number; disabled: boolean; selected?: StanceName | null; onChoose?: (stance: StanceName) => void }) {
    const { hand, seat, disabled, selected = null, onChoose } = props;
    const owned = [...hand.hand, ...hand.discard];
    return (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm" w="100%" maw={760}>
            {ALL_STANCES.filter(stance => owned.includes(stance)).map((stance) => {
                const cooldown = getStanceCooldown(stance, hand.discard);
                return (
                    <CardStance
                        key={stance}
                        stance={stance}
                        seat={seat}
                        selected={stance === selected}
                        cooldown={cooldown}
                        disabled={disabled || cooldown > 0 || (selected !== null && stance !== selected)}
                        onClick={() => { onChoose?.(stance); }}
                    />
                );
            })}
        </SimpleGrid>
    );
}

import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { ALL_STANCES, type StanceName } from '@hero-pages/games-core';
import { CardStance, getStanceCooldown, STANCE_LABELS } from '@/components/Card/CardStance';

export const BattleBossHand = (props: {
    hand: StanceName[];
    discard: StanceName[];
    selectedCard: StanceName | null;
    submitted: boolean;
    actionStep: 'card' | 'move' | 'attack' | null;
    animPhase: 'idle' | 'moving' | 'attacking';
    onSelect: (stance: StanceName) => void;
    onCancel: () => void;
    onSkip: () => void;
}) => {
    const { hand, discard, selectedCard, submitted, actionStep, animPhase, onSelect, onCancel, onSkip } = props;

    let hint = '';
    if (animPhase === 'moving') hint = '双方移动中…';
    else if (animPhase === 'attacking') hint = 'Boss 出招！';
    else if (submitted) hint = '等待中…';
    else if (actionStep === 'card') hint = '选择要打出的招式';
    else if (actionStep === 'move') hint = `${STANCE_LABELS[selectedCard]}：在棋盘上选择移动目标`;
    else if (actionStep === 'attack') hint = `${STANCE_LABELS[selectedCard]}：在棋盘上选择攻击目标`;

    return (
        <Stack gap="xs" align="center">
            <Text size="sm">{hint}</Text>
            {(hand.length > 0 || discard.length > 0) && (
                <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm" w="100%" maw={760}>
                    {ALL_STANCES.filter(stance => [...hand, ...discard].includes(stance)).map((stance) => {
                        const cooldown = getStanceCooldown(stance, discard);
                        const isDisabled = submitted || actionStep !== 'card' || cooldown > 0 || animPhase !== 'idle';
                        return (
                            <CardStance
                                key={stance}
                                stance={stance}
                                selected={stance === selectedCard}
                                cooldown={cooldown}
                                disabled={isDisabled}
                                onClick={() => {
                                    if (!isDisabled) {
                                        onSelect(stance);
                                    }
                                }}
                            />
                        );
                    })}
                </SimpleGrid>
            )}
            {!submitted && (actionStep === 'move' || actionStep === 'attack') && (
                <Group gap="xs">
                    <Button size="xs" variant="subtle" onClick={onCancel}>↩ 取消</Button>
                    {actionStep === 'attack' && (
                        <Button size="xs" variant="subtle" onClick={onSkip}>跳过攻击</Button>
                    )}
                </Group>
            )}
        </Stack>
    );
};

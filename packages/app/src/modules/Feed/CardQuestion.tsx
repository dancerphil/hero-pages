import { useRef, useState } from 'react';
import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import type { FeedQuestion } from '@/shared/achievementModel';
import { submitAnswer } from '@/modules/Answer/FormAnswer';
import { TIER_META } from '@/utils/tier';

export function CardQuestion(props: {
    question: FeedQuestion;
    open: boolean;
    onOpen: () => void;
    onEdit: () => void;
    onPassed: (from: DOMRect) => void;
}) {
    const { question, open } = props;
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isChoice = question.kind === 'choice';
    const meta = TIER_META[question.tier];

    async function submit(value: string) {
        setSubmitting(true);
        const passed = await submitAnswer({ achievementId: question.achievementId, tier: question.tier, answer: value });
        setSubmitting(false);
        if (!passed) return;
        if (!ref.current) throw new Error('题目卡片未挂载');
        props.onPassed(ref.current.getBoundingClientRect());
    }

    return (
        <Card
            ref={ref}
            withBorder
            padding="lg"
            onClick={open ? undefined : props.onOpen}
            style={{
                cursor: open ? undefined : 'pointer',
                borderColor: open ? 'var(--mantine-color-blue-filled)' : undefined,
            }}
        >
            <Stack gap="xs">
                <Text>{question.prompt}</Text>
                <Group justify="flex-start">
                    <Badge
                        variant="light"
                        color={meta.color}
                        size="sm"
                        leftSection={<meta.Icon size={12} />}
                        style={{ cursor: 'pointer' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            props.onEdit();
                        }}
                    >
                        {question.achievementTitle}
                    </Badge>
                </Group>
            </Stack>
            {open && !isChoice && (
                <Group mt="md" wrap="nowrap">
                    <TextInput
                        style={{ flex: 1 }}
                        placeholder="输入你的回答"
                        value={answer}
                        autoFocus
                        onChange={event => setAnswer(event.currentTarget.value)}
                        onKeyDown={event => event.key === 'Enter' && answer.trim() && submit(answer)}
                    />
                    <Button onClick={() => submit(answer)} loading={submitting} disabled={!answer.trim()}>
                        提交
                    </Button>
                </Group>
            )}
            {open && isChoice && (
                <SimpleGrid cols={2} mt="md">
                    {question.choices?.map(choice => (
                        <Button
                            key={choice}
                            variant="light"
                            disabled={submitting}
                            onClick={() => submit(choice)}
                            styles={{ root: { height: 'auto', minHeight: 36, whiteSpace: 'normal' } }}
                        >
                            {choice}
                        </Button>
                    ))}
                </SimpleGrid>
            )}
        </Card>
    );
}

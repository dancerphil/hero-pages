import { useState } from 'react';
import { Button, Radio, Stack, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Tier } from '@/shared/tier';
import { fetchApi } from '@/api';

export interface AnswerQuestion {
    tier: Tier;
    prompt: string;
    kind: 'free' | 'fill' | 'choice';
    choices: string[] | null;
}

export async function submitAnswer(input: { achievementId: number; tier: Tier; answer: string }) {
    try {
        const { passed } = await fetchApi<{ passed: boolean }>({
            path: `/api/achievements/${input.achievementId}/answer`,
            body: { tier: input.tier, answer: input.answer },
        });
        notifications.show({
            color: passed ? 'green' : 'red',
            message: passed ? '回答正确，已获得成就' : '回答未通过，可以再试',
        });
        return passed;
    }
    catch (error) {
        notifications.show({ color: 'red', message: (error as Error).message });
        return false;
    }
}

export function FormAnswer(props: {
    achievementId: number;
    question: AnswerQuestion;
    initialAnswer?: string;
    onSubmitted: (passed: boolean) => void;
}) {
    const [answer, setAnswer] = useState(props.initialAnswer ?? '');
    const [loading, setLoading] = useState(false);
    const { question } = props;

    async function submit() {
        setLoading(true);
        const passed = await submitAnswer({ achievementId: props.achievementId, tier: question.tier, answer });
        setLoading(false);
        props.onSubmitted(passed);
    }

    return (
        <Stack>
            {question.kind === 'choice' ? (
                <Radio.Group value={answer} onChange={setAnswer}>
                    <Stack>
                        {question.choices?.map(choice => (
                            <Radio key={choice} value={choice} label={choice} />
                        ))}
                    </Stack>
                </Radio.Group>
            ) : (question.kind === 'fill' ? (
                <TextInput
                    label="你的答案"
                    value={answer}
                    onChange={event => setAnswer(event.currentTarget.value)}
                />
            ) : (
                <Textarea
                    label="你的回答"
                    autosize
                    minRows={2}
                    value={answer}
                    onChange={event => setAnswer(event.currentTarget.value)}
                />
            ))}
            <Button onClick={submit} loading={loading} disabled={!answer}>
                提交
            </Button>
        </Stack>
    );
}

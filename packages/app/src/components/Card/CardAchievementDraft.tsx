import type { ReactNode } from 'react';
import { Button, Card, Checkbox, Group, ActionIcon, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import type { GeneratedAchievement, QuestionInput } from '@/server/achievementModel';
import { BadgeTier } from '@/ui/BadgeTier';
import { sortByTier } from '@/utils/tier';
import { changeKind, emptyQuestion } from '@/utils/achievementDraft';
import { TIERS, type Tier } from '@/shared/tier';

export function CardAchievementDraft(props: {
    draft: GeneratedAchievement;
    onChange: (draft: GeneratedAchievement) => void;
    leading?: ReactNode;
    actions?: ReactNode;
    isRegenerating?: (index: number) => boolean;
    onRegenerateQuestion?: (index: number) => void;
}) {
    const { draft, onChange, isRegenerating, onRegenerateQuestion } = props;

    function updateQuestion(index: number, patch: Partial<QuestionInput>) {
        onChange({ ...draft, questions: draft.questions.map((question, i) => (i === index ? { ...question, ...patch } : question)) });
    }

    function toggleTier(tier: Tier, enabled: boolean) {
        onChange({
            ...draft,
            questions: enabled ? [...draft.questions, emptyQuestion(tier)] : draft.questions.filter(question => question.tier !== tier),
        });
    }

    return (
        <Card withBorder>
            <Group wrap="nowrap" align="flex-start">
                {props.leading}
                <TextInput
                    style={{ flex: 1 }}
                    placeholder="成就名称"
                    value={draft.title}
                    onChange={event => onChange({ ...draft, title: event.currentTarget.value })}
                />
                {props.actions}
            </Group>
            <Stack mt="sm">
                <Group>
                    {TIERS.map(tier => (
                        <Checkbox
                            key={tier}
                            label={<BadgeTier tier={tier} />}
                            checked={draft.questions.some(question => question.tier === tier)}
                            onChange={event => toggleTier(tier, event.currentTarget.checked)}
                        />
                    ))}
                </Group>
                {sortByTier(draft.questions.map((question, index) => ({ ...question, index }))).map(({ index, ...question }) => (
                    <Stack key={index} gap="xs">
                        <Group wrap="nowrap" gap="xs" align="center">
                            <BadgeTier tier={question.tier} />
                            <SegmentedControl
                                data={[
                                    { label: '选择', value: 'choice' },
                                    { label: '填空', value: 'fill' },
                                    { label: '简答', value: 'free' },
                                ]}
                                value={question.kind}
                                onChange={value => updateQuestion(index, changeKind(value as QuestionInput['kind'], question))}
                            />
                            <TextInput
                                style={{ flex: 1, minWidth: 0 }}
                                placeholder="问题"
                                value={question.prompt}
                                onChange={event => updateQuestion(index, { prompt: event.currentTarget.value })}
                            />
                            {onRegenerateQuestion && (
                                <Button variant="subtle" loading={isRegenerating?.(index)} onClick={() => onRegenerateQuestion(index)}>
                                    换一个
                                </Button>
                            )}
                        </Group>
                        {question.kind === 'choice' && (
                            <Group gap="xs" wrap="nowrap" align="center">
                                {(question.options ?? []).map((option, optionIndex) => (
                                    <TextInput
                                        key={optionIndex}
                                        style={{ flex: 1, minWidth: 0 }}
                                        placeholder={optionIndex === 0 ? '答案' : '干扰项'}
                                        value={option}
                                        onChange={(event) => {
                                            const options = [...(question.options ?? [])];
                                            options[optionIndex] = event.currentTarget.value;
                                            updateQuestion(index, { options });
                                        }}
                                        rightSection={(
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={() => updateQuestion(index, { options: (question.options ?? []).filter((_, i) => i !== optionIndex) })}
                                            >
                                                <IconX size={12} />
                                            </ActionIcon>
                                        )}
                                    />
                                ))}
                                {(question.options?.length ?? 0) < 8 && (
                                    <ActionIcon
                                        variant="light"
                                        onClick={() => updateQuestion(index, { options: [...(question.options ?? []), ''] })}
                                    >
                                        <IconPlus size={14} />
                                    </ActionIcon>
                                )}
                            </Group>
                        )}
                        {question.kind === 'fill' && (
                            <Group grow gap="xs">
                                <TextInput
                                    placeholder="答案"
                                    value={(question.options ?? [])[0] ?? ''}
                                    onChange={event => updateQuestion(index, { options: [event.currentTarget.value] })}
                                />
                                <TextInput
                                    placeholder="说明（可选）"
                                    value={question.criteria ?? ''}
                                    onChange={event => updateQuestion(index, { criteria: event.currentTarget.value })}
                                />
                            </Group>
                        )}
                        {question.kind === 'free' && (
                            <TextInput
                                placeholder="判断标准（可选，空则由 AI 判断）"
                                value={question.criteria ?? ''}
                                onChange={event => updateQuestion(index, { criteria: event.currentTarget.value })}
                            />
                        )}
                    </Stack>
                ))}
                {draft.questions.length === 0 && <Text c="dimmed">尚未添加任何档位，保存时会报错</Text>}
            </Stack>
        </Card>
    );
}

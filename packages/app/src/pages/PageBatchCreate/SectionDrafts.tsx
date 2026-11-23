import { type Dispatch, type SetStateAction, useState } from 'react';
import { Button, Checkbox } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { fetchApi } from '@hero-pages/account/client';
import type { GeneratedAchievement, QuestionInput } from '@/shared/achievementModel';
import { CardAchievementDraft } from '@/components/Card/CardAchievementDraft';

export type Draft = GeneratedAchievement & { key: number; selected: boolean };

function tierLabel(tier: string) {
    return tier === 'bronze' ? '青铜' : (tier === 'silver' ? '白银' : '黄金');
}

export function SectionDrafts(props: {
    drafts: Draft[];
    setDrafts: Dispatch<SetStateAction<Draft[]>>;
    scope: string;
    extra: string;
}) {
    const { drafts, setDrafts, scope, extra } = props;
    const [regenerating, setRegenerating] = useState<string[]>([]);
    const [regeneratingDrafts, setRegeneratingDrafts] = useState<number[]>([]);

    function updateDraft(key: number, next: Draft) {
        setDrafts(prev => prev.map(draft => (draft.key === key ? next : draft)));
    }

    async function regenerateQuestion(draftKey: number, index: number) {
        const snapshot = drafts.find(item => item.key === draftKey);
        const target = snapshot?.questions[index];
        if (!snapshot || !target) return;
        if (!window.confirm(`确定重新生成「${snapshot.title}」${tierLabel(target.tier)}题目吗？当前题目将被替换。`)) return;
        const key = `${draftKey}:${index}`;
        setRegenerating(prev => (prev.includes(key) ? prev : [...prev, key]));
        try {
            const { question } = await fetchApi<{ question: QuestionInput }>({
                path: '/api/achievements/generate-question',
                body: {
                    scope: scope.trim(),
                    title: snapshot.title.trim(),
                    tier: target.tier,
                    extra: extra.trim(),
                    exclude: snapshot.questions.map(question => question.prompt),
                },
            });
            setDrafts(prev =>
                prev.map(item =>
                    item.key !== draftKey
                        ? item
                        : { ...item, questions: item.questions.map((q, i) => (i === index ? { ...question, tier: target.tier } : q)) },
                ),
            );
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
        finally {
            setRegenerating(prev => prev.filter(item => item !== key));
        }
    }

    async function regenerateDraft(draftKey: number) {
        const snapshot = drafts.find(item => item.key === draftKey);
        if (!snapshot || !snapshot.title.trim()) return;
        if (!window.confirm(`确定重新生成「${snapshot.title}」的全部题目吗？当前题目将被替换。`)) return;
        setRegeneratingDrafts(prev => (prev.includes(draftKey) ? prev : [...prev, draftKey]));
        try {
            const { items } = await fetchApi<{ items: GeneratedAchievement[] }>({
                path: '/api/achievements/generate-details',
                body: { scope: scope.trim(), titles: [snapshot.title.trim()], extra: extra.trim() },
            });
            const fresh = items[0]?.questions;
            if (!fresh) throw new Error('AI 返回为空');
            setDrafts(prev => prev.map(item => (item.key === draftKey ? { ...item, questions: fresh } : item)));
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
        finally {
            setRegeneratingDrafts(prev => prev.filter(item => item !== draftKey));
        }
    }

    return (
        <>
            {drafts.map(draft => (
                <CardAchievementDraft
                    key={draft.key}
                    draft={draft}
                    onChange={next => updateDraft(draft.key, { ...draft, ...next })}
                    leading={(
                        <Checkbox
                            mt={8}
                            checked={draft.selected}
                            onChange={event => updateDraft(draft.key, { ...draft, selected: event.currentTarget.checked })}
                        />
                    )}
                    actions={(
                        <>
                            <Button variant="subtle" loading={regeneratingDrafts.includes(draft.key)} onClick={() => regenerateDraft(draft.key)}>
                                重新生成
                            </Button>
                            <Button variant="subtle" color="red" onClick={() => setDrafts(prev => prev.filter(item => item.key !== draft.key))}>
                                <IconTrash size={16} />
                            </Button>
                        </>
                    )}
                    isRegenerating={index => regenerating.includes(`${draft.key}:${index}`)}
                    onRegenerateQuestion={index => regenerateQuestion(draft.key, index)}
                />
            ))}
        </>
    );
}

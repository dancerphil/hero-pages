import { useEffect, useState } from 'react';
import { Badge, Button, Group, Stack, Text, Title } from '@mantine/core';
import type { AchievementDetail } from '@/server/achievementModel';
import { ModalAnswer } from '@/modules/Answer/ModalAnswer';
import { BadgeTier } from '@/ui/BadgeTier';
import { ModalMerge } from '@/components/Modal/ModalMerge';
import { fetchApi } from '@hero-pages/account/client';
import { sortByTier } from '@/utils/tier';

type Question = AchievementDetail['questions'][number];

export function PageAchievement(props: {
    id: number;
    isAdmin: boolean;
    onEdit: () => void;
    onDeleted: () => void;
    onMerged: (title: string) => void;
}) {
    const [detail, setDetail] = useState<AchievementDetail | null>(null);
    const [answering, setAnswering] = useState<Question | null>(null);
    const [merging, setMerging] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        async function load() {
            setDetail(await fetchApi<AchievementDetail>({ path: `/api/achievements/${props.id}`, method: 'GET' }));
        }
        load();
    }, [props.id, reloadKey]);

    async function remove() {
        if (!window.confirm('确定删除这个成就吗？已获得的记录也会一并删除。')) return;
        await fetchApi({ path: `/api/achievements/${props.id}`, method: 'DELETE' });
        props.onDeleted();
    }

    if (!detail) return null;

    return (
        <Stack>
            <Group justify="space-between" wrap="wrap">
                <div>
                    <Title order={3}>{detail.title}</Title>
                    <Text size="sm" c="dimmed">创建者：{detail.creator}</Text>
                    {detail.aliases.length > 0 && (
                        <Text size="sm" c="dimmed">别名：{detail.aliases.join('、')}</Text>
                    )}
                </div>
                <Group>
                    <Button variant="light" onClick={props.onEdit}>编辑</Button>
                    {props.isAdmin && (
                        <>
                            <Button variant="light" onClick={() => setMerging(true)}>合并</Button>
                            <Button variant="light" color="red" onClick={remove}>删除</Button>
                        </>
                    )}
                </Group>
            </Group>
            {sortByTier(detail.questions).map(question => (
                <Group key={question.tier} justify="space-between" wrap="nowrap" align="flex-start">
                    <Stack gap={4}>
                        <BadgeTier tier={question.tier} />
                        <Text size="sm">{question.prompt}</Text>
                    </Stack>
                    <Group gap="xs" wrap="nowrap">
                        {question.unlocked && <Badge color="green" variant="light">已获得</Badge>}
                        <Button size="compact-sm" onClick={() => setAnswering(question)}>作答</Button>
                    </Group>
                </Group>
            ))}
            {merging && (
                <ModalMerge
                    sourceId={props.id}
                    sourceTitle={detail.title}
                    onClose={() => setMerging(false)}
                    onMerged={props.onMerged}
                />
            )}
            {answering && (
                <ModalAnswer
                    achievementId={props.id}
                    question={answering}
                    onClose={() => setAnswering(null)}
                    onSubmitted={() => setReloadKey(key => key + 1)}
                />
            )}
        </Stack>
    );
}

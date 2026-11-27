import { useEffect, useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiGetAchievementEdit, apiPostAchievement, apiPutAchievement } from '@/api/achievement';
import type { GeneratedAchievement } from '@/shared/achievementModel';
import { CardAchievementDraft } from '@/components/Card/CardAchievementDraft';
import { normalizeAchievement } from '@/utils/achievementDraft';

export function PageAchievementForm(props: { id?: number; onSaved: (title: string) => void }) {
    const [draft, setDraft] = useState<GeneratedAchievement>({ title: '', questions: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function load(id: number) {
            setDraft(await apiGetAchievementEdit({ id }));
        }
        if (props.id !== undefined) load(props.id);
    }, [props.id]);

    async function save() {
        setLoading(true);
        setError('');
        try {
            const body = normalizeAchievement(draft);
            const { linked } = props.id === undefined
                ? await apiPostAchievement(body)
                : await apiPutAchievement({ id: props.id, ...body });
            if (linked) notifications.show({ color: 'blue', message: '已存在同一成就，已关联到已有成就' });
            props.onSaved(body.title);
        }
        catch (error_) {
            setError((error_ as Error).message);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <Stack>
            <CardAchievementDraft draft={draft} onChange={setDraft} />
            {error && <Text c="red" size="sm">{error}</Text>}
            <Button onClick={save} loading={loading} disabled={!draft.title.trim() || draft.questions.length === 0}>
                保存
            </Button>
        </Stack>
    );
}

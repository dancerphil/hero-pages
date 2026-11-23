import { useState } from 'react';
import { Button, Group, NumberInput, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchApi } from '@hero-pages/account/client';
import type { GeneratedAchievement } from '@/shared/achievementModel';
import { normalizeAchievement } from '@/utils/achievementDraft';
import { type Draft, SectionDrafts } from './SectionDrafts';
import { type NameDraft, SectionNames } from './SectionNames';

export function PageBatchCreate(props: { onDone: () => void }) {
    const [scope, setScope] = useState('');
    const [count, setCount] = useState(5);
    const [extra, setExtra] = useState('');
    const [generatingTitles, setGeneratingTitles] = useState(false);
    const [generatingDetails, setGeneratingDetails] = useState(false);
    const [saving, setSaving] = useState(false);
    const [names, setNames] = useState<NameDraft[]>([]);
    const [drafts, setDrafts] = useState<Draft[]>([]);

    async function generateTitles() {
        setGeneratingTitles(true);
        try {
            const { titles } = await fetchApi<{ titles: string[] }>({
                path: '/api/achievements/generate-titles',
                body: { scope: scope.trim(), count, extra: extra.trim() },
            });
            setNames(titles.map((text, index) => ({ key: Date.now() + index, text, selected: true })));
            setDrafts([]);
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
        finally {
            setGeneratingTitles(false);
        }
    }

    async function generateDetails() {
        const titles = names.filter(name => name.selected).map(name => name.text.trim()).filter(Boolean);
        setGeneratingDetails(true);
        try {
            const { items } = await fetchApi<{ items: GeneratedAchievement[] }>({
                path: '/api/achievements/generate-details',
                body: { scope: scope.trim(), titles, extra: extra.trim() },
            });
            setDrafts(items.map((item, index) => ({ ...item, key: Date.now() + index, selected: true })));
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
        finally {
            setGeneratingDetails(false);
        }
    }

    async function save() {
        const items = drafts.filter(draft => draft.selected).map(normalizeAchievement);
        if (items.length === 0) {
            notifications.show({ color: 'red', message: '请至少勾选一个成就' });
            return;
        }
        setSaving(true);
        try {
            const { results } = await fetchApi<{ results: { linked: boolean }[] }>({
                path: '/api/achievements/batch',
                body: { items },
            });
            const linked = results.filter(result => result.linked).length;
            notifications.show({
                color: 'green',
                message: `已创建 ${results.length - linked} 个成就${linked > 0 ? `，关联 ${linked} 个已有成就` : ''}`,
            });
            props.onDone();
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <Stack>
            <TextInput
                label="范围"
                description="AI 会在这个范围内拆分出多个具体概念，每个概念是一个成就"
                placeholder="例如：海贼王"
                value={scope}
                onChange={event => setScope(event.currentTarget.value)}
            />
            <Group grow>
                <NumberInput label="成就数量（1–10）" min={1} max={10} value={count} onChange={value => setCount(Number(value) || 5)} />
            </Group>
            <Textarea
                label="补充要求（可选）"
                placeholder="例如：侧重前期剧情，避免过于冷门的角色"
                autosize
                minRows={2}
                value={extra}
                onChange={event => setExtra(event.currentTarget.value)}
            />
            <Button onClick={generateTitles} loading={generatingTitles} disabled={!scope.trim()}>
                生成名称
            </Button>

            {names.length > 0 && (
                <SectionNames names={names} setNames={setNames} generating={generatingDetails} onGenerate={generateDetails} />
            )}

            {drafts.length > 0 && <Text fw={500}>第二步：确认题目细节</Text>}
            <SectionDrafts drafts={drafts} setDrafts={setDrafts} scope={scope} extra={extra} />
            {drafts.length > 0 && (
                <Button onClick={save} loading={saving}>
                    保存勾选的成就
                </Button>
            )}
        </Stack>
    );
}

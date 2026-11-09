import { useEffect, useState } from 'react';
import { Button, Modal, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchApi } from '@hero-pages/account/client';

export function ModalMerge(props: { sourceId: number; sourceTitle: string; onClose: () => void; onMerged: (title: string) => void }) {
    const [titles, setTitles] = useState<{ id: number; title: string }[]>([]);
    const [targetId, setTargetId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            const items = await fetchApi<{ id: number; title: string }[]>({ path: '/api/achievements/titles', method: 'GET' });
            setTitles(items.filter(item => item.id !== props.sourceId));
        }
        load();
    }, [props.sourceId]);

    async function merge() {
        setLoading(true);
        try {
            const target = titles.find(item => String(item.id) === targetId);
            if (!target) throw new Error('请选择要合并到的成就');
            await fetchApi({
                path: `/api/achievements/${props.sourceId}/merge`,
                body: { targetId: target.id },
            });
            notifications.show({ color: 'green', message: `已合并《${props.sourceTitle}》` });
            props.onMerged(target.title);
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <Modal opened onClose={props.onClose} title="合并成就" centered>
            <Stack>
                <Text size="sm">
                    把《{props.sourceTitle}》合并到下面选择的成就。名称会变成对方的别名，两边都有的档位保留对方的题目，已获得的记录会一并合并。合并后《{props.sourceTitle}》将被删除。
                </Text>
                <Select
                    label="合并到"
                    placeholder="搜索成就"
                    searchable
                    data={titles.map(item => ({ value: String(item.id), label: item.title }))}
                    value={targetId}
                    onChange={setTargetId}
                />
                <Button color="red" onClick={merge} loading={loading} disabled={!targetId}>
                    确认合并
                </Button>
            </Stack>
        </Modal>
    );
}

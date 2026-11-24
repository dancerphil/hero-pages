import { useState } from 'react';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import type { NovelRow } from '@/shared/novel';

interface ListNovelProps {
    novels: NovelRow[];
    onOpen: (uuid: string) => void;
    onRename: (uuid: string, name: string) => void;
}

export const ListNovel = ({ novels, onOpen, onRename }: ListNovelProps) => {
    const [editingId, setEditingId] = useState<string>();
    const [draft, setDraft] = useState('');

    const commit = (novel: NovelRow) => {
        const name = draft.trim();
        setEditingId(undefined);
        if (name && name !== novel.name) {
            onRename(novel.uuid, name);
        }
    };

    return (
        <Stack>
            {novels.map(novel => (
                <Group key={novel.uuid} justify="space-between">
                    {editingId === novel.uuid ? (
                        <TextInput
                            autoFocus
                            value={draft}
                            onChange={e => setDraft(e.currentTarget.value)}
                            onBlur={() => commit(novel)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                }
                            }}
                        />
                    ) : (
                        <Text>{novel.name}</Text>
                    )}
                    <Group>
                        <Button
                            variant="default"
                            onClick={() => {
                                setEditingId(novel.uuid);
                                setDraft(novel.name);
                            }}
                        >
                            改名
                        </Button>
                        <Button onClick={() => onOpen(novel.uuid)}>打开</Button>
                    </Group>
                </Group>
            ))}
        </Stack>
    );
};

import { useState } from 'react';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import type { NovelRow } from '@/shared/novel';

export interface NovelItem {
    row: NovelRow;
    local: boolean;
    remote: boolean;
}

interface ListNovelProps {
    items: NovelItem[];
    transfer?: {
        onUpload: (row: NovelRow) => void;
        onDownload: (row: NovelRow) => void;
    };
    onOpen: (uuid: string) => void;
    onRename: (uuid: string, name: string) => void;
}

export const ListNovel = ({ items, transfer, onOpen, onRename }: ListNovelProps) => {
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
            {items.map(({ row, local, remote }) => (
                <Group key={row.uuid} justify="space-between">
                    {editingId === row.uuid ? (
                        <TextInput
                            autoFocus
                            value={draft}
                            onChange={e => setDraft(e.currentTarget.value)}
                            onBlur={() => commit(row)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                }
                            }}
                        />
                    ) : (
                        <Text>{row.name}</Text>
                    )}
                    <Group>
                        {transfer && local && !remote && (
                            <Button variant="default" onClick={() => transfer.onUpload(row)}>上传</Button>
                        )}
                        {transfer && remote && !local && (
                            <Button variant="default" onClick={() => transfer.onDownload(row)}>下载</Button>
                        )}
                        {local && (
                            <>
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        setEditingId(row.uuid);
                                        setDraft(row.name);
                                    }}
                                >
                                    改名
                                </Button>
                                <Button onClick={() => onOpen(row.uuid)}>打开</Button>
                            </>
                        )}
                    </Group>
                </Group>
            ))}
        </Stack>
    );
};

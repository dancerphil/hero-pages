import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, FileButton, Group, Stack } from '@mantine/core';
import type { NovelRow } from '@/shared/novel';
import { userRegion } from '@/regions/user';
import { ListNovel, type NovelItem } from './ListNovel';
import { getNovelRows, putNovel, updateNovelRow } from './db';
import { downloadNovel, syncNovels, uploadNovel } from './sync';

const decode = async (file: File) => {
    const buffer = await file.arrayBuffer();
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    }
    catch {
        return new TextDecoder('gbk').decode(buffer);
    }
};

export const Read = () => {
    const navigate = useNavigate();
    const user = userRegion.useValue();
    const [novels, setNovels] = useState<NovelRow[]>([]);
    const [remoteNovels, setRemoteNovels] = useState<NovelRow[]>([]);

    const refresh = useCallback(async () => {
        setNovels(await getNovelRows());
        if (user) {
            setRemoteNovels(await syncNovels());
            setNovels(await getNovelRows());
        }
        else {
            setRemoteNovels([]);
        }
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleFile = async (file: File | null) => {
        if (!file) return;
        await putNovel({ uuid: crypto.randomUUID(), name: file.name, paragraph: 0, updatedAt: Date.now() }, await decode(file));
        refresh();
    };

    const handleRename = async (uuid: string, name: string) => {
        await updateNovelRow(uuid, { name });
        setNovels(await getNovelRows());
    };

    const handleUpload = async (row: NovelRow) => {
        await uploadNovel(row);
        refresh();
    };

    const handleDownload = async (row: NovelRow) => {
        await downloadNovel(row);
        refresh();
    };

    const localUuids = new Set(novels.map(row => row.uuid));
    const remoteUuids = new Set(remoteNovels.map(row => row.uuid));
    const items: NovelItem[] = [
        ...novels.map(row => ({ row, local: true, remote: remoteUuids.has(row.uuid) })),
        ...remoteNovels.filter(row => !localUuids.has(row.uuid)).map(row => ({ row, local: false, remote: true })),
    ].toSorted((a, b) => b.row.updatedAt - a.row.updatedAt);

    return (
        <Stack p="md">
            <Group justify="flex-end">
                <FileButton accept="text/plain" onChange={handleFile}>
                    {props => <Button {...props}>新增小说</Button>}
                </FileButton>
            </Group>
            <ListNovel
                items={items}
                transfer={user ? { onUpload: handleUpload, onDownload: handleDownload } : undefined}
                onOpen={uuid => navigate(`/read/${uuid}`)}
                onRename={handleRename}
            />
        </Stack>
    );
};

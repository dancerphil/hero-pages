import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, FileButton, Group, Stack } from '@mantine/core';
import type { NovelRow } from '@/shared/novel';
import { userRegion } from '@/regions/user';
import { ListNovel } from './ListNovel';
import { getNovelRows, putNovel, updateNovelRow } from './db';
import { syncNovels } from './sync';

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

    const refresh = useCallback(async () => {
        setNovels(await getNovelRows());
        if (user) {
            await syncNovels();
            setNovels(await getNovelRows());
        }
    }, [user]);

    useEffect(() => {
        const load = async () => {
            setNovels(await getNovelRows());
            if (user) {
                await syncNovels();
                setNovels(await getNovelRows());
            }
        };
        load();
    }, [user]);

    const handleFile = async (file: File | null) => {
        if (!file) return;
        await putNovel({ uuid: crypto.randomUUID(), name: file.name, paragraph: 0, updatedAt: Date.now() }, await decode(file));
        refresh();
    };

    const handleRename = async (uuid: string, name: string) => {
        await updateNovelRow(uuid, { name });
        setNovels(await getNovelRows());
    };

    return (
        <Stack p="md">
            <Group justify="flex-end">
                <Button variant="default" onClick={refresh}>同步</Button>
                <FileButton accept="text/plain" onChange={handleFile}>
                    {props => <Button {...props}>新增小说</Button>}
                </FileButton>
            </Group>
            <ListNovel novels={novels} onOpen={uuid => navigate(`/read/${uuid}`)} onRename={handleRename} />
        </Stack>
    );
};

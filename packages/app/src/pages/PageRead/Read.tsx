import { useEffect, useState } from 'react';
import { Button, FileButton, Group, Stack, Text } from '@mantine/core';
import { fetchApi, ModalAuth } from '@hero-pages/account/client';
import type { NovelDetail, NovelRow } from '@/shared/novel';
import { logout, userRegion } from '@/regions/user';
import { ListNovel } from './ListNovel';
import { ViewNovel } from './ViewNovel';
import { readingRegion } from './region';

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
    const user = userRegion.useValue();
    const [authOpened, setAuthOpened] = useState(false);
    const [novels, setNovels] = useState<NovelRow[]>([]);
    const [opened, setOpened] = useState<NovelDetail>();

    useEffect(() => {
        readingRegion.set(!!opened);
        return () => readingRegion.set(false);
    }, [opened]);

    useEffect(() => {
        async function load() {
            setNovels(await fetchApi<NovelRow[]>({ path: '/api/novels', method: 'GET' }));
        }
        if (user) load();
    }, [user]);

    const handleFile = async (file: File | null) => {
        if (!file) return;
        const novel = await fetchApi<NovelRow>({ path: '/api/novels', body: { name: file.name, text: await decode(file) } });
        setNovels(prev => [...prev, novel]);
    };

    const handleOpen = async (id: number) => {
        setOpened(await fetchApi<NovelDetail>({ path: `/api/novels/${id}`, method: 'GET' }));
    };

    const handleRename = async (id: number, name: string) => {
        await fetchApi({ path: `/api/novels/${id}`, method: 'PATCH', body: { name } });
        setNovels(prev => prev.map(item => (item.id === id ? { ...item, name } : item)));
        setOpened(prev => prev && prev.id === id ? { ...prev, name } : prev);
    };

    if (opened) {
        return (
            <ViewNovel
                key={opened.id}
                novel={opened}
                onBack={() => setOpened(undefined)}
                onRename={handleRename}
            />
        );
    }

    return (
        <Stack p="md">
            <Group justify="space-between">
                <Text fw={600}>我的小说</Text>
                <Group>
                    {user && (
                        <>
                            <Text>{user.username}</Text>
                            {user.email ? (
                                <Button variant="subtle" onClick={logout}>退出</Button>
                            ) : (
                                <Button variant="subtle" onClick={() => setAuthOpened(true)}>登录 / 注册</Button>
                            )}
                        </>
                    )}
                    <FileButton accept="text/plain" onChange={handleFile}>
                        {props => <Button {...props}>上传小说</Button>}
                    </FileButton>
                </Group>
            </Group>
            <ListNovel novels={novels} onOpen={handleOpen} onRename={handleRename} />
            <ModalAuth
                opened={authOpened}
                onClose={() => setAuthOpened(false)}
                onSuccess={(next) => {
                    userRegion.set(next);
                    setAuthOpened(false);
                }}
            />
        </Stack>
    );
};

import { useEffect, useState } from 'react';
import { Button, FileButton, Group, Stack, Text } from '@mantine/core';
import { fetchApi, loadUser, ModalAuth, type UserRow } from '@hero-pages/account/client';
import type { NovelDetail, NovelRow } from '@/shared/novel';
import { ListNovel } from './ListNovel';
import { ViewNovel } from './ViewNovel';

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
    const [user, setUser] = useState<UserRow | null>(null);
    const [authOpened, setAuthOpened] = useState(false);
    const [novels, setNovels] = useState<NovelRow[]>([]);
    const [opened, setOpened] = useState<NovelDetail>();

    useEffect(() => {
        async function load() {
            setUser(await loadUser());
        }
        load();
    }, []);

    useEffect(() => {
        async function load() {
            setNovels(await fetchApi<NovelRow[]>({ path: '/api/novels', method: 'GET' }));
        }
        if (user) load();
    }, [user]);

    async function logout() {
        await fetchApi({ path: '/api/auth/logout' });
        setUser(await loadUser());
    }

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
                    setUser(next);
                    setAuthOpened(false);
                }}
            />
        </Stack>
    );
};

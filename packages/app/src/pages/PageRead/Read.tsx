import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, FileButton, Group, Stack, Text } from '@mantine/core';
import { fetchApi, ModalAuth } from '@hero-pages/account/client';
import type { NovelRow } from '@/shared/novel';
import { logout, userRegion } from '@/regions/user';
import { ListNovel } from './ListNovel';

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
    const [authOpened, setAuthOpened] = useState(false);
    const [novels, setNovels] = useState<NovelRow[]>([]);

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

    const handleRename = async (id: number, name: string) => {
        await fetchApi({ path: `/api/novels/${id}`, method: 'PATCH', body: { name } });
        setNovels(prev => prev.map(item => (item.id === id ? { ...item, name } : item)));
    };

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
            <ListNovel novels={novels} onOpen={id => navigate(`/read/${id}`)} onRename={handleRename} />
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

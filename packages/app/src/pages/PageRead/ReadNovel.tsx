import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Text } from '@mantine/core';
import type { NovelRow } from '@/shared/novel';
import { userRegion } from '@/regions/user';
import { ViewNovel } from './ViewNovel';
import { getNovel, updateNovelRow } from './db';
import { syncNovels } from './sync';

export const ReadNovel = ({ uuid }: { uuid: string }) => {
    const navigate = useNavigate();
    const user = userRegion.useValue();
    const [novel, setNovel] = useState<{ row: NovelRow; text: string } | null>();

    useEffect(() => {
        async function load() {
            const found = await getNovel(uuid);
            if (found) {
                setNovel(found);
                return;
            }
            if (!user) return;
            await syncNovels();
            setNovel((await getNovel(uuid)) ?? null);
        }
        load();
    }, [uuid, user]);

    const handleRename = async (name: string) => {
        await updateNovelRow(uuid, { name });
        setNovel(prev => prev && { ...prev, row: { ...prev.row, name } });
    };

    if (novel === undefined) return null;
    if (novel === null) return <Text p="md">小说不存在</Text>;

    return (
        <ViewNovel
            key={uuid}
            novel={novel.row}
            text={novel.text}
            onBack={() => navigate('/read')}
            onRename={handleRename}
        />
    );
};

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { fetchApi } from '@hero-pages/account/client';
import type { NovelDetail } from '@/shared/novel';
import { userRegion } from '@/regions/user';
import { ViewNovel } from './ViewNovel';
import { loadNovelText } from './cache';

export const ReadNovel = ({ id }: { id: number }) => {
    const navigate = useNavigate();
    const user = userRegion.useValue();
    const [novel, setNovel] = useState<NovelDetail>();
    const [text, setText] = useState<string>();

    useEffect(() => {
        async function load() {
            const fetchText = async () => {
                const { text } = await fetchApi<{ text: string }>({ path: `/api/novels/${id}/text`, method: 'GET' });
                return text;
            };
            setNovel(await fetchApi<NovelDetail>({ path: `/api/novels/${id}`, method: 'GET' }));
            setText(await loadNovelText(id, fetchText));
        }
        if (user) load();
    }, [id, user]);

    const handleRename = async (name: string) => {
        await fetchApi({ path: `/api/novels/${id}`, method: 'PATCH', body: { name } });
        setNovel(prev => prev && { ...prev, name });
    };

    if (!novel || text === undefined) return null;

    return (
        <ViewNovel
            key={novel.id}
            novel={novel}
            text={text}
            onBack={() => navigate('/read')}
            onRename={handleRename}
        />
    );
};

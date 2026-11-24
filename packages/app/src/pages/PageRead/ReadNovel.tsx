import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { fetchApi } from '@hero-pages/account/client';
import type { NovelDetail } from '@/shared/novel';
import { userRegion } from '@/regions/user';
import { ViewNovel } from './ViewNovel';

export const ReadNovel = ({ id }: { id: number }) => {
    const navigate = useNavigate();
    const user = userRegion.useValue();
    const [novel, setNovel] = useState<NovelDetail>();

    useEffect(() => {
        async function load() {
            setNovel(await fetchApi<NovelDetail>({ path: `/api/novels/${id}`, method: 'GET' }));
        }
        if (user) load();
    }, [id, user]);

    const handleRename = async (name: string) => {
        await fetchApi({ path: `/api/novels/${id}`, method: 'PATCH', body: { name } });
        setNovel(prev => prev && { ...prev, name });
    };

    if (!novel) return null;

    return (
        <ViewNovel
            key={novel.id}
            novel={novel}
            onBack={() => navigate('/read')}
            onRename={handleRename}
        />
    );
};

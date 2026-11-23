import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { fetchApi } from '@hero-pages/account/client';
import { PageAchievement } from '@/pages/PageAchievement';
import { PageAchievementForm } from '@/pages/PageAchievementForm';

export function PageNamed(props: { isAdmin: boolean }) {
    const { name = '' } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [id, setId] = useState<number | null>(null);

    useEffect(() => {
        async function load() {
            const achievement = await fetchApi<{ id: number }>({
                path: `/api/achievements/by-name/${encodeURIComponent(name)}`,
                method: 'GET',
            });
            setId(achievement.id);
        }
        load();
    }, [name]);

    if (id === null) return null;

    if (searchParams.get('action') === 'edit') {
        return <PageAchievementForm id={id} onSaved={title => navigate(`/achievement/${encodeURIComponent(title)}`)} />;
    }

    return (
        <PageAchievement
            id={id}
            isAdmin={props.isAdmin}
            onEdit={() => navigate('?action=edit')}
            onDeleted={() => navigate('/achievement')}
            onMerged={title => navigate(`/achievement/${encodeURIComponent(title)}`)}
        />
    );
}

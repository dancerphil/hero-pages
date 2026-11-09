import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { PageAchievement } from '@/pages/PageAchievement';
import { PageAchievementForm } from '@/pages/PageAchievementForm';
import { fetchApi } from '@/api';

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
        return <PageAchievementForm id={id} onSaved={title => navigate(`/${encodeURIComponent(title)}`)} />;
    }

    return (
        <PageAchievement
            id={id}
            isAdmin={props.isAdmin}
            onEdit={() => navigate('?action=edit')}
            onDeleted={() => navigate('/')}
            onMerged={title => navigate(`/${encodeURIComponent(title)}`)}
        />
    );
}

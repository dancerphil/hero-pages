import { useEffect, useState } from 'react';
import { Avatar, Button, FileButton, Group, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useParams } from 'react-router';
import type { UserRow } from '@hero-pages/account/client';
import { fetchApi } from '@hero-pages/account/client';
import type { UserPage } from '@/shared/user';
import { avatarSrc } from '@/utils/avatar';
import { loadUser } from '@/regions/user';
import { SectionProfile } from './SectionProfile';

export function PageUser(props: { user: UserRow }) {
    const { uid = '' } = useParams();
    const [page, setPage] = useState<UserPage | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const isSelf = props.user.uid === uid;

    useEffect(() => {
        async function load() {
            setPage(await fetchApi<UserPage>({ path: `/api/users/${uid}`, method: 'GET' }));
        }
        load();
    }, [uid, reloadKey]);

    if (!page) return null;

    async function uploadAvatar(file: File | null) {
        if (!file) return;
        const body = new FormData();
        body.append('avatar', file);
        try {
            await fetchApi({ path: '/api/users/me/avatar', method: 'PUT', body });
            await loadUser();
            setReloadKey(key => key + 1);
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
    }

    return (
        <Stack>
            <Group>
                <Avatar src={avatarSrc({ uid: page.uid, avatarUpdatedAt: page.avatarUpdatedAt })} size={64} />
                <div>
                    <Title order={3}>{page.username}</Title>
                    <Text size="sm" c="dimmed">ID：{page.uid}</Text>
                </div>
            </Group>
            {isSelf && (
                <>
                    <FileButton onChange={uploadAvatar} accept="image/png,image/jpeg,image/webp">
                        {buttonProps => <Button {...buttonProps} variant="light">上传头像</Button>}
                    </FileButton>
                    <SectionProfile user={props.user} onSaved={() => setReloadKey(key => key + 1)} />
                </>
            )}
        </Stack>
    );
}

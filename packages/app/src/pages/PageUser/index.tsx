import { useEffect, useState } from 'react';
import { Avatar, Button, FileButton, Group, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useParams } from 'react-router';
import { apiGetUser, apiPutUserAvatar } from '@/api/user';
import type { UserPage, UserRow } from '@/shared/user';
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
            setPage(await apiGetUser({ uid }));
        }
        load();
    }, [uid, reloadKey]);

    if (!page) return null;

    async function uploadAvatar(file: File | null) {
        if (!file) return;
        const body = new FormData();
        body.append('avatar', file);
        try {
            await apiPutUserAvatar(body);
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

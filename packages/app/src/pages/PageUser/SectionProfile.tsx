import { useState } from 'react';
import { Button, Group, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import type { UserRow } from '@hero-pages/account/client';
import { fetchApi } from '@hero-pages/account/client';
import { userRegion } from '@/regions/user';

export function SectionProfile(props: { user: UserRow; onSaved: () => void }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState(props.user.username);
    const [newUid, setNewUid] = useState(props.user.uid);

    async function saveUsername() {
        userRegion.set(await fetchApi<UserRow>({ path: '/api/auth/me', method: 'PATCH', body: { username } }));
        props.onSaved();
    }

    async function saveUid() {
        try {
            const user = await fetchApi<UserRow>({ path: '/api/auth/me/uid', method: 'PATCH', body: { uid: newUid } });
            userRegion.set(user);
            navigate(`/user/${user.uid}`);
        }
        catch (error) {
            notifications.show({ color: 'red', message: (error as Error).message });
        }
    }

    return (
        <>
            <Group align="flex-end">
                <TextInput label="用户名" value={username} onChange={event => setUsername(event.currentTarget.value)} />
                <Button variant="light" onClick={saveUsername}>修改用户名</Button>
            </Group>
            <Group align="flex-end">
                <TextInput label="用户 ID" value={newUid} onChange={event => setNewUid(event.currentTarget.value)} />
                <Button variant="light" onClick={saveUid}>修改 ID</Button>
            </Group>
        </>
    );
}

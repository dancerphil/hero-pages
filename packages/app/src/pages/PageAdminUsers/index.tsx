import { useEffect, useState } from 'react';
import { Select, Stack, Table, TextInput } from '@mantine/core';
import { apiGetAdminUsers, apiPatchAdminUser } from '@/api/admin';
import type { AdminUserRow, UserRole } from '@/shared/user';
import { userRegion } from '@/regions/user';

const ROLE_OPTIONS = [
    { value: 'admin', label: '管理员' },
    { value: 'vip', label: 'VIP' },
    { value: 'user', label: '普通用户' },
];

export const PageAdminUsers = () => {
    const user = userRegion.useValue();
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        async function load() {
            setUsers(await apiGetAdminUsers());
        }
        load();
    }, []);

    const changeRole = async (target: AdminUserRow, role: UserRole) => {
        const updated = await apiPatchAdminUser({ id: target.id, role });
        setUsers(prev => prev.map(item => (item.id === updated.id ? updated : item)));
    };

    const filtered = users.filter(item => [item.uid, item.username, item.email].some(field => field?.includes(keyword)));

    return (
        <Stack py="md">
            <TextInput placeholder="搜索 ID、用户名或邮箱" value={keyword} onChange={e => setKeyword(e.currentTarget.value)} />
            <Table striped withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>用户名</Table.Th>
                        <Table.Th>邮箱</Table.Th>
                        <Table.Th>注册时间</Table.Th>
                        <Table.Th>角色</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {filtered.map(item => (
                        <Table.Tr key={item.id}>
                            <Table.Td>{item.uid}</Table.Td>
                            <Table.Td>{item.username}</Table.Td>
                            <Table.Td>{item.email ?? '—'}</Table.Td>
                            <Table.Td>{item.createdAt}</Table.Td>
                            <Table.Td>
                                <Select
                                    w={120}
                                    size="xs"
                                    data={ROLE_OPTIONS}
                                    value={item.role}
                                    allowDeselect={false}
                                    disabled={item.id === user?.id}
                                    onChange={value => value && changeRole(item, value as UserRole)}
                                />
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Stack>
    );
};

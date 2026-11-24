import { useEffect, useState } from 'react';
import { Stack, Table } from '@mantine/core';
import { fetchApi } from '@hero-pages/account/client';
import type { AdminNovelRow } from '@/shared/novel';

export const PageAdminNovels = () => {
    const [novels, setNovels] = useState<AdminNovelRow[]>([]);

    useEffect(() => {
        async function load() {
            setNovels(await fetchApi<AdminNovelRow[]>({ path: '/api/admin/novels', method: 'GET' }));
        }
        load();
    }, []);

    return (
        <Stack py="md">
            <Table striped withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>所属用户</Table.Th>
                        <Table.Th>书名</Table.Th>
                        <Table.Th>阅读进度</Table.Th>
                        <Table.Th>上传时间</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {novels.map(novel => (
                        <Table.Tr key={novel.uuid}>
                            <Table.Td>{novel.username}（{novel.uid}）</Table.Td>
                            <Table.Td>{novel.name}</Table.Td>
                            <Table.Td>第 {novel.paragraph} 段</Table.Td>
                            <Table.Td>{novel.createdAt}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Stack>
    );
};

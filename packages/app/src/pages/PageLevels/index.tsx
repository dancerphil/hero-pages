import { useEffect, useState } from 'react';
import { Button, Card, Group, Image, SimpleGrid, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router';
import { apiDeleteLevel, apiGetLevels } from '@/api/level';
import type { LevelRow } from '@/shared/level';

export function PageLevels() {
    const navigate = useNavigate();
    const [levels, setLevels] = useState<LevelRow[]>([]);

    useEffect(() => {
        async function load() {
            setLevels(await apiGetLevels());
        }
        load();
    }, []);

    async function remove(id: number) {
        if (!window.confirm('确定删除这个关卡？')) return;
        await apiDeleteLevel({ id });
        setLevels(levels.filter(level => level.id !== id));
    }

    if (levels.length === 0) {
        return (
            <Stack align="center" py="xl">
                <Text c="dimmed">还没有关卡</Text>
                <Button onClick={() => navigate('/puzzle/new')}>新建关卡</Button>
            </Stack>
        );
    }

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {levels.map(level => (
                <Card key={level.id} withBorder>
                    <Card.Section>
                        <Image src={`/api/levels/${level.id}/image`} h={160} fit="cover" />
                    </Card.Section>
                    <Stack gap="xs" mt="sm">
                        <Text fw={500}>{level.name}</Text>
                        <Text size="sm" c="dimmed">{level.cols} × {level.rows}</Text>
                        <Group grow>
                            <Button size="xs" onClick={() => navigate(`/puzzle/play/${level.id}`)}>开始</Button>
                            <Button size="xs" variant="light" color="red" onClick={() => remove(level.id)}>删除</Button>
                        </Group>
                    </Stack>
                </Card>
            ))}
        </SimpleGrid>
    );
}

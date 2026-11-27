import { useEffect, useState } from 'react';
import { Button, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useParams } from 'react-router';
import { apiGetLevel } from '@/api/level';
import type { LevelRow } from '@/shared/level';
import { CanvasPuzzle } from '@/components/Canvas/CanvasPuzzle';

export function PagePlay() {
    const { id } = useParams();
    const [level, setLevel] = useState<LevelRow | null>(null);
    const [round, setRound] = useState(0);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        async function load() {
            setLevel(await apiGetLevel({ id }));
        }
        load();
    }, [id]);

    if (!level) return <Loader m="xl" />;

    function restart() {
        setCompleted(false);
        setRound(round + 1);
    }

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={4}>{level.name}</Title>
                <Text size="sm" c="dimmed">{level.cols} × {level.rows}</Text>
            </Group>
            <CanvasPuzzle
                key={round}
                src={`/api/levels/${level.id}/image`}
                cols={level.cols}
                rows={level.rows}
                onComplete={() => setCompleted(true)}
            />
            {completed && (
                <Group justify="center">
                    <Text fw={500}>完成！</Text>
                    <Button onClick={restart}>再来一局</Button>
                </Group>
            )}
        </Stack>
    );
}

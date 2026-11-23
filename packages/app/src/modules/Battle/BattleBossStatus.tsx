import { Group, Text } from '@mantine/core';
import { emptyHealthBackground, enemyRed, playerBlue } from '@/constants/gameColors';

export const BattleBossStatus = (props: {
    bossName: string;
    bossHealth: number;
    hp: [number, number];
    playerWins: number;
    bossWins: number;
    skillLabel: string | null;
    skillDescription: string;
    specialStatusText: string | null;
}) => {
    const { bossName, bossHealth, hp, playerWins, bossWins, skillLabel, skillDescription, specialStatusText } = props;

    return (
        <>
            <div style={{ height: 20, display: 'flex', alignItems: 'center' }}>
                {(playerWins > 0 || bossWins > 0) && (
                    <Text size="sm" c="dimmed">你的胜场 {playerWins} · Boss 胜场 {bossWins}</Text>
                )}
            </div>
            <Group gap="xl">
                <Group gap={4}>
                    <Text size="sm" fw={700}>我</Text>
                    {Array.from({ length: 2 }, (_, index) => (
                        <div key={index} style={{ width: 12, height: 12, borderRadius: 2, background: index < hp[0] ? playerBlue : emptyHealthBackground }} />
                    ))}
                    <Text size="sm">{hp[0]}/2</Text>
                </Group>
                <Group gap={4}>
                    <Text size="sm" fw={700} c="red">Boss {bossName}</Text>
                    {Array.from({ length: bossHealth }, (_, index) => (
                        <div key={index} style={{ width: 12, height: 12, borderRadius: 2, background: index < hp[1] ? enemyRed : emptyHealthBackground }} />
                    ))}
                    <Text size="sm">{hp[1]}/{bossHealth}</Text>
                </Group>
            </Group>
            <div style={{ height: 72, maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                {skillLabel && (
                    <Text size="sm" c="red" ta="center">
                        Boss 下一技能：{skillLabel}（{skillDescription}）
                    </Text>
                )}
                {specialStatusText && <Text size="xs" c="orange" ta="center">{specialStatusText}</Text>}
            </div>
        </>
    );
};

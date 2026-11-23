import { Badge, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import type { StanceName } from '@hero-pages/games-core';
import { cardBackground, cardSelectedBackground, neutralBorder, playerBlue } from '@/constants/gameColors';
import { CardStancePreview } from './CardStancePreview';

export const STANCE_LABELS: Record<StanceName, string> = {
    snake: '蛇',
    crane: '鹤',
    leopard: '豹',
    tiger: '虎',
    dragon: '龙',
    turtle: '龟',
    horse: '马',
    charge: '凝',
    dodge: '闪',
    crab: '蟹',
    monkey: '猴',
    ox: '牛',
    dog: '狗',
};

export const STANCE_DESCRIPTIONS: Record<StanceName, string> = {
    snake: '斜向一步，侧向攻击',
    crane: '直向一步，前后攻击',
    leopard: '直向两步，前后攻击',
    tiger: '直向一步，前后攻击点中选一格，命中时横扫三格',
    dragon: '不移动，选择 5×5 外圈中的一格攻击',
    turtle: '不移动，选择 3×3 中的一格攻击',
    horse: '马步走，前后攻击',
    charge: '不移动不攻击，下一招额外造成 1 点伤害',
    dodge: '向任意方向移动一格，本回合免疫伤害',
    crab: '斜向一步，除来路外三个斜向位置选一格攻击',
    monkey: '直向两步，攻击自己的落点',
    ox: '直向一步，选择一格攻击并横扫垂直三格',
    dog: '直向一步，往回斜向选一格攻击',
};

const STANCE_EXTRA_NOTES: Partial<Record<StanceName, string>> = {
    charge: '效果：下一招额外造成 1 点伤害',
    dodge: '效果：本回合免疫伤害',
};

export const getStanceCooldown = (stance: StanceName, discard: StanceName[]): number =>
    stance === discard[1] ? 2 : (stance === discard[0] ? 1 : 0);

export function CardStance(props: {
    stance: StanceName;
    seat?: number;
    selected?: boolean;
    disabled?: boolean;
    cooldown?: number;
    onClick?: () => void;
}) {
    const { stance, seat = 0, selected = false, disabled = false, cooldown = 0, onClick } = props;
    const extraNote = STANCE_EXTRA_NOTES[stance];
    const statusLabel = cooldown > 0 ? `冷却 ${cooldown}` : (selected ? '已选中' : null);

    return (
        <UnstyledButton
            onClick={onClick}
            disabled={disabled}
            style={{ width: '100%', display: 'block', cursor: disabled ? 'not-allowed' : (onClick ? 'pointer' : 'default') }}
        >
            <Stack
                gap={8}
                p={10}
                style={{
                    aspectRatio: '2 / 3',
                    borderRadius: 14,
                    border: `1px solid ${neutralBorder}`,
                    outline: selected ? `2px solid ${playerBlue}` : 'none',
                    background: selected ? cardSelectedBackground : cardBackground,
                    boxShadow: selected ? '0 8px 18px rgba(59, 130, 246, 0.16)' : '0 4px 12px rgba(15, 23, 42, 0.08)',
                    opacity: disabled ? 0.58 : 1,
                    overflow: 'hidden',
                }}
            >
                <Group justify="center" gap={6} wrap="nowrap">
                    <Text fw={800} size="sm">{STANCE_LABELS[stance]}</Text>
                    {statusLabel && (
                        <Badge size="xs" color={cooldown > 0 ? 'gray' : 'blue'} variant={cooldown > 0 ? 'filled' : 'light'}>
                            {statusLabel}
                        </Badge>
                    )}
                </Group>

                <CardStancePreview stance={stance} seat={seat} />

                <Stack gap={4} align="center" style={{ overflow: 'hidden' }}>
                    <Text size="10px" c="dimmed" ta="center" style={{ lineHeight: 1.35 }}>
                        {STANCE_DESCRIPTIONS[stance]}
                    </Text>
                    {extraNote && (
                        <Text size="10px" fw={600} ta="center" c={stance === 'dodge' ? 'cyan.7' : 'blue.7'} style={{ lineHeight: 1.35 }}>
                            {extraNote}
                        </Text>
                    )}
                </Stack>
            </Stack>
        </UnstyledButton>
    );
}

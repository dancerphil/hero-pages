import { Badge } from '@mantine/core';
import type { Tier } from '@/shared/tier';
import { TIER_META } from '@/utils/tier';

export function BadgeCount(props: { tier: Tier; count: number; gain: number }) {
    const meta = TIER_META[props.tier];
    return (
        <Badge
            data-tier={props.tier}
            variant="light"
            color={meta.color}
            size="lg"
            leftSection={<meta.Icon size={14} />}
        >
            {props.gain ? `${props.count}+${props.gain}` : props.count}
        </Badge>
    );
}

import { ThemeIcon } from '@mantine/core';
import type { Tier } from '@/shared/tier';
import { TIER_META } from '@/utils/tier';

export function BadgeTier(props: { tier: Tier }) {
    const meta = TIER_META[props.tier];
    return (
        <ThemeIcon color={meta.color} variant="light" radius="xl" size="lg" aria-label={meta.label}>
            <meta.Icon size={18} />
        </ThemeIcon>
    );
}

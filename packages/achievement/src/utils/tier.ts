import { IconSquareRotated, IconStar, IconTriangle } from '@tabler/icons-react';
import { TIERS, type Tier } from '@/shared/tier';

export const TIER_META: Record<Tier, { label: string; color: string; Icon: typeof IconStar }> = {
    bronze: { label: '青铜', color: 'orange', Icon: IconTriangle },
    silver: { label: '白银', color: 'gray', Icon: IconSquareRotated },
    gold: { label: '黄金', color: 'yellow', Icon: IconStar },
};

export const TIERS_DESC = TIERS.toReversed();

export function sortByTier<T extends { tier: Tier }>(items: T[]) {
    return items.toSorted((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier));
}

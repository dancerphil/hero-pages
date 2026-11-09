export const TIERS = ['bronze', 'silver', 'gold'] as const;

export type Tier = (typeof TIERS)[number];

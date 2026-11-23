import { Badge } from '@mantine/core';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_COLORS = ['#222', '#c00', '#25f', '#0a0'];

export const suitColor = (card: number) => SUIT_COLORS[Math.floor(card / 13)];

export const formatCard = (card: number) => `${SUITS[Math.floor(card / 13)]}${RANKS[card % 13]}`;

export function BadgePoker(props: { card: number; selected?: boolean; recommended?: boolean; onClick?: () => void }) {
    const color = suitColor(props.card);
    const variant = props.selected ? 'filled' : (props.recommended ? 'light' : 'outline');
    return (
        <Badge
            variant={variant}
            size="xl"
            style={{
                cursor: props.onClick ? 'pointer' : 'default',
                color: variant === 'filled' ? '#fff' : color,
                backgroundColor: variant === 'filled' ? color : undefined,
                borderColor: color,
                userSelect: 'none',
                fontSize: 18,
                fontWeight: 600,
                padding: '8px 12px',
            }}
            onClick={props.onClick}
        >
            {formatCard(props.card)}
        </Badge>
    );
}

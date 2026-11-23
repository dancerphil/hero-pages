import { useState } from 'react';
import { Button, SimpleGrid, Stack, Text } from '@mantine/core';
import { ALL_STANCES, type RoomView, type StanceName, type StanceView } from '@hero-pages/games-core';
import { CardStance } from '@/components/Card/CardStance';
import { BoardStanceArena } from './BoardStanceArena';

export interface BoardStanceProps {
    room: RoomView<unknown>;
    view: StanceView;
    onMove: (move: unknown) => void;
}

export function BoardStance({ room, view, onMove }: BoardStanceProps) {
    if (room.yourSeat !== null && view.hands === null) {
        return <DeckStance seat={room.yourSeat} submitted={view.submitted} onMove={onMove} />;
    }
    return <BoardStanceArena room={room} view={view} onMove={onMove} />;
}

function DeckStance(props: { seat: number; submitted: boolean; onMove: (move: unknown) => void }) {
    const [deck, setDeck] = useState<StanceName[]>([]);
    const toggle = (stance: StanceName) => {
        if (deck.includes(stance)) setDeck(deck.filter(item => item !== stance));
        else if (deck.length < 5) setDeck([...deck, stance]);
    };
    return (
        <Stack gap="sm" maw={760} w="100%">
            <Text size="sm">选择 5 张招式组成套牌（已选 {deck.length}/5）</Text>
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
                {ALL_STANCES.map(stance => (
                    <CardStance
                        key={stance}
                        stance={stance}
                        seat={props.seat}
                        selected={deck.includes(stance)}
                        disabled={props.submitted || (!deck.includes(stance) && deck.length >= 5)}
                        onClick={() => { toggle(stance); }}
                    />
                ))}
            </SimpleGrid>
            {props.submitted
                ? <Text c="dimmed" size="sm">已选定套牌，等待对手…</Text>
                : <Button disabled={deck.length !== 5} onClick={() => { props.onMove({ stances: deck }); }}>确认套牌</Button>}
        </Stack>
    );
}

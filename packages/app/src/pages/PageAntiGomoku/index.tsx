import { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { antiGomokuMove, losingLine } from '@hero-pages/games-core/ai/anti-gomoku';
import type { AntiGomokuPlayer } from '@hero-pages/games-core';
import { BoardLine } from '@/components/Board/BoardLine';

const CELLS = 15 * 15;
const emptyBoard = () => Array.from({ length: CELLS }, (): AntiGomokuPlayer | null => null);

export function PageAntiGomoku() {
    const [board, setBoard] = useState(emptyBoard);
    const [lastMove, setLastMove] = useState<number | null>(null);
    const [winner, setWinner] = useState<AntiGomokuPlayer | null>(null);

    const restart = () => {
        setBoard(emptyBoard());
        setLastMove(null);
        setWinner(null);
    };

    const place = (pos: number) => {
        const afterHuman = [...board];
        afterHuman[pos] = 'black';
        setBoard(afterHuman);
        setLastMove(pos);
        if (losingLine({ board: afterHuman, pos, player: 'black' })) {
            setWinner('white');
            return;
        }
        const ai = antiGomokuMove({ board: afterHuman, player: 'white' });
        const afterAi = [...afterHuman];
        afterAi[ai] = 'white';
        setBoard(afterAi);
        setLastMove(ai);
        if (losingLine({ board: afterAi, pos: ai, player: 'white' })) setWinner('black');
    };

    const status = winner === 'black' ? '你赢了（AI 连成五子）'
        : (winner === 'white' ? 'AI 输了（你连成五子）'
                : '轮到你（黑）');

    return (
        <Stack align="center" gap="md" p="md">
            <Text fw={700}>反五子棋</Text>
            <Text size="sm" c="dimmed">{status}</Text>
            <BoardLine board={board} lastMove={lastMove} disabled={winner !== null} onPlace={place} />
            <Button variant="light" onClick={restart}>重新开始</Button>
        </Stack>
    );
}

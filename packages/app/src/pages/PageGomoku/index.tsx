import { useEffect, useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import * as ort from 'onnxruntime-web/wasm';
import { gomokuMove } from '@hero-pages/games-core/ai/gomoku';
import { checkWinAt } from '@hero-pages/games-core/ai/gomoku-board';
import type { GomokuBoard, GomokuEvaluate, GomokuPlayer } from '@hero-pages/games-core/ai/gomoku';
import { BoardLine } from '@/components/Board/BoardLine';

const CELLS = 15 * 15;
const emptyBoard = (): GomokuBoard => Array.from({ length: CELLS }, (): null => null);

const createEvaluate = (session: ort.InferenceSession): GomokuEvaluate => async (cells, player) => {
    const input = new Float32Array(3 * CELLS);
    cells.forEach((cell, pos) => {
        if (cell === null) input[2 * CELLS + pos] = 1;
        else input[(cell === player ? 0 : 1) * CELLS + pos] = 1;
    });
    const output = await session.run({ board: new ort.Tensor('float32', input, [1, 3, 15, 15]) });
    const logits = output['policy'].data as Float32Array;
    const max = Math.max(...logits);
    const exps = Array.from(logits, l => Math.exp(l - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return { value: output['value'].data[0] as number, policy: exps.map(e => e / sum) };
};

export function PageGomoku() {
    const [session, setSession] = useState<ort.InferenceSession>();
    const [board, setBoard] = useState(emptyBoard);
    const [lastMove, setLastMove] = useState<number | null>(null);
    const [winner, setWinner] = useState<GomokuPlayer | null>(null);
    const [thinking, setThinking] = useState(false);

    useEffect(() => {
        const loadSession = async () => {
            setSession(await ort.InferenceSession.create('/gomoku/nn-v6-full.onnx'));
        };
        loadSession();
    }, []);

    const restart = () => {
        setBoard(emptyBoard());
        setLastMove(null);
        setWinner(null);
    };

    const place = async (pos: number) => {
        if (!session) return;
        const afterHuman = [...board];
        afterHuman[pos] = 'black';
        setBoard(afterHuman);
        setLastMove(pos);
        if (checkWinAt({ board: afterHuman, pos, player: 'black' })) {
            setWinner('black');
            return;
        }
        setThinking(true);
        const ai = await gomokuMove({ board: afterHuman, player: 'white', evaluate: createEvaluate(session) });
        const afterAi = [...afterHuman];
        afterAi[ai] = 'white';
        setBoard(afterAi);
        setLastMove(ai);
        if (checkWinAt({ board: afterAi, pos: ai, player: 'white' })) setWinner('white');
        setThinking(false);
    };

    let status: string;
    if (!session) status = '加载模型中…';
    else if (winner === 'black') status = '你赢了';
    else if (winner === 'white') status = 'AI 赢了';
    else if (thinking) status = 'AI 思考中…';
    else status = '轮到你（黑）';

    return (
        <Stack align="center" gap="md" p="md">
            <Text fw={700}>五子棋</Text>
            <Text size="sm" c="dimmed">{status}</Text>
            <BoardLine board={board} lastMove={lastMove} disabled={!session || thinking || winner !== null} onPlace={place} />
            <Button variant="light" onClick={restart}>重新开始</Button>
        </Stack>
    );
}

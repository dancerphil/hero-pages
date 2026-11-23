import { Button, Grid, Stack, Text } from '@mantine/core';
import { getWinLine, type Player, type RoomView, type TicTacToeView } from '@hero-pages/games-core';

const MARKS: Player[] = ['X', 'O'];

interface BoardTicTacToeProps {
    room: RoomView<unknown>;
    view: TicTacToeView;
    onMove: (move: unknown) => void;
}

export function BoardTicTacToe({ room, view, onMove }: BoardTicTacToeProps) {
    const myMark = room.yourSeat === null ? null : MARKS[room.yourSeat];
    const myTurn = room.status === 'playing' && view.currentTurn === myMark;
    const winLine = getWinLine(view.board);
    return (
        <Stack align="center">
            {room.status === 'playing' && (
                <Text>{myTurn ? '轮到你了' : `${room.seats[MARKS.indexOf(view.currentTurn)]} 的回合`}</Text>
            )}
            <Grid style={{ width: 306 }} gap={6}>
                {view.board.map((cell, i) => {
                    const isWinCell = winLine?.includes(i) ?? false;
                    return (
                        <Grid.Col key={i} span={4}>
                            <Button
                                fullWidth
                                h={96}
                                variant={isWinCell ? 'filled' : (cell ? 'light' : 'outline')}
                                color={cell === 'X' ? 'blue' : (cell === 'O' ? 'red' : 'gray')}
                                onClick={() => { onMove(i); }}
                                disabled={cell !== null || !myTurn}
                                style={{ fontSize: 40, fontWeight: 700 }}
                            >
                                {cell}
                            </Button>
                        </Grid.Col>
                    );
                })}
            </Grid>
        </Stack>
    );
}

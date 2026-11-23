import { Text } from '@mantine/core';
import type { ESView, MineTexasView, NineView, RoomView, StanceView, TicTacToeView } from '@hero-pages/games-core';
import { BoardEmperorSlave } from './BoardEmperorSlave';
import { BoardMineTexas } from './BoardMineTexas';
import { BoardNine } from './BoardNine';
import { BoardStance } from './BoardStance';
import { BoardTicTacToe } from './BoardTicTacToe';

interface GameBoardProps {
    room: RoomView<unknown>;
    onMove: (move: unknown) => void;
}

export function GameBoard({ room, onMove }: GameBoardProps) {
    if (room.view === null) return null;
    switch (room.game) {
        case 'tic-tac-toe': {
            return <BoardTicTacToe room={room} view={room.view as TicTacToeView} onMove={onMove} />;
        }
        case 'nine': {
            return <BoardNine room={room} view={room.view as NineView} onMove={onMove} />;
        }
        case 'emperor-slave': {
            return <BoardEmperorSlave room={room} view={room.view as ESView} onMove={onMove} />;
        }
        case 'mine-texas': {
            return <BoardMineTexas key={(room.view as MineTexasView).round} room={room} view={room.view as MineTexasView} onMove={onMove} />;
        }
        case 'stance': {
            return <BoardStance key={(room.view as StanceView).turn} room={room} view={room.view as StanceView} onMove={onMove} />;
        }
        default: {
            return <Text c="red">未知游戏</Text>;
        }
    }
}

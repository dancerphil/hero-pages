import type { GameType } from '@hero-pages/games-core';

export const GAMES: { game: GameType; label: string }[] = [
    { game: 'tic-tac-toe', label: '井字棋' },
    { game: 'nine', label: '九张牌' },
    { game: 'emperor-slave', label: '国王与奴隶' },
    { game: 'mine-texas', label: '地雷德扑' },
    { game: 'stance', label: '招式对战' },
];

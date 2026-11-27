import type { GameType } from '@hero-pages/games-core';
import { createInterface } from './createInterface';

export const apiPostGameRoom = createInterface<{ game: GameType; ai: boolean }, { id: string }>('POST', '/api/games/rooms');

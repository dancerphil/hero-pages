import type { LevelRow } from '@/shared/level';
import { createInterface } from './createInterface';

export const apiGetLevels = createInterface<void, LevelRow[]>('GET', '/api/levels');
export const apiGetLevel = createInterface<{ id: number | string }, LevelRow>('GET', '/api/levels/{id}');
export const apiPostLevel = createInterface<FormData, void>('POST', '/api/levels');
export const apiDeleteLevel = createInterface<{ id: number }, void>('DELETE', '/api/levels/{id}');

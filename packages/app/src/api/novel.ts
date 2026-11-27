import type { NovelRow } from '@/shared/novel';
import { createInterface } from './createInterface';

export const apiGetNovels = createInterface<void, NovelRow[]>('GET', '/api/novels');
export const apiPostNovel = createInterface<NovelRow & { text: string }, void>('POST', '/api/novels');
export const apiGetNovelText = createInterface<{ uuid: string }, { text: string }>('GET', '/api/novels/{uuid}/text');
export const apiPatchNovel = createInterface<NovelRow, void>('PATCH', '/api/novels/{uuid}');

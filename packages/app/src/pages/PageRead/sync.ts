import { fetchApi } from '@hero-pages/account/client';
import type { NovelRow } from '@/shared/novel';
import { getNovel, getNovelRows, putNovel, putNovelRow } from './db';

async function doSync() {
    const remote = await fetchApi<NovelRow[]>({ path: '/api/novels', method: 'GET' });
    const local = await getNovelRows();
    const localByUuid = new Map(local.map(row => [row.uuid, row]));
    const remoteByUuid = new Map(remote.map(row => [row.uuid, row]));

    await Promise.all([
        ...local.map(async (row) => {
            const server = remoteByUuid.get(row.uuid);
            if (!server) {
                const novel = await getNovel(row.uuid);
                if (!novel) throw new Error(`本地小说缺少正文: ${row.uuid}`);
                await fetchApi({ path: '/api/novels', body: { ...row, text: novel.text } });
            }
            else if (row.updatedAt > server.updatedAt) {
                await fetchApi({ path: `/api/novels/${row.uuid}`, method: 'PATCH', body: row });
            }
        }),
        ...remote.map(async (row) => {
            const current = localByUuid.get(row.uuid);
            if (!current) {
                const { text } = await fetchApi<{ text: string }>({ path: `/api/novels/${row.uuid}/text`, method: 'GET' });
                await putNovel(row, text);
            }
            else if (row.updatedAt > current.updatedAt) {
                await putNovelRow(row);
            }
        }),
    ]);
}

const state: { running?: Promise<void> } = {};

async function runSync() {
    try {
        await doSync();
    }
    finally {
        state.running = undefined;
    }
}

export const syncNovels = () => {
    state.running ??= runSync();
    return state.running;
};

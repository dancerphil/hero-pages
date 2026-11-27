import { apiGetNovels, apiGetNovelText, apiPatchNovel, apiPostNovel } from '@/api/novel';
import type { NovelRow } from '@/shared/novel';
import { getNovel, getNovelRows, putNovel, putNovelRow } from './db';

export async function uploadNovel(row: NovelRow) {
    const novel = await getNovel(row.uuid);
    if (!novel) throw new Error(`本地小说缺少正文: ${row.uuid}`);
    await apiPostNovel({ ...row, text: novel.text });
}

export async function downloadNovel(row: NovelRow) {
    const { text } = await apiGetNovelText({ uuid: row.uuid });
    await putNovel(row, text);
}

async function doSync() {
    const remote = await apiGetNovels();
    const local = await getNovelRows();
    const localByUuid = new Map(local.map(row => [row.uuid, row]));
    const remoteByUuid = new Map(remote.map(row => [row.uuid, row]));

    await Promise.all([
        ...local.map(async (row) => {
            const server = remoteByUuid.get(row.uuid);
            if (server && row.updatedAt > server.updatedAt) {
                await apiPatchNovel(row);
            }
        }),
        ...remote.map(async (row) => {
            const current = localByUuid.get(row.uuid);
            if (current && row.updatedAt > current.updatedAt) {
                await putNovelRow(row);
            }
        }),
    ]);
    return remote;
}

const state: { running?: Promise<NovelRow[]> } = {};

async function runSync() {
    try {
        return await doSync();
    }
    finally {
        state.running = undefined;
    }
}

export const syncNovels = () => {
    state.running ??= runSync();
    return state.running;
};

import type { NovelRow } from '@/shared/novel';

const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('read-novels', 1);
    request.addEventListener('upgradeneeded', () => {
        request.result.createObjectStore('novels', { keyPath: 'uuid' });
        request.result.createObjectStore('texts');
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
});

const transaction = async (stores: string[], mode: IDBTransactionMode) => {
    const db = await dbPromise;
    return db.transaction(stores, mode);
};

const toPromise = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
});

const toDone = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
});

export async function getNovelRows() {
    const tx = await transaction(['novels'], 'readonly');
    const rows = await toPromise<NovelRow[]>(tx.objectStore('novels').getAll());
    return rows.toSorted((a, b) => b.updatedAt - a.updatedAt);
}

export async function getNovel(uuid: string) {
    const tx = await transaction(['novels', 'texts'], 'readonly');
    const [row, text] = await Promise.all([
        toPromise<NovelRow | undefined>(tx.objectStore('novels').get(uuid)),
        toPromise<string | undefined>(tx.objectStore('texts').get(uuid)),
    ]);
    return row && text !== undefined ? { row, text } : undefined;
}

export async function putNovel(row: NovelRow, text: string) {
    const tx = await transaction(['novels', 'texts'], 'readwrite');
    tx.objectStore('novels').put(row);
    tx.objectStore('texts').put(text, row.uuid);
    await toDone(tx);
}

export async function putNovelRow(row: NovelRow) {
    const tx = await transaction(['novels'], 'readwrite');
    tx.objectStore('novels').put(row);
    await toDone(tx);
}

export async function updateNovelRow(uuid: string, patch: Partial<Pick<NovelRow, 'name' | 'paragraph'>>) {
    const tx = await transaction(['novels'], 'readwrite');
    const store = tx.objectStore('novels');
    const row = await toPromise<NovelRow>(store.get(uuid));
    store.put({ ...row, ...patch, updatedAt: Date.now() });
    await toDone(tx);
}

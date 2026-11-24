const DB_NAME = 'read';
const STORE = 'text';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

interface TextRow {
    id: number;
    text: string;
    lastAccessAt: number;
}

const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE, { keyPath: 'id' }).createIndex('lastAccessAt', 'lastAccessAt');
    };
    request.onsuccess = () => resolve(request.result);
    request.addEventListener('error', () => reject(request.error));
});

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
    const db = await dbPromise;
    return new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.addEventListener('error', () => reject(request.error));
    });
}

export async function loadNovelText(id: number, fetchText: () => Promise<string>) {
    const cached = await transact<TextRow | undefined>('readonly', store => store.get(id));
    if (cached) {
        await transact('readwrite', store => store.put({ ...cached, lastAccessAt: Date.now() }));
        return cached.text;
    }
    const text = await fetchText();
    await transact('readwrite', store => store.put({ id, text, lastAccessAt: Date.now() }));
    return text;
}

export async function clearStaleNovelText() {
    const db = await dbPromise;
    const request = db.transaction(STORE, 'readwrite')
        .objectStore(STORE)
        .index('lastAccessAt')
        .openCursor(IDBKeyRange.upperBound(Date.now() - MAX_AGE));
    request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
    };
}

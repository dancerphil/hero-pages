const DEVICE_ID_KEY = 'deviceId';

export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

export async function fetchApi<T>(input: {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
}) {
    const response = await fetch(input.path, {
        method: input.method ?? 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
    });
    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data as T;
}

import type { UserRow } from '../types';

const DEVICE_ID_KEY = 'deviceId';

export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

export async function loadUser() {
    const response = await fetch('/api/auth/me');
    if (response.ok) return (await response.json()) as UserRow;
    return fetchApi<UserRow>({ path: '/api/auth/device-login', body: { deviceId: getDeviceId() } });
}

export async function fetchApi<T>(input: {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
}) {
    const isJson = input.body !== undefined && !(input.body instanceof FormData);
    const response = await fetch(input.path, {
        method: input.method ?? 'POST',
        headers: isJson ? { 'Content-Type': 'application/json' } : undefined,
        body: isJson ? JSON.stringify(input.body) : (input.body as FormData | undefined),
    });
    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data as T;
}

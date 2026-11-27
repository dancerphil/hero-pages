import type { UserRow } from '@/shared/user';
import { createInterface } from './createInterface';

const DEVICE_ID_KEY = 'deviceId';

export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

export const apiGetAuthMe = createInterface<void, UserRow>('GET', '/api/auth/me');
export const apiPatchAuthMe = createInterface<{ username: string }, UserRow>('PATCH', '/api/auth/me');
export const apiPatchAuthMeUid = createInterface<{ uid: string }, UserRow>('PATCH', '/api/auth/me/uid');
export const apiPostAuthDeviceLogin = createInterface<{ deviceId: string }, UserRow>('POST', '/api/auth/device-login');
export const apiPostAuthEmailCodes = createInterface<{ email: string; purpose: 'register' | 'reset' }, void>('POST', '/api/auth/email-codes');
export const apiPostAuthRegister = createInterface<{ email: string; code: string; password: string }, UserRow>('POST', '/api/auth/register');
export const apiPostAuthLogin = createInterface<{ email: string; password: string }, UserRow>('POST', '/api/auth/login');
export const apiPostAuthPasswordReset = createInterface<{ email: string; code: string; password: string }, UserRow>('POST', '/api/auth/password-reset');
export const apiPostAuthLogout = createInterface<void, void>('POST', '/api/auth/logout');

export async function fetchUser() {
    try {
        return await apiGetAuthMe();
    }
    catch {
        return apiPostAuthDeviceLogin({ deviceId: getDeviceId() });
    }
}

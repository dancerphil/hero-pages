import { createRegion } from 'region-react';
import { fetchApi, fetchUser, type UserRow } from '@hero-pages/account/client';

export const userRegion = createRegion<UserRow>();

export const loadUser = userRegion.loadBy(fetchUser);

export async function logout() {
    await fetchApi({ path: '/api/auth/logout' });
    await loadUser();
}

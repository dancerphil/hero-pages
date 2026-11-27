import { createRegion } from 'region-react';
import { apiPostAuthLogout, fetchUser } from '@/api/auth';
import type { UserRow } from '@/shared/user';

export const userRegion = createRegion<UserRow>();

export const loadUser = userRegion.loadBy(fetchUser);

export async function logout() {
    await apiPostAuthLogout();
    await loadUser();
}

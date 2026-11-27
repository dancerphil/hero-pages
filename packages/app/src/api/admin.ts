import type { AdminNovelRow } from '@/shared/novel';
import type { AdminUserRow, UserRole } from '@/shared/user';
import { createInterface } from './createInterface';

export const apiGetAdminUsers = createInterface<void, AdminUserRow[]>('GET', '/api/admin/users');
export const apiPatchAdminUser = createInterface<{ id: number; role: UserRole }, AdminUserRow>('PATCH', '/api/admin/users/{id}');
export const apiGetAdminNovels = createInterface<void, AdminNovelRow[]>('GET', '/api/admin/novels');

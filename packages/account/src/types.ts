export type UserRole = 'admin' | 'vip' | 'user';

export interface UserRow {
    id: number;
    uid: string;
    username: string;
    email: string | null;
    role: UserRole;
    avatar_updated_at: string | null;
}

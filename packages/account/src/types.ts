export interface UserRow {
    id: number;
    uid: string;
    username: string;
    email: string | null;
    is_admin: number;
    avatar_updated_at: string | null;
}

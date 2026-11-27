export type UserRole = 'admin' | 'vip' | 'user';

export interface UserRow {
    id: number;
    uid: string;
    username: string;
    email: string | null;
    role: UserRole;
    avatar_updated_at: string | null;
}

import type { MineUnlock } from './achievementModel';
import type { Tier } from './tier';

export interface UserPage {
    uid: string;
    username: string;
    avatarUpdatedAt: string | null;
    unlocks: MineUnlock[];
}

export interface AnswerRecord {
    id: number;
    achievementId: number;
    title: string;
    tier: Tier;
    prompt: string;
    kind: 'free' | 'fill' | 'choice';
    choices: string[] | null;
    answer: string;
    passed: boolean;
    createdAt: string;
}

export interface AdminUserRow {
    id: number;
    uid: string;
    username: string;
    email: string | null;
    role: UserRole;
    createdAt: string;
}

import type { MineUnlock } from './achievementModel';
import type { Tier } from './tier';

export interface UserPage {
    uid: string;
    username: string;
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

import type { Tier } from '@/shared/tier';

export interface QuestionInput {
    tier: Tier;
    prompt: string;
    kind: 'free' | 'fill' | 'choice';
    criteria: string | null;
    options: string[] | null;
}

export interface GeneratedAchievement {
    title: string;
    questions: QuestionInput[];
}

export interface FeedQuestion {
    achievementId: number;
    achievementTitle: string;
    tier: Tier;
    prompt: string;
    kind: QuestionInput['kind'];
    choices: string[] | null;
}

export interface AchievementDetail {
    id: number;
    title: string;
    creator: string;
    aliases: string[];
    questions: { tier: Tier; prompt: string; kind: QuestionInput['kind']; unlocked: boolean; choices: string[] | null }[];
}

export interface MineUnlock {
    questionId: number;
    achievementId: number;
    title: string;
    tier: Tier;
    unlockedAt: string;
    rarity: number;
}

export interface QuestionRow {
    id: number;
    tier: Tier;
    prompt: string;
    criteria: string | null;
    kind: QuestionInput['kind'];
    options: string | null;
}

const MAX_CHOICE_OPTIONS = 8;
const MIN_CHOICE_OPTIONS = 4;

export function titleKey(title: string) {
    return title.normalize('NFKC').replaceAll(/[《》\s]/g, '').toLowerCase();
}

export function parseOptions(options: string | null) {
    return options === null ? null : (JSON.parse(options) as string[]);
}

function shuffle<T>(items: T[]) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const swap = result[i];
        result[i] = result[j];
        result[j] = swap;
    }
    return result;
}

export function pickChoices(options: string[]) {
    const [correct, ...wrong] = options;
    return shuffle([correct, ...shuffle(wrong).slice(0, MIN_CHOICE_OPTIONS - 1)]);
}

export function validateQuestions(questions: QuestionInput[]) {
    if (questions.length === 0) return '至少填写一个档位';
    for (const question of questions) {
        if (question.kind === 'choice') {
            const count = question.options?.length ?? 0;
            if (count < MIN_CHOICE_OPTIONS || count > MAX_CHOICE_OPTIONS) {
                return `选择题需要 ${MIN_CHOICE_OPTIONS}–${MAX_CHOICE_OPTIONS} 个选项`;
            }
        }
        if (question.kind === 'fill' && !question.options?.[0]?.trim()) return '填空题需要填写标准答案';
    }
    return null;
}

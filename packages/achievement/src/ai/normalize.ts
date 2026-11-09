import { TIERS } from '@/shared/tier';
import type { GeneratedAchievement, QuestionInput } from '@/server/achievementModel';

export function normalizeTitles(data: unknown) {
    const list = (data as { titles?: unknown }).titles;
    if (!Array.isArray(list)) throw new Error('AI 返回格式错误');
    const titles = list.filter((title): title is string => typeof title === 'string').map(title => title.trim());
    return [...new Set(titles.filter(Boolean))];
}

export function normalizeAchievements(data: unknown): GeneratedAchievement[] {
    const list = (data as { achievements?: unknown }).achievements;
    if (!Array.isArray(list)) throw new Error('AI 返回格式错误');
    return list.map((item) => {
        const raw = item as { title?: unknown; questions?: unknown };
        const questions = (Array.isArray(raw.questions) ? raw.questions : [])
            .filter(
                question =>
                    question &&
                    typeof question === 'object' &&
                    TIERS.includes((question as QuestionInput).tier) &&
                    typeof (question as QuestionInput).prompt === 'string' &&
                    ['free', 'fill', 'choice'].includes((question as QuestionInput).kind),
            )
            .map((question) => {
                const q = question as QuestionInput;
                return {
                    tier: q.tier,
                    prompt: q.prompt,
                    kind: q.kind,
                    criteria: typeof q.criteria === 'string' ? q.criteria : null,
                    options: Array.isArray(q.options) ? q.options.filter(option => typeof option === 'string') : null,
                } satisfies QuestionInput;
            });
        return { title: typeof raw.title === 'string' ? raw.title : '', questions };
    });
}

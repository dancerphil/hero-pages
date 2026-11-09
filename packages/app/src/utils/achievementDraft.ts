import type { GeneratedAchievement, QuestionInput } from '@/server/achievementModel';
import type { Tier } from '@/shared/tier';

function defaultKind(tier: Tier): QuestionInput['kind'] {
    return tier === 'bronze' ? 'choice' : (tier === 'silver' ? 'fill' : 'free');
}

export function changeKind(kind: QuestionInput['kind'], prev: QuestionInput): Partial<QuestionInput> {
    if (kind === prev.kind) return {};
    if (kind === 'choice') {
        const options = [...(prev.options ?? [])];
        while (options.length < 4) options.push('');
        return { kind, options, criteria: null };
    }
    if (kind === 'fill') return { kind, options: [prev.options?.[0] ?? ''], criteria: prev.criteria ?? null };
    return { kind, options: null, criteria: prev.criteria ?? null };
}

export function emptyQuestion(tier: Tier): QuestionInput {
    const base: QuestionInput = { tier, kind: 'free', prompt: '', options: null, criteria: null };
    return { ...base, ...changeKind(defaultKind(tier), base) };
}

export function normalizeAchievement(draft: GeneratedAchievement): GeneratedAchievement {
    return {
        title: draft.title.trim(),
        questions: draft.questions.map(question => ({
            ...question,
            prompt: question.prompt.trim(),
            criteria: question.criteria?.trim() || null,
            options:
                question.kind === 'choice'
                    ? (question.options ?? []).map(option => option.trim()).filter(Boolean)
                    : (question.kind === 'fill'
                            ? [(question.options?.[0] ?? '').trim()].filter(Boolean)
                            : null),
        })),
    };
}

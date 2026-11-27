import type { AchievementDetail, FeedQuestion, GeneratedAchievement, QuestionInput } from '@/shared/achievementModel';
import type { Tier } from '@/shared/tier';
import { createInterface } from './createInterface';

export const apiGetAchievements = createInterface<void, FeedQuestion[]>('GET', '/api/achievements');
export const apiGetAchievement = createInterface<{ id: number }, AchievementDetail>('GET', '/api/achievements/{id}');
export const apiGetAchievementEdit = createInterface<{ id: number }, GeneratedAchievement>('GET', '/api/achievements/{id}/edit');
export const apiGetAchievementByName = createInterface<{ name: string }, { id: number }>('GET', '/api/achievements/by-name/{name}');
export const apiGetAchievementTitles = createInterface<void, { id: number; title: string }[]>('GET', '/api/achievements/titles');
export const apiPostAchievement = createInterface<GeneratedAchievement, { linked?: boolean }>('POST', '/api/achievements');
export const apiPutAchievement = createInterface<GeneratedAchievement & { id: number }, { linked?: boolean }>('PUT', '/api/achievements/{id}');
export const apiDeleteAchievement = createInterface<{ id: number }, void>('DELETE', '/api/achievements/{id}');
export const apiPostAchievementMerge = createInterface<{ sourceId: number; targetId: number }, void>('POST', '/api/achievements/{sourceId}/merge');
export const apiPostAchievementAnswer = createInterface<{ achievementId: number; tier: Tier; answer: string }, { passed: boolean }>('POST', '/api/achievements/{achievementId}/answer');
export const apiPostAchievementGenerateTitles = createInterface<{ scope: string; count: number; extra: string }, { titles: string[] }>('POST', '/api/achievements/generate-titles');
export const apiPostAchievementGenerateDetails = createInterface<{ scope: string; titles: string[]; extra: string }, { items: GeneratedAchievement[] }>('POST', '/api/achievements/generate-details');
export const apiPostAchievementGenerateQuestion = createInterface<{ scope: string; title: string; tier: Tier; extra: string; exclude: string[] }, { question: QuestionInput }>('POST', '/api/achievements/generate-question');
export const apiPostAchievementBatch = createInterface<{ items: GeneratedAchievement[] }, { results: { linked: boolean }[] }>('POST', '/api/achievements/batch');

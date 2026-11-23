import { Hono } from 'hono';
import { requireUser, type AppEnv } from '@hero-pages/account/server';
import { TIERS } from '@/shared/tier';
import { buildDetailsPrompt, buildQuestionPrompt, buildTitlesPrompt } from '@/ai/prompt';
import { normalizeAchievements, normalizeTitles } from '@/ai/normalize';
import { validateQuestions, type GeneratedAchievement } from '@/shared/achievementModel';
import { chat } from './chat';
import { createAchievement } from './achievementStore';

const MAX_COUNT = 10;

export const generateRoutes = new Hono<AppEnv>()
    .post('/generate-titles', requireUser, async (c) => {
        const { scope, count, extra } = await c.req.json<{ scope: string; count?: number; extra?: string }>();
        if (!scope?.trim()) return c.json({ error: '请填写范围' }, 400);
        const data = await chat(c, {
            system: buildTitlesPrompt(),
            user: `范围：${scope.trim()}\n名称数量：${Math.min(Math.max(count ?? 5, 1), MAX_COUNT)} 个\n补充要求：${extra?.trim() || '无'}`,
        });
        return c.json({ titles: normalizeTitles(data) });
    })
    .post('/generate-details', requireUser, async (c) => {
        const { scope, titles, extra } = await c.req.json<{ scope: string; titles: string[]; extra?: string }>();
        if (!Array.isArray(titles) || titles.length === 0 || titles.length > MAX_COUNT) {
            return c.json({ error: `一次最多生成 ${MAX_COUNT} 个成就的细节` }, 400);
        }
        const data = await chat(c, {
            system: buildDetailsPrompt(),
            user: `范围：${scope.trim()}\n成就名称：\n${titles.map(title => `- ${title}`).join('\n')}\n补充要求：${extra?.trim() || '无'}`,
        });
        return c.json({ items: normalizeAchievements(data) });
    })
    .post('/generate-question', requireUser, async (c) => {
        const { scope, title, tier, extra, exclude } = await c.req.json<{
            scope: string;
            title: string;
            tier: string;
            extra?: string;
            exclude?: string[];
        }>();
        if (!title?.trim() || !TIERS.includes(tier as never)) return c.json({ error: '参数错误' }, 400);
        const data = await chat(c, {
            system: buildQuestionPrompt(tier),
            user: `范围：${scope?.trim() || '无'}\n成就名称：${title.trim()}\n档位：${tier}\n补充要求：${extra?.trim() || '无'}\n已有问题（请换一个不同的）：\n${(exclude ?? []).map(prompt => `- ${prompt}`).join('\n') || '无'}`,
        });
        const raw = data as { prompt?: unknown; kind?: unknown; criteria?: unknown; options?: unknown };
        const kind = tier === 'bronze' ? 'choice' : (tier === 'silver' ? 'fill' : 'free');
        const normalized = normalizeAchievements({ achievements: [{ title, questions: [{ ...raw, tier, kind }] }] })[0]?.questions[0];
        if (!normalized) return c.json({ error: 'AI 返回格式错误' }, 500);
        return c.json({ question: normalized });
    })
    .post('/batch', requireUser, async (c) => {
        const { items } = await c.req.json<{ items: GeneratedAchievement[] }>();
        if (!Array.isArray(items) || items.length === 0 || items.length > MAX_COUNT) {
            return c.json({ error: `一次最多保存 ${MAX_COUNT} 个` }, 400);
        }
        for (const item of items) {
            if (!item.title?.trim()) return c.json({ error: '成就名称不能为空' }, 400);
            const error = validateQuestions(item.questions);
            if (error) return c.json({ error: `${item.title}：${error}` }, 400);
        }
        const results = [];
        for (const item of items) {
            results.push(
                await createAchievement(c.env.DB, {
                    title: item.title.trim(),
                    creatorId: c.get('user').id,
                    questions: item.questions,
                }),
            );
        }
        return c.json({ results });
    });

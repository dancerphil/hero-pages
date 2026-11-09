import { Hono } from 'hono';
import type { Tier } from '@/shared/tier';
import { judgeAnswer, PASS_CONFIDENCE } from '@/ai/jev';
import { parseOptions, type QuestionRow } from './achievementModel';
import { requireUser, type AppEnv } from '@hero-pages/account/server';

export const answerRoutes = new Hono<AppEnv>()
    .post('/:id/answer', requireUser, async (c) => {
        const id = Number(c.req.param('id'));
        const { tier, answer } = await c.req.json<{ tier: Tier; answer: string }>();
        const question = await c.env.DB.prepare(
            'SELECT id, prompt, criteria, kind, options FROM question WHERE achievement_id = ? AND tier = ?',
        )
            .bind(id, tier)
            .first<QuestionRow>();
        if (!question) return c.json({ error: '档位不存在' }, 404);
        const options = parseOptions(question.options);
        if (question.kind === 'choice' && !options) throw new Error('选择题缺少选项');
        const passed =
            question.kind === 'choice'
                ? answer === options?.[0]
                : (await judgeAnswer(c, {
                        prompt: question.prompt,
                        criteria: question.criteria,
                        answer,
                        reference: question.kind === 'fill' ? options?.[0] ?? null : null,
                    })) >= PASS_CONFIDENCE;
        await c.env.DB.prepare('INSERT INTO user_answer (user_id, question_id, answer, passed) VALUES (?, ?, ?, ?)')
            .bind(c.get('user').id, question.id, answer, passed ? 1 : 0)
            .run();
        if (passed) {
            await c.env.DB.prepare('INSERT OR IGNORE INTO user_achievement (user_id, question_id) VALUES (?, ?)')
                .bind(c.get('user').id, question.id)
                .run();
        }
        return c.json({ passed });
    });

import { titleKey, type QuestionInput } from '@/shared/achievementModel';

function questionValues(achievementId: number, question: QuestionInput) {
    return [
        achievementId,
        question.tier,
        question.prompt,
        question.criteria,
        question.kind,
        question.options && JSON.stringify(question.options),
    ] as const;
}

export function upsertQuestion({ db, achievementId, question }: { db: D1Database; achievementId: number; question: QuestionInput }) {
    return db
        .prepare(
            `INSERT INTO question (achievement_id, tier, prompt, criteria, kind, options) VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT (achievement_id, tier) DO UPDATE SET
               prompt = excluded.prompt, criteria = excluded.criteria, kind = excluded.kind, options = excluded.options`,
        )
        .bind(...questionValues(achievementId, question));
}

function insertMissingQuestion({ db, achievementId, question }: { db: D1Database; achievementId: number; question: QuestionInput }) {
    return db
        .prepare(
            `INSERT OR IGNORE INTO question (achievement_id, tier, prompt, criteria, kind, options) VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(...questionValues(achievementId, question));
}

export async function findByTitle(db: D1Database, title: string) {
    return db
        .prepare('SELECT achievement_id AS id FROM achievement_alias WHERE name_key = ?')
        .bind(titleKey(title))
        .first<{ id: number }>();
}

export async function createAchievement(
    db: D1Database,
    input: { title: string; creatorId: number; questions: QuestionInput[] },
) {
    const existing = await findByTitle(db, input.title);
    if (existing) {
        await db.batch(input.questions.map(question => insertMissingQuestion({ db, achievementId: existing.id, question })));
        return { id: existing.id, linked: true };
    }
    const achievement = await db
        .prepare('INSERT INTO achievement (title, creator_id) VALUES (?, ?) RETURNING id')
        .bind(input.title, input.creatorId)
        .first<{ id: number }>();
    if (!achievement) throw new Error('成就创建失败');
    await db.batch([
        db
            .prepare('INSERT INTO achievement_alias (name_key, name, achievement_id) VALUES (?, ?, ?)')
            .bind(titleKey(input.title), input.title, achievement.id),
        ...input.questions.map(question => upsertQuestion({ db, achievementId: achievement.id, question })),
    ]);
    return { id: achievement.id, linked: false };
}

export async function mergeAchievement(db: D1Database, input: { sourceId: number; targetId: number }) {
    await db.batch([
        db
            .prepare(
                `INSERT OR IGNORE INTO user_achievement (user_id, question_id, unlocked_at)
                 SELECT ua.user_id, tq.id, ua.unlocked_at
                 FROM user_achievement ua
                 JOIN question sq ON sq.id = ua.question_id
                 JOIN question tq ON tq.achievement_id = ? AND tq.tier = sq.tier
                 WHERE sq.achievement_id = ?`,
            )
            .bind(input.targetId, input.sourceId),
        db
            .prepare(
                `DELETE FROM question WHERE achievement_id = ? AND tier IN (SELECT tier FROM question WHERE achievement_id = ?)`,
            )
            .bind(input.sourceId, input.targetId),
        db.prepare('UPDATE question SET achievement_id = ? WHERE achievement_id = ?').bind(input.targetId, input.sourceId),
        db.prepare('UPDATE achievement_alias SET achievement_id = ? WHERE achievement_id = ?').bind(input.targetId, input.sourceId),
        db.prepare('DELETE FROM achievement WHERE id = ?').bind(input.sourceId),
    ]);
}

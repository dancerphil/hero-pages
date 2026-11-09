const CONCEPT_RULE = `每个成就是一个具体的概念点，例如一部作品、一个角色、一个物品或能力、一个具体事件。成就名称必须是这个概念本身，不能是系列或分类。
例如范围为"海贼王"时，合适的成就是"《海贼王》""路飞""橡胶果实""白胡子海贼团"；不合适的是"经典台词与名梗""人物设定""剧情"这类分类。
同一范围内的成就互不重复。全部使用中文。`;

export function buildTitlesPrompt() {
    return `你是成就问答的策划。只输出 JSON 对象，格式为 {"titles": ["名称1", "名称2"]}，不要输出其他内容。
${CONCEPT_RULE}
这一步只输出名称，不要输出题目。`;
}

export function buildDetailsPrompt() {
    return `你是成就问答的出题人。只输出 JSON 对象，格式为 {"achievements": [{"title": "...", "questions": [...]}]}，不要输出其他内容。
achievements 中的 title 必须与用户给出的名称一一对应，不要增减或改写。
三个档位对应三种题型与认知深度，题型与档位严格绑定：
- bronze 青铜是选择题（kind 必须为 choice）：考查了解，知道基本事实即可回答，如是什么、是谁、在哪里；
- silver 白银是填空题（kind 必须为 fill）：考查掌握，能说出具体情节、关系、设定等细节，有相对标准的答案（一句话以内可答完）；
- gold 黄金是简答题（kind 必须为 free）：考查精通，需要主观作答，回答冷门细节、背景或深入研究才知道的内容，由 AI 判断。
三档问题都围绕该概念本身。
每个 questions 为 1–3 题，每题包含 tier（bronze、silver 或 gold）、prompt（中文问题）、kind（必须与 tier 对应：bronze=choice、silver=fill、gold=free）、criteria、options：
- choice：options 为选项数组，4–8 个，第一个必须是正确答案，其余是干扰项；criteria 为 null；
- fill：options 为单元素数组，只放标准答案；criteria 可为 null，或补充别名与容错说明；
- free：options 为 null；criteria 可为 null，为空时由 AI 自行判断，填写则作为判断标准。全部使用中文。`;
}

export function buildQuestionPrompt(tier: string) {
    const rule =
        tier === 'bronze'
            ? 'bronze 青铜是选择题（kind 必须为 choice）：考查了解，如是什么、是谁、在哪里；options 为 4-8 个选项数组，第一个必须是正确答案，其余是干扰项；criteria 为 null'
            : (tier === 'silver'
                    ? 'silver 白银是填空题（kind 必须为 fill）：考查掌握，能说出具体情节、关系、设定等细节，有相对标准的答案（一句话以内可答完）；options 为单元素数组，只放标准答案；criteria 可为 null，或补充别名与说明'
                    : 'gold 黄金是简答题（kind 必须为 free）：考查精通，需要主观作答，回答冷门细节、背景或深入研究才知道的内容；options 为 null；criteria 可为 null，为空时由 AI 自行判断');
    return `你是成就问答的出题人。只输出 JSON 对象，格式为 {"tier": "...", "prompt": "...", "kind": "...", "criteria": ..., "options": ...}，不要输出其他内容。
问题围绕用户给出的概念本身，全部使用中文。
档位与题型严格绑定：${rule}。`;
}

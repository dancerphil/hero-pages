export const PASS_CONFIDENCE = 0.7;

export async function judgeAnswer(
    c: { env: Env },
    input: { prompt: string; criteria: string | null; answer: string; reference: string | null },
) {
    const instructions = input.reference
        ? `这是一道填空题，标准答案是「${input.reference}」。用户回答与标准答案意思一致即可算对，允许同义表达、别名、大小写与空格差异。问题是「${input.prompt}」。${input.criteria ?? ''}`
        : `以下是对问题「${input.prompt}」的回答，判断它是否正确。${input.criteria ?? ''}`;
    const response = await fetch('https://openrouter.ai/api/v1/systemone', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${c.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            state: input.answer,
            model: '~typesafe/jev-latest',
            questions: {
                answer: {
                    type: 'noul',
                    instructions,
                },
            },
        }),
    });
    if (!response.ok) throw new Error(`判题失败：${await response.text()}`);
    const data = (await response.json()) as { answers: { answer: { noul: number } } };
    return data.answers.answer.noul;
}

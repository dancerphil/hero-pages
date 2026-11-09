const GENERATE_MODEL = 'deepseek/deepseek-v4.1-flash';

function stripFences(text: string) {
    return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export async function chat(c: { env: Env }, input: { system: string; user: string }) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${c.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://achievement.dancerphil.com',
            'X-Title': '成就',
        },
        body: JSON.stringify({
            model: GENERATE_MODEL,
            messages: [
                { role: 'system', content: input.system },
                { role: 'user', content: input.user },
            ],
            response_format: { type: 'json_object' },
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`生成失败：${text.slice(0, 200)}`);
    }
    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message.content;
    if (!content) throw new Error('AI 返回为空');
    return JSON.parse(stripFences(content)) as unknown;
}

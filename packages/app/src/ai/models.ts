import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseekProvider = createDeepSeek({
    baseURL: '/api/ai/deepseek',
    apiKey: '',
});

export const deepseek = deepseekProvider('deepseek-chat');

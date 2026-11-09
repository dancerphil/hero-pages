import { reactConfigs } from '@hero-u/eslint-config/react.js';
import { unicornConfigs } from '@hero-u/eslint-config/unicorn.js';

export default [
    ...reactConfigs,
    ...unicornConfigs,
    {
        ignores: ['**/dist/**', '**/worker-configuration.d.ts'],
    },
    {
        rules: {
            'unicorn/prefer-https': 'off',
        },
    },
    {
        files: ['packages/achievement/src/server/**'],
        rules: {
            'unicorn/no-top-level-side-effects': 'off',
        },
    },
    {
        // Cloudflare Worker 入口必须使用 default export
        files: ['packages/achievement/src/server/index.ts'],
        rules: {
            'import-x/no-default-export': 'off',
        },
    },
];

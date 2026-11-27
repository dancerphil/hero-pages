import { createFactory } from '@hero-u/fetch';

export const { createInterface } = createFactory({
    encodePathVariable: true,
    async onResolve(response) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },
});

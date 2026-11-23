const articles = import.meta.glob<string>('./articles/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
});

const assets = import.meta.glob<string>('./assets/*.svg', {
    query: '?url',
    import: 'default',
    eager: true,
});

const assetUrls = Object.fromEntries(
    Object.entries(assets).map(([path, url]) => [path.split('/').pop(), url]),
);

export const contents = Object.keys(articles)
    .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(path => articles[path].replaceAll(/\.\.\/assets\/([\w-]+\.svg)/g, (_, name: string) => assetUrls[name]));

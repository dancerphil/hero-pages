const articles = import.meta.glob<string>('./articles/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
});

const assets = import.meta.glob<string>('./articles/assets/*.svg', {
    query: '?url',
    import: 'default',
    eager: true,
});

const assetUrls = Object.fromEntries(
    Object.entries(assets).map(([path, url]) => [path.split('/').pop(), url]),
);

const loadArticle = (slug: string) => Object.keys(articles)
    .filter(path => path.startsWith(`./articles/${slug}/`))
    .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(path => articles[path].replaceAll(/\.\.\/assets\/([\w-]+\.svg)/g, (_, name: string) => assetUrls[name]));

export const mathArticles = [
    { slug: 'category', title: '范畴论', contents: loadArticle('category') },
    { slug: 'euler', title: '欧拉乘积公式', contents: loadArticle('euler') },
];

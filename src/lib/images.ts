// Must match IMG_PREFIX in scripts/scrape.mjs
const IMG_PREFIX = "https://cz0appsearchengine0prod.blob.core.windows.net/prod/media/cache/";
export const img = (u: string) => (/^https?:\/\//.test(u) ? u : IMG_PREFIX + u);

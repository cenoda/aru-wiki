// Writes dist/sitemap.xml for search engines: the front page and one short address
// (`/wiki/<name>`, src/route.ts) per article page. Run by `npm run build` (postbuild), after
// prebuild made data/runtime/. Addresses carry no `?v=`: without it the site shows the latest
// version, where every page is revealed. public/robots.txt points crawlers here.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

const SITE = 'https://aru.wiki';
const root = new URL('../../', import.meta.url);
const read = async (f) => JSON.parse(await readFile(new URL(`data/runtime/${f}`, root), 'utf8'));

const theme = await read('theme-khaenriah.json');
// pages outside the theme that also have an article (written only once the whole-wiki pass exists)
const others = existsSync(new URL('data/runtime/pages.json', root)) ? await read('pages.json') : [];
// the same name and encoding as articleUrl() in src/route.ts: Korean name, else the page id
const path = (n) => `/wiki/${encodeURIComponent((n.ko ?? n.id).replace(/ /g, '_')).replace(/%2F/gi, '/')}`;
const seen = new Set();
const urls = [`${SITE}/`];
for (const n of [...theme.nodes, ...others]) {
  const u = SITE + path(n);
  if (!seen.has(u)) { seen.add(u); urls.push(u); }
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n')}
</urlset>
`;
await writeFile(new URL('dist/sitemap.xml', root), xml);
console.log(`dist/sitemap.xml ${urls.length} URLs`);

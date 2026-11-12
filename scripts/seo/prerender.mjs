// Search-engine pages, run by `npm run build` (postbuild) after vite wrote dist/index.html:
//   dist/wiki/<name>.html  one per article page: the built index.html with the page's own title,
//                          description, canonical address and the article text (latest version)
//                          inside #root, so crawlers read it without running the app. The app's
//                          createRoot replaces it on load. The server answers /wiki/<name> with this
//                          file and falls back to index.html (Caddy `try_files {path}.html /index.html`).
//   dist/index.html        the front page gets a description and links to every article.
//   dist/sitemap.xml       the front page and every article address. public/robots.txt points here.
// Addresses carry no `?v=`: without it the site shows the latest version, where every page is revealed.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SITE = 'https://aru.wiki';
const root = new URL('../../', import.meta.url);
const dist = new URL('dist/', root);
const read = async (f) => JSON.parse(await readFile(new URL(`data/runtime/${f}`, root), 'utf8'));

const chart = await read('chart.json');
// pages with an article that are not stars of the chart
const others = existsSync(new URL('data/runtime/pages.json', root)) ? await read('pages.json') : [];
const nodes = [...chart.nodes, ...others];
const byId = new Map(nodes.map((n) => [n.id, n]));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => s.replace(/\*\*/g, '');
const nameOf = (n) => n.ko ?? n.id;
// the same name and encoding as articleUrl() in src/route.ts: Korean name, else the page id
const fileName = (n) => nameOf(n).replace(/ /g, '_');
const pathOf = (n) => `/wiki/${encodeURIComponent(fileName(n)).replace(/%2F/gi, '/')}`;
const articleSlug = (page) => page.replace(/[^A-Za-z0-9]+/g, '_'); // = build-runtime-data / src/lore.ts
const fandomUrl = (page) => `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(page.replace(/ /g, '_'))}`;
const sentences = (p) => p.s.map((x) => plain(x.t)).join(' ');
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

const shell = await readFile(new URL('index.html', dist), 'utf8');
if (!shell.includes('<div id="root"></div>')) throw new Error('dist/index.html: no empty #root to fill');
const page = ({ title, description, path, body }) => shell
  .replace(/<title>[^<]*<\/title>/, [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${SITE}${path}" />`,
    `<meta property="og:type" content="${path === '/' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="aru.wiki" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${SITE}${path}" />`,
    // readers with scripts get the app instead: hide the static text until createRoot replaces it, so
    // it never flashes (and a `?v=` reader never sees later-version text from the latest-version copy)
    `<script>document.documentElement.classList.add('js')</script>`,
    `<style>.js .prerender{display:none}</style>`,
  ].join('\n    '))
  .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

const neighbours = new Map();
for (const l of chart.links ?? []) {
  for (const [a, b] of [[l.source, l.target], [l.target, l.source]]) {
    if (!neighbours.has(a)) neighbours.set(a, []);
    neighbours.get(a).push([b, l.shared ?? 0]);
  }
}

let written = 0;
for (const n of nodes) {
  const file = new URL(`data/runtime/articles/${articleSlug(n.id)}.json`, root);
  if (!existsSync(file)) continue;
  const art = JSON.parse(await readFile(file, 'utf8')).articles.at(-1); // latest version
  if (!art) continue;
  const name = nameOf(n);
  const lead = art.lead ? sentences(art.lead) : '';
  const related = (neighbours.get(n.id) ?? []).sort((a, b) => b[1] - a[1]).map(([id]) => byId.get(id)).filter(Boolean);
  const wikiPages = [...new Set((art.sources ?? []).filter((s) => s.kind === 'wiki').map((s) => s.page))];
  const body = [
    `<article class="prerender">`,
    `<p><a href="/">aru.wiki</a></p>`,
    `<h1>${esc(name)}</h1>`,
    n.ko && n.ko !== n.id ? `<p>${esc(n.id)}</p>` : '',
    lead ? `<p>${esc(lead)}</p>` : '',
    ...(art.sections ?? []).map((s) => `<h2>${esc(plain(s.h))}</h2>\n${(s.p ?? []).map((p) => `<p>${esc(sentences(p))}</p>`).join('\n')}`),
    related.length ? `<h2>관련 문서</h2>\n<ul>${related.map((r) => `<li><a href="${pathOf(r)}">${esc(nameOf(r))}</a></li>`).join('')}</ul>` : '',
    `<h2>출처와 라이선스</h2>`,
    `<p>Fandom 원신 위키 글(CC BY-SA 3.0)을 번역·요약해 고쳐 쓴 글입니다${wikiPages.length ? `: ${wikiPages.map((p) => `<a href="${fandomUrl(p)}">${esc(p)}</a>`).join(', ')}` : ''}. 이 문서의 글도 CC BY-SA로 쓸 수 있습니다. 게임에 관한 권리는 HoYoverse에 있습니다.</p>`,
    `</article>`,
  ].filter(Boolean).join('\n');
  const out = new URL(`wiki/${fileName(n)}.html`, dist);
  await mkdir(new URL('./', out), { recursive: true });
  await writeFile(out, page({
    title: `${name} - aru.wiki`,
    description: clip(lead || `${name}: 원신 시간축 위키 aru.wiki의 문서`, 160),
    path: pathOf(n),
    body,
  }));
  n.prerendered = true;
  written++;
}

const listed = nodes.filter((n) => n.prerendered).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'ko'));
await writeFile(new URL('index.html', dist), page({
  title: 'aru.wiki — 원신 시간축 위키',
  description: '원신 이야기를 버전 순서대로 따라가는 위키. 고른 버전까지 공개된 내용만 보여 주어 스포일러 없이 읽을 수 있습니다.',
  path: '/',
  body: `<nav class="prerender"><h1>aru.wiki — 원신 시간축 위키</h1>\n<ul>${listed.map((n) => `<li><a href="${pathOf(n)}">${esc(nameOf(n))}</a></li>`).join('')}</ul></nav>`,
}));

const urls = [`${SITE}/`, ...listed.map((n) => SITE + pathOf(n))];
await writeFile(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`dist/wiki/ ${written} article pages, dist/sitemap.xml ${urls.length} URLs`);

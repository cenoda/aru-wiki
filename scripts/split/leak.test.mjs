// The browser downloads nothing revealed after the version it shows (design.md 1절 3번, 6절).
// Serves the built site (dist/, `npm run build`) the way the server does, opens it in Chromium at a
// few versions, works the screens (3D chart and card, articles, search with body search, an address of
// a later page, recent changes, the quest map and its search, a step back on the version picker) and
// collects every response. None may hold a name or sentence first revealed after that version:
//   - names: page names (English id, Korean name), red-link names and quest names of later versions,
//     looked for anywhere in the text; a hit counts only when the name does not also belong to
//     something revealed by then (a 1.0 article may say a word that is a later page's name)
//   - sentences: article, snapshot and timeline sentences and video titles of later versions, matched
//     as whole strings in the JSON received
// What is expected is worked out here from data/runtime/ (the full data) on its own, not from the
// split build, so a mistake there shows up.
// Accepted, not checked (design.md 6절): the HTML documents themselves (index.html with its list of
// every article, and the search-engine pages dist/wiki/*.html with the latest text), which the server
// sends for an address before the app runs. Requests leaving the site (fonts, YouTube) are blocked.
// Skipped when dist/ is missing.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
// LEAK_TEST_DIST: another build to check (e.g. one from before the split, which must fail)
const dist = process.env.LEAK_TEST_DIST ?? join(root, 'dist');
const runtime = join(root, 'data/runtime');
const built = existsSync(join(dist, 'index.html')) && (existsSync(join(dist, 'assets/d')) || !!process.env.LEAK_TEST_DIST);
const J = (f) => JSON.parse(readFileSync(join(runtime, f), 'utf8'));

// ---------- a static server like the Caddyfile: /wiki/<name> → dist/wiki/<name>.html, else index.html ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
let server, base;
before(async () => {
  if (!built) return;
  server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = (p) => { const f = normalize(join(dist, p)); return f.startsWith(dist) && existsSync(f) && statSync(f).isFile() ? f : null; };
    const f = (path.startsWith('/wiki/') && file(`${path}.html`)) || file(path) || join(dist, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());

// ---------- what each version may and may not show, from the full data ----------
const graph = J('graph.json'), chart = J('chart.json'), extraPages = J('pages.json'), snapshots = J('snapshots-khaenriah.json');
const red = J('redlinks.json'), videos = J('videos.json'), recent = J('recent.json');
const LAST = graph.versions.length - 1;
const vOrder = new Map(graph.versions.map((v) => [v.id, v.order]));
const pages = [...chart.nodes, ...extraPages];
const revealed = new Map(pages.map((n) => [n.id, n.revealed]));
const slug = (p) => p.replace(/[^A-Za-z0-9]+/g, '_');
const texts = pages.map((n) => {
  const f = join(runtime, 'articles', `${slug(n.id)}.json`);
  const d = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { articles: [], timeline: [] };
  return { page: n.id, ...d, snapshots: snapshots[n.id] ?? [] };
});
const at = (page, o) => Math.max(o, revealed.get(page) ?? LAST);
const sentencesOf = (x) => JSON.stringify(x).match(/"t":"(?:[^"\\]|\\.)*"/g)?.map((m) => JSON.parse(m.slice(4))) ?? [];

function expectations(v) {
  const allowed = [], later = { names: new Set(), strings: new Set() };
  const keep = (o, x) => { if (o <= v) allowed.push(JSON.stringify(x)); return o > v; };
  for (const n of pages) if (keep(n.revealed, n)) { if (n.id.length >= 4) later.names.add(n.id); if (n.ko && n.ko.length >= 3) later.names.add(n.ko); }
  for (const t of texts) {
    for (const a of t.articles) if (keep(at(t.page, a.from), a)) for (const s of sentencesOf(a)) later.strings.add(s);
    for (const s of t.snapshots) if (keep(at(t.page, s.from), s)) for (const b of [s.summary?.t, ...s.bullets.map((x) => x.t)]) if (b) later.strings.add(b);
    for (const e of t.timeline) if (keep(at(t.page, e.v), e)) for (const it of e.items) later.strings.add(it.t);
  }
  for (const r of red) if (keep(r[1], r)) later.names.add(r[0]);
  for (const [page, list] of Object.entries(videos)) for (const x of list) if (keep(at(page, x.v), x) && x.t) later.strings.add(x.t);
  for (const r of recent) keep(r.g, r);
  for (const q of [...graph.quests, ...graph.units.units]) {
    if (keep(vOrder.get(q.first_version) ?? LAST, q)) for (const nm of [q.names.ko, q.names.en]) if (nm && nm.length >= 4) later.names.add(nm);
  }
  for (const e of graph.recommended) if (keep(vOrder.get(e.revealed_version) ?? 0, e)) later.strings.add(e.reason_ko);
  // version ids, numbers and dates are shown for every version (the picker)
  allowed.push(JSON.stringify(graph.versions.map(({ id, number, released }) => ({ id, number, released }))));
  // a version's title and new areas from that version on (the quest map's version notes)
  for (const ver of graph.versions) keep(ver.order, ver);
  // act card figures are shown with their act (the icon only from its release, src/FocusView.tsx)
  for (const [act, { character }] of Object.entries(graph.figures.acts)) keep(vOrder.get(graph.quests.find((q) => q.id === act)?.first_version) ?? 0, [character, graph.figures.characters[character]]);
  // character icons are shown from their release version (docs/image-policy.md)
  for (const f of graph.imageFiles) keep(vOrder.get(f.release_version) ?? LAST, f);
  for (const s of allowed.flatMap((x) => sentencesOf(JSON.parse(x)))) later.strings.delete(s);
  // short strings (a name in bold, "두린") are names, looked for as names above, not as sentences
  for (const s of later.strings) if (s.length < 12) later.strings.delete(s);
  return { allowed: allowed.join('\n'), later, shownNames: pages.filter((n) => n.revealed <= v).map((n) => n.ko ?? n.id) };
}

/** every string value in a JSON text */
function stringsIn(text, out) {
  const walk = (x) => { if (typeof x === 'string') out.add(x); else if (x && typeof x === 'object') for (const y of Object.values(x)) walk(y); };
  try { walk(JSON.parse(text)); } catch { /* not JSON */ }
}

// ---------- the browser ----------
async function visit(v) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const bodies = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('**/*', (r) => (r.request().url().startsWith(base) ? r.continue() : r.abort()));
  page.on('response', async (res) => {
    if (res.request().resourceType() === 'document') return; // accepted: index.html, dist/wiki/*.html (see top)
    try { bodies.push({ url: res.url(), text: (await res.body()).toString('utf8') }); } catch { /* gone with a navigation */ }
  });
  const id = graph.versions[v].id;
  const q = `v=${encodeURIComponent(id)}`;
  const settle = () => page.waitForLoadState('networkidle').catch(() => {});
  const type = async (text) => {
    const box = page.getByRole('combobox', { name: '문서·임무 검색' }).first();
    await box.fill(text);
    await page.waitForTimeout(700);
    await settle();
  };
  const exp = expectations(v);
  const later = [...exp.later.names];
  const shown = pages.filter((n) => n.revealed <= v).sort((a, b) => b.units - a.units);

  // 3D chart, a picked star's card, search (names, quests, body text), a step back
  await page.goto(`${base}/?${q}`);
  await page.waitForSelector('.w3d-stage[data-ready]', { timeout: 60000 }).catch(() => {});
  await settle();
  for (const t of ['신의', '기사단', later[0] ?? '켄리아', later[later.length >> 1] ?? '데인슬레이프']) await type(t);
  // a revealed article, through the search box
  await type(shown[0].ko ?? shown[0].id);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.wa-title', { timeout: 20000 }).catch(() => {});
  await settle();
  if (v > 0) { await page.getByRole('button', { name: '이전 버전' }).first().click().catch(() => {}); await settle(); }
  // an article revealed later, by its address: shows only that it is not revealed
  const hidden = pages.find((n) => n.revealed > v && n.ko);
  let hiddenTitle = null;
  if (hidden) {
    await page.goto(`${base}/wiki/${encodeURIComponent(hidden.ko)}?${q}`);
    await page.waitForSelector('.wa-title', { timeout: 30000 }).catch(() => {});
    await settle();
    hiddenTitle = await page.locator('.wa-title').first().textContent().catch(() => null);
  }
  // a revealed article opened by address, then recent changes
  await page.goto(`${base}/wiki/${encodeURIComponent(shown[1].ko ?? shown[1].id)}?${q}`);
  await page.waitForSelector('.wa-title', { timeout: 30000 }).catch(() => {});
  await settle();
  await page.goto(`${base}/wiki/${encodeURIComponent('특수:최근바뀜')}?${q}`);
  await page.waitForSelector('.recent, .rc', { timeout: 20000 }).catch(() => {});
  await settle();
  // the quest map and its search
  await page.goto(`${base}/?view=quests&${q}`);
  await page.waitForSelector('.react-flow__node', { timeout: 60000 }).catch(() => {});
  await settle();
  await type('임무');
  await type(later.find((x) => /[가-힣]/.test(x)) ?? '마신');
  await browser.close();
  return { bodies, errors, exp, hidden, hiddenTitle };
}

function leaks({ bodies, exp }) {
  const strings = new Set();
  for (const b of bodies) stringsIn(b.text, strings);
  const found = [];
  for (const s of exp.later.strings) if (strings.has(s)) found.push({ kind: 'sentence', s: s.slice(0, 60) });
  // a Latin name as a word ("Lumi" in a library's getLuminance is not the page Lumi); a Korean one
  // anywhere, since particles follow it directly (노드크라이의)
  const word = (name) => !/^[\x20-\x7e]+$/.test(name) ? { test: (t) => t.includes(name) } : new RegExp(`(?<![\\p{L}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u');
  for (const name of exp.later.names) {
    if (!bodies.some((b) => b.text.includes(name) || b.text.includes(JSON.stringify(name).slice(1, -1)))) continue; // quick test first
    const re = word(name), reEsc = word(JSON.stringify(name).slice(1, -1));
    const where = bodies.find((b) => re.test(b.text) || reEsc.test(b.text));
    if (where && !exp.allowed.includes(name)) found.push({ kind: 'name', s: name, url: where.url.replace(base, '') });
  }
  return found;
}

const VERSIONS = ['1.0', '4.0', 'Luna IV', graph.versions[LAST].id];
for (const id of VERSIONS) {
  test(`nothing revealed after ${id} is downloaded at ${id}`, { skip: !built && 'no dist/: run npm run build first', timeout: 240000 }, async () => {
    const v = vOrder.get(id);
    assert.ok(v !== undefined, `version ${id}`);
    const run = await visit(v);
    assert.deepEqual(run.errors, [], 'page errors');
    // the run saw the screens: data came in and names of this version were in it
    const all = run.bodies.map((b) => b.text).join('\n');
    assert.ok(run.exp.shownNames.slice(0, 20).some((n) => all.includes(n)), 'names of this version arrived');
    if (run.hidden) assert.equal(run.hiddenTitle, '공개되지 않은 항목', `a later page's address (${run.hidden.id}) shows only that it is not revealed`);
    const found = leaks(run);
    assert.deepEqual(found.slice(0, 20), [], `${found.length} later names or sentences downloaded`);
  });
}

test('the built bundle names no article file', { skip: !built && 'no dist/' }, () => {
  const js = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8')).join('\n');
  assert.ok(!js.includes('runtime/articles/'), 'article file list in the JS');
  assert.ok(!js.includes('runtime/search/'), 'search file list in the JS');
  for (const n of chart.nodes.filter((x) => x.revealed > 0 && x.id.length >= 8).slice(0, 300)) assert.ok(!js.includes(`"${n.id}"`), `${n.id} in the JS`);
});

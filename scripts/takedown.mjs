// Find, block and remove what a rights holder asks us to take down (docs/takedown.md).
//
//   node scripts/takedown.mjs find <query>...
//       List every record and local file that matches. A query is a character name (en or ko),
//       an act id or act name (en or ko), a file name ("Albedo.png", "Ambor"), a wiki page name,
//       or a URL (aru.wiki image, Enka icon, Fandom page). Prefix a kind to narrow it:
//       character:, act:, file:, page:  (e.g. "page:Khaenri'ah"). Text pages are blocked only
//       with page: or a Fandom URL; a plain name lists them as suggestions.
//   node scripts/takedown.mjs block <query>... --requester "..." --reason "..." [--apply]
//       Add one entry to data/manual/takedown.json with the exact matches, and delete their local
//       copies (public/, dist/, data/runtime/articles/). Without --apply it only prints the plan.
//   node scripts/takedown.mjs clean [--apply]   delete local copies of everything already blocked
//   node scripts/takedown.mjs check             is anything blocked still here? (+ live URLs to test)
//   node scripts/takedown.mjs list              the entries in data/manual/takedown.json
//   node scripts/takedown.mjs unblock <id> [--apply]   remove an entry (a mistaken block)
//
// Only exact matches are blocked; partial matches are printed as suggestions. Every run without
// --apply changes nothing. The live site changes only after a redeploy (docs/takedown.md).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { blocked, KINDS, readTakedown, TAKEDOWN_FILE } from './images/takedown-list.mjs';

const root = new URL('../', import.meta.url);
const SITE = 'https://aru.wiki/';
const rel = (u) => decodeURIComponent(u.pathname.slice(root.pathname.length));
const readJson = (path, fallback) => {
  const u = new URL(path, root);
  return existsSync(u) ? JSON.parse(readFileSync(u, 'utf8')) : fallback;
};
const lsDir = (path) => (existsSync(new URL(path, root)) ? readdirSync(new URL(path, root)) : []);
const norm = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const today = new Date().toISOString().slice(0, 10);

// ---------- what the project holds ----------
const imageFiles = readJson('data/generated/image-files.json', { files: [] }).files;
const figures = readJson('data/generated/card-figures.json', { acts: {}, characters: {} });
const koNames = readJson('data/generated/ko-names.json', {});
const quests = readJson('data/generated/quests.json', []);
const acts = quests.filter((q) => q.level === 'ACT');
const theme = readJson('data/generated/theme-khaenriah.json', { nodes: [] });
const articles = readJson('data/generated/articles-khaenriah.json', { articles: [] }).articles;
const snapshots = readJson('data/generated/snapshots-khaenriah.json', { snapshots: [] }).snapshots;
const manualIcons = readJson('data/manual/enka-icons.json', { characters: {} }).characters;
const manualFigures = readJson('data/manual/card-figures.json', { acts: {} }).acts;

/** Pages whose text the site ships (theme graph, snapshots, articles), with where each appears. */
const textPages = new Map();
const addPage = (page, where) => { if (page) (textPages.get(page) ?? textPages.set(page, new Set()).get(page)).add(where); };
if (theme.page) addPage(theme.page, 'theme-khaenriah (hub)');
for (const n of theme.nodes) addPage(n.page, 'theme-khaenriah');
for (const s of snapshots) addPage(s.node, 'snapshots-khaenriah');
for (const a of articles) addPage(a.node, 'articles-khaenriah');

const characters = new Set([...Object.keys(figures.characters), ...imageFiles.map((f) => f.character)]);
const koOf = (page) => figures.characters[page]?.ko ?? koNames[page]?.ko ?? null;
/** Every name a page goes by: itself, its Korean name, Fandom titles that redirect to it. */
const namesOf = new Map();
const addName = (page, name) => { if (page && name) (namesOf.get(page) ?? namesOf.set(page, new Set()).get(page)).add(norm(name)); };
for (const p of [...characters, ...textPages.keys()]) { addName(p, p); addName(p, koOf(p)); }
for (const [title, v] of Object.entries(koNames)) {
  if (namesOf.has(v.page)) { addName(v.page, title); addName(v.page, v.ko); }
}

const articleSlug = (page) => page.replace(/[^A-Za-z0-9]+/g, '_'); // = build-runtime-data / src/lore.ts
const iconName = (file) => /([^/]+)\.png$/.exec(file)?.[1] ?? file;

// ---------- matching ----------
/** Turn a URL into plain queries: an image file, an Enka icon name, a Fandom page title. */
function fromUrl(q) {
  let u;
  if (!/^https?:\/\//i.test(q)) return null;
  try { u = new URL(q); } catch { return null; }
  const path = decodeURIComponent(u.pathname);
  const icon = /UI_AvatarIcon_Side_([A-Za-z0-9]+)\.png$/.exec(path)?.[1];
  if (icon) return [`file:${icon}`];
  const img = /\/(img\/.+)$/.exec(path)?.[1];
  if (img) return [`file:${img}`];
  const wiki = /\/wiki\/(.+)$/.exec(path)?.[1];
  if (wiki) return [`page:${wiki.replace(/_/g, ' ')}`]; // a Fandom URL is about its text
  // a site URL: try the values of its parameters (act ids, page names)
  return [...u.searchParams.values(), path.split('/').filter(Boolean).at(-1)].filter(Boolean);
}

/** Exact and partial matches for one query: { exact: {kind: Set}, partial: {kind: Set} } */
function match(query) {
  const exact = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  const partial = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  const urlQueries = fromUrl(query);
  if (urlQueries) {
    for (const q of urlQueries) {
      const m = match(q);
      for (const k of KINDS) { m.exact[k].forEach((v) => exact[k].add(v)); m.partial[k].forEach((v) => partial[k].add(v)); }
    }
    return { exact, partial };
  }
  const kind = /^(character|act|file|page):(.*)$/s.exec(query);
  const only = kind?.[1];
  const raw = kind ? kind[2] : query;
  const q = norm(raw);
  if (!q) return { exact, partial };
  const want = (k) => !only || only === k;
  const test = (names, set, value) => {
    if ([...names].some((n) => n === q)) exact[set].add(value);
    else if (q.length >= 2 && [...names].some((n) => n.includes(q))) partial[set].add(value);
  };

  if (want('character')) for (const c of characters) test(namesOf.get(c) ?? new Set([norm(c)]), 'characters', c);
  if (want('page')) for (const p of textPages.keys()) test(namesOf.get(p) ?? new Set([norm(p)]), 'pages', p);
  // text is blocked only when asked for by name (page:) or by its Fandom URL, never as a side
  // effect of an image request for the same character
  if (only !== 'page') { exact.pages.forEach((p) => partial.pages.add(p)); exact.pages.clear(); }
  if (want('act')) {
    for (const a of acts) {
      if (a.id === raw.trim()) { exact.acts.add(a.id); continue; }
      test(new Set([norm(a.id), norm(a.names.en), norm(a.names.ko)].filter(Boolean)), 'acts', a.id);
    }
  }
  if (want('file')) {
    const local = [...lsDir('public/img/characters/'), ...lsDir('dist/img/characters/')].map((n) => `img/characters/${n}`);
    for (const file of new Set([...imageFiles.map((f) => f.file), ...local])) {
      const names = new Set([norm(file), norm(file.split('/').at(-1)), norm(iconName(file))]);
      const rec = imageFiles.find((f) => f.file === file);
      if (rec) names.add(norm(rec.source_url));
      test(names, 'files', file);
    }
  }
  // a character only as a text page, or the reverse, is fine: both kinds are listed
  return { exact, partial };
}

/** What a set of matched items pulls in: a character's files and cards, an act's figure. */
function expand(items) {
  const out = Object.fromEntries(KINDS.map((k) => [k, new Set(items[k])]));
  for (const c of items.characters) for (const f of imageFiles) if (f.character === c) out.files.add(f.file);
  return out;
}

// ---------- local copies ----------
/** Files on this computer that hold blocked material. Paths relative to the project root. */
function localCopies(b) {
  const out = [];
  const files = new Set(b.files);
  for (const f of imageFiles) if (b.characters.has(f.character)) files.add(f.file);
  for (const file of files) for (const dir of ['public/', 'dist/']) {
    if (existsSync(new URL(dir + file, root))) out.push(dir + file);
  }
  for (const page of b.pages) {
    const slug = articleSlug(page);
    if (existsSync(new URL(`data/runtime/articles/${slug}.json`, root))) out.push(`data/runtime/articles/${slug}.json`);
    // dist/assets/<slug>-<hash>.json (its JS stub only holds the URL and stays until the rebuild)
    for (const n of lsDir('dist/assets/')) if (new RegExp(`^${slug}-[A-Za-z0-9_-]{8}\\.json$`).test(n)) out.push(`dist/assets/${n}`);
  }
  return out;
}

/** Blocked material that the built data still carries (dist and data/runtime need a rebuild). */
function builtLeftovers(b) {
  const out = [];
  const graphs = [new URL('data/runtime/graph.json', root)];
  const graph = existsSync(graphs[0]) ? JSON.parse(readFileSync(graphs[0], 'utf8')) : null;
  for (const f of graph?.imageFiles ?? []) {
    if (b.files.has(f.file) || b.characters.has(f.character)) out.push(`data/runtime/graph.json: image record ${f.file} (src/data.ts hides it on screen; the build-runtime-data hook drops it from the data)`);
  }
  for (const name of ['theme-khaenriah.json', 'snapshots-khaenriah.json']) {
    const u = new URL(`data/runtime/${name}`, root);
    if (!existsSync(u)) continue;
    const data = JSON.parse(readFileSync(u, 'utf8'));
    const ids = name.startsWith('theme') ? data.nodes.map((n) => n.id) : Object.keys(data);
    for (const p of b.pages) if (ids.includes(p)) out.push(`data/runtime/${name}: page ${p} (needs the build-runtime-data hook)`);
  }
  return out;
}

// ---------- output ----------
function describe(kind, v) {
  if (kind === 'characters') {
    const cards = Object.entries(figures.acts).filter(([, f]) => f.character === v).map(([a]) => a);
    const files = imageFiles.filter((f) => f.character === v).map((f) => f.file);
    const manual = [manualIcons[v] && 'data/manual/enka-icons.json',
      Object.entries(manualFigures).some(([, f]) => f.character === v) && 'data/manual/card-figures.json'].filter(Boolean);
    return `${v}${koOf(v) ? ` (${koOf(v)})` : ''} — icon files: ${files.join(', ') || '-'}; cards: ${cards.length ? cards.join(', ') : '-'}${manual.length ? `; named in ${manual.join(', ')}` : ''}${textPages.has(v) ? '; also a text page' : ''}`;
  }
  if (kind === 'files') {
    const rec = imageFiles.find((f) => f.file === v);
    const where = ['public/', 'dist/'].filter((d) => existsSync(new URL(d + v, root))).join(' ') || 'no local copy';
    return `${v} — ${rec ? `${rec.character}, ${rec.source_url}, fetched ${rec.fetched}` : 'no record in image-files.json'}; ${where}; live ${SITE}${v}`;
  }
  if (kind === 'acts') {
    const a = acts.find((x) => x.id === v);
    const fig = figures.acts[v];
    return `${v} — ${a?.names.en ?? '?'}${a?.names.ko ? ` / ${a.names.ko}` : ''}; card figure: ${fig ? `${fig.character} (${fig.basis})` : '-'}`;
  }
  if (kind === 'pages') {
    return `${v}${koOf(v) ? ` (${koOf(v)})` : ''} — text in ${[...(textPages.get(v) ?? [])].join(', ')}; source ${koNames[v]?.url ?? `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(v.replace(/ /g, '_'))}`}`;
  }
  return v;
}
const LABEL = { characters: '인물(아이콘)', files: '이미지 파일', acts: '임무 카드', pages: '글(위키 문서)' };
function print(title, items) {
  console.log(title);
  let any = false;
  for (const k of KINDS) {
    if (!items[k].size) continue;
    any = true;
    console.log(`  ${LABEL[k]}:`);
    for (const v of [...items[k]].sort()) console.log(`    - ${describe(k, v)}`);
  }
  if (!any) console.log('  (없음)');
}

async function save(data) {
  await writeFile(TAKEDOWN_FILE, `${JSON.stringify(data, null, 1)}\n`);
  console.log(`wrote ${rel(TAKEDOWN_FILE)}`);
}

async function remove(paths, apply) {
  if (!paths.length) { console.log('지울 로컬 파일 없음'); return; }
  for (const p of paths) {
    if (apply) await rm(new URL(p, root), { force: true });
    console.log(`${apply ? 'deleted' : 'would delete'} ${p}`);
  }
}

// ---------- commands ----------
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((a, i) => !a.startsWith('--') && !['--requester', '--reason'].includes(args[i - 1]));
const [cmd, ...queries] = positional;

function collect(qs) {
  const exact = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  const partial = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  for (const q of qs) {
    const m = match(q);
    for (const k of KINDS) { m.exact[k].forEach((v) => exact[k].add(v)); m.partial[k].forEach((v) => partial[k].add(v)); }
  }
  for (const k of KINDS) for (const v of exact[k]) partial[k].delete(v);
  return { exact, partial };
}

if (cmd === 'find') {
  if (!queries.length) throw new Error('usage: find <query>...');
  const { exact, partial } = collect(queries);
  const all = expand(exact);
  print(`정확히 맞는 것 (block이 막을 것) — ${queries.join(', ')}`, all);
  print('비슷한 것 (막지 않음; 맞으면 그 이름으로 다시 찾기)', partial);
  const b = blocked();
  const already = KINDS.flatMap((k) => [...all[k]].filter((v) => b[k].has(v)).map((v) => `${k}:${v}`));
  if (already.length) console.log(`이미 막힘: ${already.join(', ')}`);
} else if (cmd === 'block') {
  if (!queries.length) throw new Error('usage: block <query>... --requester "..." --reason "..." [--apply]');
  const requester = opt('--requester'), reason = opt('--reason');
  if (!requester || !reason) throw new Error('--requester and --reason are required (no personal data: say "HoYoverse legal" or "rights holder", not an email address)');
  const { exact, partial } = collect(queries);
  if (!KINDS.some((k) => exact[k].size)) {
    print('정확히 맞는 것이 없다. 비슷한 것:', partial);
    process.exit(1);
  }
  const data = readTakedown();
  data._note ??= 'Takedown requests (docs/takedown.md). Written by scripts/takedown.mjs. No personal data: requester is a role or organisation, the email stays in the mailbox.';
  data.entries ??= [];
  const n = data.entries.filter((e) => e.date === today).length + 1;
  const items = expand(exact); // a character's icon files are listed too, so the entry says what went
  const entry = { id: `${today}-${n}`, date: today, requester, reason, queries,
    ...Object.fromEntries(KINDS.map((k) => [k, [...items[k]].sort()])) };
  print(`막을 것 (${entry.id})`, items);
  console.log(JSON.stringify(entry, null, 1));
  if (apply) { data.entries.push(entry); await save(data); }
  await remove(localCopies(blocked({ entries: [entry] })), apply);
  if (!apply) console.log('\n--dry-run: nothing changed. Add --apply to write the entry and delete the files.');
  else console.log('\nNext: npm run build, then deploy (docs/takedown.md).');
} else if (cmd === 'clean') {
  await remove(localCopies(blocked()), apply);
  if (!apply) console.log('--dry-run: add --apply to delete.');
} else if (cmd === 'check') {
  const b = blocked();
  const left = [...localCopies(b), ...builtLeftovers(b)];
  console.log(left.length ? `아직 남은 것:\n${left.map((x) => `  - ${x}`).join('\n')}` : '로컬에 남은 것 없음');
  const files = new Set(b.files);
  for (const f of imageFiles) if (b.characters.has(f.character)) files.add(f.file);
  if (files.size) console.log(`배포 뒤 확인 (404여야 한다):\n${[...files].map((f) => `  curl -s -o /dev/null -w "%{http_code}\\n" ${SITE}${f}`).join('\n')}`);
  process.exitCode = left.length ? 1 : 0;
} else if (cmd === 'list') {
  const data = readTakedown();
  if (!data.entries?.length) console.log('(항목 없음)');
  for (const e of data.entries ?? []) {
    console.log(`${e.id}  ${e.requester} — ${e.reason}`);
    for (const k of KINDS) if (e[k]?.length) console.log(`    ${k}: ${e[k].join(', ')}`);
  }
} else if (cmd === 'unblock') {
  const id = queries[0];
  const data = readTakedown();
  const e = data.entries?.find((x) => x.id === id);
  if (!e) throw new Error(`no entry ${id}`);
  console.log(`${apply ? 'removing' : 'would remove'} ${JSON.stringify(e)}`);
  if (apply) { data.entries = data.entries.filter((x) => x !== e); await save(data); console.log('Files come back with npm run fetch:icons and npm run build.'); }
} else {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 23).filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exitCode = cmd ? 1 : 0;
}

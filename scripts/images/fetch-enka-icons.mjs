// Character icons for act cards, from the URL that Enka.Network's official API docs give
// (https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md#icons-and-images):
//   https://enka.network/ui/[icon_name].png, icon_name from store/characters.json (SideIconName).
//
// Rules (docs/image-policy.md): only the files a card needs, one request at a time with a pause,
// never Fandom, never anything unreleased. A character gets an icon only when the Fandom dump
// says it is playable and gives a release version inside the data (card-figures.json).
//
// Icon names are internal names, not display names. The store's localisation file (loc.json)
// is extracted game text, which this project does not use (docs/image-policy.md 2), so a
// character is matched by name only:
//   exact  the icon name equals the page name without spaces ("Hu Tao" → Hutao)
//   title  the icon name is a Fandom page title that redirects to the character ("Heizo")
//   token  the icon name is one word of the page name ("Kamisato Ayaka" → Ayaka)
//   prefix the icon name starts with the page name ("Skirk" → SkirkNew)
//   near   one word is within edit distance 2 of exactly one icon name, no other character
//          claims that icon, and the icon name is not the title of another Fandom page
//          ("Lyney" → Liney; "Xianyun" is not matched to Xinyan, which has its own page)
//   data/manual/enka-icons.json overrides or blocks a match (a person checked it).
// No match → no icon; the card keeps its region emblem.
//
// Every file gets a record in data/generated/image-files.json: character, source URL, date
// fetched, release version, edits. Files are kept as served (128×128 PNG).
//
// Usage: node scripts/images/fetch-enka-icons.mjs [--dry-run]
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { generatedFile } from '../fandom/paths.mjs';
import { FandomClient } from '../fandom/client.mjs';

const root = new URL('../../', import.meta.url);
const OUT_DIR = new URL('public/img/characters/', root);
const CACHE = new URL('.cache/enka/', root);
const STORES = [
  'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json',
  // same repository; newer characters are only in this file
  'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/avatars.json',
];
const ICON_URL = (name) => `https://enka.network/ui/${name}.png`;
const UA = 'aru-wiki-build/1.0 (+https://aru.wiki)';
const PAUSE_MS = 2000;
export const NOTICE = '© All rights reserved by COGNOSPHERE. Other properties belong to their respective owners.';

const dry = process.argv.includes('--dry-run');
const log = (...a) => console.error('[enka-icons]', ...a);
const read = async (u) => JSON.parse(await readFile(u, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

async function store(url) {
  const file = new URL(url.split('/').slice(-2).join('-'), CACHE);
  if (existsSync(file)) return read(file);
  await mkdir(CACHE, { recursive: true });
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  await writeFile(file, text);
  await sleep(PAUSE_MS);
  return JSON.parse(text);
}

/** Side icon names (without "UI_AvatarIcon_Side_") → the store file that lists them. */
async function iconNames() {
  const out = new Map();
  for (const url of STORES) {
    for (const entry of Object.values(await store(url))) {
      const m = /UI_AvatarIcon_Side_([A-Za-z0-9]+)/.exec(entry.SideIconName ?? '');
      if (m && !out.has(m[1])) out.set(m[1], url);
    }
  }
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

function match(names, icons, manual, titles) {
  const keys = [...icons.keys()];
  // icon name → the page it names in the dump, after redirects
  const page = new Map(keys.map((k) => [k, titles.get(norm(k))]).filter(([, t]) => t));
  const out = new Map();
  const near = new Map();
  for (const name of names) {
    const m = manual[name];
    if (m) { if (m.icon) out.set(name, { icon: m.icon, match: 'manual' }); continue; }
    const tokens = name.split(/\s+/).map(norm);
    const exact = keys.find((k) => norm(k) === norm(name));
    if (exact) { out.set(name, { icon: exact, match: 'exact' }); continue; }
    const titled = keys.filter((k) => page.get(k) === name);
    if (titled.length === 1) { out.set(name, { icon: titled[0], match: 'title' }); continue; }
    const token = keys.filter((k) => tokens.includes(norm(k)));
    if (token.length === 1) { out.set(name, { icon: token[0], match: 'token' }); continue; }
    // "Skirk" → "SkirkNew": an icon name that starts with the whole page name
    const prefixed = keys.filter((k) => norm(k).startsWith(norm(name)) && norm(k) !== norm(name));
    const close = keys.filter((k) => !page.has(k)).map((k) => ({ k, d: Math.min(...tokens.map((t) => editDistance(t, norm(k)))) })).filter((x) => x.d <= 2);
    const cands = prefixed.length ? prefixed.map((k) => ({ k, d: 0 })) : close;
    if (cands.length === 1) near.set(name, { icon: cands[0].k, match: prefixed.length ? 'prefix' : `near:${cands[0].d}` });
  }
  const claimed = new Set([...out.values()].map((v) => v.icon));
  const nearCount = new Map();
  for (const v of near.values()) nearCount.set(v.icon, (nearCount.get(v.icon) ?? 0) + 1);
  for (const [name, v] of near) if (!claimed.has(v.icon) && nearCount.get(v.icon) === 1) out.set(name, v);
  return out;
}

async function main() {
  const figures = await read(generatedFile('card-figures.json'));
  const manual = existsSync(new URL('data/manual/enka-icons.json', root)) ? (await read(new URL('data/manual/enka-icons.json', root))).characters ?? {} : {};
  const recordsFile = generatedFile('image-files.json');
  const old = existsSync(recordsFile) ? await read(recordsFile) : { files: [] };
  const oldByFile = new Map(old.files.map((f) => [f.file, f]));

  const wanted = Object.entries(figures.characters).filter(([, c]) => c.playable && c.release_version).map(([n]) => n);
  const icons = await iconNames();
  const dump = await new FandomClient().dump();
  const titles = new Map();
  for (const p of dump.pages.values()) {
    if (p.ns !== 0) continue;
    const key = norm(p.title);
    if (!titles.has(key) || !p.redirect) titles.set(key, p.redirect ?? p.title);
  }
  const matched = match(wanted, icons, manual, titles);
  const unmatched = wanted.filter((n) => !matched.has(n));

  await mkdir(OUT_DIR, { recursive: true });
  const files = [];
  let requests = 0;
  for (const name of wanted.filter((n) => matched.has(n)).sort()) {
    const { icon, match: how } = matched.get(name);
    const iconName = `UI_AvatarIcon_Side_${icon}`;
    const file = `img/characters/${icon}.png`;
    const target = new URL(file, new URL('public/', root));
    const prev = oldByFile.get(file);
    if (!existsSync(target) && !dry) {
      if (requests) await sleep(PAUSE_MS);
      const res = await fetch(ICON_URL(iconName), { headers: { 'user-agent': UA } });
      requests++;
      if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/png')) {
        log(`skip ${name}: HTTP ${res.status} ${res.headers.get('content-type')}`);
        continue;
      }
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
    }
    if (!existsSync(target) && dry) { log(`would fetch ${ICON_URL(iconName)} for ${name} (${how})`); continue; }
    files.push({
      file,
      character: name,
      source_url: ICON_URL(iconName),
      fetched: prev?.source_url === ICON_URL(iconName) ? prev.fetched : today,
      release_version: figures.characters[name].release_version,
      release_basis: { date: figures.characters[name].release_date, ...figures.characters[name].source },
      edits: 'none (128×128 PNG as served; shown scaled down)',
      icon_name_from: icons.get(icon),
      match: how,
      notice: NOTICE,
      license: 'not covered by the project CC BY-SA license',
    });
  }

  if (!dry) {
    await writeFile(recordsFile, `${JSON.stringify({
      _note: 'One record per image file (docs/image-policy.md 3). Written by scripts/images/fetch-enka-icons.mjs.',
      files,
    }, null, 1)}\n`);
  }
  log(`characters: ${wanted.length}, with an icon: ${files.length}, requests this run: ${requests}`);
  log('no icon (no name match):', unmatched.join(', ') || '-');
  log('near/prefix matches:', [...matched].filter(([, v]) => !['exact', 'title', 'token', 'manual'].includes(v.match)).map(([n, v]) => `${n}→${v.icon}`).join(', '));
}

main().catch((e) => { console.error(e); process.exit(1); });

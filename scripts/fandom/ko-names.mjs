// Official Korean names from Fandom `{{Other Languages}}` tables (design.md §3), shared by
// build-characters.mjs and build-ko-names.mjs.
//
// For each requested page title:
//   - the page is read after redirects (`Houzhang` -> `Moon Carver`); a subpage with no table of
//     its own (`Zhongli/Storyline`) falls back to its base page;
//   - tables pulled in from other pages are resolved: `{{Other Languages|Guard (1)}}`,
//     `Transclude=Page`, `Transclude_1=Page;2#2`;
//   - on pages with several tables (`1_ko`, `2_ko`, ...) the table whose `en` matches the
//     requested name is used (`Houzhang` -> 후강, `Rotwang` -> 로트왕), else the first one;
//   - a value listing two names (`생론<->파 / 아무르타`) gives the first as `ko` and both in
//     `ko_variants`;
//   - the value is reduced to the name as displayed: `{{tt|감우|甘雨}}` -> 감우, and the
//     romanization markers of Module:Ko-rm are dropped (`//종려//`, `당< >무적`, `밤<->의 신`,
//     `리드<・: >밀러 <13:십삼><->세` -> 리드·밀러 13세). The game writes the middle dot as
//     `·` (U+00B7); editors often type `・` (U+30FB), which is normalized to `·`.
// Titles with no Korean name on Fandom keep `ko: null` and a `missing` reason, unless
// data/manual/ko-names.json gives one. That file is kept by hand: each entry names the public
// pages it was read from (HoYoWiki, Namuwiki facts, other Fandom pages) or a person's own
// play-through, and replaces or fills the Fandom value; a replaced Fandom value stays in
// `fandom_ko`. Extracted game text is never a source (design.md §1.1).
import { readFile } from 'node:fs/promises';
import { pageUrl } from './client.mjs';
import { findTemplate, normalizeTitle, parseTemplate, plainText } from './wikitext.mjs';

const MANUAL = new URL('../../data/manual/ko-names.json', import.meta.url);

/** Displayed Korean text of a `ko` value; '' when blank or marked unavailable. */
export function cleanKo(value) {
  if (!value || value.trim() === '_UNAVAILABLE') return '';
  let s = value
    .replace(/<!--[\s\S]*?(-->|$)/g, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  // Module:Ko-rm markers (see its p.strip): manual readings `<text:reading>` keep the text,
  // one-character separators `< >` `<->` vanish, `//given name//`, `^` and `_` are dropped.
  s = s
    .replace(/<([^<>:]+):[^<>]*>/g, '$1')
    .replace(/<[^<>]>/g, '')
    .replace(/\/\/(.*?)\/\//g, '$1')
    .replace(/[\^_]/g, '');
  return plainText(s).replace(/・/g, '·');
}

/** Every `{{Other Languages ...}}` call on a page, as raw inner text, in order. */
function allTables(content) {
  const out = [];
  let rest = content;
  for (;;) {
    const inner = findTemplate(rest, 'Other Languages');
    if (inner == null) return out;
    out.push(inner);
    rest = rest.slice(rest.indexOf(inner) + inner.length);
  }
}

/**
 * Tables of a page's `{{Other Languages}}` calls: Map<index, { en, ko }>, plus what they
 * transclude. A page can carry the template more than once (Sea of Stars leaves `ko` blank in
 * the first call and fills it in a later one), so a filled value wins over a blank one.
 */
export function readTables(content) {
  const calls = allTables(content);
  if (!calls.length) return null;
  const tables = new Map();
  const transcludes = [];
  for (const inner of calls) {
    const { positional, named } = parseTemplate(inner);
    const own = new Map();
    for (const [k, v] of Object.entries(named)) {
      const m = k.match(/^(?:(\d+)_)?(en|ko)$/);
      if (!m) continue;
      const i = Number(m[1] ?? 0);
      if (!own.has(i)) own.set(i, {});
      own.get(i)[m[2]] = v;
    }
    for (const [i, t] of own) {
      const prev = tables.get(i);
      if (!prev || (!cleanKo(prev.ko) && cleanKo(t.ko))) tables.set(i, { en: t.en ?? prev?.en, ko: t.ko });
    }
    // `Transclude=Page;2#4`: table 2 of Page shown as table 4. A bare positional page name
    // transcludes that page's table as is.
    for (const [k, v] of Object.entries(named)) {
      if (!/^Transclude(_\d+)?$/.test(k)) continue;
      const m = v.match(/^([^;#]+)(?:;(\d+))?(?:#(\d+))?$/);
      if (m) transcludes.push({ page: normalizeTitle(m[1]), from: m[2] && Number(m[2]), to: m[3] && Number(m[3]) });
    }
    const bare = positional.find((p) => p && !p.includes('='));
    if (bare) transcludes.push({ page: normalizeTitle(bare) });
  }
  return { tables, transcludes };
}

/** Pages whose tables are needed, transclusions resolved up to `depth` hops. */
export async function loadPages(client, titles) {
  const pages = await client.latest(titles);
  let pending = [...pages.values()];
  for (let depth = 0; depth < 3 && pending.length; depth++) {
    const want = new Set();
    for (const p of pending) {
      for (const t of readTables(p.content)?.transcludes ?? []) if (!pages.has(t.page)) want.add(t.page);
    }
    const more = await client.latest([...want]);
    for (const [k, v] of more) pages.set(k, v);
    pending = [...new Set(more.values())];
  }
  return pages;
}

/** All tables shown on a page, own and transcluded: [{ index, en, ko, page }]. */
function pageTables(pages, title, seen = new Set()) {
  const page = pages.get(title);
  if (!page || seen.has(page.title)) return [];
  seen.add(page.title);
  const read = readTables(page.content);
  if (!read) return [];
  const out = [];
  for (const [index, t] of read.tables) {
    // `en` defaults to the page name for an unnumbered table.
    out.push({ index, en: t.en ?? (index === 0 ? page.title : undefined), ko: t.ko, page: page.title });
  }
  for (const tr of read.transcludes) {
    const src = pageTables(pages, tr.page, seen);
    const picked = tr.from ? src.filter((t) => t.index === tr.from) : src;
    for (const t of picked) {
      const index = tr.to ?? t.index;
      const own = out.find((o) => o.index === index);
      if (own && own.ko) continue; // a value on the page wins over the transcluded one
      if (own) Object.assign(own, { ko: t.ko, page: t.page, en: own.en ?? t.en });
      else out.push({ ...t, index });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Hand-kept names; every entry needs a Korean name and at least one source URL. */
export async function readManual() {
  let data;
  try { data = JSON.parse(await readFile(MANUAL, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
  for (const [name, v] of Object.entries(data)) {
    if (name.startsWith('$')) { delete data[name]; continue; }
    // A source is a public page (`url`), a person's own play-through (`site: "play"`), or a
    // maintainer's own lookup of public pages (`site: "maintainer"`).
    const valid = (s) => /^https:\/\//.test(s.url ?? '') || (['play', 'maintainer'].includes(s.site) && s.by);
    if (!v.ko || !v.sources?.length || !v.sources.every(valid)) {
      throw new Error(`ko-names.json: ${name} needs ko and sources (url, or site "play"/"maintainer" with by)`);
    }
  }
  return data;
}

const key = (s) => plainText(s ?? '').replace(/["“”「」]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const bareName = (s) => s.replace(/\s*\([^)]*\)$/, '');

const basePage = (t) => (t.includes('/') ? t.slice(0, t.indexOf('/')) : null);

/**
 * Korean names for page titles: { out: { title: entry }, missing: { reason: [title] }, manual: n }.
 * An entry is { ko, ko_variants?, page, url, revision, table?, transcluded_from?, base_page?, fandom_ko?,
 * ko_source?, manual? } or { ko: null, missing, ... }.
 */
export async function koNames(client, titles, { log = () => {} } = {}) {
  const manual = await readManual();
  const used = new Set();
  const bases = titles.map(basePage).filter(Boolean);
  const pages = await loadPages(client, [...titles, ...bases]);
  const out = {};
  const missing = {};
  const fromPage = (name, title) => {
    const page = pages.get(title);
    if (!page) return { ko: null, missing: 'no page' };
    const tables = pageTables(pages, title).map((t) => ({ ...t, ko: cleanKo(t.ko) })).filter((t) => t.ko);
    const base = { page: page.title, url: pageUrl(page.title), revision: page.revid };
    if (!tables.length) {
      const reason = /\{\{\s*Disambiguation/i.test(page.content) ? 'disambiguation page'
        : !allTables(page.content).length ? 'no Other Languages table' : 'ko blank';
      return { ko: null, ...base, missing: reason };
    }
    const wanted = [name, page.title, bareName(name), bareName(page.title)].map(key);
    const match = wanted.map((w) => tables.find((t) => t.en && key(t.en) === w)).find(Boolean);
    const t = match ?? tables[0];
    // `생론<->파 / 아무르타`: every language column lists both names, the common one first.
    const parts = t.ko.split(/\s+\/\s+/);
    const entry = { ko: parts[0], ...base };
    if (parts.length > 1) entry.ko_variants = parts;
    if (t.index) entry.table = t.index;
    if (t.page !== page.title) entry.transcluded_from = t.page;
    return entry;
  };
  for (const name of titles) {
    let entry = fromPage(name, name);
    const b = basePage(name);
    if (!entry.ko && b) {
      const fb = fromPage(b, b);
      if (fb.ko) entry = { ...fb, base_page: fb.page, page: entry.page ?? name, url: entry.url ?? pageUrl(name), revision: entry.revision ?? fb.revision };
    }
    const fix = manual[name];
    if (fix) {
      if (entry.ko && entry.ko !== fix.ko) entry.fandom_ko = entry.ko;
      entry.ko = fix.ko;
      entry.ko_source = 'manual';
      entry.manual = { status: fix.status, sources: fix.sources };
      delete entry.missing;
      used.add(name);
    }
    out[name] = entry;
    if (!entry.ko) (missing[entry.missing] ??= []).push(name);
  }
  return { out, missing, manual: used.size, unusedManual: Object.keys(manual).filter((n) => !used.has(n)) };
}

/** Print counts and the titles still missing a Korean name. */
export function report(total, { missing, manual }) {
  const lost = Object.values(missing).flat().length;
  console.log(JSON.stringify({
    titles: total, ko: total - lost, manual,
    missing: Object.fromEntries(Object.entries(missing).map(([k, v]) => [k, v.length])),
  }, null, 2));
  for (const [reason, list] of Object.entries(missing)) console.log(`\n${reason} (${list.length}): ${list.join(' | ')}`);
}

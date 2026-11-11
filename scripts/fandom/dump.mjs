// Official Fandom database dumps (Special:Statistics → .cache/dump/*.7z). No network access.
//
//   genshinimpact_pages_current.7z  one (latest) revision per page, all namespaces
//   genshinimpact_pages_full.7z     every revision of every page
//
// The current dump answers the queries the build scripts used to send to api.php
// (allpages, categorymembers, redirects, categories, latest revisions). The full dump is
// used through a revision index (.cache/dump-index/) for "the page as it was at time T":
// when the page has no revision at or before T, the answer is "none", never a later revision.
import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { createGunzip, createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { categoryLinks, pageCategories, releaseVersionList, unconditionalCategories } from './dump-categories.mjs';
import { Expander } from './expand.mjs';

export const CURRENT = 'genshinimpact_pages_current.7z';
export const FULL = 'genshinimpact_pages_full.7z';
const INDEX_FORMAT = 2;

// ---------- titles ----------

const ucfirst = (s) => {
  if (!s) return s;
  const cp = s.codePointAt(0);
  const first = String.fromCodePoint(cp);
  return first.toUpperCase() + s.slice(first.length);
};

/**
 * MediaWiki title normalization for a first-letter wiki: underscores and runs of spaces become
 * one space, a known namespace prefix takes its canonical spelling, and the first letter of the
 * page name is upper-cased. `namespaces` maps lower-case namespace names to canonical ones.
 */
export function canonicalTitle(title, namespaces = DEFAULT_NAMESPACES) {
  let s = String(title ?? '').replace(/[_\s]+/g, ' ').trim();
  if (s.startsWith(':')) s = s.slice(1).trim();
  const colon = s.indexOf(':');
  if (colon > 0) {
    const ns = namespaces.get(s.slice(0, colon).trim().toLowerCase());
    if (ns !== undefined) {
      const rest = s.slice(colon + 1).trim();
      return ns ? `${ns}:${ucfirst(rest)}` : ucfirst(rest);
    }
  }
  return ucfirst(s);
}

const DEFAULT_NAMESPACES = new Map(
  ['Talk', 'User', 'User talk', 'File', 'Image', 'MediaWiki', 'Template', 'Help', 'Category', 'Module', 'Special', 'Media']
    .map((n) => [n.toLowerCase(), n === 'Image' ? 'File' : n]),
);

// ---------- XML ----------

export function decodeXml(s) {
  if (!s.includes('&')) return s;
  return s.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
    switch (e) {
      case 'lt': return '<';
      case 'gt': return '>';
      case 'amp': return '&';
      case 'quot': return '"';
      case 'apos': return "'";
      default: return e[1] === 'x' || e[1] === 'X'
        ? String.fromCodePoint(parseInt(e.slice(2), 16))
        : String.fromCodePoint(Number(e.slice(1)));
    }
  });
}

/** A copy that does not keep the (large) source string alive (V8 sliced strings do). */
const own = (s) => (s == null ? s : (' ' + s).slice(1));

const tag = (xml, name) => {
  const open = xml.indexOf(`<${name}>`);
  if (open === -1) return null;
  const close = xml.indexOf(`</${name}>`, open);
  return close === -1 ? null : xml.slice(open + name.length + 2, close);
};

/** Parse a `<revision>…</revision>` block. Text is decoded only when `withText` is set. */
export function parseRevision(xml, withText = true) {
  const textAt = xml.indexOf('<text');
  const head = textAt === -1 ? xml : xml.slice(0, textAt);
  const revid = Number(tag(head, 'id'));
  const parent = tag(head, 'parentid');
  const timestamp = tag(head, 'timestamp') ?? '';
  const sha1At = xml.lastIndexOf('<sha1>');
  const sha1 = sha1At === -1 ? '' : tag(xml.slice(sha1At), 'sha1') ?? '';
  let content = null, bytes = 0;
  if (textAt !== -1) {
    const gt = xml.indexOf('>', textAt);
    const attrs = xml.slice(textAt, gt);
    bytes = Number(attrs.match(/bytes="(\d+)"/)?.[1] ?? 0);
    const deleted = /\bdeleted="deleted"/.test(attrs);
    // <text ... /> is an empty text, or a suppressed one (deleted="deleted": content stays null)
    if (withText && !deleted) content = attrs.endsWith('/') ? '' : decodeXml(xml.slice(gt + 1, xml.indexOf('</text>', gt)));
  }
  return { revid, parentid: parent ? Number(parent) : 0, timestamp, bytes, sha1, content };
}

/** Parse one `<page>` block of the current dump (one revision). */
export function parseCurrentPage(xml) {
  const revAt = xml.indexOf('<revision>');
  const head = revAt === -1 ? xml : xml.slice(0, revAt);
  const title = tag(head, 'title');
  const ns = Number(tag(head, 'ns') ?? -1);
  const pageid = Number(tag(head, 'id') ?? 0);
  const redirectTag = head.match(/<redirect title="([^"]*)"/)?.[1];
  const revXml = xml.slice(xml.indexOf('<revision>'), xml.lastIndexOf('</revision>') + 11);
  if (title == null || ns < 0 || !revXml.startsWith('<revision>')) return null;
  const rev = parseRevision(revXml, true);
  const page = { title: decodeXml(title), ns, pageid, revid: rev.revid, timestamp: rev.timestamp, content: rev.content ?? '' };
  const target = redirectTarget(page.content) ?? (redirectTag != null ? decodeXml(redirectTag) : null);
  if (target) page.redirect = target;
  return page;
}

/** `#REDIRECT [[Target#frag|label]]` → raw target (fragment dropped), else null. */
export function redirectTarget(content) {
  const m = /^\s*#REDIRECT\s*:?\s*\[\[([^\]|#]*)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/i.exec(content);
  return m && m[1].trim() ? m[1].trim() : null;
}

/**
 * Stream a dump archive through `7z e -so` and call back per page header and per revision,
 * without holding a whole page (with all its revisions) in memory.
 *   onPage({ title, ns, pageid })            once per page, before its revisions
 *   onRevision(page, revisionXml)            per revision block
 */
export async function streamDump(archivePath, { onSiteinfo, onPage, onRevision }) {
  await stat(archivePath);
  const proc = spawn('7z', ['e', '-so', archivePath], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d; });
  const closed = new Promise((res) => proc.on('close', res));
  const decoder = new StringDecoder('utf8');
  let buf = '';
  let page = null;
  let siteinfoDone = !onSiteinfo;
  try {
  for await (const chunk of proc.stdout) {
    buf += decoder.write(chunk);
    let pos = 0;
    for (;;) {
      if (!siteinfoDone) {
        const end = buf.indexOf('</siteinfo>', pos);
        if (end === -1) break;
        onSiteinfo(buf.slice(buf.indexOf('<siteinfo>'), end + 11));
        siteinfoDone = true;
        pos = end + 11;
        continue;
      }
      if (!page) {
        const start = buf.indexOf('<page>', pos);
        if (start === -1) { pos = Math.max(pos, buf.length - 16); break; }
        const revStart = buf.indexOf('<revision>', start);
        const pageEnd = buf.indexOf('</page>', start);
        const headEnd = revStart === -1 ? pageEnd : (pageEnd === -1 ? revStart : Math.min(revStart, pageEnd));
        if (headEnd === -1) { pos = start; break; }
        const head = buf.slice(start, headEnd);
        page = {
          title: own(decodeXml(tag(head, 'title') ?? '')),
          ns: Number(tag(head, 'ns') ?? -1),
          pageid: Number(tag(head, 'id') ?? 0),
          redirectTag: head.match(/<redirect title="([^"]*)"/)?.[1],
        };
        onPage?.(page);
        pos = headEnd;
        continue;
      }
      const revStart = buf.indexOf('<revision>', pos);
      const pageEnd = buf.indexOf('</page>', pos);
      if (revStart !== -1 && (pageEnd === -1 || revStart < pageEnd)) {
        const revEnd = buf.indexOf('</revision>', revStart);
        if (revEnd === -1) { pos = revStart; break; }
        onRevision?.(page, buf.slice(revStart, revEnd + 11));
        pos = revEnd + 11;
        continue;
      }
      if (pageEnd === -1) break;
      page = null;
      pos = pageEnd + 7;
    }
    buf = buf.slice(pos);
  }
  } catch (e) {
    proc.kill();
    await closed;
    throw e;
  }
  const code = await closed;
  if (code !== 0) throw new Error(`7z exited with ${code} for ${archivePath}: ${stderr.trim()}`);
}

function parseSiteinfo(xml) {
  const namespaces = new Map();
  const names = new Map();
  for (const m of xml.matchAll(/<namespace key="(-?\d+)"[^>]*?(?:\/>|>([^<]*)<\/namespace>)/g)) {
    const name = decodeXml(m[2] ?? '');
    names.set(Number(m[1]), name);
    namespaces.set(name.toLowerCase(), name);
  }
  namespaces.set('image', 'File');
  namespaces.set('project', names.get(4) ?? 'Project');
  return {
    sitename: tag(xml, 'sitename'),
    dbname: tag(xml, 'dbname'),
    generator: tag(xml, 'generator'),
    namespaces,
    nsNames: names,
  };
}

// ---------- current dump ----------

/** Namespaces whose page text is kept in memory (main, template, category, module). */
const TEXT_NAMESPACES = new Set([0, 10, 14, 828]);

/**
 * Load the current dump. Every page is indexed by title (namespace, id, redirect target);
 * page text is kept for the namespaces in TEXT_NAMESPACES.
 */
export async function loadCurrentDump(dumpDir = '.cache/dump') {
  const path = join(dumpDir, CURRENT);
  let site = { namespaces: DEFAULT_NAMESPACES, nsNames: new Map() };
  /** @type {Map<string, { title, ns, pageid, revid, timestamp, content?, redirect? }>} */
  const pages = new Map();
  let lastEdit = '';
  await streamDump(path, {
    onSiteinfo: (xml) => { site = parseSiteinfo(xml); },
    onRevision: (p, xml) => {
      const keep = TEXT_NAMESPACES.has(p.ns);
      const rev = parseRevision(xml, true);
      const content = rev.content ?? '';
      const page = { title: p.title, ns: p.ns, pageid: p.pageid, revid: rev.revid, timestamp: own(rev.timestamp) };
      if (keep) page.content = content;
      const target = redirectTarget(content) ?? (p.redirectTag != null ? decodeXml(p.redirectTag) : null);
      if (target) page.redirect = canonicalTitle(target, site.namespaces);
      if (rev.timestamp > lastEdit) lastEdit = own(rev.timestamp);
      pages.set(p.title, page);
    },
  });
  return { path, site, pages, lastEdit };
}

/**
 * Query layer over the current dump that answers the api.php requests FandomClient makes
 * (formatversion=2 response shapes). Categories are derived by dump-categories.mjs.
 */
export async function loadDump(dumpDir = '.cache/dump') {
  const current = await loadCurrentDump(dumpDir);
  const { pages, site } = current;
  const norm = (t) => canonicalTitle(t, site.namespaces);
  const get = (t) => pages.get(t) ?? pages.get(norm(t));

  // categories of every main-namespace article, and members per category
  const releaseVersions = releaseVersionList(get('Template:Change History')?.content ?? '');
  const hidden = new Set();
  for (const p of pages.values()) {
    if (p.ns === 14 && p.content != null && isHiddenCategory(p.content)) hidden.add(p.title);
  }
  const templateCats = new Map();
  const templateCategories = (name) => {
    if (templateCats.has(name)) return templateCats.get(name);
    const f = follow(`Template:${name}`);
    const cats = f.page?.content != null ? unconditionalCategories(f.page.content) : [];
    templateCats.set(name, cats);
    return cats;
  };
  /** @type {Map<string, { title: string, sortkey: string }[]>} */
  const members = new Map();
  /** @type {Map<string, string[]>} */
  const categoriesOf = new Map();
  for (const p of pages.values()) {
    if (p.ns !== 0 || p.redirect || p.content == null) continue;
    const { categories, sortkey } = pageCategories(p.content, p.title, { releaseVersions, templateCategories });
    const titles = categories.map((c) => norm(`Category:${c}`));
    categoriesOf.set(p.title, [...new Set(titles)]);
    for (const c of new Set(titles)) {
      if (!members.has(c)) members.set(c, []);
      members.get(c).push({ title: p.title, sortkey: sortkey(c) });
    }
  }
  // MediaWiki lists category members by sort key (uppercase collation), then title
  for (const list of members.values()) {
    list.sort((a, b) => cmp(a.sortkey, b.sortkey) || cmp(a.title, b.title));
  }
  // Full page categories (prop=categories): the rules above plus the categories that the
  // page's templates produce when expanded. Computed on demand; slower than the rules.
  const expander = new Expander({ getPage: get, canonicalTitle: norm, siteName: site.sitename ?? '' });
  const expandedCats = new Map();
  function fullCategories(title) {
    if (expandedCats.has(title)) return expandedCats.get(title);
    const p = pages.get(title);
    const out = new Set(categoriesOf.get(title) ?? []);
    if (p?.content != null) {
      const { text } = expander.expandPage(p.title, p.content);
      for (const c of categoryLinks(text)) out.add(norm(`Category:${c}`));
    }
    const list = [...out];
    expandedCats.set(title, list);
    return list;
  }
  const mainTitles = [...pages.values()].filter((p) => p.ns === 0).map((p) => p.title).sort(cmpDbKey);

  /** Follow redirects (with loop guard). */
  function follow(raw) {
    const normalized = norm(raw);
    const redirects = [];
    let cur = normalized;
    const seen = new Set([cur]);
    for (;;) {
      const page = pages.get(cur);
      if (!page?.redirect) return { normalized, target: cur, page, redirects };
      redirects.push({ from: cur, to: page.redirect });
      cur = page.redirect;
      if (seen.has(cur)) return { normalized, target: cur, page: pages.get(cur), redirects, loop: true };
      seen.add(cur);
    }
  }

  function page2(page, title) {
    if (!page) return { ns: nsOf(title), title, missing: true };
    return { pageid: page.pageid, ns: page.ns, title: page.title };
  }
  const nsOf = (title) => {
    const c = title.indexOf(':');
    if (c > 0) for (const [k, v] of site.nsNames) if (v && v === title.slice(0, c)) return k;
    return 0;
  };

  function list(all, start, limit, key) {
    const s = Number(start ?? 0);
    const n = Number(limit === 'max' ? 500 : limit ?? 10);
    const slice = all.slice(s, s + n);
    const out = { batchcomplete: true, query: { [key]: slice.map((title) => ({ ns: nsOf(title), title })) } };
    if (s + n < all.length) out.continue = { [key === 'allpages' ? 'apcontinue' : 'cmcontinue']: String(s + n), continue: '-||' };
    return out;
  }

  const warned = new Set();
  /** formatversion=2 responses for the parameter sets FandomClient sends. */
  function query(params) {
    if ((params.action ?? 'query') !== 'query') throw new Error(`dump: unsupported action ${params.action}`);
    if (params.list === 'categorymembers') {
      if (params.cmnamespace != null && String(params.cmnamespace) !== '0') throw new Error('dump: categorymembers supports cmnamespace=0 only');
      const cat = norm(params.cmtitle);
      const all = (members.get(cat) ?? []).map((m) => m.title);
      if (!all.length && !warned.has(cat)) {
        warned.add(cat);
        console.error(`[dump] ${cat}: no members. Category lists cover explicit links and the template rules in dump-categories.mjs only.`);
      }
      return list(all, params.cmcontinue, params.cmlimit, 'categorymembers');
    }
    if (params.list === 'allpages') {
      if (params.apnamespace != null && String(params.apnamespace) !== '0') throw new Error('dump: allpages supports apnamespace=0 only');
      const prefix = params.apprefix ? norm(params.apprefix) : '';
      const all = mainTitles.filter((t) => t.startsWith(prefix));
      return list(all, params.apcontinue, params.aplimit, 'allpages');
    }
    if (params.list) throw new Error(`dump: unsupported list=${params.list}`);

    const titles = String(params.titles ?? '').split('|').filter(Boolean);
    const resolveRedirects = params.redirects != null && params.redirects !== false && params.redirects !== '0';
    const normalized = [];
    const redirects = [];
    const out = [];
    const seen = new Set();
    for (const raw of titles) {
      const f = follow(raw);
      if (f.normalized !== raw) normalized.push({ fromencoded: false, from: raw, to: f.normalized });
      let page = pages.get(f.normalized);
      let title = f.normalized;
      if (resolveRedirects && f.redirects.length) {
        redirects.push(...f.redirects);
        page = f.page;
        title = f.target;
      }
      if (seen.has(title)) continue;
      seen.add(title);
      const entry = page2(page, title);
      if (page && params.prop) {
        const props = String(params.prop).split('|');
        if (props.includes('revisions')) {
          entry.revisions = [{
            revid: page.revid,
            timestamp: page.timestamp,
            slots: { main: { contentmodel: 'wikitext', contentformat: 'text/x-wiki', content: page.content ?? '' } },
          }];
        }
        if (props.includes('categories')) {
          const showHidden = !String(params.clshow ?? '').includes('!hidden');
          const cats = fullCategories(page.title).filter((c) => showHidden || !hidden.has(c));
          if (cats.length) entry.categories = cats.sort(cmp).map((c) => ({ ns: 14, title: c }));
        }
        const unknown = props.filter((p) => p !== 'revisions' && p !== 'categories');
        if (unknown.length) throw new Error(`dump: unsupported prop=${unknown.join('|')}`);
      }
      out.push(entry);
    }
    const q = {};
    if (normalized.length) q.normalized = normalized;
    if (redirects.length) q.redirects = dedupe(redirects);
    q.pages = out;
    return { batchcomplete: true, query: q };
  }

  return {
    ...current,
    releaseVersions,
    hiddenCategories: hidden,
    categoryMembers: members,
    categoriesOf,
    fullCategories,
    mainTitles,
    canonicalTitle: norm,
    page: get,
    follow,
    query,
  };
}

const dedupe = (rs) => {
  const seen = new Set();
  return rs.filter((r) => { const k = `${r.from}\n${r.to}`; if (seen.has(k)) return false; seen.add(k); return true; });
};

function isHiddenCategory(content) {
  return /__HIDDENCAT__/.test(content) || /\{\{\s*(?:Hidden Category|Hiddencat|Maintenance Category|Tracking Category)\b/i.test(content);
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
// allpages orders by DB key (spaces as underscores), byte-wise
const cmpDbKey = (a, b) => Buffer.compare(Buffer.from(a.replace(/ /g, '_')), Buffer.from(b.replace(/ /g, '_')));

// ---------- full-history revision index ----------

/**
 * Revision metadata of every main-namespace page in the full dump, cached on disk:
 * { format, archive: { size, mtimeMs }, lastEdit, pages: { [title]: { pageid, revs: [[revid, parentid, unix seconds, bytes, sha1]] } } }
 * revs are sorted by timestamp, then revid. Built once (one pass over the archive).
 */
export async function loadRevisionIndex(dumpDir = '.cache/dump', { indexDir = join(dirname(dumpDir), 'dump-index'), namespaces = [0], log = () => {} } = {}) {
  const path = join(dumpDir, FULL);
  const st = await stat(path);
  const file = join(indexDir, `${FULL}.ns${namespaces.join('-')}.revisions.json.gz`);
  try {
    const idx = JSON.parse(await gunzipFile(file));
    if (idx.format === INDEX_FORMAT && idx.archive.size === st.size && idx.archive.mtimeMs === st.mtimeMs) return wrapIndex(idx);
    log(`revision index ${file} is stale; rebuilding`);
  } catch { /* build below */ }

  const want = new Set(namespaces);
  const pages = {};
  let lastEdit = '';
  let revisions = 0;
  let cur = null;
  log(`building revision index from ${path} (one pass)…`);
  const started = Date.now();
  await streamDump(path, {
    onPage: (p) => {
      cur = want.has(p.ns) ? (pages[p.title] = { pageid: p.pageid, ns: p.ns, revs: [] }) : null;
    },
    onRevision: (_p, xml) => {
      const r = parseRevision(xml, false);
      if (r.timestamp > lastEdit) lastEdit = own(r.timestamp);
      revisions++;
      if (cur) cur.revs.push([r.revid, r.parentid, Date.parse(r.timestamp) / 1000, r.bytes, own(r.sha1)]);
    },
  });
  for (const p of Object.values(pages)) p.revs.sort((a, b) => a[2] - b[2] || a[0] - b[0]);
  const idx = { format: INDEX_FORMAT, archive: { file: FULL, size: st.size, mtimeMs: st.mtimeMs }, namespaces, lastEdit, revisions, pages };
  await mkdir(indexDir, { recursive: true });
  await gzipFile(`${file}.tmp`, JSON.stringify(idx));
  await rename(`${file}.tmp`, file);
  log(`revision index: ${Object.keys(pages).length} pages, ${revisions} revisions in all namespaces, ${((Date.now() - started) / 1000).toFixed(0)}s`);
  return wrapIndex(idx);
}

function wrapIndex(idx) {
  const byRevid = new Map();
  for (const [title, p] of Object.entries(idx.pages)) for (const r of p.revs) byRevid.set(r[0], title);
  const row = (title, r) => ({ title, revid: r[0], parentid: r[1], timestamp: isoOf(r[2]), bytes: r[3], sha1: r[4] });
  return {
    ...idx,
    /** Revision metadata by id (main namespace), or null when the dump does not have it. */
    revision(revid) {
      const title = byRevid.get(Number(revid));
      if (!title) return null;
      return row(title, idx.pages[title].revs.find((r) => r[0] === Number(revid)));
    },
    /** All revisions of a page (current title), oldest first. */
    history(title) {
      return (idx.pages[title]?.revs ?? []).map((r) => row(title, r));
    },
    /**
     * The revision of `title` that was current at `at` (ISO timestamp, inclusive).
     *   { status: 'ok', revision }       latest revision with timestamp <= at
     *   { status: 'not-yet' }             the page's first revision is later than `at`
     *   { status: 'missing' }             no such page in the full dump
     *   { status: 'beyond-dump' }         `at` is after the dump's last edit: the true revision
     *                                     may be newer than anything in the dump
     * A later revision is never returned in place of a missing earlier one.
     */
    revisionAt(title, at) {
      const iso = toIso(at);
      if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(iso)) throw new Error(`revisionAt: expected an ISO timestamp like 2026-01-01T00:00:00Z, got ${at}`);
      if (iso > idx.lastEdit) return { status: 'beyond-dump', lastEdit: idx.lastEdit };
      const sec = Date.parse(iso) / 1000;
      const p = idx.pages[title];
      if (!p || !p.revs.length) return { status: 'missing' };
      let lo = 0, hi = p.revs.length - 1, hit = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (p.revs[mid][2] <= sec) { hit = mid; lo = mid + 1; } else hi = mid - 1;
      }
      if (hit === -1) return { status: 'not-yet', first: row(title, p.revs[0]) };
      return { status: 'ok', revision: row(title, p.revs[hit]) };
    },
  };
}

const isoOf = (sec) => new Date(sec * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const toIso = (at) => (at instanceof Date ? at.toISOString().replace(/\.\d{3}Z$/, 'Z') : String(at));

/**
 * Text of specific revisions from the full dump, in one pass: Map<revid, { title, revid, timestamp, content }>.
 * Revisions not in the dump are absent from the result.
 */
export async function revisionContents(revids, dumpDir = '.cache/dump') {
  const want = new Set([...revids].map(Number));
  const out = new Map();
  if (!want.size) return out;
  const done = new Error('done');
  try {
    await streamDump(join(dumpDir, FULL), {
      onRevision: (p, xml) => {
        const id = Number(tag(xml.slice(0, 200), 'id'));
        if (!want.has(id)) return;
        const r = parseRevision(xml, true);
        out.set(id, { title: p.title, revid: id, timestamp: r.timestamp, content: r.content });
        if (out.size === want.size) throw done;
      },
    });
  } catch (e) {
    if (e !== done) throw e;
  }
  return out;
}

/**
 * Cut-off for "the wiki as of version V" (decided 2026-11-11): one day before the next
 * version's release, i.e. 00:00 UTC of the day before its release date. Updates go live on the
 * release morning in UTC+8 (the evening before in UTC), so the day before is left out entirely.
 * `versions` is versions.json (release order). Returns null for the last listed version: its
 * period has not ended within the data, so there is no cut-off and no revision to pick.
 */
export function versionCutoff(versions, id) {
  const i = versions.findIndex((x) => x.id === id);
  const next = i === -1 ? null : versions[i + 1];
  const day = next?.released ?? next?.date;
  if (!day) return null;
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Start of a version's release day in UTC (`released` in versions.json), or null. */
export function versionStart(versions, id) {
  const v = versions.find((x) => x.id === id);
  const day = v?.released ?? v?.date;
  return day ? `${day}T00:00:00Z` : null;
}

async function gunzipFile(file) {
  const chunks = [];
  await pipeline(createReadStream(file), createGunzip(), async function* (src) { for await (const c of src) chunks.push(c); });
  return Buffer.concat(chunks).toString('utf8');
}

async function gzipFile(file, text) {
  await pipeline(Readable.from([Buffer.from(text)]), createGzip(), createWriteStream(file));
}

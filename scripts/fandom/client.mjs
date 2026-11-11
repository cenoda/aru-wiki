// Fandom wiki text for the build scripts, read from the official database dump
// (docs/rights-risk-2026-11-11.md). There is no network access: automatic api.php calls are
// disabled. The old api.php response cache (.cache/fandom) can still be read for comparison
// with `source: 'legacy'` (or ARU_FANDOM_SOURCE=legacy); nothing is ever fetched to fill it.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadDump, loadRevisionIndex, revisionContents, versionCutoff } from './dump.mjs';
import { generatedFile } from './paths.mjs';

const shared = new Map(); // dumpDir → Promise<dump>

const DISABLED = 'Automatic Fandom access is disabled; use the official database dump (docs/rights-risk-2026-11-11.md).';

export class FandomClient {
  constructor({
    cacheDir = '.cache/fandom',
    dumpDir = '.cache/dump',
    refresh = false,
    source = process.env.ARU_FANDOM_SOURCE ?? 'dump',
  } = {}) {
    if (source !== 'dump' && source !== 'legacy') throw new Error(`Unknown Fandom source: ${source}`);
    this.cacheDir = cacheDir;
    this.dumpDir = dumpDir;
    this.refresh = refresh;
    this.source = source;
    this.requests = 0; // network requests: always 0 (build scripts log this)
    this.lookups = 0; // dump / cache queries answered
  }

  /** The loaded current dump (shared by every client in the process). */
  dump() {
    if (!shared.has(this.dumpDir)) shared.set(this.dumpDir, loadDump(this.dumpDir));
    return shared.get(this.dumpDir);
  }

  /** Date (YYYY-MM-DD) up to which the source reflects the wiki, or null when unknown (legacy cache). */
  async asOf() {
    return this.source === 'dump' ? (await this.dump()).lastEdit.slice(0, 10) : null;
  }

  /** api.php-shaped response for `params`, from the dump or the legacy cache. */
  async get(params) {
    if (this.refresh) throw new Error(`--refresh is unavailable. ${DISABLED}`);
    this.lookups++;
    if (this.source === 'dump') return (await this.dump()).query(params);
    const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
    const key = createHash('sha1').update(qs.toString()).digest('hex');
    const file = join(this.cacheDir, `${key}.json`);
    try {
      return JSON.parse(await readFile(file, 'utf8'));
    } catch (cause) {
      throw new Error(`Fandom cache is missing or unreadable: ${file}. ${DISABLED}`, { cause });
    }
  }

  /** All main-namespace page titles in a category. */
  async categoryMembers(category) {
    const out = [];
    let cont = {};
    for (;;) {
      const d = await this.get({ action: 'query', list: 'categorymembers', cmtitle: category, cmnamespace: '0', cmlimit: '500', ...cont });
      out.push(...d.query.categorymembers.map((m) => m.title));
      if (!d.continue) return out;
      cont = { cmcontinue: d.continue.cmcontinue };
    }
  }

  /** All main-namespace page titles starting with a prefix. */
  async prefixPages(prefix) {
    const out = [];
    let cont = {};
    for (;;) {
      const d = await this.get({ action: 'query', list: 'allpages', apprefix: prefix, apnamespace: '0', aplimit: '500', ...cont });
      out.push(...d.query.allpages.map((p) => p.title));
      if (!d.continue) return out;
      cont = { apcontinue: d.continue.apcontinue };
    }
  }

  /**
   * Latest revision of each page, following redirects.
   * Returns Map<requested title, { title, revid, timestamp, content }>.
   */
  async latest(titles) {
    const out = new Map();
    const unique = [...new Set(titles)];
    for (let i = 0; i < unique.length; i += 50) {
      const batch = unique.slice(i, i + 50);
      const d = await this.get({
        action: 'query', prop: 'revisions', rvprop: 'ids|timestamp|content', rvslots: 'main',
        redirects: '1', titles: batch.join('|'),
      });
      const step = new Map();
      for (const n of d.query.normalized ?? []) step.set(n.from, n.to);
      for (const r of d.query.redirects ?? []) step.set(r.from, r.to);
      const byTitle = new Map();
      for (const p of d.query.pages) {
        if (!p.revisions) continue;
        const rev = p.revisions[0];
        byTitle.set(p.title, { title: p.title, revid: rev.revid, timestamp: rev.timestamp, content: rev.slots.main.content });
      }
      for (const t of batch) {
        let cur = t;
        for (let k = 0; k < 3 && step.has(cur); k++) cur = step.get(cur);
        const page = byTitle.get(cur);
        if (page) { out.set(t, page); out.set(page.title, page); }
      }
    }
    return out;
  }

  /** Map<requested title, canonical title> after redirects; missing pages are left out. */
  async resolve(titles) {
    const out = new Map();
    const unique = [...new Set(titles)];
    for (let i = 0; i < unique.length; i += 50) {
      const batch = unique.slice(i, i + 50);
      const d = await this.get({ action: 'query', redirects: '1', titles: batch.join('|') });
      const step = new Map();
      for (const n of d.query.normalized ?? []) step.set(n.from, n.to);
      for (const r of d.query.redirects ?? []) step.set(r.from, r.to);
      const exists = new Set(d.query.pages.filter((p) => !p.missing && !p.invalid).map((p) => p.title));
      for (const t of batch) {
        let cur = t;
        for (let k = 0; k < 3 && step.has(cur); k++) cur = step.get(cur);
        if (exists.has(cur)) out.set(t, cur);
      }
    }
    return out;
  }

  /**
   * Text of every main-namespace article (not redirects): Map<title, { revid, content }>.
   * Replaces reading the whole legacy cache directory.
   */
  async pageTexts() {
    if (this.source !== 'dump') throw new Error('pageTexts() reads the dump; use recommend/excerpt.mjs loadPages() for the legacy cache');
    const out = new Map();
    for (const p of (await this.dump()).pages.values()) {
      if (p.ns === 0 && !p.redirect && p.content != null) out.set(p.title, { revid: p.revid, content: p.content });
    }
    return out;
  }

  /**
   * The revision of a page that was current at `at` (ISO timestamp), from the full-history dump.
   * Redirects are followed as of the current dump. Statuses: ok | not-yet | missing | beyond-dump
   * (see dump.mjs). With `content: true` the text is read from the full dump (one pass).
   * A page with no revision at `at` gets no revision: never a later one.
   */
  async revisionAt(title, at, { content = false } = {}) {
    if (this.source !== 'dump') throw new Error('revisionAt() needs the full-history dump');
    const dump = await this.dump();
    const target = dump.follow(title).target;
    const idx = await loadRevisionIndex(this.dumpDir, { log: (...a) => console.error('[dump]', ...a) });
    const r = idx.revisionAt(target, at);
    if (r.status === 'ok' && content) {
      const text = (await revisionContents([r.revision.revid], this.dumpDir)).get(r.revision.revid);
      r.revision.content = text?.content ?? null;
    }
    return { requested: title, title: target, at, ...r };
  }

  /**
   * The page as of version `id`: revisionAt() at versionCutoff() (one day before the next
   * version's release). `versions` defaults to versions.json. For the last listed version there
   * is no cut-off yet: { status: 'open' } and no revision.
   */
  async revisionAtVersion(title, id, { versions, content = false } = {}) {
    versions ??= JSON.parse(await readFile(generatedFile('versions.json'), 'utf8'));
    if (!versions.some((v) => v.id === id)) throw new Error(`Unknown version: ${id}`);
    const at = versionCutoff(versions, id);
    if (!at) return { requested: title, version: id, at: null, status: 'open' };
    return { version: id, ...(await this.revisionAt(title, at, { content })) };
  }
}

export function pageUrl(title) {
  return `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

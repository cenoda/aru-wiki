// Polite MediaWiki API client for the Genshin Impact Fandom wiki:
// explicit User-Agent, one request at a time with a delay, on-disk cache.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const API = 'https://genshin-impact.fandom.com/api.php';
const USER_AGENT = 'aru-wiki-bot/0.1 (+https://aru.wiki; contact@aru.wiki)';

export class FandomClient {
  constructor({ cacheDir = '.cache/fandom', delayMs = 1000, refresh = false } = {}) {
    this.cacheDir = cacheDir;
    this.delayMs = delayMs;
    this.refresh = refresh;
    this.last = 0;
    this.requests = 0;
  }

  async get(params) {
    const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
    const key = createHash('sha1').update(qs.toString()).digest('hex');
    const file = join(this.cacheDir, `${key}.json`);
    if (!this.refresh) {
      try { return JSON.parse(await readFile(file, 'utf8')); } catch {}
    }
    for (let attempt = 0; ; attempt++) {
      const wait = this.last + this.delayMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.last = Date.now();
      this.requests++;
      try {
        const res = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': USER_AGENT } });
        if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(`API ${data.error.code}: ${data.error.info}`);
        await mkdir(this.cacheDir, { recursive: true });
        await writeFile(file, JSON.stringify(data));
        return data;
      } catch (e) {
        if (attempt >= 4) throw e;
        await sleep(2000 * 2 ** attempt);
      }
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
}

export function pageUrl(title) {
  return `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

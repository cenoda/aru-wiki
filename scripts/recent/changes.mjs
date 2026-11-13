// "최근 바뀜" (recent changes): what changed in the wiki, newest first. Built by
// scripts/build-runtime-data.mjs into data/runtime/recent.json, fetched only by that page.
//
// Two sources:
// - approved reader edits (data/manual/reader-edits.json): time = `approved_at` (review.mjs writes it
//   since 2026-11-13), else the `approved` date alone.
// - generated articles: the git history of data/generated/articles-khaenriah.json and the whole-wiki articles
//   (articles-all.json, since 2026-11-13 the folder articles-all/ with one file per page). For each
//   commit that touched them, a page's state is its shown articles as {from_version: input_hash}.
//   A page that appears is a new page, a new from_version is added text, a changed input_hash is a
//   rewrite (the writer read different sources). Edits that keep the input (name fixes) are not
//   listed. The working copy, when it differs from the last commit, counts at the file's mtime.
//   Each file version's state is cached by its git blob id in .cache/recent-changes/.
// Nothing about the people involved goes in, beyond the nickname a reader chose to show.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

const FILES = ['data/generated/articles-khaenriah.json', 'data/generated/articles-all.json'];
// since 2026-11-13 the whole wiki is one file per page (scripts/theme/article-store.mjs); before that one file,
// for one commit kept in Git LFS (the blob is then a pointer, read through `git lfs smudge`)
const ALL_DIR = 'data/generated/articles-all';

/** a whole-wiki article with at least one paragraph the site shows (build-runtime-data.mjs showsSomething) */
export const showsSomething = (a) => (a.paragraphs ?? []).some((p) => (p.status === 'accepted' || p.status === 'trimmed') && p.sentences.some((x) => !x.dropped));

/** page → {from_version: input_hash} for the articles the site would show */
export function signature(articles) {
  const out = {};
  for (const a of articles ?? []) if (showsSomething(a)) (out[a.node] ??= {})[a.from_version] = a.input_hash ?? '';
  return out;
}

/** The site keeps a theme page's theme article over the whole-wiki one (build-runtime-data.mjs articleList). */
export const mergeState = (theme, all) => ({ ...all, ...theme });

/** Rows for what changed between two states: k = new | more | redo, v = version ids involved. */
export function diffStates(prev, next, t) {
  const rows = [];
  for (const [page, vers] of Object.entries(next)) {
    const old = prev[page];
    if (!old) { rows.push({ t, page, k: 'new', v: Object.keys(vers) }); continue; }
    const added = Object.keys(vers).filter((v) => !(v in old));
    const redone = Object.keys(vers).filter((v) => v in old && old[v] !== vers[v]);
    if (added.length) rows.push({ t, page, k: 'more', v: added });
    if (redone.length) rows.push({ t, page, k: 'redo', v: redone });
  }
  return rows;
}

const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

/**
 * Article rows from the git history, oldest first. `current` = [theme articles, whole-wiki articles]
 * as the build read them from the working copy. Returns [] when git is not available.
 */
export function articleHistory(rootPath, current, { cacheDir = `${rootPath}/.cache/recent-changes` } = {}) {
  let log;
  try { log = git(rootPath, ['log', '--reverse', '--format=%H %cI', '--', ...FILES, ALL_DIR]).trim(); } catch { return []; }
  mkdirSync(cacheDir, { recursive: true });
  const text = (blob) => {
    const t = git(rootPath, ['cat-file', 'blob', blob]);
    return t.startsWith('version https://git-lfs') ? execFileSync('git', ['lfs', 'smudge'], { cwd: rootPath, input: t, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] }) : t;
  };
  const sigOfBlob = (blob) => {
    const cached = `${cacheDir}/${blob}.json`;
    if (existsSync(cached)) return JSON.parse(readFileSync(cached, 'utf8'));
    let sig = {};
    try { sig = signature(JSON.parse(text(blob)).articles); } catch { /* unreadable: empty */ }
    writeFileSync(cached, JSON.stringify(sig));
    return sig;
  };
  const sigOf = (sha, file) => {
    let blob;
    try { blob = git(rootPath, ['rev-parse', `${sha}:${file}`]).trim(); } catch { return {}; } // not there yet
    return sigOfBlob(blob);
  };
  // the page folder at that commit: every page file's signature, merged (cached per file blob)
  const sigOfDir = (sha) => {
    let tree;
    try { tree = git(rootPath, ['ls-tree', `${sha}:${ALL_DIR}`]).trim(); } catch { return null; } // no folder yet
    const out = {};
    for (const line of tree ? tree.split('\n') : []) {
      const [info, name] = line.split('\t');
      if (name === '_meta.json' || !name.endsWith('.json')) continue;
      Object.assign(out, sigOfBlob(info.split(' ')[2]));
    }
    return out;
  };
  const rows = [];
  let prev = {};
  for (const line of log ? log.split('\n') : []) {
    const [sha, when] = line.split(' ');
    const t = new Date(when).toISOString();
    const next = mergeState(sigOf(sha, FILES[0]), sigOfDir(sha) ?? sigOf(sha, FILES[1]));
    rows.push(...diffStates(prev, next, t));
    prev = next;
  }
  const work = mergeState(signature(current[0]), signature(current[1]));
  const dir = `${rootPath}/${ALL_DIR}`;
  const mtimes = [...FILES.map((f) => `${rootPath}/${f}`), ...(existsSync(dir) ? readdirSync(dir).map((f) => `${dir}/${f}`) : [])]
    .filter((f) => existsSync(f)).map((f) => statSync(f).mtimeMs);
  if (mtimes.length) rows.push(...diffStates(prev, work, new Date(Math.max(...mtimes)).toISOString()));
  return rows;
}

const clip = (s, n) => { const c = [...(s ?? '').replace(/\s+/g, ' ').trim()]; return c.length > n ? `${c.slice(0, n).join('')}…` : c.join(''); };

/** Rows for approved reader edits: k = edit | add | page. Only fields the article page already shows. */
export const readerRows = (edits) => (edits ?? []).filter((e) => e.approved_at || e.approved).map((e) => ({
  t: e.approved_at ?? e.approved, page: e.page, k: e.kind === 'edit' ? 'edit' : e.kind === 'page' ? 'page' : 'add', v: [e.v],
  ...(e.section ? { sec: e.section } : {}), s: clip(e.text, 60), ...(e.nick ? { nick: e.nick } : {}),
}));

/**
 * The runtime list, newest first. `order` maps version id → order; `revealedOf(page)` is the page's
 * reveal order, or undefined when no page by that id is on the site (reader pages pass through, a page
 * taken off the site drops). Each row carries g: the earliest version order at which it may be named.
 */
export function buildRecent(rows, { order, revealedOf, limit = 500 }) {
  const out = [];
  for (const r of rows) {
    const vs = r.v.map((v) => order.get(v)).filter((x) => x !== undefined);
    if (!vs.length) continue;
    const reader = r.k === 'edit' || r.k === 'add' || r.k === 'page';
    const rev = revealedOf(r.page);
    if (rev === undefined && !(reader && r.k !== 'edit')) continue;
    const { v, ...rest } = r;
    out.push({ ...rest, v: vs.sort((a, b) => a - b), g: Math.max(rev ?? 0, Math.min(...vs)) });
  }
  // newest first; a date-only time (reader edits approved before approved_at) sorts as that day's end
  const key = (t) => (t.length === 10 ? `${t}T23:59:59Z` : t);
  out.sort((a, b) => (key(a.t) < key(b.t) ? 1 : key(a.t) > key(b.t) ? -1 : 0));
  return out.slice(0, limit);
}

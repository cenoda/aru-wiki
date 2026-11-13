// Articles of a theme as one file per page (data/generated/articles-<theme>/), or one JSON file.
// The whole-wiki set outgrew a single file (53 MB at 836 pages, about 85 MB when done; GitHub refuses
// files over 100 MB), and one file per page keeps a commit to the pages that changed.
//   <dir>/_meta.json         { theme, note }
//   <dir>/<slug>-<hash>.json { node, articles: [every version of that page] }
// Readers get the same shape as the single file: { theme, note, articles } with articles sorted by page,
// then in the order kept in each page file. A path ending in .json is read and written as one file.
//   node scripts/theme/article-store.mjs split <file.json> <dir>   (one file → page files)
//   node scripts/theme/article-store.mjs count <path>              (number of articles)
import { createHash } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const META = '_meta.json';
const written = new Map(); // file → text this process last wrote: a save after every article reads no page twice
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

/** File name of a page: readable part plus a short hash, so "A-B" and "A B" never share a file. */
export const pageFile = (node) =>
  `${node.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'page'}-${createHash('sha1').update(node).digest('hex').slice(0, 8)}.json`;

/** The path a theme's articles live at: the page folder when there is one (or for the whole wiki), else the single file. */
export function articlesPath(genDir, theme) {
  const dir = join(genDir, `articles-${theme}`);
  if (isDir(dir)) return dir;
  return existsSync(`${dir}.json`) || theme !== 'all' ? `${dir}.json` : dir; // an old single file is still read
}

/** { theme, note, articles }, or `fallback` when nothing is there yet. */
export async function readArticles(path, fallback = undefined) {
  if (isDir(path)) {
    const names = (await readdir(path)).filter((f) => f.endsWith('.json') && f !== META);
    const meta = existsSync(join(path, META)) ? JSON.parse(await readFile(join(path, META), 'utf8')) : {};
    const pages = await Promise.all(names.map(async (f) => JSON.parse(await readFile(join(path, f), 'utf8'))));
    pages.sort((a, b) => a.node.localeCompare(b.node));
    return { ...meta, articles: pages.flatMap((p) => p.articles) };
  }
  if (existsSync(path)) return JSON.parse(await readFile(path, 'utf8'));
  if (fallback !== undefined) return fallback;
  throw Object.assign(new Error(`no articles at ${path}`), { code: 'ENOENT' });
}

/** Write { theme, note, articles }; in a folder only the pages whose text changed are rewritten, and pages gone are removed. */
export async function writeArticles(path, data) {
  const { articles, ...meta } = data;
  if (path.endsWith('.json')) { await writeFile(`${path}.tmp`, `${JSON.stringify(data, null, 1)}\n`); await rename(`${path}.tmp`, path); return; }
  await mkdir(path, { recursive: true });
  const byNode = new Map();
  for (const a of articles) { if (!byNode.has(a.node)) byNode.set(a.node, []); byNode.get(a.node).push(a); }
  const keep = new Set([META]);
  const put = async (name, text) => {
    keep.add(name);
    const file = join(path, name);
    if (written.get(file) === text) return;
    if (!written.has(file) && existsSync(file) && (await readFile(file, 'utf8')) === text) { written.set(file, text); return; }
    await writeFile(`${file}.tmp`, text); // a reader never sees half a file
    await rename(`${file}.tmp`, file);
    written.set(file, text);
  };
  await put(META, `${JSON.stringify(meta, null, 1)}\n`);
  for (const [node, list] of byNode) await put(pageFile(node), `${JSON.stringify({ node, articles: list }, null, 1)}\n`);
  for (const f of await readdir(path)) if (f.endsWith('.json') && !keep.has(f)) { await rm(join(path, f)); written.delete(join(path, f)); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'split' && a && b) { const d = await readArticles(a); await writeArticles(b, d); console.log(`${d.articles.length} articles → ${b}`); }
  else if (cmd === 'count' && a) console.log((await readArticles(a, { articles: [] })).articles.length);
  else { console.error('usage: article-store.mjs split <file.json> <dir> | count <path>'); process.exit(1); }
}

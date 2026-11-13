import assert from 'node:assert/strict';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { articlesPath, pageFile, readArticles, writeArticles } from './article-store.mjs';

const data = (arts) => ({ theme: 'all', note: 'n', articles: arts });
const art = (node, v) => ({ node, from_version: v, paragraphs: [] });

test('page folder round trip keeps the single-file shape and order', async () => {
  const dir = join(await mkdtemp(join(tmpdir(), 'store-')), 'articles-all');
  const d = data([art('A B', '1.0'), art('A B', '2.0'), art('A-B', '1.0'), art('Zed', '1.0')]);
  await writeArticles(dir, d);
  assert.deepEqual(await readArticles(dir), d);
  assert.equal((await readdir(dir)).length, 4); // three pages + _meta.json
  assert.notEqual(pageFile('A B'), pageFile('A-B'));
});

test('a page gone from the set loses its file; unchanged pages are not rewritten', async () => {
  const dir = join(await mkdtemp(join(tmpdir(), 'store-')), 'articles-all');
  await writeArticles(dir, data([art('A', '1.0'), art('B', '1.0')]));
  await writeArticles(dir, data([art('A', '1.0')]));
  assert.deepEqual((await readdir(dir)).sort(), ['_meta.json', pageFile('A')].sort());
});

test('a .json path stays one file, and an old single file is still found', async () => {
  const gen = await mkdtemp(join(tmpdir(), 'store-'));
  const file = join(gen, 'articles-x.json');
  await writeArticles(file, data([art('A', '1.0')]));
  assert.deepEqual(await readArticles(file), data([art('A', '1.0')]));
  assert.equal(articlesPath(gen, 'x'), file);
  assert.equal(articlesPath(gen, 'all'), join(gen, 'articles-all')); // nothing yet: the whole wiki goes in a folder
  await writeFile(join(gen, 'articles-all.json'), JSON.stringify(data([])));
  assert.equal(articlesPath(gen, 'all'), join(gen, 'articles-all.json'));
  assert.deepEqual(await readArticles(join(gen, 'missing'), { articles: [] }), { articles: [] });
});

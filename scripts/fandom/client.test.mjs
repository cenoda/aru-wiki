import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FandomClient } from './client.mjs';
import { CURRENT, FULL } from './dump.mjs';

async function tinyDump(t) {
  const dir = await mkdtemp(join(tmpdir(), 'aru-client-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const rev = (id, ts, text) => `<revision><id>${id}</id><timestamp>${ts}</timestamp><text bytes="1" xml:space="preserve">${text}</text></revision>`;
  const xml = (revs) => `<mediawiki><siteinfo><sitename>T</sitename></siteinfo><page><title>Paimon</title><ns>0</ns><id>1</id>${revs}</page></mediawiki>`;
  for (const [name, body] of [[CURRENT, rev(2, '2021-01-01T00:00:00Z', 'new')], [FULL, rev(1, '2020-01-01T00:00:00Z', 'old') + rev(2, '2021-01-01T00:00:00Z', 'new')]]) {
    await writeFile(join(dir, `${name}.xml`), xml(body));
    execFileSync('7z', ['a', '-bd', '-y', join(dir, 'dump', name), join(dir, `${name}.xml`)], { stdio: 'ignore' });
  }
  return join(dir, 'dump');
}

test('the dump is the default source and nothing touches the network', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request'); });
  const client = new FandomClient({ dumpDir: await tinyDump(t), source: 'dump' });
  assert.equal(new FandomClient().source, process.env.ARU_FANDOM_SOURCE ?? 'dump');
  const pages = await client.latest(['paimon']);
  assert.equal(pages.get('paimon').content, 'new');
  assert.equal(await client.asOf(), '2021-01-01');
  assert.deepEqual([...(await client.pageTexts()).keys()], ['Paimon']);

  const old = await client.revisionAt('Paimon', '2020-06-01T00:00:00Z', { content: true });
  assert.deepEqual([old.status, old.revision.revid, old.revision.content], ['ok', 1, 'old']);
  assert.equal((await client.revisionAt('Paimon', '2019-01-01T00:00:00Z')).status, 'not-yet');
  assert.equal((await client.revisionAt('Paimon', '2030-01-01T00:00:00Z')).status, 'beyond-dump');
  const versions = [{ id: '1.0', released: '2020-01-01' }, { id: '1.1', released: '2020-12-01' }, { id: '1.2', released: '2021-01-02' }];
  // 1.0 → cut-off 2020-11-30: revision 1 (2020-01-01); 1.1 → cut-off 2021-01-01T00:00:00Z: revision 2 at exactly that time
  assert.equal((await client.revisionAtVersion('Paimon', '1.0', { versions })).revision.revid, 1);
  assert.equal((await client.revisionAtVersion('Paimon', '1.1', { versions })).revision.revid, 2);
  assert.equal((await client.revisionAtVersion('Paimon', '1.2', { versions })).status, 'open');
  await assert.rejects(client.revisionAtVersion('Paimon', '9.9', { versions }), /Unknown version/);
  assert.equal(client.requests, 0);
  assert.ok(client.lookups > 0);
  assert.equal(fetch.mock.callCount(), 0);
});

test('legacy cache is read only; missing, corrupt and --refresh never access Fandom', async (t) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'aru-fandom-cache-'));
  t.after(() => rm(cacheDir, { recursive: true, force: true }));
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request'); });
  const params = { action: 'query', titles: 'Paimon' };
  const key = createHash('sha1').update(new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString()).digest('hex');
  const file = join(cacheDir, `${key}.json`);
  const client = new FandomClient({ cacheDir, source: 'legacy' });

  await assert.rejects(client.get(params), /cache is missing or unreadable.*Automatic Fandom access is disabled/);
  await writeFile(file, '{invalid');
  await assert.rejects(client.get(params), /cache is missing or unreadable/);
  const cached = { query: { pages: [{ title: 'Paimon' }] } };
  await writeFile(file, JSON.stringify(cached));
  assert.deepEqual(await client.get(params), cached);
  await assert.rejects(new FandomClient({ cacheDir, refresh: true }).get(params), /--refresh is unavailable/);
  await assert.rejects(client.revisionAt('Paimon', '2020-01-01T00:00:00Z'), /full-history dump/);
  assert.throws(() => new FandomClient({ source: 'api' }), /Unknown Fandom source/);
  assert.equal(client.requests, 0);
  assert.equal(fetch.mock.callCount(), 0);
});

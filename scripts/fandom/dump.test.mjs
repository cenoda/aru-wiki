import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CURRENT, FULL, canonicalTitle, decodeXml, loadDump, loadRevisionIndex, parseCurrentPage, redirectTarget, revisionContents, versionCutoff, versionStart,
} from './dump.mjs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SITEINFO = `<siteinfo><sitename>Test Wiki</sitename><dbname>test</dbname><generator>MediaWiki 1.43</generator>
  <namespaces><namespace key="0" case="first-letter" /><namespace key="10" case="first-letter">Template</namespace>
  <namespace key="14" case="first-letter">Category</namespace><namespace key="828" case="first-letter">Module</namespace></namespaces></siteinfo>`;
let nextPage = 1;
const page = (title, ns, revs) => `<page><title>${esc(title)}</title><ns>${ns}</ns><id>${nextPage++}</id>${revs.map(([id, ts, text]) => `
  <revision><id>${id}</id><timestamp>${ts}</timestamp><model>wikitext</model><format>text/x-wiki</format>
  <text bytes="${Buffer.byteLength(text)}" sha1="x" xml:space="preserve">${esc(text)}</text><sha1>x</sha1></revision>`).join('')}</page>`;
const wiki = (pages) => `<mediawiki version="0.11">${SITEINFO}${pages.join('\n')}</mediawiki>`;

const CHANGE_HISTORY = '<includeonly>{{#switch:{{{1|}}}<!--\n-->|1.0|1.1|Luna I=[[Category:Released in Version {{{1|}}}]]|#default=[[Category:Released in Unknown Version]]}}</includeonly>';
const QUEST_A_OLD = '{{Quest Infobox|type=Archon}}\nOld text.';
const QUEST_A = '{{Quest Infobox\n|type = Archon\n<!-- |event_name = Hidden -->\n}}\n{{Change History|1.0}}\nText & more.\n[[Category:Lore|Zed]]';
const NPC = '{{Character Infobox|type=Mentioned}}\n{{Change History|1.1}}';
const CHAR_INFOBOX = '<includeonly>{{Namespace|main={{#switch:{{{type|}}}|NPC|Mentioned=[[Category:NPCs]][[Category:Mentioned Characters]]|#default=[[Category:Characters]]}}}}</includeonly>';

let dir;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'aru-dump-'));
  const current = wiki([
    page('Template:Change History', 10, [[50, '2025-01-01T00:00:00Z', CHANGE_HISTORY]]),
    page('Template:Character Infobox', 10, [[51, '2025-01-01T00:00:00Z', CHAR_INFOBOX]]),
    page('Template:Namespace', 10, [[52, '2025-01-01T00:00:00Z', '{{SAFESUBST:<noinclude />#invoke:Namespace detect}}']]),
    page('Category:Hidden Things', 14, [[53, '2025-01-01T00:00:00Z', '__HIDDENCAT__']]),
    page('Quest & A', 0, [[3, '2021-01-01T00:00:00Z', QUEST_A]]),
    page('Old Quest', 0, [[4, '2021-02-01T00:00:00Z', '#REDIRECT [[Quest & A#Section]]']]),
    page('Some NPC', 0, [[5, '2021-03-01T00:00:00Z', `${NPC}\n[[Category:Hidden Things]]`]]),
    page('Version/1.0', 0, [[6, '2021-04-01T00:00:00Z', '{{Version Infobox|version=1.0}}']]),
    page('Late Page', 0, [[9, '2022-01-01T00:00:00Z', 'Created late.']]),
  ]);
  nextPage = 1;
  const full = wiki([
    page('Template:Change History', 10, [[50, '2025-01-01T00:00:00Z', CHANGE_HISTORY]]),
    page('Quest & A', 0, [[1, '2020-01-01T00:00:00Z', QUEST_A_OLD], [3, '2021-01-01T00:00:00Z', QUEST_A]]),
    page('Old Quest', 0, [[4, '2021-02-01T00:00:00Z', '#REDIRECT [[Quest & A#Section]]']]),
    page('Late Page', 0, [[9, '2022-01-01T00:00:00Z', 'Created late.']]),
  ]);
  for (const [name, xml] of [[CURRENT, current], [FULL, full]]) {
    const src = join(dir, `${name}.xml`);
    await writeFile(src, xml);
    execFileSync('7z', ['a', '-bd', '-y', join(dir, 'dump', name), src], { stdio: 'ignore' });
  }
});
after(() => rm(dir, { recursive: true, force: true }));

test('titles and XML text are normalized like MediaWiki', () => {
  assert.equal(canonicalTitle('paimon'), 'Paimon');
  assert.equal(canonicalTitle('category:archon_quests'), 'Category:Archon quests');
  assert.equal(canonicalTitle('  Version/7.1 '), 'Version/7.1');
  assert.equal(decodeXml('A &amp; B &lt;br&gt; &#39;x&#x27;'), "A & B <br> 'x'");
  assert.equal(redirectTarget('#redirect [[Paimon#Profile|x]]'), 'Paimon');
  assert.equal(redirectTarget('Text #REDIRECT [[X]]'), null);
  const p = parseCurrentPage('<page><title>A &amp; B</title><ns>0</ns><id>9</id><revision><id>12</id><timestamp>t</timestamp><text bytes="1">#REDIRECT [[C]]</text></revision></page>');
  assert.deepEqual([p.title, p.revid, p.redirect], ['A & B', 12, 'C']);
});

test('current dump answers the api.php queries of the build scripts', async () => {
  const d = await loadDump(join(dir, 'dump'));
  assert.equal(d.lastEdit, '2025-01-01T00:00:00Z');
  assert.deepEqual([...d.releaseVersions], ['1.0', '1.1', 'Luna I']);

  const all = d.query({ action: 'query', list: 'allpages', apprefix: 'Version/', apnamespace: '0', aplimit: '500' });
  assert.deepEqual(all.query.allpages.map((p) => p.title), ['Version/1.0']);

  const members = (cat) => d.query({ action: 'query', list: 'categorymembers', cmtitle: cat, cmnamespace: '0', cmlimit: '500' }).query.categorymembers.map((m) => m.title);
  assert.deepEqual(members('Category:Archon Quests'), ['Quest & A']);
  assert.deepEqual(members('Category:Released in Version 1.0'), ['Quest & A']);
  assert.deepEqual(members('Category:Released in Version 1.1'), ['Some NPC']);
  assert.deepEqual(members('Category:Event Quests'), [], 'a commented-out event_name adds nothing');

  const paged = d.query({ action: 'query', list: 'allpages', apprefix: '', apnamespace: '0', aplimit: '2' });
  assert.equal(paged.query.allpages.length, 2);
  assert.ok(paged.continue.apcontinue);

  const r = d.query({ action: 'query', redirects: '1', titles: 'old_Quest|Missing page' }).query;
  assert.deepEqual(r.redirects, [{ from: 'Old Quest', to: 'Quest & A' }]);
  assert.deepEqual(r.pages.map((p) => [p.title, Boolean(p.missing)]), [['Quest & A', false], ['Missing page', true]]);

  const rev = d.query({ action: 'query', prop: 'revisions', rvprop: 'ids|timestamp|content', rvslots: 'main', redirects: '1', titles: 'Old Quest' }).query.pages[0];
  assert.equal(rev.revisions[0].revid, 3);
  assert.match(rev.revisions[0].slots.main.content, /Text & more\./);

  // categories from templates expanded through a Lua-module stand-in; hidden ones filtered
  const cats = d.query({ action: 'query', prop: 'categories', clshow: '!hidden', cllimit: 'max', titles: 'Some NPC' }).query.pages[0].categories.map((c) => c.title);
  assert.deepEqual(cats, ['Category:Mentioned Characters', 'Category:NPCs', 'Category:Released in Version 1.1', 'Category:Version']);
  const withHidden = d.query({ action: 'query', prop: 'categories', titles: 'Some NPC' }).query.pages[0].categories.map((c) => c.title);
  assert.ok(withHidden.includes('Category:Hidden Things'));
  assert.throws(() => d.query({ action: 'parse', page: 'X' }), /unsupported action/);
});

test('revision at a time never falls back to a later revision', async () => {
  const idx = await loadRevisionIndex(join(dir, 'dump'));
  assert.equal(idx.revisions, 5);
  const at = (t, ts) => idx.revisionAt(t, ts);
  assert.equal(at('Quest & A', '2020-06-01T00:00:00Z').revision.revid, 1);
  assert.equal(at('Quest & A', '2021-01-01T00:00:00Z').revision.revid, 3, 'inclusive at the exact timestamp');
  assert.equal(at('Late Page', '2021-12-31T23:59:59Z').status, 'not-yet');
  assert.equal(at('Late Page', '2021-12-31T23:59:59Z').revision, undefined);
  assert.equal(at('Nowhere', '2021-01-01T00:00:00Z').status, 'missing');
  assert.equal(at('Quest & A', '2026-01-01T00:00:00Z').status, 'beyond-dump');
  assert.throws(() => at('Quest & A', '2021-01-01'), /ISO timestamp/);
  assert.equal(idx.revision(1).title, 'Quest & A');
  assert.equal(idx.revision(999), null);

  const texts = await revisionContents([1, 999], join(dir, 'dump'));
  assert.equal(texts.get(1).content, QUEST_A_OLD);
  assert.ok(!texts.has(999));
  assert.equal(versionStart([{ id: '1.0', released: '2020-09-28' }], '1.0'), '2020-09-28T00:00:00Z');
  const versions = [{ id: '1.0', released: '2020-09-28' }, { id: '1.1', released: '2020-11-11' }, { id: '1.2', released: '2021-03-01' }];
  assert.equal(versionCutoff(versions, '1.0'), '2020-11-10T00:00:00Z', 'one day before the next release');
  assert.equal(versionCutoff(versions, '1.1'), '2021-02-28T00:00:00Z', 'month boundary');
  assert.equal(versionCutoff(versions, '1.2'), null, 'last version has no cut-off');
});

// Rebuild the Fandom-derived data from the official dump and report how it differs from the
// committed data/generated and from the legacy api.php cache. Nothing in data/generated or
// .cache/fandom is written: rebuilds go to .cache/dump-build/<source>/generated.
//
// Usage: node scripts/fandom/compare-dump.mjs [--rebuild] [--no-legacy]
//   --rebuild    run the build chain again (dump, and legacy cache unless --no-legacy)
// Writes .cache/dump-build/report.json and report.md. No network, no LLM, no images.
import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadDump, loadRevisionIndex, versionCutoff, versionStart } from './dump.mjs';

const args = process.argv.slice(2);
const OUT = '.cache/dump-build';
const COMMITTED = 'data/generated';
const CHAIN = ['build-stage1', 'build-series', 'build-units', 'build-lore', 'build-characters', 'build-ko-names', 'build-units'];
const log = (...a) => console.error('[compare-dump]', ...a);

// Fandom-derived files and how their entries are keyed. LLM outputs are not rebuilt.
const FILES = {
  'versions.json': (d) => d.map((v) => [v.id, v]),
  'quests.json': (d) => d.map((q) => [q.id, q]),
  'quest-edges.json': (d) => d.map((e) => [`${e.relation}:${e.basis}:${e.source}>${e.target}`, e]),
  'quest-series.json': (d) => d.map((s) => [s.id, s]),
  'quest-units.json': (d) => [...d.units.map((u) => [u.id, u]), ...Object.entries(d.region_entry).map(([r, a]) => [`region_entry:${r}`, a])],
  'quest-characters.json': (d) => Object.entries(d),
  'character-aliases.json': (d) => Object.entries(d),
  'characters.json': (d) => Object.entries(d),
  'ko-names.json': (d) => Object.entries(d),
  'lore-links.json': (d) => Object.entries(d),
};
const LLM_FILES = ['recommended-edges.json', 'recommended-candidates.json', 'recommended-candidates-2.json', 'recommended-judgments.json', 'recommended-judgments-2.json', 'recommended-ratings.json', 'unit-facts.json', 'unit-facts-haiku.json'];

async function rebuild(source) {
  const dir = join(OUT, source);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await cp(COMMITTED, join(dir, 'generated'), { recursive: true });
  const env = { ...process.env, ARU_FANDOM_SOURCE: source, ARU_GENERATED_DIR: join(dir, 'generated') };
  for (const [i, step] of CHAIN.entries()) {
    log(`${source}: ${step}`);
    const r = spawnSync(process.execPath, [`scripts/fandom/${step}.mjs`], { env, encoding: 'utf8', maxBuffer: 1 << 28 });
    await writeFile(join(dir, `${i}-${step}.log`), `${r.stdout}\n${r.stderr}`);
    if (r.status !== 0) throw new Error(`${source} ${step} failed (see ${dir}/${i}-${step}.log)\n${r.stderr.slice(-2000)}`);
  }
}

const readJson = async (f) => JSON.parse(await readFile(f, 'utf8'));
const stable = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x));
const withoutRevisions = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v, (k, x) => (k === 'revision' ? undefined : x))));

function diffFile(name, a, b) {
  const A = new Map(FILES[name](a));
  const B = new Map(FILES[name](b));
  const added = [...B.keys()].filter((k) => !A.has(k));
  const removed = [...A.keys()].filter((k) => !B.has(k));
  const changed = [];
  let revisionOnly = 0;
  const fieldCounts = {};
  for (const [k, va] of A) {
    if (!B.has(k)) continue;
    const vb = B.get(k);
    if (stable(va) === stable(vb)) continue;
    if (stable(withoutRevisions(va)) === stable(withoutRevisions(vb))) { revisionOnly++; continue; }
    const fields = va && vb && typeof va === 'object' && !Array.isArray(va)
      ? [...new Set([...Object.keys(va), ...Object.keys(vb)])].filter((f) => stable(withoutRevisions(va[f])) !== stable(withoutRevisions(vb[f])))
      : ['(value)'];
    for (const f of fields) fieldCounts[f] = (fieldCounts[f] ?? 0) + 1;
    changed.push({ key: k, fields, ...(changed.length < 40 ? { before: pick(va, fields), after: pick(vb, fields) } : {}) });
  }
  return {
    entries: { before: A.size, after: B.size },
    added: added.length, removed: removed.length, changed: changed.length, revisionOnly,
    fieldCounts,
    samples: { added: added.slice(0, 40), removed: removed.slice(0, 40), changed: changed.slice(0, 40) },
    all: { added, removed, changed: changed.map((c) => c.key) },
  };
}
const pick = (v, fields) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(fields.map((f) => [f, v[f]])) : v);

/** Every { url, revision } that cites a Fandom page, with the page title from the URL. */
function citedRevisions(value, out = []) {
  if (Array.isArray(value)) value.forEach((x) => citedRevisions(x, out));
  else if (value && typeof value === 'object') {
    if (typeof value.url === 'string' && value.url.includes('genshin-impact.fandom.com/wiki/') && typeof value.revision === 'number') {
      out.push({ title: decodeURIComponent(value.url.split('/wiki/')[1]).replace(/_/g, ' '), revision: value.revision });
    }
    Object.values(value).forEach((x) => citedRevisions(x, out));
  }
  return out;
}

function classify(title, revid, dump, idx) {
  const page = dump.page(title);
  if (page?.revid === revid) return 'current';
  const r = idx.revision(revid);
  if (r) return r.title === (page?.title ?? title) || !page ? 'older-in-dump' : 'older-in-dump-other-title';
  if (revid > maxRevid(idx)) return 'after-dump';
  return page ? 'not-in-dump' : 'page-not-in-dump';
}
let maxRev = 0;
function maxRevid(idx) {
  if (!maxRev) for (const p of Object.values(idx.pages)) for (const r of p.revs) if (r[0] > maxRev) maxRev = r[0];
  return maxRev;
}

const count = (list) => list.reduce((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});

async function main() {
  if (args.includes('--rebuild')) {
    await rebuild('dump');
    if (!args.includes('--no-legacy')) await rebuild('legacy');
  }
  const dump = await loadDump();
  const idx = await loadRevisionIndex('.cache/dump', { log });
  const report = {
    generated: new Date().toISOString(),
    dump: { currentLastEdit: dump.lastEdit, fullLastEdit: idx.lastEdit, pages: dump.pages.size, mainPages: dump.mainTitles.length, fullRevisions: idx.revisions, siteGenerator: dump.site.generator },
    files: {}, legacyBaseline: {}, llmReferences: {}, revisions: {}, consistency: {}, asOf: {},
  };

  // 1. committed data vs dump rebuild (and vs legacy-cache rebuild, to separate code drift)
  const dumpDir = join(OUT, 'dump', 'generated');
  const legacyDir = join(OUT, 'legacy', 'generated');
  for (const name of Object.keys(FILES)) {
    const committed = await readJson(join(COMMITTED, name));
    report.files[name] = diffFile(name, committed, await readJson(join(dumpDir, name)));
    if (existsSync(join(legacyDir, name))) {
      const d = diffFile(name, committed, await readJson(join(legacyDir, name)));
      report.legacyBaseline[name] = { added: d.added, removed: d.removed, changed: d.changed, revisionOnly: d.revisionOnly, samples: d.samples.changed.slice(0, 5).map((c) => c.key) };
    }
  }

  // 2. LLM outputs keep pointing at ids; which ones disappear in the dump rebuild?
  const quests = await readJson(join(dumpDir, 'quests.json'));
  const units = (await readJson(join(dumpDir, 'quest-units.json'))).units;
  const ids = new Set([...quests.map((q) => q.id), ...units.map((u) => u.id)]);
  for (const name of LLM_FILES) {
    if (!existsSync(join(COMMITTED, name))) continue;
    const text = await readFile(join(COMMITTED, name), 'utf8');
    const refs = new Set(text.match(/"((?:act|quest|series|event|chain|single)_[a-z0-9_]+)"/g)?.map((s) => s.slice(1, -1)) ?? []);
    const missing = [...refs].filter((r) => !ids.has(r));
    report.llmReferences[name] = { ids: refs.size, missingInDumpBuild: missing.length, samples: missing.slice(0, 20) };
  }

  // 3. revisions: cited by the committed data, and held in the legacy cache
  const cited = [];
  for (const name of Object.keys(FILES)) cited.push(...citedRevisions(await readJson(join(COMMITTED, name))));
  const uniq = new Map(cited.map((c) => [`${c.title}\n${c.revision}`, c]));
  const citedClass = [...uniq.values()].map((c) => ({ ...c, class: classify(c.title, c.revision, dump, idx) }));
  report.revisions.citedByCommittedData = {
    citations: cited.length, distinct: uniq.size, byClass: count(citedClass.map((c) => c.class)),
    samples: Object.fromEntries(Object.keys(count(citedClass.map((c) => c.class))).map((k) => [k, citedClass.filter((c) => c.class === k).slice(0, 8)])),
  };
  const legacy = [];
  for (const f of await readdir('.cache/fandom')) {
    const body = await readJson(join('.cache/fandom', f));
    for (const p of body.query?.pages ?? []) if (p.revisions?.[0]) legacy.push({ title: p.title, revision: p.revisions[0].revid, timestamp: p.revisions[0].timestamp });
  }
  const legacyUniq = new Map(legacy.map((c) => [`${c.title}\n${c.revision}`, c]));
  const legacyClass = [...legacyUniq.values()].map((c) => ({ ...c, class: classify(c.title, c.revision, dump, idx) }));
  const ts = legacy.map((c) => c.timestamp).sort();
  report.revisions.legacyCache = {
    files: (await readdir('.cache/fandom')).length, pageRevisions: legacyUniq.size,
    newestRevisionTimestamp: ts.at(-1), byClass: count(legacyClass.map((c) => c.class)),
    titlesWithSeveralRevisions: Object.values(count(legacyClass.map((c) => c.title))).filter((n) => n > 1).length,
  };

  // 4. the two dumps: current vs last revision in the full history
  let same = 0, differ = 0, onlyCurrent = 0;
  const differSamples = [];
  for (const p of dump.pages.values()) {
    if (p.ns !== 0) continue;
    const h = idx.pages[p.title];
    if (!h) { onlyCurrent++; continue; }
    const last = h.revs.at(-1)[0];
    if (last === p.revid) same++;
    else { differ++; if (differSamples.length < 10) differSamples.push({ title: p.title, current: p.revid, fullLast: last }); }
  }
  report.consistency = { mainPagesSameLastRevision: same, differ, onlyInCurrentDump: onlyCurrent, differSamples };

  // 5. "as of version": quest pages at their version's release (start of release day, UTC)
  //    and at the next version's release. No later revision is ever substituted.
  const versions = await readJson(join(dumpDir, 'versions.json'));
  const at = { releaseDay: [], cutoff: [] };
  for (const q of quests) {
    if (!q.first_version) continue;
    const title = dump.follow(q.names.en).target;
    const start = versionStart(versions, q.first_version);
    if (start) at.releaseDay.push(idx.revisionAt(title, start).status);
    const cut = versionCutoff(versions, q.first_version);
    at.cutoff.push(cut ? idx.revisionAt(title, cut).status : 'open');
  }
  report.asOf = { quests: quests.length, releaseDayStart: count(at.releaseDay), cutoff: count(at.cutoff) };

  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'report.json'), `${JSON.stringify(report, null, 1)}\n`);
  await writeFile(join(OUT, 'report.md'), markdown(report));
  log(`wrote ${OUT}/report.json and report.md`);
  console.log(markdown(report));
}

function markdown(r) {
  const L = [];
  L.push(`# Fandom 덤프 대조 보고 (${r.generated.slice(0, 10)})`, '');
  L.push(`덤프: 현재판 마지막 편집 ${r.dump.currentLastEdit}, 전체 이력 마지막 편집 ${r.dump.fullLastEdit}, 문서 ${r.dump.pages} (일반 문서 ${r.dump.mainPages}), 전체 리비전 ${r.dump.fullRevisions}`, '');
  L.push('## 생성물: 커밋본 → 덤프 재빌드', '', '| 파일 | 항목(전→후) | 추가 | 삭제 | 변경 | 리비전만 변경 | 주로 바뀐 필드 |', '|---|---|---|---|---|---|---|');
  for (const [f, d] of Object.entries(r.files)) {
    const top = Object.entries(d.fieldCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} ${n}`).join(', ');
    L.push(`| ${f} | ${d.entries.before}→${d.entries.after} | ${d.added} | ${d.removed} | ${d.changed} | ${d.revisionOnly} | ${top} |`);
  }
  if (Object.keys(r.legacyBaseline).length) {
    L.push('', '## 기준선: 커밋본 → 기존 API 캐시 재빌드', '', '코드 변경의 영향과 덤프의 영향을 구분하기 위한 대조.', '', '| 파일 | 추가 | 삭제 | 변경 | 리비전만 |', '|---|---|---|---|---|');
    for (const [f, d] of Object.entries(r.legacyBaseline)) L.push(`| ${f} | ${d.added} | ${d.removed} | ${d.changed} | ${d.revisionOnly} |`);
  }
  L.push('', '## 인용 리비전 분류', '', `커밋본이 인용한 리비전 (고유 ${r.revisions.citedByCommittedData.distinct}): ${JSON.stringify(r.revisions.citedByCommittedData.byClass)}`);
  L.push(`기존 API 캐시의 문서 리비전 (고유 ${r.revisions.legacyCache.pageRevisions}, 최신 ${r.revisions.legacyCache.newestRevisionTimestamp}): ${JSON.stringify(r.revisions.legacyCache.byClass)}`);
  L.push('', 'current = 덤프의 현재 리비전과 같음 · older-in-dump = 전체 이력에 있으나 덤프 시점에는 이미 더 새 리비전이 있음 · after-dump = 덤프 이후 리비전(덤프에 없음)');
  L.push('', '## LLM 생성물의 ID 참조 (재생성하지 않음)', '', '| 파일 | 참조 ID | 덤프 빌드에 없음 |', '|---|---|---|');
  for (const [f, d] of Object.entries(r.llmReferences)) L.push(`| ${f} | ${d.ids} | ${d.missingInDumpBuild} |`);
  L.push('', '## 현재판·전체 이력 덤프 일관성', '', `일반 문서 마지막 리비전 일치 ${r.consistency.mainPagesSameLastRevision}, 불일치 ${r.consistency.differ}, 현재판에만 있음 ${r.consistency.onlyInCurrentDump}`);
  L.push('', '## 버전 시점 리비전 (퀘스트 문서)', '', `출시일 00:00 UTC 기준: ${JSON.stringify(r.asOf.releaseDayStart)}`, `기준 시각(다음 버전 출시 1일 전 00:00 UTC): ${JSON.stringify(r.asOf.cutoff)}`, '', 'not-yet = 그 시점에 문서가 없음(이후 리비전으로 대체하지 않음) · open = 다음 버전이 데이터에 없어 기준 시각이 아직 없음');
  return `${L.join('\n')}\n`;
}

main().catch((e) => { console.error(e); process.exit(1); });

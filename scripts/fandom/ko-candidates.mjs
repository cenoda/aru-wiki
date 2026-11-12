// Candidate Korean names for the English names left in a theme's snapshots, from the local
// Fandom dump only (no network). A person reviews them; nothing here writes ko-names.json
// (scripts/fandom/ko-accept.mjs does, one name at a time, when a person accepts it).
//
// Evidence is any `{{Other Languages}}` row (en, ko) of the dump:
//   exact     the row's `en` is the name, up to "The " and a plural "s"
//   contains  the row's `en` has the name as a whole word (Archon → "Archon Quest" = 마신 임무)
// A "contains" row is not the name's own Korean name. The doc lists the Korean words that
// appear most often across those rows, so a person can see e.g. 마신 vs 집정관 at a glance.
//
//   node scripts/fandom/ko-candidates.mjs [theme=khaenriah]
//     → docs/ko-name-candidates.md, data/generated/ko-name-candidates.json
//   The en/ko rows of the dump are cached in .cache/ko-pairs.json (rebuilt when the dump changes).
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { CURRENT, FULL, parseRevision, streamDump } from './dump.mjs';
import { pageUrl } from './client.mjs';
import { cleanKo, readTables } from './ko-names.mjs';
import { plainText } from './wikitext.mjs';
import { namesLeft, shownRecords } from '../theme/names-left.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const DUMP = join(ROOT, '.cache/dump', CURRENT);
const CACHE = join(ROOT, '.cache/ko-pairs.json');
const FULL_DUMP = join(ROOT, '.cache/dump', FULL);
const HISTORY_CACHE = join(ROOT, '.cache/ko-history-pairs.json');

const cleanEn = (s) => plainText((s ?? '').replace(/<ref[^>]*\/>/gi, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ''));

/** Own (not transcluded) table rows of one page: [{ en, ko, page }]. */
export function pairsFromPage(title, content) {
  if (!content || !/\{\{\s*Other Languages/i.test(content)) return [];
  const read = readTables(content);
  if (!read) return [];
  const out = [];
  for (const [index, t] of read.tables) {
    const en = cleanEn(t.en ?? (index === 0 ? title : ''));
    const ko = cleanKo(t.ko);
    if (en && ko) out.push({ en, ko, page: title });
  }
  return out;
}

/** Every en/ko row in the main namespace of the current dump, cached by dump size and mtime. */
export async function dumpPairs({ log = () => {} } = {}) {
  const s = await stat(DUMP);
  const stamp = `${s.size}:${s.mtimeMs}`;
  try {
    const cached = JSON.parse(await readFile(CACHE, 'utf8'));
    if (cached.stamp === stamp) return cached.pairs;
  } catch { /* no cache yet */ }
  log('reading Other Languages rows from the dump (a minute or two)…');
  const pairs = [];
  await streamDump(DUMP, {
    onRevision: (p, xml) => {
      if (p.ns !== 0 || !xml.includes('Other Languages')) return;
      pairs.push(...pairsFromPage(p.title, parseRevision(xml, true).content));
    },
  });
  await writeFile(CACHE, JSON.stringify({ stamp, pairs }));
  return pairs;
}

/**
 * Rows whose `en` is one of `names` (up to The/plural) in any revision of the full-history dump
 * but in no current row: tables later removed or merged (God of the Woods, Raiden Makoto).
 * Latest revision per (en, ko, page): [{ en, ko, page, revid, timestamp }].
 */
export async function historyPairs(names, current, { log = () => {} } = {}) {
  const s = await stat(FULL_DUMP);
  const keys = new Set(names.map((n) => singular(norm(n))));
  const stamp = `${s.size}:${s.mtimeMs}:${createHash('sha1').update([...keys].sort().join('\n')).digest('hex').slice(0, 12)}`;
  try {
    const cached = JSON.parse(await readFile(HISTORY_CACHE, 'utf8'));
    if (cached.stamp === stamp) return cached.pairs;
  } catch { /* no cache yet */ }
  log('reading the full-history dump for removed rows…');
  const forms = [...new Set(names.flatMap((n) => [n.replace(/^The /, ''), n.replace(/^The /, '').replace(/s$/, '')]))];
  const xmlEsc = (t) => esc(t.replace(/&/g, '&amp;').replace(/"/g, '&quot;'));
  const pre = new RegExp(`^\\s*\\|\\s*(?:\\d+_)?en\\s*=\\s*(?:The )?(?:${forms.map(xmlEsc).join('|')})s?\\s*$`, 'mi');
  const have = new Set(current.map((p) => `${p.en}\u0000${p.ko}`));
  const best = new Map();
  await streamDump(FULL_DUMP, {
    onRevision: (p, xml) => {
      if (p.ns !== 0 || !xml.includes('Other Languages') || !pre.test(xml)) return;
      const rev = parseRevision(xml, true);
      for (const row of pairsFromPage(p.title, rev.content)) {
        if (!keys.has(singular(norm(row.en))) || have.has(`${row.en}\u0000${row.ko}`)) continue;
        const id = `${row.en}\u0000${row.ko}\u0000${row.page}`;
        if ((best.get(id)?.timestamp ?? '') < rev.timestamp) best.set(id, { ...row, revid: rev.revid, timestamp: rev.timestamp });
      }
    },
  });
  const pairs = [...best.values()];
  await writeFile(HISTORY_CACHE, JSON.stringify({ stamp, pairs }));
  return pairs;
}

const norm = (s) => s.toLowerCase().replace(/^the\s+/, '').replace(/[’]/g, "'").replace(/["“”「」]/g, '').trim();
const singular = (s) => s.replace(/(?<=[a-z])s$/, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Korean words of a value, for counting what the "contains" rows share. */
const koWords = (ko) => ko.split(/[\s·「」『』()（）/,.!?~:<>\-]+/)
  .map((w) => w.replace(w.length >= 3 ? /(?:의|을|를|은|는|과|와|에)$/ : /(?<=.)의$/, ''))
  .filter((w) => /[가-힣]/.test(w));

/**
 * Candidates for one English name.
 * @returns {{ exact: object[], history: object[], contains: object[], words: [string, number][] }}
 */
export function candidatesFor(name, pairs, old = []) {
  const key = singular(norm(name));
  const forms = [...new Set([name, name.replace(/^The /, ''), name.replace(/s$/, ''), `${name.replace(/^The /, '')}s`])].filter(Boolean);
  const word = new RegExp(`(?<![A-Za-z0-9'’])(?:${forms.map(esc).join('|')})(?![A-Za-z0-9'’])`, 'i');
  const exact = [], contains = [];
  const seen = new Set();
  for (const p of pairs) {
    const id = `${p.en}\u0000${p.ko}`;
    if (seen.has(id)) continue;
    if (singular(norm(p.en)) === key) { exact.push(p); seen.add(id); }
    else if (word.test(p.en)) { contains.push(p); seen.add(id); }
  }
  contains.sort((a, b) => a.en.length - b.en.length || a.en.localeCompare(b.en));
  const count = new Map();
  for (const p of contains) for (const w of new Set(koWords(p.ko))) count.set(w, (count.get(w) ?? 0) + 1);
  const words = [...count].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4);
  const history = old.filter((p) => singular(norm(p.en)) === key)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { exact, history, contains, words };
}

// Words whose Korean depends on the sentence (docs/ko-names-plan.md): never one dictionary entry.
const CONTEXT = {
  archon: '문맥마다 다르다. 그냥 강한 존재면 마신, 마신 전쟁에서 이겨 신의 심장을 차지한 일곱이면 집정관([조사 계획](ko-names-plan.md)).',
};
const oldUrl = (p) => `${pageUrl(p.page)}?oldid=${p.revid}`;
const hasCandidates = (r) => r.exact.length || r.history?.length || r.contains.length;
const link = (page) => `[${page.replace(/([[\]|])/g, '\\$1')}](${pageUrl(page)})`;
const cell = (s) => String(s).replace(/\|/g, '\\|');

/** Forms of one name (Harbinger / Harbingers, The Chasm / Chasm) as one entry; candidates merged. */
export function groupForms(rows) {
  const groups = new Map();
  for (const r of rows) {
    const k = singular(norm(r.name));
    const g = groups.get(k);
    if (!g) { groups.set(k, { ...r, forms: [r.name] }); continue; }
    g.forms.push(r.name);
    g.n += r.n;
    for (const f of ['nodes', 'pages']) g[f] = [...new Set([...g[f], ...r[f]])];
    for (const f of ['exact', 'history', 'contains']) {
      const id = (p) => `${p.en}\u0000${p.ko}\u0000${f === 'history' ? p.page : ''}`;
      const have = new Set((g[f] ?? []).map(id));
      g[f] = [...(g[f] ?? []), ...(r[f] ?? []).filter((p) => !have.has(id(p)))];
    }
    if (r.words.length > g.words.length) g.words = r.words;
  }
  return [...groups.values()].sort((a, b) => b.n - a.n || a.id - b.id);
}

function markdown(theme, rows, minCount) {
  const shown = groupForms(rows).filter((r) => r.n >= minCount);
  const withC = shown.filter(hasCandidates);
  const without = shown.filter((r) => !hasCandidates(r));
  const one = (r) => {
    const lines = [`### ${r.id}. ${r.forms.join(' / ')} (${r.n}회)`, '', `예문: ${r.example}`, ''];
    for (const p of r.exact) lines.push(`- **같은 영어**: \`${p.en}\` = **${p.ko}** (${link(p.page)})`);
    for (const p of r.history ?? []) lines.push(`- **옛 판에만**: \`${p.en}\` = **${p.ko}** ([${p.page.replace(/([[\]|])/g, '\\$1')} ${p.timestamp.slice(0, 10)} 판](${oldUrl(p)}))`);
    if (r.words.length) lines.push(`- 들어간 이름에 자주 나온 한국어: ${r.words.map(([w, n]) => `**${w}** ${n}개`).join(', ')}`);
    for (const p of r.contains.slice(0, 6)) lines.push(`- \`${p.en}\` = ${p.ko} (${link(p.page)})`);
    if (r.contains.length > 6) lines.push(`- … 외 ${r.contains.length - 6}개 (\`data/generated/ko-name-candidates.json\`)`);
    const rule = CONTEXT[singular(norm(r.forms[0]))];
    lines.push(rule ? `- **넣지 않음**: ${rule}` : `- 넣을 때: \`'${r.forms.join('|')}=한국어'\``, '');
    return lines.join('\n');
  };
  return `# 한국어 이름 후보 (로컬 덤프)

\`node scripts/fandom/ko-candidates.mjs ${theme}\`가 만든다(손으로 고치지 않는다). 대상은 [한국어 이름이 필요한 말](ko-names-needed.md)과 같다(${minCount}번 이상).
근거는 로컬 Fandom 덤프의 \`Other Languages\` 표뿐이다. 네트워크를 쓰지 않고, LLM이 고르지 않는다.

- **같은 영어**: 표의 \`en\`이 그 이름과 같다(\`The\`, 복수 \`s\` 무시). 그래도 다른 것을 가리킬 수 있으니 문서를 확인한다.
- **옛 판에만**: 지금 문서에는 없고 예전 판의 표에만 있다. 표가 다른 문서로 합쳐지며 빠졌을 수도, 틀려서 지워졌을 수도 있다. 판마다 값이 다르면 모두 적는다.
- 후보의 한국어가 다른 인물·존재의 이름이면 정체가 드러날 수 있으니 쓰지 않는다(예: Ruler of Life → 나베리우스).
- **들어간 이름**: \`en\`에 그 이름이 단어로 들어 있다. 그 이름 자체의 번역이 아니다. 같은 영어가 다른 한국어로 나올 수 있다(Archon: 마신 / 집정관).

## 넣는 법

맞는 이름을 고르면 한 줄로 넣는다. 근거 문서는 후보에서 자동으로 붙는다(고른 한국어가 들어 있는 표만).

\`\`\`bash
node scripts/fandom/ko-accept.mjs 'Harbinger|Harbingers=집행관'
node scripts/fandom/ko-accept.mjs 'Il Dottore=도토레' --play maintainer --note '마신 임무 3장 4막 대사'
node scripts/theme/snapshots.mjs ${theme} --write --only none
\`\`\`

\`|\`로 단수·복수 같은 여러 영어 형태를 한 번에 넣는다. 후보에 근거가 없으면 \`--play 이름\`(게임에서 봄), \`--url 주소\`(공개 문서·영상), \`--maintainer 이름\`(일반어를 직접 정함) 중 하나가 있어야 넣어진다.
채팅으로 "3번 집행관 맞음"처럼 알려 줘도 같은 명령으로 넣는다.

## 후보가 있는 것 (${withC.length}개)

${withC.map(one).join('\n')}
## 덤프에 후보가 없는 것 (${without.length}개)

게임이나 공식 자료에서 직접 확인해야 한다. 방법은 [조사 계획](ko-names-plan.md)의 「덤프에 후보가 없는 것」에 있다. 「나온 문서」는 문장이 요약된 Fandom 문서다. 어떤 임무·도감에 나오는지 찾을 때 쓴다.

| 번호 | 영어 | 횟수 | 나온 문서 |
|---|---|---|---|
${without.map((r) => `| ${r.id} | ${cell(r.forms.join(' / '))} | ${r.n} | ${r.pages.slice(0, 4).map(link).join(', ')}${r.pages.length > 4 ? ` 외 ${r.pages.length - 4}` : ''} |`).join('\n')}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const theme = process.argv[2] ?? 'khaenriah';
  const log = (m) => console.error(`[ko-candidates] ${m}`);
  const snaps = await shownRecords(theme);
  const pairs = await dumpPairs({ log });
  log(`${pairs.length} en/ko rows in the dump`);
  const left = namesLeft(snaps);
  const old = await historyPairs([...left.keys()], pairs, { log });
  log(`${old.length} rows only in older revisions`);
  const rows = [...left].map(([name, e], i) => {
    const c = candidatesFor(name, pairs, old);
    return { id: i + 1, name, n: e.n, nodes: [...e.nodes], pages: [...e.pages], example: e.example, ...c };
  });
  await writeFile(join(ROOT, 'data/generated/ko-name-candidates.json'), `${JSON.stringify({
    theme, note: 'Candidates only, not confirmed names. Evidence: Other Languages rows of the local Fandom dumps (current; history = older revisions only).',
    names: rows.map(({ exact, history, contains, ...r }) => ({
      ...r,
      exact: exact.map((p) => ({ ...p, url: pageUrl(p.page) })),
      history: history.map((p) => ({ ...p, url: oldUrl(p) })),
      contains: contains.slice(0, 40).map((p) => ({ ...p, url: pageUrl(p.page) })),
      contains_total: contains.length,
    })),
  }, null, 1)}\n`);
  await writeFile(join(ROOT, 'docs/ko-name-candidates.md'), markdown(theme, rows, 3));
  const has = hasCandidates;
  const top = groupForms(rows).filter((r) => r.n >= 3);
  log(`${rows.length} names (${rows.filter(has).length} with candidates); ${top.length} used 3+ times when forms are merged (${top.filter(has).length} with candidates)`);
  log('→ docs/ko-name-candidates.md, data/generated/ko-name-candidates.json');
}

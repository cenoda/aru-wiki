// Step 1 of the official-video match (no LLM): for each wiki page, list videos from the
// official Korean channel whose title names the page (Korean name or alias), plus the
// version PV of the version where the page first appears in a story.
// Input: .cache/youtube/uploads-kr.json (scripts/youtube/fetch-uploads.mjs).
// Output: .cache/youtube/candidates.json (gitignored; it holds video titles).
import fs from 'node:fs';
import { articlesPath, readArticles } from '../theme/article-store.mjs';

const gen = (f) => JSON.parse(fs.readFileSync(`data/generated/${f}`, 'utf8'));
const theme = gen('theme-all.json');
const loreLinks = gen('lore-links.json');
const koNames = gen('ko-names.json');
const versions = gen('versions.json');
const units = gen('quest-units.json').units;
const all = (await readArticles(articlesPath('data/generated', 'all'), { articles: [] })).articles;
const videos = JSON.parse(fs.readFileSync('.cache/youtube/uploads-kr.json', 'utf8')).videos
  .filter((v) => !/HoYoFair/i.test(v.title)); // fan creations: third-party rights

const order = new Map(versions.map((v, i) => [v.id, i]));
const unitVersion = new Map(units.map((u) => [u.id, u.first_version]));
const pageIds = [...new Set([...theme.nodes.map((n) => n.page), ...all.map((a) => a.node)])];

// version PV per version id: "4.4 버전 PV" / "Ver.4.4" etc.
const versionPv = new Map();
for (const v of videos) {
  const m = v.title.match(/(\d\.\d)\s*버전\s*PV/);
  if (m && !versionPv.has(m[1])) versionPv.set(m[1], v);
}

const out = [];
for (const page of pageIds) {
  const ko = koNames[page]?.ko;
  if (!ko) continue; // no official Korean name yet: nothing to match a Korean title against
  const names = [ko.replace(/[「」]/g, '')].filter((n) => n.length >= 2);
  const firsts = (loreLinks[page]?.units ?? []).map((u) => unitVersion.get(u)).filter((v) => order.has(v));
  const first = firsts.sort((a, b) => order.get(a) - order.get(b))[0] ?? null;
  const byName = videos.filter((v) => names.some((n) => v.title.includes(n)));
  const pv = first && versionPv.get(first);
  const cands = [...byName.map((v) => ({ ...v, why: 'title' }))];
  if (pv && !byName.some((v) => v.id === pv.id)) cands.push({ ...pv, why: 'first-version-pv' });
  out.push({ page, ko, kind: loreLinks[page]?.kind ?? theme.nodes.find((n) => n.page === page)?.kind ?? 'lore',
    first_version: first, candidates: cands.map(({ description, ...v }) => ({ ...v, desc: description.slice(0, 300) })) });
}
fs.writeFileSync('.cache/youtube/candidates.json', JSON.stringify(out, null, 1));
const withTitle = out.filter((p) => p.candidates.some((c) => c.why === 'title'));
const n = withTitle.reduce((s, p) => s + p.candidates.filter((c) => c.why === 'title').length, 0);
console.log({ pages: pageIds.length, with_ko: out.length, with_title_match: withTitle.length, title_pairs: n,
  with_pv_only: out.filter((p) => p.candidates.length && !p.candidates.some((c) => c.why === 'title')).length,
  version_pvs: versionPv.size });
const big = [...withTitle].sort((a, b) => b.candidates.length - a.candidates.length).slice(0, 12).map((p) => `${p.ko} ${p.candidates.length}`);
console.log(big.join(', '));

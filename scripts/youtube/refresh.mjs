// Step 3 / monthly refresh of the official-video list (data/generated/videos.json).
// YouTube API Services Developer Policies III.E.4 (c)(d): stored API data must be refreshed or
// deleted within 30 days, and III.E.4(j): the Made for Kids status of every embedded video must be
// looked up. This asks the API about every stored video ID again and
// - drops videos that are gone, not public, not embeddable, or made for kids,
// - recomputes each video's version from its current publish date,
// - refreshes each title (shown under the still),
// - stamps `refreshed`. Run at least every 30 days: with-youtube node scripts/youtube/refresh.mjs
// The title caches in .cache/youtube/ are deleted after 30 days by the same run.
import fs from 'node:fs';
import { dropBlockedVideos } from '../images/takedown-list.mjs';

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) { console.error('YOUTUBE_API_KEY missing; run through with-youtube'); process.exit(1); }
const FILE = 'data/generated/videos.json';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
// takedowns (data/manual/takedown.json videos) are dropped first, so a refresh never brings them back
const takedown = dropBlockedVideos(data.pages);
data.pages = takedown.pages;
const versions = JSON.parse(fs.readFileSync('data/generated/versions.json', 'utf8'));
const versionOf = (published) => { // same rule as judge.mjs
  const t = new Date(published).getTime() + 20 * 864e5;
  let best = versions[0].id;
  for (const v of versions) if (new Date(v.released).getTime() <= t) best = v.id;
  return best;
};

const ids = [...new Set(Object.values(data.pages).flat().map((x) => x.id))];
const info = new Map();
for (let i = 0; i < ids.length; i += 50) {
  const u = new URL('https://www.googleapis.com/youtube/v3/videos');
  u.search = new URLSearchParams({ part: 'status,snippet', id: ids.slice(i, i + 50).join(','), key: KEY, maxResults: '50' });
  const j = await (await fetch(u)).json();
  if (j.error) throw new Error(`${j.error.code} ${j.error.message}`);
  for (const v of j.items) info.set(v.id, v);
}
const why = {};
const dropped = new Set(data.dropped ?? []); // judge.mjs leaves these out when it rebuilds the list
const ok = (id) => {
  const v = info.get(id);
  const bad = !v ? 'gone' : v.status.privacyStatus !== 'public' ? 'not public' : !v.status.embeddable ? 'not embeddable'
    : v.status.madeForKids ? 'made for kids' : null;
  if (bad) { why[bad] = (why[bad] ?? 0) + 1; dropped.add(id); }
  return !bad;
};
for (const [page, list] of Object.entries(data.pages)) {
  const kept = list.filter((x) => ok(x.id)).map((x) => ({ ...x, version: versionOf(info.get(x.id).snippet.publishedAt), title: info.get(x.id).snippet.title }));
  if (kept.length && !kept.some((x) => x.role === 'main')) kept[0].role = 'main';
  if (kept.length) data.pages[page] = kept; else delete data.pages[page];
}
if (dropped.size) data.dropped = [...dropped].sort();
data.refreshed = new Date().toISOString();
fs.writeFileSync(FILE, JSON.stringify(data, null, 1));
// the title caches are only for matching; they do not outlive the 30 days
for (const f of fs.existsSync('.cache/youtube') ? fs.readdirSync('.cache/youtube') : []) {
  const p = `.cache/youtube/${f}`;
  if (Date.now() - fs.statSync(p).mtimeMs > 30 * 864e5) { fs.rmSync(p); console.log('deleted old cache', p); }
}
console.log({ videos: ids.length, dropped: why, takedown: takedown.dropped.length, pages: Object.keys(data.pages).length });

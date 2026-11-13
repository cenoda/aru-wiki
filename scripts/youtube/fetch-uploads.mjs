// Fetch the upload lists of the official Genshin Impact YouTube channels.
// Run with: with-youtube node scripts/youtube/fetch-uploads.mjs
// Output: .cache/youtube/uploads-<channel>.json (gitignored). YouTube API Services
// Developer Policies limit how long API data may be stored, so this cache is
// refreshed by re-running; only video IDs and our own matching go into the repo.
import fs from 'node:fs';

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) { console.error('YOUTUBE_API_KEY missing; run through with-youtube'); process.exit(1); }

const CHANNELS = {
  kr: 'UCcum1rCJ5GJeQ_xv0xrohqg', // @genshinimpact_kr 원신
  global: 'UCiS882YPwZt1NfaM0gR0D9Q', // @genshinimpact Genshin Impact
};

async function api(path, params) {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries({ ...params, key: KEY })) u.searchParams.set(k, v);
  const r = await fetch(u);
  const j = await r.json();
  if (j.error) throw new Error(`${j.error.code} ${j.error.message}`);
  return j;
}

for (const [name, id] of Object.entries(CHANNELS)) {
  const uploads = 'UU' + id.slice(2);
  const videos = [];
  let pageToken = '';
  do {
    const j = await api('playlistItems', { part: 'snippet,contentDetails', playlistId: uploads, maxResults: 50, ...(pageToken && { pageToken }) });
    for (const it of j.items) {
      videos.push({
        id: it.contentDetails.videoId,
        published: it.contentDetails.videoPublishedAt,
        title: it.snippet.title,
        description: it.snippet.description,
      });
    }
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  const out = { channel: id, name, fetched: new Date().toISOString(), videos };
  fs.writeFileSync(`.cache/youtube/uploads-${name}.json`, JSON.stringify(out, null, 1));
  console.log(name, videos.length);
}

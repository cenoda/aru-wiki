// Writes data/runtime/graph.json: only the fields the site reads, from data/generated.
// The site fetches this file at start instead of bundling the full generated JSON into the JS,
// so the first download is smaller and the data stays out of the JS parse.
// Run by `npm run dev` / `npm run build` (predev/prebuild); the output is not committed.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (f) => JSON.parse(await readFile(new URL(`data/generated/${f}`, root), 'utf8'));
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const [quests, edges, versions, units, recommended] = await Promise.all([
  read('quests.json'), read('quest-edges.json'), read('versions.json'), read('quest-units.json'), read('recommended-edges.json'),
]);

const graph = {
  versions,
  quests: quests.map((q) => ({
    ...pick(q, ['id', 'level', 'quest_type', 'act', 'names', 'first_version', 'replayable', 'event', 'region']),
    // the detail panel links the first source; revision ids are for the data pipeline
    sources: (q.sources ?? []).slice(0, 1).map((s) => ({ url: s.url })),
  })),
  questEdges: edges.map((e) => pick(e, ['source', 'target', 'relation', 'basis', 'revealed_version'])),
  units: {
    region_entry: units.region_entry,
    units: units.units.map((u) => pick(u, [
      'id', 'kind', 'names', 'members', 'quest_type', 'region', 'first_version', 'replayable', 'attach', 'next', 'major',
    ])),
  },
  recommended: recommended
    .filter((e) => !e.already_required) // the game enforces this order already; the site drops them too
    .map((e) => pick(e, ['source', 'target', 'tier', 'reason_ko', 'gist_ko', 'links', 'revealed_version', 'review'])),
};

const outDir = new URL('data/runtime/', root);
await mkdir(outDir, { recursive: true });
const text = JSON.stringify(graph);
await writeFile(new URL('graph.json', outDir), text);
console.log(`data/runtime/graph.json ${(text.length / 1024).toFixed(0)} KB`);

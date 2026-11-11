// Put Korean names a person has confirmed into data/manual/ko-names.json, with their sources.
// No network, no LLM.
//
//   node scripts/fandom/ko-accept.mjs 'Harbinger|Harbingers=집행관' ['Kuutar=쿠타르' …]
//        [--play <who>] [--maintainer <who>] [--url <https://…>]… [--note <text>] [--force] [--dry-run]
//
// `A|B=한국어` gives every English form the same Korean name. Sources:
//   - the dump candidates (data/generated/ko-name-candidates.json, from ko-candidates.mjs):
//     Fandom pages whose Other Languages row has one of the forms in `en` AND the chosen Korean
//     in `ko` (exact rows, then rows only in older revisions, then the rest; at most 3). A candidate that does not contain the Korean is never
//     cited;
//   - `--play <who>`: seen in the game by that person (say where in --note);
//   - `--maintainer <who>`: a maintainer's own choice or lookup (common words such as Natlanese,
//     which have no single official name; say why in --note);
//   - `--url`: a public page.
// A name with none of these is refused. An existing entry with another Korean name is kept
// unless --force.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = new URL('../../', import.meta.url).pathname;
const MANUAL = join(ROOT, 'data/manual/ko-names.json');
const CANDIDATES = join(ROOT, 'data/generated/ko-name-candidates.json');

/** 'A|B=한국어' → { forms: ['A', 'B'], ko: '한국어' } */
export function parseSpec(spec) {
  const at = spec.lastIndexOf('=');
  const forms = spec.slice(0, at).split('|').map((s) => s.trim()).filter(Boolean);
  const ko = spec.slice(at + 1).trim();
  if (at < 1 || !forms.length || !ko) throw new Error(`expected 'English[|English…]=한국어', got: ${spec}`);
  if (!/[가-힣]/.test(ko)) throw new Error(`no Hangul in the Korean name: ${spec}`);
  return { forms, ko };
}

// One Korean name would be wrong for part of the sentences (docs/ko-names-plan.md).
const CONTEXT_DEPENDENT = new Set(['archon']);

const squash = (s) => s.replace(/\s+/g, '');

/** Candidate rows that support `ko` for any of `forms`: exact rows first. */
export function evidence(candidates, forms, ko, max = 3) {
  const want = squash(ko);
  const rows = [];
  for (const kind of ['exact', 'history', 'contains']) {
    for (const c of candidates.names ?? []) {
      if (!forms.includes(c.name)) continue;
      for (const p of c[kind] ?? []) if (squash(p.ko).includes(want)) rows.push({ ...p, kind });
    }
  }
  const seen = new Set();
  return rows.filter((p) => !seen.has(p.url) && seen.add(p.url)).slice(0, max);
}

/**
 * New manual data with the accepted names; returns { data, added, skipped }.
 * Throws when a name has no source or would overwrite a different Korean name without force.
 */
export function accept(manual, candidates, specs, { play, maintainer, urls = [], note, force = false } = {}) {
  const data = { ...manual };
  const added = [], skipped = [];
  for (const spec of specs) {
    const { forms, ko } = parseSpec(spec);
    const ctx = forms.find((f) => CONTEXT_DEPENDENT.has(f.replace(/^The /, '').replace(/s$/, '').toLowerCase()));
    if (ctx && !force) throw new Error(`${ctx}: its Korean depends on the sentence (마신 / 집정관, docs/ko-names-plan.md); not put in ko-names.json`);
    const ev = evidence(candidates, forms, ko);
    const sources = [
      ...ev.map((p) => ({ url: p.url, site: 'fandom' })),
      ...urls.map((url) => {
        if (!/^https:\/\//.test(url)) throw new Error(`--url must start with https://: ${url}`);
        return { url, site: new URL(url).hostname };
      }),
      ...(play ? [{ site: 'play', by: play }] : []),
      ...(maintainer ? [{ site: 'maintainer', by: maintainer }] : []),
    ];
    if (!sources.length) {
      throw new Error(`${forms.join('|')}=${ko}: no dump candidate contains "${ko}"; give --play <who>, --maintainer <who> or --url <page>`);
    }
    const notes = [];
    if (ev.length) notes.push(`Chosen by a person from dump candidates: ${ev.map((p) => `"${p.en}" = ${p.ko}`).join('; ')}.`);
    if (note) notes.push(note);
    for (const en of forms) {
      const old = data[en];
      if (old && old.ko === ko) { skipped.push(`${en} (already ${ko})`); continue; }
      if (old && !force) throw new Error(`${en} is already "${old.ko}" in ko-names.json; use --force to replace it`);
      data[en] = { ko, status: 'confirmed', sources, ...(notes.length ? { note: notes.join(' ') } : {}) };
      added.push(`${en}=${ko}`);
    }
  }
  return { data, added, skipped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values: opt, positionals: specs } = parseArgs({ allowPositionals: true, options: {
    play: { type: 'string' }, maintainer: { type: 'string' }, url: { type: 'string', multiple: true }, note: { type: 'string' },
    force: { type: 'boolean', default: false }, 'dry-run': { type: 'boolean', default: false },
  } });
  if (!specs.length) {
    console.error("usage: ko-accept.mjs 'English[|English…]=한국어' … [--play <who>] [--maintainer <who>] [--url <https://…>] [--note <text>] [--force] [--dry-run]");
    process.exit(2);
  }
  const manual = JSON.parse(await readFile(MANUAL, 'utf8'));
  let candidates = { names: [] };
  try { candidates = JSON.parse(await readFile(CANDIDATES, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  try {
    const { data, added, skipped } = accept(manual, candidates, specs, { play: opt.play, maintainer: opt.maintainer, urls: opt.url, note: opt.note, force: opt.force });
    for (const a of added) console.log(`+ ${a}  ${JSON.stringify(data[a.slice(0, a.lastIndexOf('='))].sources)}`);
    for (const s of skipped) console.log(`= ${s}`);
    if (opt['dry-run']) { console.log('(dry run: nothing written)'); process.exit(0); }
    if (added.length) {
      await writeFile(MANUAL, `${JSON.stringify(data, null, 1)}\n`);
      console.log(`wrote data/manual/ko-names.json. Next: node scripts/theme/snapshots.mjs ${candidates.theme ?? '<theme>'} --write --only none`);
    }
  } catch (e) {
    console.error(`ko-accept: ${e.message}`);
    process.exit(1);
  }
}

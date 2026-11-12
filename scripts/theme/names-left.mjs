// Names still in English in accepted snapshot points, after whole-sentence localization.
// Shared by snapshots.mjs (docs/ko-names-needed.md) and fandom/ko-candidates.mjs.
// latin_left is used instead of re-scanning the text, so pieces of a phrase that was translated
// whole (Musou and Hitotachi in Musou no Hitotachi) are not listed.

export const STOP = new Set(['The', 'No', 'First', 'Second', 'Third', 'Unknown', 'Human', 'Mini', 'Project', 'Chapter', 'Act', 'Part', 'Version']);

/**
 * Map<name, { n, nodes: Set<node label>, pages: Set<Fandom page>, example }>, sorted by count.
 * @param {Array<{ node: string, ko?: string, points: object[] }>} snapshots
 */
export function namesLeft(snapshots) {
  const left = new Map();
  for (const r of snapshots) for (const p of r.points ?? []) {
    if (p.status !== 'accepted') continue;
    for (const n of new Set(p.latin_left ?? [])) {
      if (n.length < 3 || STOP.has(n)) continue;
      const e = left.get(n) ?? left.set(n, { n: 0, nodes: new Set(), pages: new Set(), example: p.text }).get(n);
      e.n++;
      e.nodes.add(r.ko ?? r.node);
      if (p.source?.page) e.pages.add(p.source.page);
    }
  }
  return new Map([...left].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0])));
}

/**
 * Everything of a theme shown on screen, as snapshot-like records for namesLeft(): snapshot points,
 * article paragraphs (accepted or trimmed) and timeline items. Missing files count as empty.
 */
export async function shownRecords(theme) {
  const { readFile } = await import('node:fs/promises');
  const gen = new URL(`../../data/generated/`, import.meta.url).pathname;
  const read = async (f) => { try { return JSON.parse(await readFile(gen + f, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; } };
  const [s, a, r] = await Promise.all([read(`snapshots-${theme}.json`), read(`articles-${theme}.json`), read(`reveals-${theme}.json`)]);
  return [
    ...(s.snapshots ?? []),
    ...(a.articles ?? []).map((x) => ({ node: x.node, points: x.paragraphs.filter((p) => ['accepted', 'trimmed'].includes(p.status)).map((p) => ({
      status: 'accepted', text: p.sentences.filter((y) => !y.dropped).map((y) => y.t).join(' '), quote: '', latin_left: p.latin_left ?? [] })) })),
    ...(r.reveals ?? []).map((x) => ({ node: x.node, points: x.items.map((it) => ({ ...it, latin_left: it.latin_left ?? [] })) })),
  ];
}

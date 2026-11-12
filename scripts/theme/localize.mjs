// English names inside LLM-written Korean text → official Korean names (shared by snapshots.mjs
// and articles.mjs). Writers keep proper names in English; this swaps them for names from
// ko-names.json, quest titles, names found in the dump under the same name, and LLM-written names
// (ko-names-llm.json) for what no source gives, re-choosing the particle after each name.
//
//   const ko = await makeKo(texts)   // texts: the English-named Korean texts, to look up names left
//   ko("Dainsleif는 Khaenri'ah 출신이다") → "데인슬레이프는 켄리아 출신이다"
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { latinNames, makeLocalizer } from '../recommend/ko-text.mjs';
import { llmNamePairs } from './ko-extra.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const gen = (f) => join(ROOT, 'data/generated', f);
const read = async (f) => JSON.parse(await readFile(gen(f), 'utf8'));

export async function makeKo(texts, { log = (...a) => console.error(...a) } = {}) {
  const koNames = await read('ko-names.json');
  const [quests, units, misspelled] = await Promise.all([read('quests.json'), read('quest-units.json'),
    readFile(join(ROOT, 'data/manual/ko-misspellings.json'), 'utf8').then(JSON.parse)]);
  const namePairs = Object.entries(koNames).map(([en, v]) => [en, v.ko]);
  const titlePairs = [...quests, ...units.units].map((x) => [x.names.en, x.names.ko]);
  const misspellingPairs = Object.entries(misspelled).filter(([w]) => !w.startsWith('$'))
    .flatMap(([w, en]) => (koNames[en]?.ko ? [[w, koNames[en].ko]] : []));
  const localize = makeLocalizer(namePairs, titlePairs, misspellingPairs);
  // "Mondstadt's knights" → "Mondstadt의 knights" before names are replaced
  // Names that hold "'s" themselves (Stormterror's Lair) are kept whole for the localizer.
  // Only when the Korean keeps the owner (바람 드래곤의 폐허): "Traveler's Sibling" is 쌍둥이 남매,
  // and "여행자의 쌍둥이 남매" reads better than the bare name.
  const apos = [...namePairs, ...titlePairs].filter(([n, k]) => n && k && /'s(?![A-Za-z])/.test(n) && k.includes('의'))
    .map(([n]) => n).sort((a, b) => b.length - a.length);
  const prep = (t) => {
    let text = t.replace(/[‘’]/g, "'");
    const kept = [];
    for (const n of apos) if (text.includes(n)) { text = text.split(n).join(`\u0003${kept.length}\u0003`); kept.push(n); }
    text = text.replace(/([A-Za-z])'s(?![A-Za-z])/g, '$1의');
    return text.replace(/\u0003(\d+)\u0003/g, (_, i) => kept[Number(i)]);
  };
  let ko = (t) => localize(prep(t));

  // Names left in English that are not in ko-names.json: look them up in the dump, but only take a
  // Korean name when the page reached is the same name (or its singular/plural). An alias that
  // redirects elsewhere is a reveal in itself (Gold → Rhinedottir, Scaramouche → Wanderer) or a
  // different thing (Eclipse Dynasty → Khaenri'ahn Dynasties), so it stays in English.
  async function extendNames(texts) {
    const { FandomClient } = await import('../fandom/client.mjs');
    const { koNames: lookup } = await import('../fandom/ko-names.mjs');
    const left = new Set(texts.flatMap((t) => latinNames(prep(t))).filter((n) => n.length >= 4 && !koNames[n]));
    // same name up to a plural ending: Ley Lines/Ley Line, Gnoses/Gnosis, Hilichurls/Hilichurl
    const same = (a, b) => [[a, b], [b, a]].some(([x, y]) => x === y || x === `${y}s` || x === y.replace(/is$/, 'es'));
    const client = new FandomClient();
    const { out } = await lookup(client, [...left]);
    // An alias may have its own row on the target page (`|2_en = Tsaritsa |2_ko = 얼음의 여왕`):
    // that is the alias's own Korean name, so it reveals nothing. Taken only when `en` is the name.
    const pages = await client.latest([...new Set(Object.values(out).filter((v) => v.ko && v.table).map((v) => v.page))]);
    const ownRow = (n, v) => v.table && !v.transcluded_from
      && new RegExp(`\\|\\s*${v.table}_en\\s*=\\s*${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\\||\\n|\\}\\})`).test(pages.get(v.page)?.content ?? '');
    // a name a person entered in data/manual/ko-names.json is always used
    const extra = Object.entries(out).filter(([n, v]) => v.ko && (v.ko_source === 'manual' || !v.base_page
      && (same(n.toLowerCase(), v.page.replace(/ \(.*\)$/, '').toLowerCase()) || ownRow(n, v)))).map(([n, v]) => [n, v.ko]);
    // One replacer makes the longest name win across both sources: "Il Dottore" before "Dottore",
    // and an existing "Hydro Archon" before a newly found "Hydro".
    // LLM-written names (data/manual/ko-names-llm.json) only fill what no source gives
    const have = new Set([...namePairs, ...extra].map(([n]) => n));
    const llm = (await llmNamePairs()).filter(([n]) => !have.has(n));
    const both = makeLocalizer([...namePairs, ...extra, ...llm], titlePairs, misspellingPairs);
    // A phrase that cannot be put into Korean whole stays English whole: "God of the Woods" must
    // not become "마신 of the Woods", nor "Dendro Archon" "풀 Archon".
    // A phrase inside a longer known name in the same text is left to that name:
    // "Analyse Cardinale" in "Oratrice Mecanique d'Analyse Cardinale" (latinNames stops at "d'").
    const known = [...new Set([...namePairs, ...extra, ...llm, ...titlePairs].map(([n]) => n).filter((n) => n && n.includes(' ')))];
    ko = (t) => {
      let text = prep(t);
      const kept = [];
      const longer = known.filter((n) => text.includes(n));
      for (const ph of [...new Set(latinNames(text))].sort((a, b) => b.length - a.length)) {
        if (!ph.includes(' ') || !latinNames(both(ph)).length) continue;
        if (longer.some((n) => n.length > ph.length && n.includes(ph))) continue;
        text = text.split(ph).join(`\u0002${kept.length}\u0002`);
        kept.push(ph);
      }
      return both(text).replace(/\u0002(\d+)\u0002/g, (_, i) => kept[Number(i)]);
    };
    log(`names: ${llm.length} written by an LLM (ko-names-llm.json)`);
    log(`names: ${extra.length} more from the dump (${extra.map(([n, k]) => `${n}=${k}`).join(', ')})`);
  }
  await extendNames(texts);
  return (t) => ko(t);
}

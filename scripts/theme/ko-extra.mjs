// Korean for English left in snapshot points that no official source gives, written by an LLM
// (decided by the user on 2026-11-12; docs/ko-names-plan.md). Kept apart from ko-names.json,
// which holds only sourced names, so a confirmed name can replace an LLM one at any time.
//
//   data/manual/ko-names-llm.json  { name: { ko?, kind: "name"|"context"|"keep", by, date, note? } }
//     "name": one Korean name everywhere. "context": depends on the sentence (Archon: 마신 or
//     집정관), so no ko here; the sentence's own choice is in ko-context.json. "keep": stays English.
//   data/manual/ko-context.json    { pointKey(text_raw): { English: Korean } }
//     per-sentence choices, applied after every dictionary name (it only sees what is left).
//   data/manual/ko-rewrite.json    { pointKey(text_raw): { from, text } }
//     a whole sentence rewritten where word swaps cannot help ("제. 3", "심연의 power",
//     lowercase English). Used only while the sentence is still exactly `from`; keepsKorean()
//     checks at import that only the English parts changed.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { makeLocalizer } from '../recommend/ko-text.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
export const LLM_NAMES = `${ROOT}data/manual/ko-names-llm.json`;
export const CONTEXT = `${ROOT}data/manual/ko-context.json`;
export const REWRITE = `${ROOT}data/manual/ko-rewrite.json`;

const LATIN_RUN = /[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9'’.\-]*(?:\s+[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’.\-]*)*/g;

/**
 * Whether `to` keeps every Korean part of `from` (in order): the text between English runs,
 * minus up to 2 characters at each edge (particles change), must still be there when it is
 * 4 characters or more. Returns the first missing part, or null when all are kept.
 */
export function missingKorean(from, to) {
  let at = 0;
  for (const seg of from.split(LATIN_RUN)) {
    const core = seg.trim().slice(2, -2).trim();
    if (core.length < 4) continue;
    const i = to.indexOf(core, at);
    if (i === -1) return core;
    at = i + core.length;
  }
  return null;
}
export const keepsKorean = (from, to) => missingKorean(from, to) === null;

/** Words whose Korean depends on the sentence; never one dictionary entry. */
export const CONTEXT_DEPENDENT = new Set(['archon']);
export const isContextDependent = (name) => CONTEXT_DEPENDENT.has(name.replace(/^The /, '').replace(/s$/, '').toLowerCase());

/** Stable id of a point: its English-name draft (text_raw) does not change when names do. */
export const pointKey = (textRaw) => createHash('sha1').update(textRaw ?? '').digest('hex').slice(0, 12);

const readJson = async (path) => {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
};
const strip = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('$')));

/** [English, Korean] pairs of kind "name". */
export async function llmNamePairs() {
  return Object.entries(strip(await readJson(LLM_NAMES)))
    .filter(([n, v]) => v.kind === 'name' && v.ko && !isContextDependent(n)).map(([n, v]) => [n, v.ko]);
}

/**
 * Fixed forms that word swaps leave behind: "No. 3" → "제. 3" is a Harbinger rank, 제3위; an
 * element's Archon is "OO의 신" (user decision 2026-11-12), also where the writer put
 * "Dendro 집정관" or "얼음 신" in its own Korean. A Gnosis ("물 신의 심장") keeps its name.
 */
export const tidy = (text) => text
  .replace(/제\.\s?(\d+)(?!위)/g, '제$1위')
  .replace(/(?<![가-힣])(불|물|바람|번개|바위|풀|얼음) (?:신|집정관)(?!의 심장)(?=[^가-힣]|$|은|는|이|가|을|를|에|와|과|도|으로|로|의|만|이자|이며|이다|인|이던|이었|으로서)/g, '$1의 신');

/** Per-point replacer: (text, textRaw) → text with that point's choices, particles re-fitted. */
export async function contextLocalizer() {
  const all = strip(await readJson(CONTEXT));
  const rewrites = strip(await readJson(REWRITE));
  const cache = new Map();
  return (text, textRaw) => {
    const key = pointKey(textRaw);
    const map = all[key];
    if (map) {
      if (!cache.has(key)) cache.set(key, makeLocalizer(Object.entries(map).filter(([, ko]) => ko)));
      text = cache.get(key)(text);
    }
    const r = rewrites[key];
    return tidy(r && r.from === text ? r.text : text);
  };
}

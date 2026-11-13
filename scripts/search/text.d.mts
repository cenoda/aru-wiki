// Types for text.mjs, which the site imports (src/bodySearch.ts).
export function foldMap(s: string): { folded: string; map: number[] };
export function foldText(s: string): string;
export function bigrams(folded: string): string[];
export function shardOf(gram: string, shards: number): number;
export function articlePieces(a: { lead: { s: { t: string }[] } | null; sections: { h: string; q?: { t: string }; p: { s: { t: string }[] }[] }[] }): string[];
export const MANY: number;
export function encodePostings(list: [number, boolean][]): string;
export function decodePostings(s: string): [number, boolean][];

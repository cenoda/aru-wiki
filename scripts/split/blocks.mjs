// Version blocks for the split data (design.md 6절). Versions are compared by order (0..n-1, never by
// name: "Luna IV"). Block i (1..n) holds what was first revealed at orders lo..hi, where
// lo = i - lowbit(i) and hi = i - 1 (a Fenwick tree). Orders 0..v are covered exactly by at most
// log2(n) + 1 blocks, and none of them holds anything revealed after v. Shared by the data build
// (scripts/split/build.mjs) and the site (src/split.ts).

/** @param {number} i block number, 1-based */
export const blockRange = (i) => [i - (i & -i), i - 1];

/** Blocks that together hold orders 0..v, each exactly once. */
export function coverOf(v) {
  const out = [];
  for (let i = v + 1; i > 0; i -= i & -i) out.push(i);
  return out;
}

/** Blocks that hold order o, for n versions. */
export function blocksWith(o, n) {
  const out = [];
  for (let i = o + 1; i <= n; i += i & -i) out.push(i);
  return out;
}

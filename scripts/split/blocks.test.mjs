import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockRange, blocksWith, coverOf } from './blocks.mjs';

test('cover of 0..v is exact, never past v, and at most log2 blocks', () => {
  for (const n of [1, 7, 53, 64, 100]) {
    for (let v = 0; v < n; v++) {
      const seen = [];
      for (const i of coverOf(v)) {
        const [lo, hi] = blockRange(i);
        assert.ok(hi <= v && i <= n);
        for (let o = lo; o <= hi; o++) seen.push(o);
      }
      assert.deepEqual(seen.sort((a, b) => a - b), Array.from({ length: v + 1 }, (_, k) => k));
      assert.ok(coverOf(v).length <= Math.floor(Math.log2(n)) + 1);
    }
  }
});

test('blocksWith lists exactly the blocks whose range holds the order', () => {
  const n = 53;
  for (let o = 0; o < n; o++) {
    const want = [];
    for (let i = 1; i <= n; i++) { const [lo, hi] = blockRange(i); if (lo <= o && o <= hi) want.push(i); }
    assert.deepEqual(blocksWith(o, n), want);
  }
});

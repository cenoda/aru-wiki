// Count where the version-note brackets (.ver-stem) cross storyline track or cards on the quest map.
// node scripts/dev/memo-crossings.mjs [out.png]   (needs the dev server on :5173)
// A bracket drawn with a gap where it passes under a track still counts as a crossing ("under");
// "clean" means it never meets a track at all.
import { chromium } from 'playwright';

const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ colorScheme: process.env.DARK ? 'dark' : 'light', viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto('http://127.0.0.1:5173/?view=quests');
await page.waitForSelector('.ver-stem', { timeout: 30000 });
await page.waitForTimeout(800);
if (out) await page.screenshot({ path: out });
// zoom all the way out so every node is rendered (onlyRenderVisibleElements)
await page.mouse.move(800, 500);
for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(30); }
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  // absolute M/L/H/V only, mapped to screen space
  const segsOf = (path) => {
    const m = path.getScreenCTM();
    const toks = path.getAttribute('d').match(/[MLHVZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
    const pts = []; let cur = null, start = null, cmd = null, i = 0;
    const out = [];
    const push = (x, y) => {
      const p = new DOMPoint(x, y).matrixTransform(m);
      if (cur && (cmd !== 'M')) out.push([cur, p]);
      cur = p; cur.lx = x; cur.ly = y;
    };
    while (i < toks.length) {
      const t = toks[i];
      if (/[A-Za-z]/.test(t)) { cmd = t.toUpperCase(); i++; if (cmd === 'Z') { if (start) out.push([cur, start]); } continue; }
      if (cmd === 'M') { push(+toks[i], +toks[i + 1]); start = cur; i += 2; cmd = 'L'; continue; }
      if (cmd === 'L') { push(+toks[i], +toks[i + 1]); i += 2; continue; }
      if (cmd === 'H') { push(+toks[i], cur.ly); i += 1; continue; }
      if (cmd === 'V') { push(cur.lx, +toks[i]); i += 1; continue; }
      if (cmd === 'Q') { push(+toks[i + 2], +toks[i + 3]); i += 4; continue; } // endpoint only
      i++;
    }
    return out;
  };
  // join collinear axis-aligned pieces separated by a small gap (a bracket passing under a track)
  const bridge = (segs) => {
    const res = [...segs];
    for (let k = res.length - 1; k > 0; k--) {
      const [a1, a2] = res[k - 1], [b1, b2] = res[k];
      const vert = Math.abs(a1.x - a2.x) < .5 && Math.abs(b1.x - b2.x) < .5 && Math.abs(a1.x - b1.x) < .5;
      const horiz = Math.abs(a1.y - a2.y) < .5 && Math.abs(b1.y - b2.y) < .5 && Math.abs(a1.y - b1.y) < .5;
      if ((vert || horiz) && Math.hypot(b1.x - a2.x, b1.y - a2.y) <= 14) res.splice(k - 1, 2, [a1, b2]);
    }
    return res;
  };
  const cross = ([p, q], [s, t]) => {
    const d = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const d1 = d(s, t, p), d2 = d(s, t, q), d3 = d(p, q, s), d4 = d(p, q, t);
    return d1 * d2 < 0 && d3 * d4 < 0;
  };
  const tracks = [...document.querySelectorAll('.react-flow__edge path.react-flow__edge-path')].flatMap(segsOf);
  const cards = [...document.querySelectorAll('.react-flow__node-act')].map((n) => n.getBoundingClientRect());
  const opens = [...document.querySelectorAll('.react-flow__node-act .opens')].map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0);
  const notes = [...document.querySelectorAll('.react-flow__node-note')].map((n) => ({ id: n.dataset.id.slice(5), r: n.getBoundingClientRect() }));
  const hit = ([a, b], c) => Math.max(a.x, b.x) > c.left + .1 && Math.min(a.x, b.x) < c.right - .1 && Math.max(a.y, b.y) > c.top + .1 && Math.min(a.y, b.y) < c.bottom - .1;
  let opensHits = 0, noteHits = 0;
  let stems = 0, withCross = 0, crossings = 0, cardHits = 0, under = 0;
  const bad = [];
  for (const el of document.querySelectorAll('.react-flow__node-stem')) {
    stems++;
    const raw = [...el.querySelectorAll('path')].flatMap(segsOf);
    const segs = bridge(raw);
    let n = 0, u = 0;
    for (const s of segs) for (const t of tracks) if (cross(s, t)) { n++; if (!raw.some((q) => cross(q, t))) u++; }
    for (const s of raw) for (const c of cards) {
      const [a, b] = s, ix = Math.min(a.x, b.x), ax = Math.max(a.x, b.x), iy = Math.min(a.y, b.y), ay = Math.max(a.y, b.y);
      if (ax > c.left + .1 && ix < c.right - .1 && ay > c.top + .1 && iy < c.bottom - .1) cardHits++;
    }
    for (const s of raw) { opensHits += opens.filter((c) => hit(s, c)).length; noteHits += notes.filter((o) => o.id !== el.dataset.id.slice(5) && hit(s, o.r)).length; }
    if (n) { withCross++; bad.push(`${el.dataset.id}:${n}${u ? `(${u} under)` : ''}`); }
    crossings += n; under += u;
  }
  return { stems, tracks: tracks.length, withCross, crossings, under, cardHits, opensHits, noteHits, bad };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();

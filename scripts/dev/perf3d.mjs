// Frame time of the 3D star chart on a phone-like page: node scripts/dev/perf3d.mjs [base] [stars...]
// base: a dev server or a VITE_PERF3D=1 build (`?stars=` copies the chart, see src/wiki3dPerf.ts).
// Phone viewport (390x844, DPR 3, touch), CPU slowed 4x, night sky. For each star count: time until
// the chart is laid out, then frame times while the view is dragged round, then while zooming.
// Env: RUNS (default 2), LIGHT=1 for the day sky, DPR, THROTTLE, PROFILE=n (top n functions by self time).
// Note: headless Chromium draws WebGL in software (SwiftShader), so frame times include drawing on
// the CPU and run far above a real phone GPU; scriptPerFrame and drawsPerFrame compare better.
import { chromium } from 'playwright';

const [base = 'http://127.0.0.1:5181', ...counts] = process.argv.slice(2);
const stars = counts.length ? counts.map(Number) : [0, 1400];
const RUNS = Number(process.env.RUNS ?? 2);
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (f) => s[Math.min(s.length - 1, Math.floor(s.length * f))] ?? NaN;
  const mean = s.reduce((a, b) => a + b, 0) / (s.length || 1);
  return { frames: s.length, mean: +mean.toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +q(1).toFixed(1) };
};

async function run(n) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: Number(process.env.DPR ?? 3), isMobile: true, hasTouch: true,
    colorScheme: process.env.LIGHT ? 'light' : 'dark', reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE ?? 4) });
  await page.addInitScript(() => {
    const w = window;
    // WebGL draw calls (one per mesh, sprite or line drawn)
    w.__draws = 0;
    for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const o = WebGL2RenderingContext.prototype[f];
      WebGL2RenderingContext.prototype[f] = function (...a) { if (w.__rec) w.__draws++; return o.apply(this, a); };
    }
    w.__frames = [];
    w.__rec = false;
    let last = 0;
    const tick = (t) => { if (w.__rec && last) w.__frames.push(t - last); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    w.__long = 0;
    new PerformanceObserver((l) => { if (w.__rec) for (const e of l.getEntries()) w.__long += e.duration; }).observe({ type: 'longtask', buffered: false });
  });
  const top = async (n) => {
    const { profile } = await cdp.send('Profiler.stop');
    const self = new Map();
    const dt = new Map();
    for (let i = 0; i < profile.samples.length; i++) dt.set(profile.samples[i], (dt.get(profile.samples[i]) ?? 0) + (profile.timeDeltas[i] ?? 0));
    for (const nd of profile.nodes) {
      const k = `${nd.callFrame.functionName || '(anon)'} ${nd.callFrame.url.split('/').pop()}:${nd.callFrame.lineNumber + 1}`;
      self.set(k, (self.get(k) ?? 0) + (dt.get(nd.id) ?? 0) / 1000);
    }
    console.error([...self].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `   ${v.toFixed(0).padStart(7)} ms  ${k}`).join('\n'));
  };
  if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
  const t0 = Date.now();
  await page.goto(`${base}/${n ? `?stars=${n}` : ''}`);
  await page.waitForSelector('.w3d-stage[data-ready]', { state: 'attached', timeout: 180000 });
  const ready = Date.now() - t0;
  if (process.env.PROFILE) { console.error('  load:'); await top(Number(process.env.PROFILE) || 25); }
  const m = await page.evaluate(() => performance.getEntriesByType('measure').filter((e) => e.name.startsWith('w3d')).map((e) => `${e.name}=${Math.round(e.duration)}`).join(' '));
  if (m) console.error('  ', m);
  await page.waitForTimeout(1500);
  const box = await page.locator('.w3d-stage, canvas').first().boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await cdp.send('Performance.enable');
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  // per frame: wall time between frames, and main-thread script / task time (script time is what the
  // page's own code costs; the rest of a slow frame is drawing, here on a software GPU)
  const measure = async (fn) => {
    const m0 = await metrics();
    const w0 = Date.now();
    await page.evaluate(() => { window.__frames = []; window.__long = 0; window.__draws = 0; window.__rec = true; });
    await fn();
    const r = await page.evaluate(() => { window.__rec = false; return { frames: window.__frames, long: window.__long, draws: window.__draws }; });
    const m1 = await metrics();
    const f = r.frames.length || 1;
    return { ...stats(r.frames), wall: Date.now() - w0, scriptPerFrame: +((m1.ScriptDuration - m0.ScriptDuration) * 1000 / f).toFixed(1),
      taskPerFrame: +((m1.TaskDuration - m0.TaskDuration) * 1000 / f).toFixed(1), longTasks: Math.round(r.long), drawsPerFrame: Math.round(r.draws / f) };
  };
  // drag: turn the chart round for about 2 s
  if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
  const drag = await measure(async () => {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 0; i < 40; i++) { await page.mouse.move(cx + 120 * Math.sin(i / 12), cy + 40 * Math.cos(i / 9)); await page.waitForTimeout(50); }
    await page.mouse.up();
  });
  if (process.env.PROFILE) { console.error('  drag:'); await top(Number(process.env.PROFILE) || 25); }
  await page.waitForTimeout(400);
  const zoom = await measure(async () => {
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, i < 10 ? -60 : 60); await page.waitForTimeout(50); }
  });
  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { canvas: c ? `${c.width}x${c.height}` : null };
  });
  await ctx.close();
  return { ready, drag, zoom, ...info };
}

for (const n of stars) {
  for (let r = 0; r < RUNS; r++) {
    const res = await run(n);
    console.log(JSON.stringify({ stars: n || 'real', run: r + 1, ...res }));
  }
}
await browser.close();

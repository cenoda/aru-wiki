// Screenshot the running dev server: node scripts/dev/screenshot.mjs [query] [out.png]
import { chromium } from 'playwright';

const [query = '', out = '/tmp/aru-shot.png'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ colorScheme: process.env.DARK ? 'dark' : 'light', viewport: { width: Number(process.env.W ?? 1600), height: Number(process.env.H ?? 1000) }, deviceScaleFactor: Number(process.env.SCALE ?? 1) });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://127.0.0.1:5173/${query}`);
await page.waitForSelector(process.env.WAIT ?? '.react-flow__node', { timeout: 30000 });
if (process.env.CLICK) { await page.locator(process.env.CLICK).first().click(); await page.waitForTimeout(900); }
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: !!process.env.FULL });
console.log(out, await page.locator('.react-flow__node').count(), 'nodes rendered');
await browser.close();

import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const outDir = path.join(root, '_screens');
mkdirSync(outDir, { recursive: true });

// Each capture: filename, device, and a setup snippet run in the page.
const SHOTS = [
  // ---- Планшет (в классе) ----
  ['01-waiting',          'tablet', `resetAll();go('s1')`],
  ['02-warmup',           'tablet', `resetAll();go('s2')`],
  ['03-warmup-feedback',  'tablet', `resetAll();go('s2');wAnswer(0)`],
  ['04-explanation',      'tablet', `resetAll();go('s3')`],
  ['05-practice',         'tablet', `resetAll();st.prac=0;go('s4')`],
  ['06-practice-written', 'tablet', `resetAll();st.prac=2;go('s4')`],
  ['07-camera',           'tablet', `resetAll();st.camStep=0;go('s5')`],
  ['08-camera-preview',   'tablet', `resetAll();st.camStep=1;go('s5')`],
  ['09-camera-sent',      'tablet', `resetAll();st.camStep=2;go('s5')`],
  ['10-stuck',            'tablet', `resetAll();go('s6')`],
  ['11-reflection',       'tablet', `resetAll();go('s7');st.refl=2;render()`],
  ['12-finished',         'tablet', `resetAll();go('s8')`],
  // ---- Мобильный (дома) ----
  ['13-home',             'phone',  `resetAll();go('s9')`],
  ['14-homework',         'phone',  `resetAll();go('s10')`],
  ['15-homework-done',    'phone',  `resetAll();go('s10');[0,0,2,0,1,0].forEach(a=>{hAnswer(a);hNext()})`],
  ['16-progress',         'phone',  `resetAll();go('s12')`],
  // ---- Заглушки ----
  ['17-buffer',           'tablet', `resetAll();go('s13')`],
  ['18-diagnostic',       'tablet', `resetAll();go('s14')`],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

// Clean capture: square off screen corners, freeze animations.
await page.addStyleTag({ content: `.tscreen,.pscreen{border-radius:0!important} .notch{display:none!important} *{animation:none!important}` });

for (const [name, dev, setup] of SHOTS) {
  await page.evaluate(s => { eval(s); }, setup);
  await page.waitForTimeout(120);
  const sel = dev === 'tablet' ? '#tscreen' : '#pscreen';
  const el = await page.$(sel);
  await el.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log('saved', name);
}

await browser.close();
console.log('done -> _screens/');

// Pomocník pro e2e testy (node:test + Puppeteer) nad sestaveným webem v _site.
// Předpoklad: npm run build (případně s PATH_PREFIX). Testy spouští `npm run test:e2e`.
//
//   import { otevri, zavri } from './pomocnik.mjs';
//   const { page, url } = await otevri('penize/plan48/');
//   ...
//   after(zavri);
import { spustitProhlizec } from '../../tools/kontroly/prohlizec.mjs';
import { spustitServer } from '../../tools/kontroly/server.mjs';

let sdilene = null;

async function pripravit() {
  if (!sdilene) {
    const srv = await spustitServer({ prefix: process.env.PATH_PREFIX || '/' });
    const browser = await spustitProhlizec();
    sdilene = { srv, browser };
  }
  return sdilene;
}

// Otevře stránku (cesta relativní k prefixu) a vrátí page + seznam chyb z konzole.
export async function otevri(cesta, { sirka = 390, vyska = 844, js = true } = {}) {
  const { srv, browser } = await pripravit();
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(js);
  await page.setViewport({ width: sirka, height: vyska });
  const chyby = [];
  page.on('pageerror', (e) => chyby.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') chyby.push(m.text()); });
  await page.goto(srv.zaklad + cesta, { waitUntil: 'networkidle0' });
  return { page, chyby, url: srv.zaklad + cesta };
}

// Vyplní pole (smaže obsah a napíše hodnotu) a vyvolá input/change.
export async function vypln(page, selektor, hodnota) {
  await page.$eval(selektor, (el, h) => {
    el.value = String(h);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, hodnota);
}

// Text prvku s normalizovanými mezerami (pevné mezery → běžné).
export async function text(page, selektor) {
  const t = await page.$eval(selektor, (el) => el.textContent);
  return t.replace(/[   ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function zavri() {
  if (!sdilene) return;
  await sdilene.browser.close();
  await sdilene.srv.zavrit();
  sdilene = null;
}

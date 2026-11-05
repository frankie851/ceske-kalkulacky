// Společná knihovna pro kontroly v prohlížeči (nezávislá revize 5. 11. 2026).
// Použití: import { spustServer, otevriProhlizec, kontrolaStranky } from './prohlizec-lib.mjs'
// Nástroje (puppeteer, @axe-core/puppeteer) jsou mimo repozitář v /tmp/revize/nastroje.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('/tmp/revize/nastroje/package.json');
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

export const CHROME = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
export const XSS = '<img src=x onerror=alert(1)>';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.ics': 'text/calendar', '.csv': 'text/csv', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

/** Statický server nad složkou klonu; vrací { url, zavri }. */
export function spustServer(koren) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(koren, p);
    if (!f.startsWith(koren) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}/`;
    resolve({ url, zavri: () => new Promise(r => server.close(r)) });
  }));
}

/** Otevře prohlížeč a stránku se záznamem sítě, konzole, dialogů. */
export async function otevriProhlizec({ sirka = 360, vyska = 800 } = {}) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: sirka, height: vyska, deviceScaleFactor: 1 });
  const zaznam = { sit: [], konzole: [], dialogy: [], chyby: [] };
  page.on('request', r => zaznam.sit.push({ url: r.url(), typ: r.resourceType(), metoda: r.method() }));
  page.on('requestfailed', r => zaznam.chyby.push({ url: r.url(), chyba: r.failure()?.errorText }));
  page.on('response', r => { if (r.status() >= 400) zaznam.chyby.push({ url: r.url(), stav: r.status() }); });
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) zaznam.konzole.push({ typ: m.type(), text: m.text() }); });
  page.on('pageerror', e => zaznam.konzole.push({ typ: 'pageerror', text: String(e) }));
  page.on('dialog', async d => { zaznam.dialogy.push({ typ: d.type(), text: d.message() }); await d.dismiss(); });
  return { browser, page, zaznam, zavri: () => browser.close() };
}

export async function preteka(page) {
  return page.evaluate(() => {
    const d = document.scrollingElement || document.documentElement;
    return { scrollWidth: d.scrollWidth, innerWidth: window.innerWidth, preteka: d.scrollWidth > window.innerWidth + 1 };
  });
}

export async function axe(page) {
  const r = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  return r.violations.map(v => ({ id: v.id, dopad: v.impact, popis: v.help, pocet: v.nodes.length, uzly: v.nodes.slice(0, 3).map(n => n.target.join(' ')) , tags: v.tags.filter(t => t.startsWith('wcag')) }));
}

/** Vyplní všechna textová/číselná pole payloadem XSS a vrátí, zda se objevil dialog nebo vložený <img>. */
export async function zkusXss(page, payload = XSS) {
  await page.evaluate(p => {
    document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=range]):not([type=file]):not([type=hidden]), textarea').forEach(el => {
      el.value = p; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('form').forEach(f => f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  }, payload);
  await new Promise(r => setTimeout(r, 600));
  const img = await page.evaluate(() => !!document.querySelector('img[src="x"]'));
  return { vlozenyImg: img };
}

/** Zjistí pořadí fokusu při Tab (n kroků) a jestli je fokus vidět (outline/box-shadow nenulové). */
export async function tabulator(page, n = 25) {
  const poradi = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const viditelny = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      const lbl = el.labels?.[0]?.textContent?.trim() || el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || '';
      return { tag: el.tagName.toLowerCase(), id: el.id, typ: el.type || '', popisek: lbl, fokusViditelny: viditelny };
    });
    if (info) poradi.push(info);
  }
  return poradi;
}

export async function localStorageDump(page) {
  return page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k)?.slice(0, 300); } return o; });
}

/** Standardní kontrola jedné stránky: snímky 360/1440, přetékání, axe, síť, konzole, XSS, Tab, localStorage. */
export async function kontrolaStranky({ koren, cesta = '', vystup, nazev = 'stranka', url: urlVnejsi }) {
  fs.mkdirSync(vystup, { recursive: true });
  const srv = urlVnejsi ? null : await spustServer(koren);
  const zaklad = urlVnejsi || srv.url;
  const vysledek = { url: zaklad + cesta, datum: new Date().toISOString(), zobrazeni: {} };
  for (const [jmeno, sirka, vyska] of [['360', 360, 800], ['1440', 1440, 900]]) {
    const b = await otevriProhlizec({ sirka, vyska });
    await b.page.goto(zaklad + cesta, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 500));
    await b.page.screenshot({ path: path.join(vystup, `${nazev}-${jmeno}.png`), fullPage: true });
    const z = { preteka: await preteka(b.page) };
    if (jmeno === '360') {
      z.axe = await axe(b.page);
      z.tab = await tabulator(b.page, 30);
      z.xss = await zkusXss(b.page);
      await b.page.screenshot({ path: path.join(vystup, `${nazev}-${jmeno}-xss.png`), fullPage: true });
      z.localStorage = await localStorageDump(b.page);
    }
    z.sit = b.zaznam.sit; z.konzole = b.zaznam.konzole; z.dialogy = b.zaznam.dialogy; z.chyby = b.zaznam.chyby;
    const cizi = b.zaznam.sit.filter(r => !r.url.startsWith(zaklad));
    z.ciziPozadavky = cizi;
    vysledek.zobrazeni[jmeno] = z;
    await b.zavri();
  }
  if (srv) await srv.zavri();
  fs.writeFileSync(path.join(vystup, `${nazev}-kontrola.json`), JSON.stringify(vysledek, null, 1));
  return vysledek;
}

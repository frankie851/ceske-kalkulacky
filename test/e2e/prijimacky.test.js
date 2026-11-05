// E2E: Přijímačky bez paniky ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/prijimacky.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';
import { SCENARIOS, EXPECTED } from '../../src/nastroje/prijimacky/scenarios.js';
import { evaluateStrategy } from '../../src/nastroje/prijimacky/strategy.js';

after(zavri);

const CESTA = 'prace-rodina/prijimacky/';
const pravidla = JSON.parse(fs.readFileSync(new URL('../../src/nastroje/prijimacky/rules.json', import.meta.url), 'utf8'));
const { AxePuppeteer } = await import('@axe-core/puppeteer');

/** Přiřazení z výsledku na stránce: { id uchazeče: id školy | null } */
const prirazeni = (page) => page.$$eval('#vysledek [data-uchazec]', (li) =>
  Object.fromEntries(li.map((l) => [l.dataset.uchazec, l.dataset.skola || null])));

async function vyberScenar(page, id) {
  const i = SCENARIOS.findIndex((s) => s.id === id) + 1;
  await page.click(`label[for="scenar-${i}"]`);
}

async function prehraj(page) {
  await page.click('[data-prehrat]');
  await page.waitForSelector('#vysledek:not([hidden])', { timeout: 20000 });
}

for (const sc of SCENARIOS) {
  test(`scénář „${sc.title}“: po Přehrát odpovídá přiřazení EXPECTED`, async () => {
    const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
    await vyberScenar(page, sc.id);
    assert.equal(await page.$eval('#vysledek', (el) => el.hidden), true, 'výsledek se ukáže až po přehrání');
    await prehraj(page);
    assert.deepEqual(await prirazeni(page), EXPECTED[sc.id]);
    assert.match(await text(page, '[data-stav-kola]'), /Hotovo/);
    const prijato = Object.values(EXPECTED[sc.id]).filter(Boolean).length;
    assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), `${prijato} z ${Object.keys(EXPECTED[sc.id]).length}`);
    // vysvětlení u každého uchazeče
    const vysvetleni = await page.$$eval('#vysledek [data-uchazec] .prij-proc li', (l) => l.length);
    assert.ok(vysvetleni >= Object.keys(EXPECTED[sc.id]).length);
    assert.deepEqual(chyby, []);
    await page.close();
  });
}

test('krokování: kolo po kole až do výsledku, Začít znovu vrátí stav před startem', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 390 });
  const kol = (await page.$$eval('.prij-kolo', (k) => k.length));
  assert.equal(kol, 0);
  await page.click('[data-krok]');
  assert.match(await text(page, '[data-stav-kola]'), /Kolo 1 z 3/);
  assert.equal(await page.$$eval('.prij-kolo', (k) => k.length), 1);
  await page.click('[data-krok]');
  await page.click('[data-krok]');
  assert.equal(await page.$eval('#vysledek', (el) => el.hidden), false);
  assert.equal(await page.$eval('[data-krok]', (el) => el.disabled), true);
  await page.click('[data-znovu]');
  assert.match(await text(page, '[data-stav-kola]'), /Připraveno/);
  assert.equal(await page.$eval('#vysledek', (el) => el.hidden), true);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('úprava třídy: Kuba s 3. prioritou SOŠ služeb dostane místo; zamíchání výsledek nezmění', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  await vyberScenar(page, 'jistota');
  await page.select('#dite-b5-pr2', 'S');
  assert.match(await text(page, '[data-scenar-info]'), /Vlastní třída/);
  await page.click('[data-zamichat]');
  assert.match(await text(page, '[data-zamichat-poznamka]'), /výsledek zůstal stejný/);
  await prehraj(page);
  const p = await prirazeni(page);
  assert.equal(p.b5, 'S');
  assert.equal(p.b6, 'S');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('shoda bodů bez rozhodnutí → srozumitelná chyba, po doplnění „při shodě“ simulace běží', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  await vypln(page, '#dite-a3-body', '88'); // Cyril = Bára
  assert.equal(await page.$eval('[data-sim-chyba]', (el) => el.hidden), false);
  assert.match(await text(page, '[data-sim-chyba]'), /stejně bodů/);
  await vypln(page, '#dite-a3-shoda', '1');
  await vypln(page, '#dite-a2-shoda', '2');
  assert.equal(await page.$eval('[data-sim-chyba]', (el) => el.hidden), true);
  await prehraj(page);
  assert.equal((await prirazeni(page)).a2, 'G');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('strategie: kategorie podle evaluateStrategy a varování bez jistoty', async () => {
  const { page, chyby } = await otevri(CESTA);
  const pripady = [
    { expected: 60, margin: 5, schools: [{ name: 'Gympl', lastMin: 75 }, { name: 'Průmyslovka', lastMin: 62 }, { name: 'Obchodka', lastMin: 58 }] },
    { expected: 70, margin: 10, schools: [{ name: 'A', lastMin: 80 }, { name: 'B', lastMin: 68 }, { name: 'C', lastMin: 50 }] },
  ];
  for (const pr of pripady) {
    await vypln(page, '#str-ocekavane', pr.expected);
    await page.click(`label[for="str-rezerva-${pr.margin}"]`);
    for (const [i, s] of pr.schools.entries()) {
      await vypln(page, `#str-nazev-${i + 1}`, s.name);
      await vypln(page, `#str-min-${i + 1}`, s.lastMin);
    }
    const ocekavane = evaluateStrategy(pr);
    const kategorie = await page.$$eval('[data-strategie-vystup] [data-kategorie]', (l) => l.map((x) => x.dataset.kategorie));
    assert.deepEqual(kategorie, ocekavane.schools.map((s) => s.category));
    const upozorneni = await page.$$eval('[data-strategie-vystup] [data-upozorneni]', (l) => l.map((x) => x.dataset.upozorneni));
    assert.deepEqual(upozorneni, ocekavane.warnings.map((w) => w.id));
  }
  assert.deepEqual(chyby, []);
  await page.close();
});

test('kalendář: filtry a export .ics (Blob i stažený soubor s BEGIN:VCALENDAR)', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  const ctyrlete = pravidla.events.filter((e) => e.group === 'ss').length;
  assert.equal(await page.$$eval('.prij-termin', (l) => l.length), ctyrlete);
  await page.click('label[for="filtr-kons"]');
  const sKons = pravidla.events.filter((e) => e.group !== 'vg').length;
  assert.equal(await page.$$eval('.prij-termin', (l) => l.length), sKons);

  const slozka = fs.mkdtempSync(path.join(os.tmpdir(), 'prij-ics-'));
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: slozka });
  await page.evaluate(() => {
    window.__ics = [];
    const puvodni = URL.createObjectURL;
    URL.createObjectURL = (blob) => { window.__ics.push(blob); return puvodni.call(URL, blob); };
  });
  await page.click('[data-ics]');
  const ics = await page.evaluate(async () => ({ typ: window.__ics[0]?.type, text: await window.__ics[0]?.text() }));
  assert.match(ics.typ, /^text\/calendar/);
  assert.ok(ics.text.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.text.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.text.match(/BEGIN:VEVENT/g) || []).length, sKons);
  assert.match(ics.text, /SUMMARY:Konzervato/);
  assert.match(ics.text, /DTSTAMP:20261105T000000Z/, 'pevný čas z meta.overeno');

  const soubor = path.join(slozka, 'prijimacky-2027.ics');
  for (let i = 0; i < 50 && !fs.existsSync(soubor); i++) await new Promise((r) => setTimeout(r, 100));
  assert.ok(fs.existsSync(soubor), 'soubor .ics se stáhl');
  assert.ok(fs.readFileSync(soubor, 'utf8').startsWith('BEGIN:VCALENDAR'));
  fs.rmSync(slozka, { recursive: true, force: true });
  assert.deepEqual(chyby, []);
  await page.close();
});

test('axe během simulace a po přehrání (světlý i tmavý režim): 0 serious/critical', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  const zkontroluj = async (kdy) => {
    for (const rezim of ['light', 'dark']) {
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: rezim }]);
      // počkej, až doběhnou animace a přechody barev (čip přichází 450 ms)
      await new Promise((r) => setTimeout(r, 600));
      const r = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      const vazne = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')
        .map((x) => `${x.id}: ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
      assert.deepEqual(vazne, [], `${kdy}, ${rezim}`);
    }
  };
  await page.click('[data-krok]');
  await zkontroluj('během simulace');
  await page.click('[data-krok]');
  await page.click('[data-krok]');
  await zkontroluj('po přehrání');
  await page.click('#rezim-pokusy');
  await zkontroluj('režim dvou pokusů');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('bez JavaScriptu: ukázkový výsledek, celý kalendář a odkaz na .ics', async () => {
  const { page } = await otevri(CESTA, { js: false });
  const ukazka = await text(page, '[data-ukazka]');
  assert.match(ukazka, /6 z 6/);
  assert.deepEqual(await prirazeni(page), EXPECTED.body);
  assert.equal(await page.$$eval('.prij-kolo', (l) => l.length), 3);
  assert.equal(await page.$$eval('.prij-termin', (l) => l.length), pravidla.events.length);
  assert.equal(await page.$$eval('[data-strategie-vystup] [data-kategorie]', (l) => l.length), 3);
  const odkaz = await page.$eval('[data-ics-odkaz]', (a) => ({ href: a.getAttribute('href'), hidden: a.hidden }));
  assert.equal(odkaz.hidden, false);
  assert.match(odkaz.href, /prijimacky-2027\.ics$/);
  const odpoved = await fetch(new URL(odkaz.href, page.url()));
  assert.match(odpoved.headers.get('content-type'), /^text\/calendar/);
  assert.ok((await odpoved.text()).startsWith('BEGIN:VCALENDAR\r\n'));
  await page.close();
});

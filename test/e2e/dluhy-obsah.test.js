// Obsah stránky Exekuce, nebo oddlužení? – převod kontrol z původního test/obsah.test.js
// (frankie851/kalkulator-dluhu) na vygenerované HTML webu Spočítáno.
// Čte sestavený web (_site, případně SITE_DIR). Spuštění: npx eleventy && node --test test/e2e/dluhy-obsah.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzuj, textZHtml, textZJs, LIMITY } from '../../src/nastroje/exekuce-nebo-oddluzeni/scripts/ctenost.mjs';

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = path.resolve(KOREN, process.env.SITE_DIR || '_site');
const cti = (rel) => fs.readFileSync(path.join(SITE, rel), 'utf8');
const NASTROJ = path.join(KOREN, 'src/nastroje/exekuce-nebo-oddluzeni');

const html = cti('dluhy/exekuce-nebo-oddluzeni/index.html');
const htmlDluhy = cti('dluhy/index.html');
const main = (h) => h.match(/<main[\s\S]*<\/main>/)[0];
const jsSoubory = fs.readdirSync(path.join(SITE, 'nastroje/exekuce-nebo-oddluzeni')).filter((f) => f.endsWith('.js'));
const js = jsSoubory.map((f) => cti(`nastroje/exekuce-nebo-oddluzeni/${f}`)).join('\n');
const rules = JSON.parse(fs.readFileSync(path.join(NASTROJ, 'rules.json'), 'utf8'));
const VYHRADA = 'Orientační výpočet. Závazně to posoudí poradna, exekutor nebo insolvenční soud.';

// cnb.cz: úřední zdroj repo sazby pro úrok z prodlení (DLU-01)
const POVOLENE = [/(^|\.)justice\.cz$/, /^mpsv\.gov\.cz$/, /^e-sbirka\.gov\.cz$/, /^(www\.)?ceecr\.cz$/, /^(www\.)?ochrance\.cz$/, /^www\.cnb\.cz$/];
const externi = (h) => [...h.matchAll(/href="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).hostname);

test('stránka nástroje existuje v sestavení webu', () => {
  assert.ok(fs.existsSync(path.join(SITE, 'dluhy/exekuce-nebo-oddluzeni/index.html')));
  assert.match(htmlDluhy, /href="[^"]*\/dluhy\/exekuce-nebo-oddluzeni\/"/, '/dluhy/ odkazuje na nástroj');
});

test('odkaz na bezplatnou pomoc je v hlavičce a nad nadpisem každé části stránky', () => {
  const hlava = html.match(/<header class="dluhy-hlava">[\s\S]*?<\/header>/);
  assert.ok(hlava, 'chybí hlavička nástroje');
  const pomoc = hlava[0].indexOf('data-pomoc');
  assert.ok(pomoc > 0 && pomoc < hlava[0].indexOf('<h1'), 'hlavička: pomoc musí být nad h1');

  const sekce = [...html.matchAll(/<section[^>]*\bdata-sekce\b[^>]*>[\s\S]*?<\/section>/g)].map((m) => m[0]);
  assert.ok(sekce.length >= 3, 'stránka má části formulář, výsledek a další kroky');
  for (const s of sekce) {
    const id = s.match(/id="([^"]+)"/)[1];
    const p = s.indexOf('data-pomoc');
    const nadpis = s.search(/<h[1-3]/);
    assert.ok(p > 0 && p < nadpis, `${id}: pomoc musí být nad nadpisem`);
  }
  // Mobilní lišta s odkazem na pomoc
  assert.match(html, /<aside class="lepiva-lista[^"]*"[\s\S]*?href="#pomoc" data-pomoc[\s\S]*?<\/aside>/);
  // Sekce /dluhy/: nadpis h1 je přímo v bloku pomoci
  const blok = htmlDluhy.match(/<section class="debt[^"]*"[\s\S]*?<\/section>/)[0];
  assert.match(blok, /<h1/);
  assert.match(blok, /data-pomoc/);
});

test('stránka obsahuje oficiální seznamy pomoci z rules.json', () => {
  const pomoc = html.match(/<section[^>]*id="pomoc"[\s\S]*?<\/section>/)[0];
  assert.ok(rules.pomoc.length >= 5);
  for (const o of rules.pomoc) assert.ok(pomoc.includes(`href="${o.url}"`), `chybí ${o.url}`);
  assert.match(pomoc, /https:\/\/mpsv\.gov\.cz\/registr-poskytovatelu-sluzeb/);
  // Bezplatná pomoc s návrhem na oddlužení: oficiální průvodce ministerstva (sako.justice.cz se
  // 5. 11. 2026 zobrazovala prázdná, viz test/sdilene/pomoc.test.js).
  assert.match(pomoc, /https:\/\/insolvence\.justice\.cz\/jak-vstoupit-do-oddluzeni\//);
});

test('u každého výsledku je povinná věta o orientačním výpočtu', () => {
  const vysledek = html.match(/<section[^>]*id="vysledek"[\s\S]*?<\/section>/)[0];
  assert.match(vysledek, /data-ukazka/);
  const karty = vysledek.match(/<article[\s\S]*?<\/article>/g);
  assert.equal(karty.length, 2);
  for (const k of karty) assert.ok(k.includes(VYHRADA), 'karta bez povinné věty');
});

test('odkazy vedou jen na oficiální weby', () => {
  for (const [nazev, h] of [['nástroj', html], ['/dluhy/', htmlDluhy]]) {
    const hosty = externi(h);
    for (const host of hosty) assert.ok(POVOLENE.some((re) => re.test(host)), `${nazev}: nepovolený odkaz ${host}`);
  }
  assert.ok(externi(html).length > 5);
});

test('nic se neukládá ani neodesílá', () => {
  for (const h of [html, htmlDluhy]) {
    for (const m of h.matchAll(/<form[^>]*>/gi)) {
      const action = m[0].match(/\baction="([^"]*)"/);
      if (action) assert.doesNotMatch(action[1], /^(https?:)?\/\//, `formulář odesílá mimo web: ${action[1]}`);
    }
    assert.doesNotMatch(h, /<script[^>]*src="https?:/i);
    assert.doesNotMatch(h, /<link[^>]*href="https?:/i);
    assert.doesNotMatch(h, /<iframe|<img[^>]*src="https?:/i);
  }
  const formular = html.match(/<form[^>]*id="dluhy-formular"[^>]*>/)[0];
  assert.doesNotMatch(formular, /\baction=|\bmethod=/);
  assert.ok(jsSoubory.includes('ui.js') && jsSoubory.includes('dluhy.js'));
  assert.doesNotMatch(js, /localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|XMLHttpRequest|WebSocket|\bfetch\s*\(/);
  assert.doesNotMatch(js, /location\.(hash|search)\s*=|history\.(push|replace)State/);
});

test('žádné reklamy ani nabídky půjček', () => {
  const text = textZHtml(main(html)).toLowerCase().replace(/\s+/g, ' ').replace(/nabídky půjček nedáváme/g, '');
  for (const slovo of ['půjčka', 'úvěr bez registru', 'reklama', 'reklamní', 'sponzor', 'affiliate', 'půjčíme', 'vyřízení úvěru', 'rychlá půjčka', 'konsolidac', 'partner']) {
    assert.ok(!text.includes(slovo), `nevhodné slovo: ${slovo}`);
  }
});

test('čtivost: krátké věty a žádné nevysvětlené zkratky', () => {
  const ui = ['ui.js', 'vystup.js'].map((f) => cti(`nastroje/exekuce-nebo-oddluzeni/${f}`)).join('\n');
  const text = `${textZHtml(main(html))}\n${textZJs(ui)}`;
  const a = analyzuj(text);
  assert.ok(a.prumer <= LIMITY.prumer, `průměrná věta má ${a.prumer.toFixed(1)} slov`);
  assert.deepEqual(a.prilisDlouhe, [], 'příliš dlouhé věty');
  // Zkratka je vysvětlená, když je na stránce celý název (sdílený blok pomoc.json: „(MPSV)“ + „Provozuje: Ministerstvo práce…“)
  const VYSVETLENE = { MPSV: 'Ministerstvo práce a sociálních věcí' };
  const nevysvetlene = a.zkratky.filter((z) => !(VYSVETLENE[z] && text.includes(VYSVETLENE[z])));
  assert.deepEqual(nevysvetlene, [], 'nevysvětlené zkratky');
});

test('hlavička uvádí datum ověření shodné s rules.json', () => {
  assert.equal(rules.meta.overeno, rules.overeno);
  assert.match(html, new RegExp(`<time datetime="${rules.meta.overeno}"`));
});

// DLU-02: životní minimum 2026 cituje NV č. 361/2025 Sb., ne zrušené NV č. 436/2022 Sb.
test('zdroje na stránce necitují zrušené nařízení 436/2022', () => {
  assert.doesNotMatch(html, /436\/2022|sb\/2022\/436/);
  assert.match(html, /href="https:\/\/e-sbirka\.gov\.cz\/sb\/2025\/361"/);
});

// DLU-01: sazba úroku z prodlení podle pololetí, výchozí hodnota z rules.json
test('úrok z prodlení: nápověda mluví o pololetí a sazba v poli je z pravidel', () => {
  const napoveda = html.match(/id="urok-napoveda">([^<]*)</)[1];
  assert.match(napoveda, /pololetí/);
  assert.doesNotMatch(napoveda, /\d/);
  const nejnovejsi = rules.urokZProdleni.pololeti.at(-1);
  const sazba = html.match(/<input id="sazba"[^>]*value="([^"]*)"/)[1];
  assert.equal(sazba, String(nejnovejsi.procenta).replace('.', ','));
  const select = html.match(/<select id="pololeti"[\s\S]*?<\/select>/)[0];
  const volby = [...select.matchAll(/<option value="([^"]+)"( selected)?>/g)];
  assert.equal(volby.length, rules.urokZProdleni.pololeti.length + 1);
  assert.deepEqual([volby[0][1], Boolean(volby[0][2])], [nejnovejsi.od, true]);
  assert.equal(volby.at(-1)[1], 'jina');
  assert.match(html, /<label for="pololeti">/);
});

// DLU-03: u odkazů na úřední kalkulačky je vysvětlení, proč mohou ukázat jiné číslo
test('u úředních kalkulaček je upozornění na jiné číslo', () => {
  const pomoc = html.match(/<section[^>]*id="pomoc"[\s\S]*?<\/section>/)[0];
  const polozka = (url) => pomoc.match(new RegExp(`<li>\\s*<a[^>]*href="${url.replace(/[.?/]/g, '\\$&')}"[\\s\\S]*?</li>`))[0];
  const k = rules.uredniKalkulacky;
  const srazky = textZHtml(polozka('https://exekuce.justice.cz/vypocet-srazek-ze-mzdy/')).replace(/\s+/g, ' ');
  assert.ok(srazky.includes(k.srazky.variantaOdchylna), 'chybí název odchylné volby');
  assert.ok(srazky.includes(k.srazky.variantaPodleNarizeni), 'chybí název správné volby');
  assert.match(srazky, /k 1\. lednu/);
  const splatky = textZHtml(polozka('https://insolvence.justice.cz/')).replace(/\s+/g, ' ');
  assert.match(splatky, /vyšší splátku/);
  assert.match(splatky, /30 692 Kč/);
});

// Revize 5. 11. 2026: texty a zdroje cestovního příkazu (CES-04, CES-05).
// Hodnoty a citace ověřené proti textům na zakonyprolidi.cz 12. 11. 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as v from './vystup.js';

const rules = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const r2026 = rules['2026'];
const zdrojak = (soubor) => readFileSync(new URL(soubor, import.meta.url), 'utf8');

test('CES-04: nápověda ke spotřebě odpovídá § 158 odst. 4 ZP (kombinovaný provoz, jinak průměr)', () => {
  const html = zdrojak('./index.njk');
  const napoveda = /id: 'spotreba'[^\n]*napoveda: '([^']*)'/.exec(html)?.[1] ?? '';
  assert.match(napoveda, /kombinovaný provoz/);
  assert.match(napoveda, /aritmetický průměr/);
  assert.match(napoveda, /§ 158 odst\. 4/);
  assert.doesNotMatch(napoveda, /^Má-li technický průkaz víc údajů o spotřebě, použij jejich průměr/);
  const z = rules.zakonik.spotreba.zdroj;
  assert.match(z.url, /zakonyprolidi\.cz\/cs\/2006-262#p158$/);
  assert.match(z.citace, /údaj o spotřebě pro kombinovaný provoz/);
  assert.match(z.citace, /aritmetickým průměrem/);
});

test('CES-05: sazby 2026 odpovídají vyhláškám č. 573/2025, 78/2026 a 175/2026 Sb.', () => {
  // vyhláška č. 573/2025 Sb. § 1–3 (účinnost 1. 1. 2026)
  assert.deepEqual(r2026.sazbaKm, { osobni: 5.9, jednostope: 1.6 });
  assert.deepEqual(r2026.stravne, {
    soukroma: [155, 236, 370], verejnaMin: [155, 236, 370], verejnaMax: [185, 284, 442],
  });
  // § 4: původně benzin 95 34,70, benzin 98 39, nafta 34,10, elektřina 7,20 Kč;
  // 78/2026 Sb.: nafta 44,50 od 1. 6. 2026; 175/2026 Sb.: benzin 95 41,80 od 1. 10. 2026
  assert.deepEqual(r2026.phm, {
    benzin95: [{ od: '2026-01-01', cena: 34.7 }, { od: '2026-10-01', cena: 41.8 }],
    benzin98: [{ od: '2026-01-01', cena: 39 }],
    nafta: [{ od: '2026-01-01', cena: 34.1 }, { od: '2026-06-01', cena: 44.5 }],
    elektrina: [{ od: '2026-01-01', cena: 7.2 }],
  });
  assert.deepEqual(r2026.novely.map((n) => [n.cislo, n.ucinnost]), [['78/2026 Sb.', '2026-06-01'], ['175/2026 Sb.', '2026-10-01']]);
});

test('CES-05: zdroje vedou na zakonyprolidi.cz a nikde se netvrdí, že předpisy nebyly dostupné', () => {
  const urls = rules.meta.zdroje.map((z) => z.url);
  for (const c of ['2025-573', '2026-78', '2026-175']) {
    assert.ok(urls.includes(`https://www.zakonyprolidi.cz/cs/${c}`), `chybí zdroj ${c}`);
  }
  assert.ok(urls.includes('https://www.zakonyprolidi.cz/cs/2006-262#p183'));
  assert.ok(!urls.some((u) => /praceamzda\.cz|epravo\.cz/.test(u)), 'zdroje mají být úřední texty');
  assert.doesNotMatch(JSON.stringify(rules), /nebylo z prostředí dostupné|neměli k dispozici|sekundárních zdrojů/);
  assert.equal(r2026.overeno, '2026-11-12');
  assert.equal(r2026.zdroj.url, 'https://www.zakonyprolidi.cz/cs/2025-573');
  assert.doesNotMatch(zdrojak('./index.njk'), /spolehlivě neověřili/);
});

test('CES-05: výtisk uvádí zaokrouhlení podle § 183 odst. 5 ZP, ne „zákon ho neupravuje“', () => {
  const stav = {
    hlavicka: {
      firma: 'Test s.r.o.', kdo: 'Jan Novák', sfera: 'soukroma', kraceniPct: [70, 35, 25], stravneVerejna: [null, null, null],
      vozidlo: { spz: '1AB 2345', druh: 'osobni', palivo: 'benzin95', spotreba: 6 },
    },
    cesty: [{ id: 'a', odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', odkud: 'Praha', kam: 'Plzeň', km: 100, ucel: 'Jednání', cenaDoklad: null, jidla: {} }],
  };
  const html = v.vyuctovani(stav, v.vypocitej(stav, rules), rules).replace(/\s+/g, ' ');
  assert.doesNotMatch(html, /neupravují/);
  assert.match(html, /nahoru na celé koruny podle § 183 odst\. 5 zákoníku práce/);
  const z = rules.zakonik.zaokrouhleni.zdroj;
  assert.equal(z.url, 'https://www.zakonyprolidi.cz/cs/2006-262#p183');
  assert.match(z.citace, /zaokrouhlí na celé koruny směrem nahoru/);
});

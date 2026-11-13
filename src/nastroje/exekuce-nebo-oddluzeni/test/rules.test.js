import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const surovy = readFileSync(new URL('../rules.json', import.meta.url), 'utf8');
const rules = JSON.parse(surovy);

// Citace podle zadání oprav: zdroj { pravniZaklad, url (zakonyprolidi.cz s #pNN), citace }.
function overCitaci(z, kde) {
  assert.ok(z && typeof z === 'object', `${kde}: zdroj má být objekt s citací`);
  assert.match(z.pravniZaklad, /(Sb\.|zákon|vyhláška|nařízení)/i, `${kde}: pravniZaklad`);
  assert.match(z.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/\d{4}-\d+#p\d+/, `${kde}: url s #pNN`);
  assert.ok(z.citace && z.citace.length > 20, `${kde}: citace`);
}

test('rules.json má datum ověření', () => {
  assert.match(rules.overeno, /^\d{4}-\d{2}-\d{2}$/);
});

test('každá hodnota má popis, zdroj, odkaz do e-Sbírky a datum účinnosti', () => {
  for (const [rok, r] of Object.entries(rules.roky)) {
    assert.ok(['plati', 'neovereno'].includes(r.stav), `${rok}: stav`);
    for (const [klic, v] of Object.entries(r)) {
      if (!v || typeof v !== 'object') continue;
      const kde = `${rok}.${klic}`;
      assert.ok(v.popis, `${kde}: popis`);
      if (typeof v.zdroj === 'object') overCitaci(v.zdroj, kde);
      else assert.match(v.zdroj, /(Sb\.|zákon|vyhláška)/i, `${kde}: zdroj`);
      assert.match(v.odkaz, /^https:\/\/e-sbirka\.gov\.cz\/sb\/\d{4}\/\d+$/, `${kde}: odkaz`);
      if (r.stav === 'plati') {
        assert.ok(['number', 'string'].includes(typeof v.hodnota), `${kde}: hodnota`);
        assert.match(v.ucinnostOd, /^\d{4}-\d{2}-\d{2}$/, `${kde}: účinnost`);
      }
    }
  }
});

test('součty pro rok 2026 odpovídají ověřeným částkám', () => {
  const r = rules.roky['2026'];
  const soucet = r.zivotniMinimum.hodnota + r.normativniNajemne.hodnota + r.energetickyPausal.hodnota;
  assert.equal(soucet, 16590);
  assert.equal((soucet * r.nasobekHraniceDesetiny.hodnota) / 10, 31521);
  assert.equal((soucet * r.procentoDluznik.hodnota) / 100, 14101.5);
  const spravce = ((r.odmenaSpravceMesicne.hodnota + r.vydajeSpravceMesicne.hodnota) * (100 + r.dphProcenta.hodnota)) / 100;
  assert.equal(spravce, 1089);
});

test('rok 2027 je označen jako neúplný (stav „neovereno“), dokud chybí normativní nájemné', () => {
  const r = rules.roky['2027'];
  assert.equal(r.stav, 'neovereno');
  assert.match(r.poznamka, /nebylo vyhlášeno/);
  assert.equal(r.normativniNajemne.hodnota, null);
  assert.equal(r.zivotniMinimum.hodnota, 5500);
});

// DLU-02: životní minimum 4 860 Kč k 1. 1. 2026 plyne z NV č. 361/2025 Sb. § 1 (NV č. 436/2022 Sb.
// bylo zrušeno k 1. 10. 2025). Pro srážky v celém roce 2026 platí hodnota k 1. lednu (NV 595/2006 § 4).
test('životní minimum 2026 cituje platné nařízení 361/2025, ne zrušené 436/2022', () => {
  const zm = rules.roky['2026'].zivotniMinimum;
  assert.equal(zm.hodnota, 4860);
  assert.match(zm.zdroj.pravniZaklad, /361\/2025/);
  assert.match(zm.zdroj.pravniZaklad, /595\/2006.*§ 4/);
  assert.equal(zm.zdroj.url, 'https://www.zakonyprolidi.cz/cs/2025-361#p1');
  assert.match(zm.zdroj.citace, /4860 Kč/);
  assert.equal(zm.odkaz, 'https://e-sbirka.gov.cz/sb/2025/361');
  assert.equal(zm.ucinnostOd, '2025-10-01');
  assert.doesNotMatch(surovy, /436\/2022|sb\/2022\/436/, 'rules.json nesmí citovat zrušené nařízení 436/2022');
  assert.ok(rules.meta.zdroje.some((z) => z.url === 'https://e-sbirka.gov.cz/sb/2025/361'), 'meta.zdroje: NV 361/2025');
});

test('životní minimum 2027 cituje zákon 110/2006 § 2 ve znění od 1. 10. 2026', () => {
  const zm = rules.roky['2027'].zivotniMinimum;
  assert.equal(zm.hodnota, 5500);
  assert.match(zm.zdroj.pravniZaklad, /110\/2006.*§ 2/);
  assert.equal(zm.zdroj.url, 'https://www.zakonyprolidi.cz/cs/2006-110#p2');
  assert.match(zm.zdroj.citace, /5500 Kč/);
});

test('normativní nájemné a energetický paušál 2026 mají citaci', () => {
  const r = rules.roky['2026'];
  assert.match(r.normativniNajemne.zdroj.citace, /9 430 Kč/);
  assert.match(r.energetickyPausal.zdroj.citace, /2300 Kč/);
});

// DLU-01: historie zákonné sazby úroku z prodlení po pololetích
test('úrok z prodlení: historie sazeb po pololetích se zdrojem', () => {
  const u = rules.urokZProdleni;
  overCitaci(u.zdroj, 'urokZProdleni');
  assert.match(u.zdroj.pravniZaklad, /351\/2013.*§ 2 odst\. 1/);
  assert.match(u.zdroj.citace, /první den kalendářního pololetí, v němž došlo k prodlení/);
  assert.match(u.repoZdroj.url, /^https:\/\/www\.cnb\.cz\//);
  assert.match(u.overeno, /^\d{4}-\d{2}-\d{2}$/);
  const ocekavane = { '2023-01-01': 15, '2024-01-01': 14.75, '2024-07-01': 12.75, '2025-01-01': 12, '2025-07-01': 11.5, '2026-01-01': 11.5, '2026-07-01': 11.75 };
  const podleOd = Object.fromEntries(u.pololeti.map((x) => [x.od, x]));
  for (const [od, sazba] of Object.entries(ocekavane)) assert.equal(podleOd[od]?.procenta, sazba, `pololetí od ${od}`);
  let predchozi = '';
  for (const x of u.pololeti) {
    assert.match(x.od, /^\d{4}-(01|07)-01$/, `${x.od}: pololetí začíná 1. 1. nebo 1. 7.`);
    assert.ok(x.od > predchozi, 'pololetí jsou seřazená od nejstaršího');
    predchozi = x.od;
    assert.ok(x.repoPlatnaOd <= x.od, `${x.od}: repo sazba musí platit už první den pololetí`);
    assert.equal(x.procenta, Math.round((x.repoSazba + u.prirazkaBodu) * 100) / 100, `${x.od}: repo + 8 bodů`);
  }
});

test('úrok z prodlení už není jako jediná sazba v pravidlech roku', () => {
  for (const r of Object.values(rules.roky)) assert.equal(r.urokZProdleniProcenta, undefined);
});

// DLU-03: proč se úřední kalkulačky liší (ověřeno ze zdrojového kódu jejich stránek)
test('úřední kalkulačky: zjištění a předpis, podle kterého počítáme', () => {
  const k = rules.uredniKalkulacky;
  assert.match(k.overeno, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(k.srazky.url, 'https://exekuce.justice.cz/vypocet-srazek-ze-mzdy/');
  overCitaci(k.srazky.zdroj, 'uredniKalkulacky.srazky');
  assert.match(k.srazky.zdroj.citace, /k 1\. lednu kalendářního roku/);
  assert.ok(k.srazky.variantaOdchylna && k.srazky.variantaPodleNarizeni);
  assert.equal(k.splatky.url, 'https://insolvence.justice.cz/kalkulator-splatek/');
  overCitaci(k.splatky.zdroj, 'uredniKalkulacky.splatky');
  assert.match(k.splatky.zdroj.citace, /1,9násobek/);
  assert.equal(k.splatky.nasobekKalkulacky, 1);
  for (const o of rules.pomoc.filter((x) => x.rozdil)) assert.ok(k[o.rozdil], `pomoc ${o.url}: neznámý rozdíl ${o.rozdil}`);
  assert.deepEqual(rules.pomoc.filter((x) => x.rozdil).map((x) => x.rozdil).sort(), ['splatky', 'srazky']);
});

// DLU-09: kdy náleží paušální náhrada plátci mzdy a odkazy na pomoc vedou přímo na obsah
test('náhrada plátci mzdy: datum, od kdy náleží, s citací přechodného ustanovení (DLU-09)', () => {
  const n = rules.roky['2026'].nahradaJenProPrikazyOd;
  assert.equal(n.hodnota, '2022-01-01');
  overCitaci(n.zdroj, '2026.nahradaJenProPrikazyOd');
  assert.match(n.zdroj.pravniZaklad, /286\/2021/);
  assert.match(n.zdroj.citace, /nebyl vydán exekuční příkaz k provedení exekuce srážkami ze mzdy/);
  assert.ok(rules.meta.zdroje.some((z) => z.url === 'https://e-sbirka.gov.cz/sb/2021/286'), 'meta.zdroje: zákon 286/2021');
});

test('pomoc: kalkulátor splátek a letáky ombudsmana mají přímý odkaz (DLU-09)', () => {
  const urls = rules.pomoc.map((o) => o.url);
  assert.ok(urls.includes('https://insolvence.justice.cz/kalkulator-splatek/'));
  assert.ok(!urls.includes('https://insolvence.justice.cz/'), 'odkaz nevede jen na hlavní stránku');
  const ombudsman = rules.pomoc.find((o) => /ochrance\.cz/.test(o.url));
  assert.equal(ombudsman.url, 'https://www.ochrance.cz/letaky/');
  assert.match(ombudsman.popis, /exekuc/);
  assert.equal(rules.pomoc.find((o) => o.rozdil === 'splatky').url, rules.uredniKalkulacky.splatky.url);
});

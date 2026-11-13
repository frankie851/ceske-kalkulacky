import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  najdiPasmo,
  statniPrispevekMesicni,
  odpocet,
  danovaUspora,
  spocitejRok,
  projekce,
} from '../calc.js';
import { poznamkaCoUdelat, upozorneniPodpory } from '../vystup.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const R2026 = rules.sady['2026'];
const N2027 = rules.sady['navrh2027'];

/** Pomocník: celý rok se stejnými měsíčními vklady. */
const rok = (vstup, sada = R2026) =>
  spocitejRok({ vek: 40, sazbaDane: 0.15, dps: 0, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 0, starobniDuchod: false, ...vstup }, sada);

describe('zadání – povinné případy', () => {
  test('DPS 5 700 Kč/měs → odpočet 48 000 Kč, úspora 7 200 Kč', () => {
    const v = rok({ dps: 5700 });
    assert.equal(v.odpocet.vyuzity, 48000);
    assert.equal(v.uspora, 7200);
  });

  test('DPS 3 000 + ŽP 2 500 Kč/měs → odpočet 45 600 Kč', () => {
    const v = rok({ dps: 3000, zp: 2500 });
    assert.equal(v.odpocet.vyuzity, 45600);
    assert.equal(v.odpocet.nevyuzity, 2400);
  });

  test('DPS 400 Kč/měs → státní příspěvek 0', () => {
    assert.equal(rok({ dps: 400 }).statniPrispevekRocne, 0);
  });

  test('věk 25, návrh 2027, DPS 1 700 Kč/měs → příspěvek 8 160 Kč/rok', () => {
    assert.equal(rok({ vek: 25, dps: 1700 }, N2027).statniPrispevekRocne, 8160);
  });
});

describe('státní příspěvek – pravidla 2026', () => {
  test('hranice 500 Kč → 100 Kč', () => {
    assert.equal(statniPrispevekMesicni(500, 40, R2026), 100);
    assert.equal(statniPrispevekMesicni(499, 40, R2026), 0);
  });

  test('1 700 Kč → 340 Kč, víc už nepřidá', () => {
    assert.equal(statniPrispevekMesicni(1700, 40, R2026), 340);
    assert.equal(statniPrispevekMesicni(5000, 40, R2026), 340);
  });

  test('20 % mezi hranicemi', () => {
    assert.equal(statniPrispevekMesicni(1000, 40, R2026), 200);
  });

  test('poživatel starobního důchodu nemá nárok', () => {
    assert.equal(statniPrispevekMesicni(1700, 66, R2026, { starobniDuchod: true }), 0);
  });

  test('pásmo pro libovolný věk', () => {
    assert.equal(najdiPasmo(18, R2026).sazba, 0.2);
    assert.equal(najdiPasmo(70, R2026).minVklad, 500);
  });
});

describe('státní příspěvek – návrh 2027', () => {
  test('nezletilý (17) se 100 Kč → 40 Kč', () => {
    assert.equal(statniPrispevekMesicni(100, 17, N2027), 40);
  });

  test('20 let se 100 Kč → 0 (minimum zůstává 500 Kč)', () => {
    assert.equal(statniPrispevekMesicni(100, 20, N2027), 0);
  });

  test('29 let → 40 %, 30 let → 20 %', () => {
    assert.equal(statniPrispevekMesicni(1700, 29, N2027), 680);
    assert.equal(statniPrispevekMesicni(1700, 30, N2027), 340);
  });

  test('max 680 Kč i při vyšším vkladu', () => {
    assert.equal(statniPrispevekMesicni(3000, 25, N2027), 680);
  });
});

describe('daňový odpočet', () => {
  test('DPS se počítá jen nad 1 700 Kč měsíčně (§ 15 odst. 7 ZDP)', () => {
    const o = odpocet({ dpsMesicne: Array(12).fill(1700) }, R2026);
    assert.equal(o.vyuzity, 0);
    assert.equal(odpocet({ dpsMesicne: Array(12).fill(2000) }, R2026).vyuzity, 3600);
  });

  // Revize 5. 11. 2026, P48-01/P48-02: původní test čekal 20 600 Kč (roční odečet 20 400 Kč).
  test('mimořádný vklad v prosinci se počítá po měsících', () => {
    // 11 × 1 000 Kč (pod hranicí) + prosinec 30 000 Kč → 30 000 − 1 700 = 28 300 Kč
    assert.equal(odpocet({ dpsMesicne: [...Array(11).fill(1000), 30000] }, R2026).vyuzity, 28300);
    assert.equal(odpocet({ dpsMesicne: [...Array(11).fill(0), 48000] }, R2026).vyuzity, 46300);
  });

  test('DIP a ŽP od první koruny', () => {
    assert.equal(odpocet({ dipRocne: 1000, zpRocne: 500 }, R2026).vyuzity, 1500);
  });

  test('strop 48 000 Kč při kombinaci DIP + ŽP', () => {
    const o = odpocet({ dipRocne: 40000, zpRocne: 30000 }, R2026);
    assert.equal(o.hruby, 70000);
    assert.equal(o.vyuzity, 48000);
    assert.equal(o.nevyuzity, 0);
  });

  test('starobní důchodce: DPS od první koruny', () => {
    assert.equal(odpocet({ dpsMesicne: Array(12).fill(1000), starobniDuchod: true }, R2026).vyuzity, 12000);
  });

  test('příspěvek zaměstnavatele odpočet neovlivní', () => {
    const bez = rok({ dps: 3000 });
    const s = rok({ dps: 3000, zamestnavatel: 2000 });
    assert.equal(s.odpocet.vyuzity, bez.odpocet.vyuzity);
    assert.equal(s.uspora, bez.uspora);
  });

  test('sazba 23 %', () => {
    assert.equal(danovaUspora(48000, 0.23), 11040);
    assert.equal(rok({ dps: 5700, sazbaDane: 0.23 }).uspora, 11040);
  });
});

describe('doporučení do 31. 12.', () => {
  test('DPS 3 500 Kč/měs, 10 měsíců za námi → doplatit 26 400 Kč (příklad KB)', () => {
    const d = rok({ dps: 3500, mesicuProbehlo: 10 }).doporuceni;
    assert.equal(d.prispevek, null);
    assert.equal(d.odpocet.doplatekDipZp, 26400);
    assert.equal(d.odpocet.doplatekDps, 26400);
    assert.equal(d.odpocet.uspora, 3960);
    assert.equal(d.hotovo, false);
  });

  test('nízký vklad: navýšit na 1 700 Kč na zbývající měsíce', () => {
    const d = rok({ dps: 1000, mesicuProbehlo: 10 }).doporuceni;
    assert.equal(d.prispevek.navysitNa, 1700);
    assert.equal(d.prispevek.mesicu, 2);
    assert.equal(d.prispevek.ziskate, 2 * (340 - 200));
    // Po navýšení listopadu a prosince na 1 700 Kč se prosincový mimořádný vklad započte celý.
    // Revize 5. 11. 2026, P48-01: dřív 48 000 + 7 000 Kč (roční odečet 20 400 Kč).
    assert.equal(d.odpocet.doplatekDipZp, 48000);
    assert.equal(d.odpocet.doplatekDps, 48000);
  });

  test('P48-01: rada „mimořádně na penzijko“ je 48 000 Kč i při nulovém nebo nízkém vkladu', () => {
    assert.equal(rok({ dps: 0, mesicuProbehlo: 10 }).doporuceni.odpocet.doplatekDps, 48000);
    assert.equal(rok({ dps: 1000, mesicuProbehlo: 11 }).doporuceni.odpocet.doplatekDps, 48000);
    // Starobní důchodce bez státního příspěvku: hranice 0, vše se započte.
    assert.equal(rok({ dps: 0, mesicuProbehlo: 10, starobniDuchod: true }).doporuceni.odpocet.doplatekDps, 48000);
  });

  test('P48-01: hranice odpočtu v pravidlech je měsíční a cituje § 15 odst. 7 ZDP', () => {
    assert.equal(R2026.odpocet.dpsMesicniHranice, 1700);
    assert.match(R2026.odpocet.zdroj.pravniZaklad, /§ 15 odst\. 6 a 7/);
  });

  test('vše vyčerpáno → hotovo', () => {
    const d = rok({ dps: 5700, mesicuProbehlo: 10 }).doporuceni;
    assert.equal(d.prispevek, null);
    assert.equal(d.odpocet, null);
    assert.equal(d.hotovo, true);
  });

  test('důchodce nedostane radu na navýšení kvůli příspěvku', () => {
    const d = rok({ dps: 1000, starobniDuchod: true, mesicuProbehlo: 10 }).doporuceni;
    assert.equal(d.prispevek, null);
    assert.equal(d.odpocet.doplatekDps, 48000 - 12000);
  });

  test('návrh 2027: mladý dostane radu podle 40 %', () => {
    const d = rok({ vek: 25, dps: 1000, mesicuProbehlo: 6 }, N2027).doporuceni;
    assert.equal(d.prispevek.ziskate, 6 * (680 - 400));
  });
});

describe('projekce', () => {
  const vstup = { vek: 30, dps: 1700, dip: 1000, zamestnavatel: 500, starobniDuchod: false };

  test('začíná v aktuálním věku a končí v 60', () => {
    const p = projekce(vstup, R2026, { vynos: 0.05, poplatek: 0.01, vekKonec: 60 });
    assert.equal(p[0].vek, 30);
    assert.equal(p[0].hodnota, 0);
    assert.equal(p.at(-1).vek, 60);
    assert.equal(p.length, 31);
  });

  test('vloženo roste o vlastní + zaměstnavatel + stát + DIP', () => {
    const p = projekce(vstup, R2026, { vynos: 0, poplatek: 0, vekKonec: 60 });
    assert.equal(p[1].vlozeno, 12 * (1700 + 500 + 340 + 1000));
    assert.equal(p[1].hodnota, p[1].vlozeno);
  });

  test('kladný čistý výnos → hodnota nad vloženým, monotónní růst', () => {
    const p = projekce(vstup, R2026, { vynos: 0.05, poplatek: 0.01, vekKonec: 60 });
    for (let i = 1; i < p.length; i++) assert.ok(p[i].hodnota > p[i - 1].hodnota);
    assert.ok(p.at(-1).hodnota > p.at(-1).vlozeno);
  });

  test('poplatek vyšší než výnos → hodnota pod vloženým', () => {
    const p = projekce(vstup, R2026, { vynos: 0.01, poplatek: 0.02, vekKonec: 60 });
    assert.ok(p.at(-1).hodnota < p.at(-1).vlozeno);
  });

  test('návrh 2027: příspěvek se po 30. roce sníží', () => {
    const p = projekce({ ...vstup, vek: 28, dip: 0, zamestnavatel: 0 }, N2027, { vynos: 0, poplatek: 0, vekKonec: 32 });
    assert.equal(p[1].vlozeno - p[0].vlozeno, 12 * (1700 + 680));
    assert.equal(p[3].vlozeno - p[2].vlozeno, 12 * (1700 + 340));
  });

  test('věk ≥ 60 → jen výchozí bod', () => {
    assert.equal(projekce({ ...vstup, vek: 61 }, R2026, { vynos: 0.05, poplatek: 0.01, vekKonec: 60 }).length, 1);
  });
});

describe('rules.json', () => {
  test('každá sada má datum a zdroje', () => {
    for (const [klic, sada] of Object.entries(rules.sady)) {
      assert.match(sada.datum, /^\d{4}-\d{2}-\d{2}$/, klic);
      assert.ok(Array.isArray(sada.zdroje) && sada.zdroje.length > 0, klic);
      for (const z of sada.zdroje) assert.match(z.url, /^https:\/\//, klic);
    }
  });

  test('návrh má štítek „návrh, zatím neschváleno“', () => {
    assert.equal(N2027.stitek, 'návrh, zatím neschváleno');
  });

  test('obsahuje obě požadované sady', () => {
    assert.ok(rules.sady['2026'] && rules.sady['navrh2027']);
    assert.ok(rules.sady[rules.vychozi.sada]);
  });
});

// Revize 5. 11. 2026, P48-04: rada „DIP, životní pojištění nebo penzijko“ neupozorňovala na podmínky
// daňové podpory (§ 15b odst. 1 písm. a) bod 1 ZDP) ani na její navrácení (§ 15b odst. 4 a 5 ZDP).
describe('P48-04: podmínky daňové podpory', () => {
  test('pravidla obou sad mají 120 měsíců, 60 let a dodanění za 10 let s citací § 15b ZDP', () => {
    for (const sada of [R2026, N2027]) {
      const p = sada.odpocet.podminkyPodpory;
      assert.ok(p, sada.nazev);
      assert.equal(p.mesicu, 120);
      assert.equal(p.vek, 60);
      assert.equal(p.vraceniZaObdobi, 10);
      assert.match(p.zdroj.pravniZaklad, /§ 15b/);
      assert.match(p.zdroj.url, /zakonyprolidi\.cz\/cs\/1992-586#p15b/);
      assert.match(p.zdroj.citace, /120 kalendářních měsících/);
      assert.match(p.zdroj.citace, /60 let věku/);
      assert.match(p.zdroj.citace, /10 zdaňovacích období/);
    }
  });

  test('poznámka k radě do 31. 12. upozorní na podmínky a dodanění', () => {
    const d = rok({ dps: 1000, mesicuProbehlo: 10 }).doporuceni;
    const t = poznamkaCoUdelat(d, rules.vychozi, R2026).replace(/ /g, ' ');
    assert.match(t, /120 měsících/);
    assert.match(t, /60 let/);
    assert.match(t, /dodaníš/);
    assert.match(t, /10 let/);
  });

  test('čísla v upozornění jdou z rules.json, ne z kódu', () => {
    const jina = structuredClone(R2026);
    Object.assign(jina.odpocet.podminkyPodpory, { mesicu: 123, vek: 61, vraceniZaObdobi: 9 });
    const t = upozorneniPodpory(jina).replace(/ /g, ' ');
    assert.match(t, /123 měsících/);
    assert.match(t, /61 let/);
    assert.match(t, /9 let/);
    const zdroj = readFileSync(new URL('../vystup.js', import.meta.url), 'utf8');
    assert.ok(!/\b120\b|\b60 let|\b10 let/.test(zdroj), 'vystup.js obsahuje podmínky natvrdo');
  });

  test('bez rady na odpočet se upozornění nepřidává', () => {
    const d = rok({ dps: 5700, mesicuProbehlo: 10 }).doporuceni;
    assert.equal(poznamkaCoUdelat(d, rules.vychozi, R2026), '');
  });
});

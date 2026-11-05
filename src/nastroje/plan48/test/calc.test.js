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
  test('DPS se počítá jen nad roční hranici 20 400 Kč', () => {
    const o = odpocet({ dpsRocne: 1700 * 12 }, R2026);
    assert.equal(o.vyuzity, 0);
    assert.equal(odpocet({ dpsRocne: 2000 * 12 }, R2026).vyuzity, 3600);
  });

  test('mimořádný vklad v prosinci se započte celý (roční výpočet)', () => {
    // 11 × 1 000 Kč + 30 000 Kč v prosinci = 41 000 Kč → 20 600 Kč nad hranici
    assert.equal(odpocet({ dpsRocne: 11 * 1000 + 30000 }, R2026).vyuzity, 20600);
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
    assert.equal(odpocet({ dpsRocne: 1000 * 12, starobniDuchod: true }, R2026).vyuzity, 12000);
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
    // DPS po navýšení: 10 × 1 000 + 2 × 1 700 = 13 400 → na DPS chybí 7 000 do hranice
    assert.equal(d.odpocet.doplatekDipZp, 48000);
    assert.equal(d.odpocet.doplatekDps, 48000 + 7000);
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

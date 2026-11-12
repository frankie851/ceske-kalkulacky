import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  params,
  expenses,
  incomeTax,
  socialIns,
  healthIns,
  classic,
  flatTax,
  eetOffVariant,
  compare,
  series,
  breakEven,
  chartIncomes,
  ceilKc,
} from '../osvc.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const o = rules.osvc2027;

/** Výchozí vstup: hlavní činnost, 60% paušál, neplátce DPH, bez dětí, s kontaktními platbami. */
const base = {
  income: 800000,
  flatRateId: 'p60',
  actualExpenses: null,
  vatPayer: false,
  children: 0,
  activityId: 'main',
  contactPayments: true,
};
const inp = (extra) => ({ ...base, ...extra });
const variant = (r, id) => r.variants.find((v) => v.id === id);

describe('povinné případy ze zadání', () => {
  // Revize 5. 11. 2026, EET-03: § 14 odst. 3 písm. a) zákona č. 589/1992 Sb. dává 9 661 Kč,
  // zadání (média) uvádělo 9 662 Kč / 115 944 Kč / 132 744 Kč.
  test('paušál 1. pásmo za rok = 115 932 Kč (12 × 9 661)', () => {
    const f = flatTax(inp({ income: 800000 }), rules);
    assert.equal(f.available, true);
    assert.equal(f.band.id, 'band1');
    assert.equal(f.monthly, 9661);
    assert.equal(f.annual, 115932);
  });

  test('EET OFF za rok = 115 932 + 16 800 = 132 732 Kč', () => {
    const e = eetOffVariant(inp({ income: 800000 }), rules);
    assert.equal(e.available, true);
    assert.equal(e.monthly, 11061);
    assert.equal(e.annual, 132732);
  });

  test('plátce DPH → paušální daň i EET OFF nedostupné, s důvodem', () => {
    const r = compare(inp({ vatPayer: true }), rules);
    const f = variant(r, 'flat');
    assert.equal(f.available, false);
    assert.equal(f.code, 'vat');
    assert.match(f.reason, /[Pp]látce DPH nemůže mít paušální daň/);
    assert.equal(variant(r, 'eetOff').available, false);
    assert.equal(r.cheapestId, 'classic');
  });

  test('příjmy 1 200 000 Kč, 40% paušál → 1. pásmo nedostupné, EET OFF nedostupný', () => {
    const r = compare(inp({ income: 1200000, flatRateId: 'p40' }), rules);
    const f = variant(r, 'flat');
    assert.equal(f.available, true);
    assert.equal(f.band.id, 'band2');
    assert.equal(r.bands.find((b) => b.band.id === 'band1').eligible, false);
    const e = variant(r, 'eetOff');
    assert.equal(e.available, false);
    assert.equal(e.code, 'band');
    assert.ok(e.reason.length > 0);
  });

  test('základ daně 200 000 Kč, sleva na poplatníka, 2 děti → cca 67 704 Kč/rok (±100 Kč)', () => {
    const c = classic(inp({ income: 500000, actualExpenses: 300000, children: 2 }), rules);
    assert.equal(c.profit, 200000);
    assert.ok(Math.abs(c.annual - 67704) <= 100, `vyšlo ${c.annual}`);
    // Podle zákona z ročního základu: 63 363 + 41 848 − 37 524.
    assert.equal(c.annual, 67687);
    assert.equal(c.tax.bonus, 37524);
  });
});

describe('parametry 2027 odpovídají ověřeným hodnotám', () => {
  const p = params(rules);
  test('minimální základy a zálohy', () => {
    const s = o.social.expected;
    assert.equal(p.socialMinBaseMain, s.minBaseMain);
    assert.equal(p.socialMinAdvanceMain, s.minAdvanceMain);
    assert.equal(p.socialMinBaseSide, s.minBaseSide);
    assert.equal(p.socialMinAdvanceSide, s.minAdvanceSide);
    assert.equal(p.socialMaxBaseAnnual, s.maxBaseAnnual);
    assert.equal(p.sideThreshold, s.sideThreshold);
    assert.equal(p.healthMinBase, o.health.expected.minBaseMain);
    assert.equal(p.healthMinAdvance, o.health.expected.minAdvanceMain);
  });

  // Revize 5. 11. 2026, EET-03: o 15 % se zvyšuje vyměřovací základ, ne záloha
  // (§ 14 odst. 3 písm. a) a odst. 13 a § 7 odst. 3 zákona č. 589/1992 Sb., § 8a zákona č. 592/1992 Sb.).
  test('1. pásmo = 100 + 29,2 % z (min. VZ × 1,15, nahoru) + 13,5 % z 1/12 min. VZ zdrav.', () => {
    const b1 = flatTax(inp({}), rules).band;
    const zaklad = ceilKc(p.socialMinBaseMain * 1.15);
    assert.equal(zaklad, 20796);
    assert.equal(b1.social, ceilKc(zaklad * o.social.rate));
    assert.equal(b1.social, 6073);
    assert.equal(b1.health, ceilKc(((12 * o.health.minBaseShareMain * o.averageWage.monthly) / 12) * o.health.rate));
    assert.equal(b1.health, 3488);
    assert.equal(b1.tax, 100);
    assert.equal(b1.monthly, 9661);
    const ex = o.flatTax.bands[0].expected;
    assert.deepEqual([b1.social, b1.health, b1.monthly], [ex.social, ex.health, ex.monthly]);
    for (const b of compare(inp({ income: 1900000, flatRateId: 'p40' }), rules).bands) {
      assert.equal(b.band.monthly, b.band.tax + b.band.social + b.band.health, b.band.id);
    }
  });

  // Revize 5. 11. 2026, EET-11: průměrná mzda (§ 23b odst. 4 ZPSZ) a rozhodná částka
  // (§ 10 odst. 2 zákona č. 155/1995 Sb.) z VVZ a koeficientu podle NV č. 177/2026 Sb.
  test('průměrná mzda = VVZ × koeficient nahoru, rozhodná částka z nezaokrouhleného součinu', () => {
    const a = o.averageWage;
    assert.equal(a.generalAssessmentBase, 48900);
    assert.equal(a.conversionCoefficient, 1.0565);
    assert.equal(a.monthly, ceilKc(a.generalAssessmentBase * a.conversionCoefficient));
    assert.equal(p.sideThreshold, 123991);
  });

  test('hranice 23% sazby = 36 × průměrná mzda = 1 859 868 Kč', () => {
    assert.equal(p.highRateThreshold, 1859868);
  });

  test('ceilKc nezvedá celé částky kvůli plovoucí čárce', () => {
    assert.equal(ceilKc(100000 * 0.135), 13500);
    assert.equal(ceilKc(13500.01), 13501);
  });
});

describe('výdaje a daň', () => {
  test('výdajový paušál se stropem (60 % nejvýš 1 200 000 Kč)', () => {
    assert.equal(expenses(inp({ income: 1000000 }), rules), 600000);
    assert.equal(expenses(inp({ income: 2500000 }), rules), 1200000);
    assert.equal(expenses(inp({ income: 1000000, flatRateId: 'p80' }), rules), 800000);
    assert.equal(expenses(inp({ income: 3000000, flatRateId: 'p30' }), rules), 600000);
  });

  test('skutečné výdaje mají přednost před paušálem', () => {
    assert.equal(expenses(inp({ income: 1000000, actualExpenses: 123456 }), rules), 123456);
    assert.equal(classic(inp({ income: 100000, actualExpenses: 150000 }), rules).profit, 0);
  });

  test('základ daně se zaokrouhluje dolů na stovky, daň nahoru na Kč', () => {
    const t = incomeTax({ profit: 300099, income: 500000 }, rules);
    assert.equal(t.base, 300000);
    assert.equal(t.taxGross, 45000);
    assert.equal(t.tax, 45000 - 30840);
  });

  test('23 % nad hranicí 36násobku průměrné mzdy', () => {
    const t = incomeTax({ profit: 2000000, income: 2000000 }, rules);
    const thr = params(rules).highRateThreshold;
    assert.equal(t.highPart, 2000000 - thr);
    assert.equal(t.taxGross, ceilKc(thr * 0.15 + (2000000 - thr) * 0.23));
  });

  test('sleva na poplatníka nejde pod nulu, bez dětí žádný bonus', () => {
    const t = incomeTax({ profit: 100000, income: 300000, children: 0 }, rules);
    assert.equal(t.tax, 0);
  });

  test('zvýhodnění na 3 a více dětí: 3. a další dítě má stejnou částku', () => {
    const [a, b, c] = o.incomeTax.childCredits;
    assert.equal(incomeTax({ profit: 0, income: 500000, children: 4 }, rules).bonus, a + b + c + c);
  });

  test('daňový bonus jen při příjmech aspoň 6 × minimální mzda', () => {
    const low = incomeTax({ profit: 50000, income: 140000, children: 1 }, rules);
    assert.equal(low.bonus, 0);
    assert.equal(low.bonusBlocked, true);
    const ok = incomeTax({ profit: 50000, income: 150000, children: 1 }, rules);
    assert.equal(ok.bonus, o.incomeTax.childCredits[0]);
  });
});

describe('pojistné', () => {
  test('hlavní činnost: nejméně roční minimum', () => {
    assert.equal(socialIns(100000, 'main', rules).amount, ceilKc(18083 * 12 * 0.292));
    assert.equal(healthIns(100000, 'main', rules).amount, ceilKc(25832 * 12 * 0.135));
  });

  test('nad minimem: 55 % / 50 % zisku', () => {
    assert.equal(socialIns(1000000, 'main', rules).base, 550000);
    assert.equal(healthIns(1000000, 'main', rules).base, 500000);
  });

  test('sociální pojištění je omezené maximálním základem', () => {
    const s = socialIns(10000000, 'main', rules);
    assert.equal(s.base, o.social.expected.maxBaseAnnual);
  });

  // Revize 5. 11. 2026, EET-01: § 14 odst. 5 věta druhá zákona č. 589/1992 Sb. – v roce zahájení
  // hlavní činnosti a ve 2 následujících letech je minimum 25 % průměrné mzdy
  // (neplatí, když byl člověk OSVČ v předchozích 20 letech).
  test('začínající OSVČ: minimum sociálního pojištění 25 % průměrné mzdy', () => {
    const p = params(rules);
    assert.equal(p.socialMinBaseStarting, o.social.expected.minBaseStarting);
    assert.equal(p.socialMinBaseStarting, 12916);
    const s = socialIns(320000, 'mainStart', rules);
    assert.equal(s.min, 154992);
    assert.equal(s.base, 176000);
    assert.equal(s.amount, 51392);
    // zdravotní minimum a paušální daň se nemění
    assert.equal(healthIns(320000, 'mainStart', rules).amount, healthIns(320000, 'main', rules).amount);
    assert.equal(flatTax(inp({ activityId: 'mainStart' }), rules).annual, flatTax(inp(), rules).annual);
    assert.match(o.social.startingSourceTitle, /§ 14 odst\. 5/);
  });

  test('začínající OSVČ: 800 000 Kč, paušál 60 % → přiznání vychází levněji než paušální daň', () => {
    const r = compare(inp({ activityId: 'mainStart' }), rules);
    assert.equal(r.cheapestId, 'classic');
    assert.equal(variant(r, 'classic').annual, 110400);
    // bez příznaku začínající zůstává doporučení paušál
    const b = compare(inp(), rules);
    assert.equal(b.cheapestId, 'flat');
    assert.equal(variant(b, 'classic').annual, 122371);
  });

  test('vedlejší činnost: do rozhodné částky bez sociálního, zdravotní bez minima', () => {
    assert.equal(socialIns(100000, 'sideOther', rules).amount, 0);
    assert.equal(socialIns(130000, 'sideOther', rules).base, 71500);
    assert.ok(socialIns(130000, 'sideOther', rules).min === 5683 * 12);
    assert.equal(healthIns(100000, 'sideEmployed', rules).base, 50000);
  });

  test('vedlejší činnost při zaměstnání → paušální daň nedostupná', () => {
    const f = flatTax(inp({ activityId: 'sideEmployed' }), rules);
    assert.equal(f.available, false);
    assert.equal(f.code, 'employee');
  });
});

describe('pásma paušální daně', () => {
  test('hranice 1. pásma podle druhu činnosti', () => {
    assert.equal(flatTax(inp({ income: 1000000, flatRateId: 'p40' }), rules).band.id, 'band1');
    assert.equal(flatTax(inp({ income: 1000001, flatRateId: 'p40' }), rules).band.id, 'band2');
    assert.equal(flatTax(inp({ income: 1500000, flatRateId: 'p60' }), rules).band.id, 'band1');
    assert.equal(flatTax(inp({ income: 2000000, flatRateId: 'p80' }), rules).band.id, 'band1');
    assert.equal(flatTax(inp({ income: 1600000, flatRateId: 'p30' }), rules).band.id, 'band3');
  });

  test('příjmy nad 2 mil. Kč → paušální daň nedostupná', () => {
    const f = flatTax(inp({ income: 2000001, flatRateId: 'p80' }), rules);
    assert.equal(f.available, false);
    assert.equal(f.code, 'overMax');
  });

  test('EET OFF: 60 % a 1,2 mil. Kč → 1. pásmo ano, EET OFF ne (limit 1 mil.)', () => {
    const e = eetOffVariant(inp({ income: 1200000 }), rules);
    assert.equal(flatTax(inp({ income: 1200000 }), rules).band.id, 'band1');
    assert.equal(e.available, false);
    assert.equal(e.code, 'limit');
  });

  test('EET OFF bez kontaktních plateb nemá smysl', () => {
    const e = eetOffVariant(inp({ contactPayments: false }), rules);
    assert.equal(e.available, false);
    assert.equal(e.code, 'noContact');
  });
});

describe('porovnání a graf', () => {
  test('nejlevnější varianta a rozdíly', () => {
    const r = compare(inp({ income: 800000 }), rules);
    assert.equal(r.cheapestId, 'flat');
    assert.equal(variant(r, 'flat').diff, 0);
    assert.equal(variant(r, 'eetOff').diff, eetOffVariant(inp({}), rules).annual - 115932);
    assert.ok(variant(r, 'classic').diff > 0);
    assert.match(r.summary, /Ušetříš/);
  });

  test('s dětmi upozorní, že paušál neumožňuje zvýhodnění na děti', () => {
    const r = compare(inp({ children: 2 }), rules);
    assert.ok(r.notes.some((n) => /daňové zvýhodnění na děti/.test(n)));
  });

  test('graf 100 tis. – 2 mil. Kč včetně přesných hranic pásem', () => {
    const xs = chartIncomes(inp({}), rules);
    assert.equal(xs[0], o.chart.min);
    assert.equal(xs.at(-1), o.chart.max);
    assert.ok(xs.includes(1500000) && xs.includes(1500001));
    const pts = series(inp({}), rules, xs);
    assert.equal(pts.length, xs.length);
    assert.ok(pts.every((p) => Number.isFinite(p.classic)));
    assert.equal(pts.find((p) => p.income === 1100000).eetOff, null);
  });

  test('bod zlomu: pod ním je levnější přiznání, nad ním paušál', () => {
    const be = breakEven(inp({}), rules);
    assert.ok(be.length >= 1);
    const first = be[0];
    assert.equal(first.cheaper, 'flat');
    const before = compare(inp({ income: first.income - o.chart.breakEvenStep }), rules);
    const at = compare(inp({ income: first.income }), rules);
    assert.ok(variant(before, 'classic').annual <= variant(before, 'flat').annual);
    assert.ok(variant(at, 'flat').annual < variant(at, 'classic').annual);
  });
});

describe('integrita sekce osvc2027', () => {
  test('každý výdajový paušál má limity ve všech pásmech', () => {
    for (const b of o.flatTax.bands) {
      for (const fr of o.expenseFlatRates) assert.ok(Number.isFinite(b.limits[fr.id]), `${b.id}/${fr.id}`);
    }
  });

  test('termíny: přihláška 11. 1. 2027, první platba 20. 1. 2027', () => {
    const d = Object.fromEntries(o.deadlines.map((x) => [x.id, x.date]));
    assert.equal(d.notice, '2027-01-11');
    assert.equal(d.firstPayment, '2027-01-20');
    assert.equal(d.notice, rules.eetOff.registrationDeadline);
  });
});

describe('revize 5. 11. 2026 – střední nálezy', () => {
  // EET-07: § 10 odst. 2 zákona č. 155/1995 Sb. – účast vzniká, pokud příjem „dosáhl … aspoň
  // rozhodné částky“. Bez pojistného je jen zisk pod rozhodnou částkou.
  test('vedlejší činnost: hranice rozhodné částky 123 990 / 123 991 / 123 992 Kč', () => {
    assert.equal(socialIns(123990, 'sideOther', rules).none, true);
    const presne = socialIns(123991, 'sideOther', rules);
    assert.equal(presne.none, false);
    assert.equal(presne.amount, 19914);
    assert.equal(socialIns(123992, 'sideOther', rules).none, false);
    assert.equal(socialIns(123991, 'sideEmployed', rules).none, false);
  });

  test('vedlejší činnost, zisk přesně 123 991 Kč → sociální 19 914 Kč, celkem 28 284 Kč', () => {
    const c = classic(inp({ income: 300000, actualExpenses: 176009, activityId: 'sideOther' }), rules);
    assert.equal(c.profit, 123991);
    assert.equal(c.social.amount, 19914);
    assert.equal(c.annual, 28284);
    const pod = classic(inp({ income: 300000, actualExpenses: 176010, activityId: 'sideOther' }), rules);
    assert.equal(pod.social.amount, 0);
    assert.match(compare(inp({ income: 300000, actualExpenses: 176010, activityId: 'sideOther' }), rules).breakdown.join(' '),
      /nedosáhl rozhodné částky 123\s991\sKč/);
  });

  // EET-11: rozhodná částka = 2,4 × (VVZ × koeficient), ne 2,4 × zaokrouhlená průměrná mzda.
  test('rozhodná částka se počítá z nezaokrouhleného součinu VVZ × koeficient', () => {
    const mod = structuredClone(rules);
    Object.assign(mod.osvc2027.averageWage, { generalAssessmentBase: 10000, conversionCoefficient: 1.00003, monthly: 10001 });
    // 2,4 × 10 000,3 = 24 000,72; floor(2,4 × 10 001) by dal 24 002 Kč
    assert.equal(params(mod).sideThreshold, 24001);
    assert.equal(socialIns(24000, 'sideOther', mod).none, true);
    assert.equal(socialIns(24001, 'sideOther', mod).none, false);
  });

  // EET-06: § 2a odst. 5 zákona č. 586/1992 Sb. – vyšší limity pásem jen při aspoň 75 % příjmů
  // s paušálem 80 % (nebo 60 %); kalkulačka předpokládá jednu činnost a musí to říct.
  test('pásmo nad obecným limitem → poznámka o podmínce 75 % příjmů z jedné činnosti', () => {
    const nad = compare(inp({ income: 1200000 }), rules);
    assert.equal(variant(nad, 'flat').band.id, 'band1');
    assert.ok(nad.notes.some((n) => /aspoň 75\s% příjmů/.test(n) && /jedné činnosti/.test(n) && /80\s% nebo 60\s%/.test(n)), nad.notes.join(' | '));
    const pod = compare(inp({ income: 800000 }), rules);
    assert.ok(!pod.notes.some((n) => /75\s%/.test(n)));
    const osmdesat = compare(inp({ income: 1800000, flatRateId: 'p80' }), rules);
    assert.ok(osmdesat.notes.some((n) => /Limit 2\s000\s000\sKč pro 1\. pásmo/.test(n) && /paušálem 80\s%\./.test(n)), osmdesat.notes.join(' | '));
    const druhe = compare(inp({ income: 1600000 }), rules);
    assert.equal(variant(druhe, 'flat').band.id, 'band2');
    assert.ok(druhe.notes.some((n) => /75\s%/.test(n)));
  });

  test('nápověda k druhu činnosti zmiňuje jednu činnost a podmínku 75 %', () => {
    assert.match(o.texts.fieldFlatRateHelp, /aspoň \{share\} příjmů/);
    assert.match(o.texts.fieldFlatRateHelp, /jedné činnosti/);
    assert.equal(o.flatTax.singleActivity.share, 0.75);
    const z = o.flatTax.singleActivity.zdroj;
    assert.match(z.pravniZaklad, /§ 2a odst\. 5/);
    assert.match(z.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/1992-586#p2a$/);
    assert.match(z.citace, /alespoň 75 % příjmů ze samostatné činnosti/);
  });

  test('1. pásmo má citaci zákonného vzorce a stav „derived“', () => {
    const b1 = o.flatTax.bands[0];
    assert.equal(b1.status, 'derived');
    assert.match(b1.note, /dopočteno podle zákonného vzorce, tabulka Finanční správy pro rok 2027 zatím nevyšla/i);
    assert.match(b1.zdroj.pravniZaklad, /§ 14 odst\. 3 písm\. a\)/);
    assert.match(b1.zdroj.citace, /zvýšeného o 15 %/);
    assert.deepEqual(b1.expected, { social: 6073, health: 3488, monthly: 9661, annual: 115932, eetOffAnnual: 132732 });
  });
});

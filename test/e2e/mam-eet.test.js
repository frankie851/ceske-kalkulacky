// E2E: Mám EET? (7 scénářů ze zadání proklikáním dotazníku) a OSVČ 2027 nad sestaveným webem.
// Spuštění: npx eleventy && node --test test/e2e/mam-eet.test.js
import { test, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, zavri, text, vypln } from './pomocnik.mjs';

after(zavri);

const EET = 'dane-podnikani/mam-eet/';
const OSVC = 'dane-podnikani/mam-eet/osvc-2027/';

async function zvol(page, ...hodnoty) {
  for (const v of hodnoty) await page.click(`.quiz input[value="${v}"] + label`);
}
async function dalsi(page) {
  await page.click('.quiz button[type="submit"]');
}
async function cislo(page, v) {
  await page.$eval('.quiz input[type="text"]', (el, h) => { el.value = h; }, String(v));
}
async function otazka(page) {
  return text(page, '.quiz .quiz-q');
}

/** Projde dotazník: kroky = pole [typ, hodnota…]; vrátí výsledek. */
async function projdi(page, kroky) {
  for (const [typ, ...hodnoty] of kroky) {
    if (typ === 'cislo') await cislo(page, hodnoty[0]);
    else await zvol(page, ...hodnoty);
    await dalsi(page);
  }
  await page.waitForSelector('#vysledek-nadpis');
  return {
    nadpis: await text(page, '#vysledek-nadpis'),
    karta: await text(page, '#vysledek'),
    vse: await text(page, '#eet-app'),
    oficialni: await page.$$eval('#eet-app .reasons a', (a) => a.map((x) => new URL(x.href).hostname)),
    fokus: await page.evaluate(() => document.activeElement?.id),
  };
}

const OFICIALNI = ['eet.gov.cz', 'mf.gov.cz', 'financnisprava.gov.cz', 'e-sbirka.gov.cz'];

describe('Mám EET? – 7 scénářů ze zadání', () => {
  const scenare = [
    {
      nazev: 'OSVČ, hotovost, bez paušální daně → musí evidovat',
      kroky: [['v', 'osvc'], ['v', 'cash'], ['v', 'none'], ['v', 'none'], ['v', 'no'], ['cislo', 1]],
      ocekavani: (r) => {
        assert.match(r.nadpis, /^Ano, musíš evidovat/);
        assert.match(r.vse, /Paušální daň neplatíš, proto EET OFF zvolit nemůžeš/);
      },
    },
    {
      nazev: 'jen faktury placené převodem → nemusí evidovat',
      kroky: [['v', 'osvc'], ['v', 'invoiceTransfer']],
      ocekavani: (r) => assert.match(r.nadpis, /^Ne, evidovat tržby/),
    },
    {
      nazev: 'e-shop, jen platební brána → nemusí evidovat',
      kroky: [['v', 'po'], ['v', 'online']],
      ocekavani: (r) => assert.match(r.nadpis, /^Ne, evidovat tržby/),
    },
    {
      nazev: 'kavárna, jen QR u pultu → musí evidovat',
      kroky: [['v', 'po'], ['v', 'qrOnSite'], ['v', 'none'], ['cislo', 1]],
      ocekavani: (r) => assert.match(r.nadpis, /^Ano, musíš evidovat/),
    },
    {
      nazev: 'paušální daň 1. pásmo, příjmy 800 000 Kč → EET OFF, přirážka 16 800 Kč/rok',
      kroky: [['v', 'osvc'], ['v', 'cash', 'qrOnSite'], ['v', 'none'], ['v', 'band1'], ['cislo', 800000], ['v', 'no'], ['cislo', 1]],
      ocekavani: (r) => {
        assert.match(r.nadpis, /^Můžeš zvolit EET OFF/);
        assert.match(r.karta, /16 800 Kč/);
        assert.match(r.vse, /EET OFF, nebo evidence\?/);
      },
    },
    {
      nazev: 'paušální daň 2. pásmo → EET OFF nelze',
      kroky: [['v', 'osvc'], ['v', 'cash'], ['v', 'none'], ['v', 'band2'], ['v', 'no'], ['cislo', 1]],
      ocekavani: (r) => {
        assert.match(r.nadpis, /^Ano, musíš evidovat/);
        assert.match(r.vse, /EET OFF je jen pro 1\. pásmo paušální daně/);
      },
    },
    {
      nazev: 'paušální daň 1. pásmo, příjmy 1 200 000 Kč → EET OFF nelze',
      kroky: [['v', 'osvc'], ['v', 'cash'], ['v', 'none'], ['v', 'band1'], ['cislo', 1200000], ['v', 'no'], ['cislo', 1]],
      ocekavani: (r) => {
        assert.match(r.nadpis, /^Ano, musíš evidovat/);
        assert.match(r.vse, /Podle tvé odpovědi to bylo 1 200 000 Kč, proto EET OFF zvolit nemůžeš/);
      },
    },
  ];

  for (const s of scenare) {
    test(s.nazev, async () => {
      const { page, chyby } = await otevri(EET);
      const r = await projdi(page, s.kroky);
      s.ocekavani(r);
      assert.ok(r.oficialni.length > 0, 'výsledek má odkaz na zdroj');
      for (const host of r.oficialni) assert.ok(OFICIALNI.includes(host), `neoficiální zdroj ${host}`);
      assert.equal(r.fokus, 'vysledek-nadpis', 'fokus je na nadpisu výsledku');
      assert.deepEqual(chyby, []);
      await page.close();
    });
  }
});

describe('Mám EET? – ovládání', () => {
  test('krokovač, fokus na otázce a Zpět zachová odpovědi', async () => {
    const { page, chyby } = await otevri(EET);
    assert.equal(await page.$('#eet-bez-js'), null, 's JS se blok pro stránku bez JS odstraní');
    assert.match(await text(page, '.bar-label'), /Otázka 1 z 8/);
    await zvol(page, 'osvc');
    await dalsi(page);
    assert.match(await otazka(page), /Jak od zákazníků přijímáš platby/);
    assert.match(await text(page, '.bar-label'), /Otázka 2 z 8/);
    assert.equal(await page.$$eval('.bar-steps [aria-current="step"]', (l) => l.length), 1);
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('quiz-q')), true, 'fokus na nadpisu otázky');
    await zvol(page, 'cash', 'card');
    await dalsi(page);
    assert.match(await otazka(page), /oborů/);
    await page.click('.quiz-actions .btn-ghost');
    assert.match(await otazka(page), /platby/);
    assert.deepEqual(await page.$$eval('.quiz input:checked', (l) => l.map((i) => i.value)), ['cash', 'card']);
    await page.click('.quiz-actions .btn-ghost');
    assert.deepEqual(await page.$$eval('.quiz input:checked', (l) => l.map((i) => i.value)), ['osvc']);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('pokračovat bez odpovědi ukáže chybu', async () => {
    const { page, chyby } = await otevri(EET);
    await dalsi(page);
    assert.equal(await page.$eval('.quiz .error-msg', (el) => el.hidden), false);
    assert.match(await text(page, '.quiz .error-msg'), /Vyber aspoň jednu možnost/);
    assert.equal(await page.$eval('.quiz input', (el) => el.getAttribute('aria-invalid')), 'true');
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('kalkulačka EET OFF: vlastní pokladna dražší než přirážka', async () => {
    const { page, chyby } = await otevri(EET);
    await projdi(page, [['v', 'osvc'], ['v', 'cash'], ['v', 'none'], ['v', 'band1'], ['cislo', 800000], ['v', 'no'], ['cislo', 1]]);
    assert.match(await text(page, '[data-kalk-veta]'), /^Evidence vychází levněji/);
    await page.click('#kalk-rezim-own + label');
    await page.type('#kalk-vlastni', '20000');
    assert.match(await text(page, '[data-kalk-veta]'), /^EET OFF vychází levněji: přirážka 16 800 Kč ročně proti 20 000 Kč/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('bez JavaScriptu je vidět přehled otázek a ukázkový výsledek', async () => {
    const { page } = await otevri(EET, { js: false });
    const ukazka = await text(page, '[data-ukazka]');
    assert.match(ukazka, /Můžeš zvolit EET OFF/);
    assert.match(ukazka, /16 800 Kč/);
    assert.equal(await page.$$eval('.eet-otazky > li', (l) => l.length), 8);
    assert.match(await text(page, '#eet-bez-js'), /Interaktivní dotazník potřebuje JavaScript/);
    assert.match(await text(page, '#eet-bez-js'), /Kontrolní seznam/);
    await page.close();
  });
});

describe('OSVČ 2027', () => {
  const radek = (page, id) => text(page, `#osvc-vysledek tr[data-varianta="${id}"]`);

  // Revize 5. 11. 2026, EET-03: 1. pásmo podle § 14 odst. 3 písm. a) ZPSZ = 9 661 Kč měsíčně.
  test('výchozí srovnání: 1. pásmo 115 932 Kč, EET OFF 132 732 Kč', async () => {
    const { page, chyby } = await otevri(OSVC, { sirka: 1440, vyska: 900 });
    assert.match(await radek(page, 'flat'), /Paušální daň \(1\. pásmo\).*115 932 Kč/);
    assert.match(await radek(page, 'eetOff'), /132 732 Kč/);
    assert.match(await text(page, '#osvc-vysledek-karta'), /115 932 Kč/);
    assert.match(await text(page, '#osvc-first-payment'), /9 661 Kč/);
    assert.ok(await page.$('#osvc-graf svg.osvc-svg'), 'interaktivní graf');
    assert.equal(await page.$('#osvc-vysledek [data-ukazka]'), null, 's JS už nejde o ukázku');
    assert.deepEqual(chyby, []);
    await page.close();
  });

  // Revize 5. 11. 2026, EET-01: § 14 odst. 5 věta druhá zákona č. 589/1992 Sb.
  test('začínající hlavní činnost → přiznání 110 400 Kč vychází levněji než paušální daň', async () => {
    const { page, chyby } = await otevri(OSVC, { sirka: 1440, vyska: 900 });
    await page.click('input[name="osvc-activity"][value="mainStart"] + label');
    assert.match(await radek(page, 'classic'), /110 400 Kč/);
    assert.match(await text(page, '#osvc-vysledek-karta'), /Přiznání/);
    assert.match(await text(page, '#osvc-vysledek'), /25 % průměrné mzdy/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('plátce DPH → paušální daň ani EET OFF nejsou dostupné', async () => {
    const { page, chyby } = await otevri(OSVC, { sirka: 1440, vyska: 900 });
    await page.click('#osvc-vat-yes + label');
    assert.match(await radek(page, 'flat'), /Nedostupné: Plátce DPH nemůže mít paušální daň/);
    assert.match(await radek(page, 'eetOff'), /Nedostupné/);
    assert.match(await text(page, '#osvc-vysledek-karta'), /Přiznání/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('neplatné příjmy ukážou chybu u pole', async () => {
    const { page, chyby } = await otevri(OSVC, { sirka: 1440, vyska: 900 });
    // html má scroll-behavior: smooth; bez omezeného pohybu by Puppeteer klikal během posunu
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.$eval('#osvc-income', (el) => { el.value = ''; });
    await page.click('#osvc-form button[type="submit"]');
    assert.equal(await page.$eval('#osvc-income-chyba', (el) => el.hidden), false);
    assert.equal(await page.$eval('#osvc-income', (el) => el.getAttribute('aria-invalid')), 'true');
    assert.deepEqual(chyby, []);
    await page.close();
  });

  // Revize 5. 11. 2026, EET-05: při neplatném vstupu nesmí zůstat vidět výsledek pro staré číslo.
  test('neplatný vstup skryje starý výsledek, oprava ho vrátí', async () => {
    const { page, chyby } = await otevri(OSVC, { sirka: 360, vyska: 800 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const vstup = (hodnota) => vypln(page, '#osvc-income', hodnota);
    const viditelne = (sel) => page.$eval(sel, (el) => !el.closest('[hidden]') && el.getClientRects().length > 0);
    await vstup('1200000');
    assert.match(await text(page, '#osvc-vysledek-karta'), /Paušální daň/);
    for (const spatne of ['1200000,50', '', '-100']) {
      await vstup(spatne);
      assert.equal(await viditelne('#osvc-vysledek'), false, `výsledek pro „${spatne}“ musí zmizet`);
      assert.equal(await viditelne('#osvc-graf'), false, `graf pro „${spatne}“ musí zmizet`);
      assert.equal(await viditelne('.lepiva-lista'), false, `lišta pro „${spatne}“ musí zmizet`);
      assert.equal(await viditelne('#osvc-neplatne'), true);
      assert.match(await text(page, '#osvc-neplatne'), /opravíš/);
      assert.equal(await page.$eval('#osvc-income-chyba', (el) => el.hidden), false);
    }
    await page.click('#osvc-form button[type="submit"]');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'osvc-income');
    assert.equal(await viditelne('#osvc-vysledek'), false);
    await vstup('800000');
    assert.equal(await viditelne('#osvc-vysledek'), true);
    assert.equal(await viditelne('#osvc-graf'), true);
    assert.equal(await viditelne('.lepiva-lista'), true);
    assert.equal(await viditelne('#osvc-neplatne'), false);
    assert.match(await radek(page, 'flat'), /115 932 Kč/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  // Revize 5. 11. 2026, EET-06: pásmo se určuje z jedné činnosti, podmínka 75 % příjmů (§ 2a odst. 5 ZDP).
  test('nápověda k druhu činnosti a poznámka o podmínce 75 % příjmů', async () => {
    const { page, chyby } = await otevri(OSVC, { sirka: 1440, vyska: 900 });
    assert.match(await text(page, '#osvc-form'), /aspoň 75 % příjmů/);
    await vypln(page, '#osvc-income', 1200000);
    assert.match(await text(page, '#osvc-vysledek'), /75 % příjmů/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('bez JavaScriptu je vidět tabulka variant s ukázkou', async () => {
    const { page } = await otevri(OSVC, { js: false });
    const ukazka = await text(page, '#osvc-vysledek');
    assert.ok(await page.$('#osvc-vysledek [data-ukazka]'));
    assert.match(ukazka, /115 932 Kč/);
    assert.match(ukazka, /132 732 Kč/);
    await page.close();
  });
});

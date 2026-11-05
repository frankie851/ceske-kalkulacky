// E2E: Mám EET? (7 scénářů ze zadání proklikáním dotazníku) a OSVČ 2027 nad sestaveným webem.
// Spuštění: npx eleventy && node --test test/e2e/mam-eet.test.js
import { test, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, zavri, text } from './pomocnik.mjs';

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

  test('výchozí srovnání: 1. pásmo 115 944 Kč, EET OFF 132 744 Kč', async () => {
    const { page, chyby } = await otevri(OSVC, { sirka: 1440, vyska: 900 });
    assert.match(await radek(page, 'flat'), /Paušální daň \(1\. pásmo\).*115 944 Kč/);
    assert.match(await radek(page, 'eetOff'), /132 744 Kč/);
    assert.match(await text(page, '#osvc-vysledek-karta'), /115 944 Kč/);
    assert.ok(await page.$('#osvc-graf svg.osvc-svg'), 'interaktivní graf');
    assert.equal(await page.$('#osvc-vysledek [data-ukazka]'), null, 's JS už nejde o ukázku');
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

  test('bez JavaScriptu je vidět tabulka variant s ukázkou', async () => {
    const { page } = await otevri(OSVC, { js: false });
    const ukazka = await text(page, '#osvc-vysledek');
    assert.ok(await page.$('#osvc-vysledek [data-ukazka]'));
    assert.match(ukazka, /115 944 Kč/);
    assert.match(ukazka, /132 744 Kč/);
    await page.close();
  });
});

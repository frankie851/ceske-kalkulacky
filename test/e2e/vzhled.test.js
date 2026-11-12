// E2E: společné prvky vzhledu – sbalené zdroje na stránkách nástrojů, legenda štítků,
// podbarvené volby. Spuštění: npx eleventy && node --test test/e2e/vzhled.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, zavri } from './pomocnik.mjs';

after(zavri);

test('nástroj: „Odkud to víme“ je sbalené pod blokem neověřeného, po kliknutí ukáže zdroje', async () => {
  for (const cesta of ['penize/zdanim-to/', 'dluhy/exekuce-nebo-oddluzeni/']) {
    const { page, chyby } = await otevri(cesta, { sirka: 1440, vyska: 900 });
    const stav = await page.evaluate(() => {
      const d = document.querySelector('details.zdroje-sbalene');
      const neov = document.getElementById('neovereno-nadpis');
      return {
        sbalene: d && !d.open,
        poradi: neov && d ? Boolean(neov.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) : null,
        viditelnyOdkaz: d ? d.querySelector('.sources a').checkVisibility() : null,
      };
    });
    assert.equal(stav.sbalene, true, cesta);
    assert.equal(stav.poradi, true, `${cesta}: neověřené má být nad zdroji`);
    assert.equal(stav.viditelnyOdkaz, false, cesta);
    await page.click('details.zdroje-sbalene > summary');
    assert.equal(await page.$eval('details.zdroje-sbalene', (d) => d.open), true);
    assert.ok(await page.$eval('details.zdroje-sbalene .sources a', (a) => a.checkVisibility()));
    assert.deepEqual(chyby, [], cesta);
    await page.close();
  }
});

test('nástroj: před tiskem se sbalené zdroje otevřou', async () => {
  const { page } = await otevri('penize/zdanim-to/');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.$eval('details.zdroje-sbalene', (d) => d.open), true);
  await page.close();
});

test('Co se mění v roce 2027: štítky v legendě se nepřekrývají s textem (360 i 1440 px)', async () => {
  for (const [sirka, vyska] of [[360, 640], [1440, 900]]) {
    const { page } = await otevri('co-se-meni-2027/', { sirka, vyska });
    const prekryvy = await page.$$eval('.legenda li', (lis) => lis.map((li) => {
      const a = li.querySelector('.badge').getBoundingClientRect();
      const b = li.querySelector(':scope > span:not(.badge)').getBoundingClientRect();
      const prekryv = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return prekryv ? li.textContent.trim() : null;
    }).filter(Boolean));
    assert.deepEqual(prekryvy, [], `šířka ${sirka}`);
    await page.close();
  }
});

test('Mám EET?: volby mají jiné pozadí než karta', async () => {
  const { page } = await otevri('dane-podnikani/mam-eet/');
  const barvy = await page.evaluate(() => {
    const label = document.querySelector('#eet-app .opt label');
    return { volba: getComputedStyle(label).backgroundColor, karta: getComputedStyle(label.closest('.quiz')).backgroundColor };
  });
  assert.notEqual(barvy.volba, barvy.karta);
  await page.close();
});

// Zdaním to? – klientský modul záložky Prodeje. Čte řádky formuláře, počítá přes prodeje.js
// a aktualizuje výsledek. Pravidla bere z <script type="application/json" id="pravidla">.
// Žádné částky ani limity tu nejsou natvrdo, nic se neukládá ani neposílá.
import { osvobozeniProdeje } from './prodeje.js';
import { vysledekProdeju } from './vystup.js';
import { $, nactiCislo, nastavHtml, aktualizujVysledek, pripojRadky, hodnotyRadku, oznacChyby, oznamovac } from './ui-spolecne.js';

const rules = JSON.parse(document.getElementById('pravidla').textContent);
const form = document.getElementById('zt-prodeje-form');
const oznam = oznamovac($('[data-oznameni]'));

/** Řádek je prázdný, když v něm není vyplněné nic kromě výběru druhu. */
const jePrazdny = (h) => !h.nakup && !h.prodej && !String(h.prijem).trim() && !String(h.naklady).trim();

let ovladani = null;

function prepocitej() {
  const radky = ovladani.radky();
  const pouzite = [];
  const prodeje = [];
  radky.forEach((li, i) => {
    const h = hodnotyRadku(li);
    if (jePrazdny(h)) { oznacChyby(li, []); return; }
    const prijem = nactiCislo(h.prijem);
    const naklady = nactiCislo(h.naklady);
    prodeje.push({ typ: h.typ, nakup: h.nakup, prodej: h.prodej, prijem, naklady: naklady ?? 0 });
    pouzite.push(i);
  });
  const v = osvobozeniProdeje(prodeje, rules.rok, rules);
  // Čísla položek podle řádku formuláře, ne podle pořadí vyplněných
  v.polozky.forEach((p, j) => {
    p.index = pouzite[j];
    oznacChyby(radky[pouzite[j]], p.chyby.map((c) => c.pole));
  });
  const t = vysledekProdeju(v, rules);
  aktualizujVysledek(t);
  nastavHtml($('[data-zt-detail]'), t.detail);
  nastavHtml($('[data-zt-polozky]'), t.polozky);
  oznam(`${t.nadpis}.`);
}

ovladani = pripojRadky({ form, prefix: 'p', nazev: 'Prodej', odebratPopis: 'prodej', priZmene: prepocitej });
prepocitej();

// Zdaním to? – klientský modul záložky Dividendy ze zahraničí. Čte výplaty, počítá přes
// dividendy.js a aktualizuje výsledek. Pravidla bere z <script type="application/json" id="pravidla">.
// Žádné sazby ani kurzy tu nejsou natvrdo, nic se neukládá ani neposílá.
import { spocitejDividendy, ChybaDividend, zkontrolujVyplatu } from './dividendy.js';
import { vysledekDividend } from './vystup.js';
import { $, nactiCislo, nastavText, nastavHtml, aktualizujVysledek, pripojRadky, hodnotyRadku, oznacChyby, oznamovac } from './ui-spolecne.js';

const rules = JSON.parse(document.getElementById('pravidla').textContent);
const form = document.getElementById('zt-dividendy-form');
const oznam = oznamovac($('[data-oznameni]'));
const chyba = $('[data-chyba]');

const jePrazdny = (h) => !String(h.hruba).trim() && !String(h.srazeno).trim() && !String(h.kurz).trim();
// Způsob přepočtu: rádia, nebo jediný dostupný způsob ve skrytém poli (jednotný kurz za rok nevyšel)
const zpusob = () => form.querySelector('input[name="zpusob"]:checked')?.value ?? form.querySelector('[data-zpusob]')?.value;
// Režim § 8 / § 16a platí pro všechny výplaty najednou
const rezim = () => form.querySelector('input[name="zdaneni"]:checked')?.value;

function ukazChybu(text) {
  nastavText($('[data-chyba-text]'), text || '');
  chyba.hidden = !text;
}

let ovladani = null;

function prepocitej() {
  const z = zpusob();
  const napoveda = $('#zpusob-napoveda');
  if (napoveda && rules.kurzy.zpusoby[z]) nastavText(napoveda, rules.kurzy.zpusoby[z].popis);

  const radky = ovladani.radky();
  const vyplaty = [];
  const indexy = [];
  let chybnych = 0;
  radky.forEach((li, i) => {
    const h = hodnotyRadku(li);
    if (jePrazdny(h)) { oznacChyby(li, []); return; }
    const v = {
      zeme: h.zeme, mena: h.mena, zpusobKurzu: z,
      hruba: nactiCislo(h.hruba), srazeno: nactiCislo(h.srazeno) ?? 0, kurz: nactiCislo(h.kurz),
    };
    const chyby = zkontrolujVyplatu(v, rules).map((c) => c.pole);
    if (v.kurz !== null && !(v.kurz > 0)) chyby.push('kurz');
    oznacChyby(li, chyby);
    if (chyby.length) { chybnych += 1; return; }
    vyplaty.push(v);
    indexy.push(i);
  });

  if (chybnych) {
    ukazChybu('Některá pole nejsou vyplněná správně. Oprav označené údaje, výsledek se pak přepočítá.');
    return;
  }
  if (!vyplaty.length) {
    ukazChybu('Zadej aspoň jednu výplatu dividendy.');
    return;
  }
  try {
    const v = spocitejDividendy(vyplaty, { rok: rules.rok, rezim: rezim() }, rules);
    ukazChybu('');
    const t = vysledekDividend(v, rules);
    aktualizujVysledek(t);
    nastavHtml($('[data-zt-tabulka]'), t.tabulka);
    nastavHtml($('[data-zt-upozorneni]'), t.upozorneni);
    nastavHtml($('[data-zt-navod]'), t.navod);
    oznam(`${t.nadpis}.`);
  } catch (e) {
    if (!(e instanceof ChybaDividend)) throw e;
    if (e.kod === 'ruzne-jednotne-kurzy') {
      vyplaty.forEach((v, j) => { if (v.mena === e.data.mena) oznacChyby(radky[indexy[j]], ['kurz']); });
    } else if (e.kod === 'chybi-kurz' && e.data?.index != null) {
      oznacChyby(radky[indexy[e.data.index]], ['kurz']);
    }
    ukazChybu(e.message);
  }
}

// Přepínače režimu a způsobu přepočtu jsou ve stejném formuláři: změnu zachytí pripojRadky (událost change).
ovladani = pripojRadky({ form, prefix: 'd', nazev: 'Výplata', odebratPopis: 'výplatu', priZmene: prepocitej });
prepocitej();

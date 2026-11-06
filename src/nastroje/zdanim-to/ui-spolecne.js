// Zdaním to? – společné pomůcky obou klientských modulů: čtení čísel, řádky formuláře
// (přidat, odebrat, přečíslovat) a aktualizace výsledku bez posunu stránky.
// Nic se neukládá (žádný localStorage) ani neposílá.

export const $ = (sel, koren = document) => koren.querySelector(sel);
export const $$ = (sel, koren = document) => [...koren.querySelectorAll(sel)];

/** Číslo z textového pole: mezery pryč, desetinná čárka. Prázdné = null, nesmysl = NaN. */
export function nactiCislo(hodnota) {
  const t = String(hodnota ?? '').replace(/[\s  ]/g, '').replace(',', '.');
  if (t === '') return null;
  return /^[-+]?\d*\.?\d+$/.test(t) ? Number(t) : NaN;
}

/** Nastaví text, jen když se liší (žádné zbytečné překreslení). */
export function nastavText(el, text) {
  if (el && el.textContent !== text) el.textContent = text;
}

/** Nastaví HTML, jen když se liší – po načtení je obsah stejný jako z buildu a nic neposkočí. */
export function nastavHtml(el, html) {
  if (el && el.innerHTML !== html) el.innerHTML = html;
}

/** Hlavní část karty výsledku a lepivé lišty (makra vysledek a lepiva_lista). */
export function aktualizujVysledek(v) {
  nastavText($('#vysledek-nadpis'), v.nadpis);
  nastavText($('[data-vysledek-cislo]'), v.cislo);
  nastavText($('[data-vysledek-popis]'), v.popis);
  nastavText($('[data-vysledek-vysvetleni]'), v.vysvetleni);
  nastavText($('[data-lista-cislo]'), v.lista.cislo);
  nastavText($('[data-lista-popis]'), v.lista.popis);
}

/**
 * Řádky formuláře. Každý řádek je <li data-radek> s poli [data-pole], popisky [data-for],
 * legendou [data-radek-nazev] a tlačítkem [data-odebrat].
 * @param {{ form, prefix, nazev, odebratPopis, priZmene }} p – prefix id (p / d), nazev řádku (Prodej / Výplata)
 */
export function pripojRadky({ form, prefix, nazev, odebratPopis, priZmene }) {
  const seznam = $('[data-radky]', form);
  const vzor = $('[data-radek]', seznam).cloneNode(true);
  for (const el of $$('[data-pole]', vzor)) {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
    el.removeAttribute('aria-invalid');
  }

  function precisluj() {
    const radky = $$('[data-radek]', seznam);
    radky.forEach((li, i) => {
      const n = i + 1;
      nastavText($('[data-radek-nazev]', li), `${nazev} ${n}`);
      nastavText($('[data-odebrat-popis]', li), ` ${odebratPopis} ${n}`);
      for (const el of $$('[data-pole]', li)) {
        const id = `${prefix}${n}-${el.dataset.pole}`;
        el.id = id;
        el.name = id;
      }
      for (const l of $$('[data-for]', li)) l.htmlFor = `${prefix}${n}-${l.dataset.for}`;
      $('[data-odebrat]', li).disabled = radky.length === 1;
    });
  }

  form.addEventListener('click', (e) => {
    const odebrat = e.target.closest('[data-odebrat]');
    if (odebrat) {
      const li = odebrat.closest('[data-radek]');
      const dalsi = li.nextElementSibling || li.previousElementSibling;
      li.remove();
      precisluj();
      priZmene();
      $('[data-pole]', dalsi)?.focus();
      return;
    }
    if (e.target.closest('[data-pridat]')) {
      const li = vzor.cloneNode(true);
      seznam.append(li);
      precisluj();
      priZmene();
      $('[data-pole]', li).focus();
    }
  });
  form.addEventListener('input', priZmene);
  form.addEventListener('change', priZmene);
  form.addEventListener('submit', (e) => { e.preventDefault(); priZmene(); });
  precisluj();
  return { radky: () => $$('[data-radek]', seznam) };
}

/** Hodnoty polí řádku jako objekt { pole: hodnota } (zaškrtávátko → true/false). */
export function hodnotyRadku(li) {
  const o = {};
  for (const el of $$('[data-pole]', li)) o[el.dataset.pole] = el.type === 'checkbox' ? el.checked : el.value;
  return o;
}

/** Označí chybná pole řádku (aria-invalid) podle seznamu klíčů. */
export function oznacChyby(li, pole) {
  for (const el of $$('[data-pole]', li)) {
    if (pole.includes(el.dataset.pole)) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
}

/** Krátké oznámení pro čtečky (aria-live="polite"); stejný text se neopakuje. */
export function oznamovac(el) {
  return (text) => nastavText(el, text);
}

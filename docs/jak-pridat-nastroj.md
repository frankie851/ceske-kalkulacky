# Jak přidat nástroj na web Spočítáno

Krátký návod pro přenos nástroje do webu (Eleventy 3, design varianty B). Vzorem jsou
`src/nastroje/plan48/`, `penzijko-kompas/` a `mam-eet/`.

## 1. Struktura složky

```
src/nastroje/<id>/
  nastroj.json          metadata pro karty, kategorie, vyhledávání a „Souvisí“
  rules.json            pravidla s obalem { "meta": { … }, … }
  index.njk             stránka nástroje (další stránky/záložky = další .njk)
  <id>.11tydata.js      ukázkový výsledek spočítaný při buildu (datový soubor složky – platí pro všechny
                        stránky nástroje; pro jednu stránku lze přidat <stranka>.11tydata.js)
  calc.js …             čisté výpočetní moduly (ES moduly, bez DOM)
  ui.js                 klientský modul: čte formulář, volá výpočet, aktualizuje stránku
  test/*.test.js        původní testy beze změny (relativní cesty ../calc.js, ../rules.json sedí);
                        spouští je `npm test` (glob src/**/*.test.js)
```

Do `_site/nastroje/<id>/` se zkopírují jen `*.js` kromě `*.11tydata.js`, `*.test.js` a složek
`test/`. Moduly z prohlížeče importuj relativně (`import { spocitej } from './calc.js'`),
sdílené moduly cestou `../../js/format.js`.

Jakmile složka existuje, nástroj se v `src/_data/pripravujeme.json` sám skryje (přednost má
aktivní verze) – záznam tam můžeš smazat.

### nastroj.json

```json
{
  "id": "plan48", "nazev": "Plán48", "typ": "kalkulačka", "kategorie": "penize",
  "url": "/penize/plan48/", "poradi": 1,
  "perex": "…tykání, rodově neutrálně…", "otazka": "Otázka v bublině nahoře",
  "stitky": ["penzijko", "DIP"], "termin": "Vklady do 31. 12. 2026" | null,
  "novinka2027": true, "ilustrace": "nastroj-plan48", "cta": "Pojďme na to",
  "souvisi": ["penzijko-kompas", "zdanim-to"],
  "zalozky": [{ "id": "osvc-2027", "nazev": "OSVČ 2027", "url": "/dane-podnikani/mam-eet/osvc-2027/",
                "perex": "…", "stitky": ["…"], "typ": "kalkulačka" }]
}
```

`ilustrace` je id symbolu ve `src/img/sprite.svg` (`nastroj-plan48`, `nastroj-mam-eet`,
`nastroj-penzijko-kompas`, `nastroj-zdanim-to`, `nastroj-inflace`, `nastroj-obecny`).

### rules.json

```json
{
  "meta": {
    "overeno": "2026-11-04",
    "zdroje": [{ "nazev": "MF – Brožura EET 2.0", "url": "https://…", "poznamka": "volitelně" }],
    "neovereno": ["Text pravidla, které jsme neověřili", "…"]
  },
  "…": "vnitřní struktura pravidel beze změny"
}
```

Bez `meta.overeno` build spadne. Štítek „Pravidla ověřena k …“, seznam zdrojů na stránce
i na `/zdroje/` a blok „Co zatím neověřujeme a nepočítáme“ se berou odsud.

### Stránka (index.njk)

```njk
---
layout: layouty/nastroj.njk
nastroj: plan48
title: Plán48
description: Jedna věta pro vyhledávače.
permalink: /penize/plan48/
skripty: ['/nastroje/plan48/ui.js']
uvod: Dva krátké kroky a máš jasno.        # volitelné
stitkyNavic: ['Počítáme podle: Pravidla 2026']   # volitelné štítky v hlavičce
---
…obsah: formulář, výsledek, grafy, tabulky…
```

Záložka (např. OSVČ 2027) je další soubor se stejným `nastroj` a navíc `zalozka: osvc-2027`.
Layout sám vykreslí drobečky, hlavičku se štítkem ověření, záložky, za obsahem zdroje,
„neověřeno“, upozornění „Nejde o poradenství“, blok „Souvisí“ a
`<script type="application/json" id="pravidla">` s celým `rules.json`.

## 2. Pravidla v prohlížeči

```js
const pravidla = JSON.parse(document.getElementById('pravidla').textContent);
```

Žádný `fetch`. Výpočetní moduly dostávají pravidla jako parametr.

## 3. Ukázkový výsledek při buildu (povinné)

Stránka musí bez JS ukázat formulář s výchozími hodnotami a spočítaný výsledek. Spočítej ho
v `<id>.11tydata.js` stejným modulem jako v prohlížeči:

```js
// src/nastroje/plan48/plan48.11tydata.js
import fs from 'node:fs';
import { spocitej } from './calc.js';
import { kc } from '../../js/format.js';
import { skladanyPruh, tabulkaDat } from '../../js/graf.js';

const pravidla = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const vstup = { vek: 35, dps: 3000, dip: 0, zp: 2500, sazba: 15 };
const v = spocitej(vstup, pravidla);

export default {
  ukazka: { vstup, odpocet: kc(v.odpocet), uspora: kc(v.uspora) },
  grafLimitu: skladanyPruh({ titulek: 'Jak máš využitý limit', id: 'limit',
    polozky: [{ nazev: 'Penzijko (DPS)', hodnota: v.dps, trida: 'graf-rada-1' }], limit: pravidla.limit }),
};
```

V šabloně: `{{ ukazka.odpocet }}`, `{{ grafLimitu | safe }}`. Kartě výsledku dej
`ukazka: true` – vykreslí atribut **`data-ukazka`**, podle kterého kontrola bez JS ověřuje,
že stránka s `#pravidla` má ukázkový výsledek. Bez něj kontrola neprojde.

## 4. Makra (src/_includes/komponenty/)

Import: `{% from "komponenty/formular.njk" import pole, segmenty %}`. Parametry jsou
popsané v komentáři na začátku každého souboru. Přehled:

| Soubor | Makro | Parametry |
| --- | --- | --- |
| ikona.njk | `ikona(id, trida, titulek)` | id symbolu ve spritu |
| stitky.njk | `stitek({ typ, text, datum, li })` | typ: overeno, navrh, nove, schvaleno, kalendar, pripravujeme, plain |
| rozvrzeni.njk | `drobecky(polozky)`, `hlavicka_stranky({…})`, `zalozky({ polozky, url })`, `hlavicka`, `paticka` | layouty je volají samy |
| karty.njk | `karta_nastroje(n, { uroven, stitky })`, `situace(s)`, `kategorie_dlazdice({…})`, `zmena_2027(z, nastroje)`, `souvisi(idcka, nastroje, { nadpis })` | |
| formular.njk | `pole({ id, label, hodnota, jednotka, napoveda, chyba, chybaMisto, moznosti, typ, inputmode })` | chyba → `.is-error`, `aria-invalid`, `.error-msg` (id `<id>-chyba`); nápověda id `<id>-napoveda` |
| | `segmenty({ id, nazev, legenda, moznosti: [{ hodnota, text, vybrano }], napoveda })` | rádia jako pilulky; id rádia `<id>-<hodnota>` |
| | `volby({ id, nazev, legenda, typ: 'checkbox'\|'radio', moznosti, napoveda, otazka })` | velké dlaždice `.options` |
| | `krokovac({ kroky, aktualni, varianta: 'bubliny'\|'pruh' })` | `aria-current="step"` |
| | `krok({ cislo, titulek, shrnuti, otevreny, hotovo })` + `{% call %}` | `details.step` |
| vysledky.njk | `vysledek({ id, kicker, nadpis, verdikt, cislo, popis, vysvetleni, ilustrace, ilustraceSvg, ukazka })` + `{% call %}` | JS mění `[data-vysledek-cislo]`, `[data-vysledek-popis]`, `[data-vysledek-vysvetleni]` |
| | `statistiky([{ hodnota, popis, zvyraznit }])` | |
| | `tabulka({ caption, popisek, sloupce, radky, vpravo, stack, zvyraznit, poznamka })` | první buňka řádku = `th scope="row"` |
| | `kontrolni_seznam({ id, polozky: [{ ukol, termin, typ: 'hard'\|'doporuceny', zdroj }] })` | |
| | `lepiva_lista({ cislo, popis, cil, text })` | viz níže |
| obsah.njk | `zdroje({ zdroje, nadpis, overeno })`, `upozorneni({ typ, titulek, text })` + `{% call %}`, `pomoc_dluhy({ pomoc, varianta, … })` | typy upozornění: poradenstvi, info, navrh, varovani |

Hotové třídy z prototypu B, které můžeš použít přímo: `.calc-layout` (`.calc-side` + `.calc-main`),
`.card`, `.card-draft`, `.card-head`, `.quiz`, `.quiz-actions`, `.form-actions`, `.btn .btn-primary
.btn-ghost .btn-big`, `.todo` (krok do konce roku), `.reasons`, `.watch`, `.split`, `.scenario`,
`.done-steps`, `.note`, `.table-note`, `.verdict`, `.sr-only`, `.num` (nezalomit částku).

## 5. Lepivá lišta s výsledkem (mobil)

```njk
{{ lepiva_lista({ cislo: ukazka.odpocet, popis: 'Odpočet za rok 2026', cil: '#vysledek' }) }}
```

Lišta je `position: fixed` dole, na šířce ≥ 1040 px skrytá; `body` dostane spodní odsazení
automaticky. Třídy: `.lepiva-lista`, `.lepiva-lista-text`, `.lepiva-lista-popis`,
`.lepiva-lista-cislo`. JS aktualizuje `[data-lista-cislo]` a `[data-lista-popis]`.

## 6. format.js (src/js/format.js)

Všechny mezery ve výstupu jsou pevné (U+00A0). Stejné funkce jsou filtry v šablonách
(`{{ 45600 | kc }}`, `| cislo`, `| procenta`, `| datum`).

- `kc(n, des = 0)` → „45 600 Kč“; neplatný vstup → „–“
- `cislo(n, des = 0)` → „1 234,5“
- `procenta(n, des = 0)` → „15 %“ (vstup v procentech, ne podíl: 0,5 % = `procenta(0.5, 1)`)
- `datum(iso)` → „4. 11. 2026“ (přijme i `Date`)

## 7. graf.js (src/js/graf.js)

Vrací HTML řetězec (`<figure class="graf">` se SVG a legendou). Funguje v Node i v prohlížeči
(`el.innerHTML = caroveGrafy({...})`). Barvy jen přes třídy `graf-rada-1` … `graf-rada-5`.
Ke každému grafu přidej `tabulkaDat(...)` jako textovou alternativu.

- `skladanyPruh({ titulek, popis?, polozky: [{ nazev, hodnota, trida? }], limit?, format = kc, id? })`
  – vodorovný skládaný pruh; zbytek do limitu je čárkované „volné místo“, pod ním legenda a
  „Dohromady X z Y“.
- `caroveGrafy({ titulek, popis?, rady: [{ nazev, body: [{ x, y }], trida?, carkovana?, vyplnena?, zvyraznena? }],
  osaX: { popisek, format }, osaY: { popisek, format }, sirka = 640, vyska = 320, id? })` – osa Y
  s děleným 1-2-5, mřížka, popisky os, legenda, `role="img"`, `<title>`, `<desc>`, `viewBox`.
  Text se škáluje s šířkou: v prohlížeči můžeš graf překreslit se `sirka: kontejner.clientWidth`.
- `sloupcovyGraf({ titulek, popis?, polozky: [{ nazev, hodnota, trida? }], osaY, sirka, vyska, id? })`
- `tabulkaDat({ caption, sloupce, radky, popisek?, stack? })` – čísla formátuje `cislo()`.
- `hezkeDeleni(min, max, pocet)`, `esc(text)` – pomocné.

Pro stovky bodů (Spot, nebo fix?) body předem zjednoduš, `graf-bod` se kreslí jen do 24 bodů.

## 8. Pravidla

- **Žádný `fetch`**, žádné požadavky mimo vlastní web, žádné knihovny z CDN.
- **Žádné inline skripty ani inline styly** (`style="…"`, `<style>`, `onclick`). CSP je
  `script-src 'self'` + hash jediného skriptu tématu a `style-src 'self'`. Skripty dávej do
  modulů a do front matter `skripty`. Data pro skript předávej přes
  `<script type="application/json" id="…">{{ data | json | safe }}</script>`.
- **Žádné natvrdo zapsané částky, sazby ani limity v JS** – vše z `rules.json`.
- Návrh zákona vždy se štítkem `stitek({ typ: 'navrh' })` („Návrh, zatím neschváleno“).
- Tón: **tykání a rodově neutrálně** („zadáno“, „tvoje odpověď“, ne „zadal jsi“), krátké věty.
  **Sekce Dluhy vyká.**
- Bez reklam a affiliate odkazů. Nic neukládej do `localStorage` (kromě volby režimu, kterou
  řeší `tema.js`); u Dluhů ani do URL.
- Barvy jen z tokenů (`var(--c-…)`, `var(--il-…)`), styly patří do `src/css/main.css` do
  příslušné vrstvy (`komponenty` nebo `stranky`). Zlomy: 560, 760, 1040 px.
- Cílové plochy ≥ 24 px (tlačítka 48 px), viditelný fokus, `label` u každého pole.
- Kontrola: `npm run build`, `npm test`, a Puppeteer + axe: 0 serious/critical ve světlém
  i tmavém režimu, nic nepřetéká na 360 px, žádné chyby v konzoli (CSP).

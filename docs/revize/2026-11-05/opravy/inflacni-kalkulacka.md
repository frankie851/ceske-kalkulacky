# Opravný prompt: Inflační kalkulačka (`frankie851/inflacni-kalkulacka`)
Z nezávislé revize 5. 11. 2026 · revidovaný commit `b9e19800fed0e0bcbf0971930208b3ff0b541903` · zpráva: `docs/revize/2026-11-05/inflacni-kalkulacka.md` v repozitáři `frankie851/ceske-kalkulacky` (větev `revize/2026-11-05`)

## Jak spustit (pro Davida)
1. Otevři nové sezení Claude Code v repozitáři **frankie851/inflacni-kalkulacka**, větev `main`.
2. Model **Opus 5.5** (`/model opus`), effort **High** (`/effort high`).
3. Zkopíruj všechno od nadpisu „Prompt“ níže až do konce souboru a vlož to jako první zprávu.
4. Výsledkem bude PR do `main` s tabulkou nález → test → stav. Před sloučením si projdi tabulku a namátkou zkontroluj 1–2 opravy.

---

# Prompt

## Kontext
Inflační kalkulačka je statický web (čisté HTML + CSS + JS, ES moduly, Chart.js z cdnjs) se třemi nástroji nad bazickým indexem spotřebitelských cen ČSÚ (průměr 2015 = 100, měsíčně od ledna 1995): přepočet částky mezi dvěma měsíci, reálný výnos a reálná mzda. Zadání je v sekci „Zadání pro Claude Code: Inflační kalkulačka“ souboru https://github.com/frankie851/ceske-kalkulacky/blob/main/docs/zadani.md. Tento úkol opravuje nálezy z nezávislé revize z 5. 11. 2026 (zpráva: https://github.com/frankie851/ceske-kalkulacky/blob/revize/2026-11-05/docs/revize/2026-11-05/inflacni-kalkulacka.md), revidován byl commit `b9e19800fed0e0bcbf0971930208b3ff0b541903` na `main`. Výpočty jsou v `inflation.js` (bez vazby na DOM), propojení formuláře v `app.js`, data v `data/cpi.json` (aplikace nemá `rules.json`; „pravidla“ jsou datová řada ČSÚ a vzorce – kde se níže mluví o `rules.json`, platí to pro konstanty v kódu a README), testy `node --test` ve složce `test/` (27 testů). Revize potvrdila, že výpočty i data jsou správné (45/45 případů, 372/372 a 141/141 měsíců shodných s CSV ČSÚ); nálezy jsou v přístupnosti, čtení vstupu a testovatelnosti.

## Nálezy k opravě (seřazené podle závažnosti)
### INF-01 · Vysoká · Aktivní záložka nesplňuje kontrast písma 4,5:1 (axe color-contrast, serious)
- **Kde:** `styles.css:105` (`.tabs [role="tab"][aria-selected="true"] { background: var(--accent); color: #fff; }`), `styles.css:9` (`--accent: #2a78d6`), `styles.css:29` a `:47` (tmavý režim `--accent: #3987e5`); `index.html:25–27` (tři záložky `role="tab"`)
- **Reprodukce:** otevřít stránku (360 px) → axe WCAG 2.2 A/AA hlásí 1× `color-contrast` (serious) na `#tab-convert`; po přepnutí na „Reálná mzda“ na `#tab-wage`; v tmavém režimu (`prefers-color-scheme: dark`) totéž. Očekáváno: bílé písmo 15,2 px / tloušťka 600 (není „velký text“) potřebuje kontrast ≥ 4,5:1 → skutečnost: bílá na `#2a78d6` = 4,42:1, na `#3987e5` (tmavý režim) = 3,64:1. Potvrzeno na živém webu.
- **Správná hodnota / pravidlo a zdroj:** WCAG 2.2, kritérium 1.4.3 Contrast (Minimum), úroveň AA: kontrast textu ≥ 4,5:1 (velký text ≥ 18,66 px tučně nebo ≥ 24 px by stačil 3:1) – https://www.w3.org/TR/WCAG22/#contrast-minimum; vzorec relativní luminance https://www.w3.org/TR/WCAG22/#dfn-relative-luminance. Skeptik: Potvrzeno (poměry 4,42:1 a 3,64:1 přepočteny vzorcem WCAG; `#1d5fae` s bílou dává 6,36:1).
- **Oprava:** pro aktivní záložku použít tmavší pozadí, např. `--accent-ink` `#1d5fae` ve světlém režimu (≈ 6,4:1 s bílou), a v tmavém režimu tmavé písmo na světlém pozadí (např. text `#121211` na `#8bb8f0`); nejčistší je zavést dva tokeny `--tab-active-bg` a `--tab-active-fg` v `:root`, v bloku `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) … }` i v `:root[data-theme="dark"]`, a použít je jen v pravidle pro `[aria-selected="true"]`. Ostatní barvy a `:focus-visible` neměň. Po opravě znovu axe v obou režimech (360 px, všechny tři záložky).
- **Regresní test:** nový `test/contrast.test.mjs`: načte `styles.css`, z bloků `:root`, `@media (prefers-color-scheme: dark)` a `:root[data-theme="dark"]` vytáhne hodnoty `--tab-active-bg` a `--tab-active-fg`, spočítá kontrast podle vzorce WCAG (relativní luminance sRGB) a ověří ≥ 4,5 pro všechny tři bloky. Dnes selže (tokeny neexistují; pokud test spustíš na dnešním páru `#fff`/`#2a78d6`, dá 4,42). Hodnoty 4,42 a 3,64 uveď v komentáři testu jako stav před opravou.

### INF-03 · Střední · Zápis „10.000“ se čte jako 10 Kč
- **Kde:** `app.js:26` (`const parseInput = (s) => Number(String(s).replace(/[\s ]/g, '').replace(',', '.'))`), používá se pro pole `amount`, `rate`, `wageThen`, `wageNow`
- **Reprodukce:** do „Částka (Kč)“ napsat `10.000` (leden 2005 → září 2026) → očekáváno 10 000 Kč → „19 850 Kč“, nebo odmítnutí s hláškou → skutečnost „19,85 Kč“ a věta „10,00 Kč v lednu 2005 má stejnou kupní sílu jako 19,85 Kč v září 2026“. Nezávislé na lokalizaci prohlížeče (pole je `type="text"`). Zápis `1.500.000` dá NaN a hlášku, `10.000` ne.
- **Správná hodnota / pravidlo a zdroj:** žádné úřední pravidlo; český zápis částek používá tečku nebo mezeru jako oddělovač tisíců a čárku jako desetinnou (ČSN 01 6910). Očekáváno: `10.000` → 10 000; `1.500.000` → 1 500 000; `1.500,50` → 1 500,50; `1 500` → 1 500; `1500,50` → 1 500,50; `10.5` (tečka, za ní ne přesně tři číslice) → odmítnout s hláškou „desetinná místa oddělte čárkou“.
- **Oprava:** přesunout `parseInput` do `inflation.js` (viz INF-04) a rozšířit: tečku následovanou přesně třemi číslicemi (a bez čárky za ní) brát jako oddělovač tisíců; jinou tečku odmítnout (`NaN`) a v `app.js` zobrazit hlášku „Desetinná místa oddělte čárkou, např. 10 000,50.“; prázdný řetězec vrátit jako `NaN` (zároveň vyřeší nízký INF-05, pokud `app.js` na `NaN` reaguje výzvou).
- **Regresní test:** v `test/inflation.test.mjs` test „parseInput: český zápis částek“: `parseInput('10.000')` → 10000; `'1.500.000'` → 1500000; `'1.500,50'` → 1500.5; `'1 500'` → 1500; `'1500,50'` → 1500.5; `'1 500,5'` → 1500.5; `'10.5'` → NaN; `''` → NaN; `'abc'` → NaN; `'-5'` → −5 (zápornou částku odmítá `app.js`). Dnes selže (funkce v `inflation.js` neexistuje; dnešní `parseInput` dává 10 a 0).

### INF-04 · Střední · Čtení vstupu a logika směru přepočtu jsou v `app.js` a bez testu
- **Kde:** `app.js:26` (`parseInput`), `app.js:94–96` (chronologický směr změny cen a průměrná roční inflace při obráceném přepočtu: `change = from < to ? cum : 1 / (1 + cum) - 1`, `avg = annualizedInflation(1, 1 + change, months)`), `app.js:85, 109–110, 131` (kontroly vstupu); `test/inflation.test.mjs` testuje jen `inflation.js`
- **Reprodukce:** `node --test` 27/27, ale žádný test nepokrývá „1 500“, „1500,50“, „10.000“ (INF-03), prázdné pole (INF-05), záporné číslo ani větu při prohozených měsících; `app.js` nelze v Node importovat (po načtení volá `init()` nad `document`), takže se tato logika testovat ani nedá.
- **Správná hodnota / pravidlo a zdroj:** zadání, Technologie: „výpočty v `inflation.js` bez vazby na DOM“, Kritéria hotovo: testy `node --test`. Očekávané hodnoty (rejstřík FD-51, data FD-50): leden 2005 (80,2) → září 2026 (159,2), 260 měsíců: změna cen +98,50 %, průměrně 3,22 % ročně; obrácený přepočet září 2026 → leden 2005: 10 000 Kč → 5 037,69 Kč, věta musí dál říkat, že ceny od ledna 2005 do září 2026 **vzrostly** o 98,5 % (průměrně 3,2 % ročně), tj. změna v chronologickém směru = 1 / (1 + cum) − 1, kde cum = 80,2 / 159,2 − 1.
- **Oprava:** do `inflation.js` přesunout `parseInput` (viz INF-03) a vyčlenit čistou funkci pro „změnu cen v chronologickém směru + průměr ročně“, např. `priceChange(indexFrom, indexTo, months)` → `{ change, annual, forward }` (forward = from < to), kterou `app.js:94–96` zavolá; kontroly vstupu (`!(amount >= 0)`, `rate <= -1`, `w0 > 0`) ponechat v `app.js`, ale nad hodnotami z nového `parseInput`. Chování obrazovky se nesmí změnit (výchozí stav 19 850 Kč, tlačítko ⇄ 5 038 Kč).
- **Regresní test:** v `test/inflation.test.mjs`: (1) `priceChange(80.2, 159.2, 260)` → `change` ≈ 0,98504, `annual` ≈ 0,03215, `forward` true; (2) `priceChange(159.2, 80.2, 260)` → `change` ≈ 0,98504 (stejný kladný růst), `annual` ≈ 0,03215, `forward` false; (3) `priceChange(100, 100, 0)` → 0, 0. Dnes selže (import `priceChange`/`parseInput` z `inflation.js` neexistuje). Přesnost 1e-4. Ručně v prohlížeči: tlačítko ⇄ → „5 038 Kč“ a věta „Ceny od ledna 2005 do září 2026 vzrostly o 98,5 %“.

## Nízké nálezy (nepovinné, oprav jen pokud to nezasáhne nic jiného)
- INF-02 · Posuvná tabulka hodnot není dosažitelná klávesnicí (axe scrollable-region-focusable; skeptik vyvrátil dopad – Chromium ≥ 130 oblast zaostří samo) · `.table-scroll` doplnit `tabindex="0"`, `role="region"`, `aria-label="Tabulka hodnot"` a viditelný `:focus-visible`.
- INF-05 · Prázdná částka vrací „0,00 Kč … má stejnou kupní sílu jako 0,00 Kč“ místo výzvy · prázdný řetězec po odstranění mezer považovat za chybějící vstup (`NaN` z nového `parseInput`) a zobrazit „Zadejte částku…“.
- INF-06 · Chart.js z cdnjs bez `integrity`/`crossorigin` a bez CSP · doplnit `integrity="sha384-…"` pro verzi 4.4.1, `crossorigin="anonymous"` a `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:; style-src 'self'">`.
- INF-07 · Chybí výslovné „nejde o finanční poradenství“ · do patičky doplnit větu „Nejde o finanční ani investiční poradenství.“
- INF-08 · Výběr měsíce nabízí i říjen–prosinec 2026, za které data nejsou · u posledního roku nabídnout jen měsíce s daty (poznámku o posledním dostupném měsíci ponechat).
- INF-09 · Lámání slov uprostřed v tabulce na 360 px („červen-ec“, „Mezir-očně“) · v tabulce `white-space: nowrap` pro první sloupec a hlavičku, nebo `&shy;` v „Mezi&shy;ročně“.

## Postup
1. Nejdřív si přečti zadání aplikace a zprávu z revize (odkazy výše). Nálezy nepřeformulovávej.
2. Ke každému nálezu v pořadí výše: (a) napiš regresní test, který teď **selže** a dokládá nález; (b) proveď opravu; (c) spusť všechny testy (`node --test`). Teprve pak další nález.
3. Když měníš pravidlo nebo hodnotu v `rules.json` (zde konstanty v kódu nebo README), aktualizuj u ní zdroj (předpis, paragraf, URL) a datum ověření na den opravy.
4. Mimo uvedené nálezy nic neopravuj, nerefaktoruj a nepřepisuj (ani texty, ani styl, ani strukturu). Když při práci najdeš jinou chybu, zapiš ji do PR do sekce „Mimo rozsah“ a nech ji být.
5. Když se nález nepodaří zopakovat (test neselže, chování je jiné, než zpráva popisuje), **neopravuj naslepo**: zapiš do PR, co jsi zkusil a co jsi viděl, nález přeskoč a pokračuj dalším.
6. Na konci spusť všechny testy, otevři stránku v prohlížeči na šířce 360 px a ověř aspoň jeden opravený případ ručně.
7. Otevři PR do `main` s názvem „Opravy z nezávislé revize 5. 11. 2026“. Popis PR obsahuje tabulku **nález → test → stav** (opraveno / nezopakováno / přeskočeno s důvodem), seznam změněných souborů a sekci „Mimo rozsah“.

## Definice hotovo
- Každý kritický, vysoký a střední nález má řádek v tabulce PR se stavem a názvem testu.
- Všechny testy procházejí (`node --test`), žádný dřívější test nebyl smazán ani oslaben (změna očekávané hodnoty jen tam, kde to nález výslovně požaduje, s odkazem na zdroj).
- `rules.json` (zde konstanty v kódu a README) má u změněných hodnot aktuální zdroj a datum.
- Stránka funguje na 360 px bez vodorovného posuvníku a v konzoli nejsou chyby.
- Nic mimo nálezy nebylo změněno.

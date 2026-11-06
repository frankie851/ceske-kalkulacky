# Opravný prompt: Přijímačky bez paniky (`frankie851/prijimacky-bez-paniky`)
Z nezávislé revize 5. 11. 2026 · revidovaný commit `e9dd0d338515283b277a2b54fa684a351375e4bf` · zpráva: `docs/revize/2026-11-05/prijimacky-bez-paniky.md` v repozitáři `frankie851/ceske-kalkulacky` (větev `revize/2026-11-05`)

## Jak spustit (pro Davida)
1. Otevři nové sezení Claude Code v repozitáři **frankie851/prijimacky-bez-paniky**, větev `main`.
2. Model **Opus 5.5** (`/model opus`), effort **High** (`/effort high`).
3. Zkopíruj všechno od nadpisu „Prompt“ níže až do konce souboru a vlož to jako první zprávu.
4. Výsledkem bude PR do `main` s tabulkou nález → test → stav. Před sloučením si projdi tabulku a namátkou zkontroluj 1–2 opravy.

---

# Prompt

## Kontext
Přijímačky bez paniky je statický web (čisté HTML + CSS + JS, ES moduly, bez knihoven) pro deváťáky a rodiče: vysvětluje rozřazení na střední školy v DiPSy (odložené přijetí), má simulátor na modelové třídě, pomůcku „Moje strategie“, kalendář termínů přijímacího řízení 2026/2027 s exportem .ics a kontrolní seznam. Zadání je v sekci „Zadání pro Claude Code: Přijímačky bez paniky“ souboru https://github.com/frankie851/ceske-kalkulacky/blob/main/docs/zadani.md. Tento úkol opravuje nálezy z nezávislé revize z 5. 11. 2026 (zpráva: https://github.com/frankie851/ceske-kalkulacky/blob/revize/2026-11-05/docs/revize/2026-11-05/prijimacky-bez-paniky.md), revidován byl commit `e9dd0d338515283b277a2b54fa684a351375e4bf` na `main`. Výpočty jsou v `matching.js` (algoritmus, čisté funkce), `strategy.js` a `ics.js`, propojení obrazovky v `app.js`, termíny a pravidla v `rules.json`, testy `node --test` ve složce `tests/` (25 testů). Revize potvrdila, že všech 22 termínů a 12 pravidel i algoritmus jsou správné (200 náhodných instancí, hrubá síla); nálezy jsou střední – escapování .ics, kontrola číselných vstupů, desetinná čárka, text u „Moje strategie“ a chybějící testy.

## Nálezy k opravě (seřazené podle závažnosti)
### PRI-01 · Střední · Generátor .ics neescapuje středník, test chybu zakonzervoval
- **Kde:** `ics.js:4` (`.replace(/;/g, '\;')` – v JS řetězci je `'\;'` jen `;`), `tests/ics.test.js:27–29` (test `ics: escapování textu` očekává `'a\\, b\; c\\\\d\\ne'`, kde `\;` je opět jen `;`)
- **Reprodukce:** `escapeText('a; b')` → očekáváno `a\; b` → skutečnost `a; b`; `buildICS([{ title: 'Zkouška; termín, místo', … }])` dává řádek `SUMMARY:Zkouška; termín\, místo` – nevalidní hodnota TEXT. Čárku i zpětné lomítko aplikace escapuje správně. V dnešních datech `rules.json` středník není, stažený `export.ics` je proto zatím bez chyby.
- **Správná hodnota / pravidlo a zdroj:** RFC 5545 § 3.3.11 (TEXT): v hodnotě musí být SEMICOLON, COMMA a BACKSLASH escapované zpětným lomítkem (`\;`, `\,`, `\\`), nový řádek jako `\n` – https://www.rfc-editor.org/rfc/rfc5545#section-3.3.11. Zadání, Kritéria hotovo: „.ics se otevře v Google Kalendáři i na iPhonu“.
- **Oprava:** v `ics.js:4` změnit na `.replace(/;/g, '\\;')`; v `tests/ics.test.js:28` opravit očekávání na `'a\\, b\\; c\\\\d\\ne'` (změna očekávané hodnoty je tímto nálezem výslovně požadována, zdroj RFC 5545 § 3.3.11).
- **Regresní test:** `assert.equal(escapeText('a; b'), 'a\\; b')` – dnes selže (vrací `a; b`); dále test `buildICS` s událostí `title: 'Zkouška; termín, místo'` → výstup obsahuje řádek `SUMMARY:Zkouška\; termín\, místo` (po rozbalení skládaných řádků) – dnes selže. Opravený test `ics: escapování textu` před opravou `ics.js` také selže.

### PRI-02 · Střední · Číselná pole nehlídají rozsah ani platnost a nic nehlásí
- **Kde:** `app.js:21` (`num = v => … Number(v)` – bez rozsahu), `app.js:107–108` (kapacita), `app.js:138–139, 150–151` (body a kritérium v simulátoru), `app.js:375–377` + `index.html:172, 185–193` (strategie: `#exp`, `min0`–`min2`); atributy `min`/`max` jsou jen v HTML, `validity` se nikde nečte
- **Reprodukce:** „Moje strategie“, „Kolik bodů zhruba čekám (ze 100)“ = `150`, škola s minimem 60 → očekáváno hláška „zadejte 0–100“ → skutečnost „o 90 b. nad loňským minimem – Spíš jistota“; `1 500` → „o 1440 b. nad…“; `-5` → „Riziko“. Simulátor: body `-10`, `150`, `85.5` → bez hlášky, uchazeč má „−10 b.“ / „150 b.“ / „85.5 b.“ (`validity.rangeOverflow/rangeUnderflow/stepMismatch = true`, nic se nezobrazí). Obě lokalizace.
- **Správná hodnota / pravidlo a zdroj:** jednotná zkouška: test ČJL i M nejvýše 50 bodů, tedy 0–100 bodů celkem, celé body (vyhláška č. 422/2023 Sb. § 13; CERMAT – rejstřík PS-04, https://prijimacky.cermat.gov.cz/menu/jednotna-prijimaci-zkouska.html); zadání, Obrazovka 2: tabulka uchazečů (jméno, body, priority). Očekáváno: body 0–100 (JPZ celé), pokusy 0–50, kapacita 0–50 celá; hodnota mimo rozsah → hláška u pole a do výpočtu se nepustí.
- **Oprava:** vyčlenit čistou funkci, např. `parseScore(value, { min, max, integer, allowDecimal })` (v `strategy.js` nebo novém modulu bez DOM), která vrátí `{ value }` nebo `{ error }`; v `app.js` ji použít místo `num` u bodů (0–100, celé), pokusů (0–50, celé), kapacity (0–50, celé) a u strategie (`#exp`, `min0`–`min2`: 0–100); při chybě zobrazit hlášku u pole (prvek s `aria-describedby`, `aria-invalid="true"`) a hodnotu nepředat do `deferredAcceptance`/`evaluateStrategy` (uchazeč s neplatnými body se do rozřazení nepustí, tlačítka Krok/Přehrát jako u `TieError`). Řeš společně s PRI-03 (stejná místa).
- **Regresní test:** `tests/input.test.js` (nebo ve `strategy.test.js`): `parseScore('150', { min: 0, max: 100 })` → `error`; `'-5'` → `error`; `'1 500'` → `error` (mimo rozsah); `'85.5'` s `integer: true` → `error`; `''` → `{ value: null }` (prázdné = nezadáno); `'62'` → `{ value: 62 }`; `'0'` → `{ value: 0 }`. Dnes selže (funkce neexistuje; `num('150')` vrací 150). Ručně na 360 px: `150` do „Kolik bodů zhruba čekám“ → hláška, žádný štítek „Spíš jistota“.

### PRI-03 · Střední · Desetinná čárka se v prohlížeči s jinou než českou lokalizací zahodí (62,5 → 625)
- **Kde:** `index.html:172` (`#exp`, `type="number"`), `index.html:185, 189, 193` (`min0`–`min2`), body a pokusy v simulátoru (`app.js:138, 150`, `type="number"`); `app.js:375`
- **Reprodukce:** Chromium `--lang=en-US`: napsat `62,5` do „Kolik bodů zhruba čekám“ (škola A, minimum 60) → očekáváno 62,5 b. a „Těsné“ (nebo hláška) → skutečnost hodnota `625`, `rangeOverflow`, zobrazeno „o 565 b. nad loňským minimem – Spíš jistota“. V `--lang=cs-CZ` prohlížeč čárku přijme (`62.5`, „o 2.5 b. nad – Těsné“). V simulátoru `85,5` → cs-CZ 85.5 b., en-US 855 b. Projevuje se jen v neczeské lokalizaci prohlížeče (testováno jen Chromium) – i tak oprav.
- **Správná hodnota / pravidlo a zdroj:** žádné úřední pravidlo; očekávané chování nezávislé na jazyku prohlížeče: ve strategii `62,5` → 62,5 (loňská minima škol mohou být s desetinou), v simulátoru body JPZ jsou celé (0–100, rejstřík PS-04), takže `85,5` odmítnout s vysvětlením „body zadejte celé“; `1 500` (mezera) → mimo rozsah (viz PRI-02).
- **Oprava:** pole `#exp`, `min0`–`min2` a body/pokusy/kapacita v simulátoru převést na `type="text" inputmode="decimal"` (resp. `inputmode="numeric"` u celých) s vlastním parsováním přes `parseScore` z PRI-02 (čárka i tečka jako desetinný oddělovač, mezery a NBSP odstranit); nebo ponechat `type="number"` s `step="0.5"` u strategie a číst `validity.badInput`/`rangeOverflow` s hláškou. Preferuj první variantu (odstraní závislost na lokalizaci). Diff v textu strategie formátovat česky („o 2,5 b. nad“).
- **Regresní test:** `parseScore('62,5', { min: 0, max: 100 })` → `{ value: 62.5 }`; `parseScore('62.5', …)` → 62.5; `parseScore('85,5', { integer: true })` → `error`; `parseScore('1 500', …)` → `error` (mimo rozsah). Dnes selže (funkce neexistuje; `Number('62,5')` je NaN). Ručně v Chromiu `--lang=en-US` na 360 px: `62,5` → „o 2,5 b. nad loňským minimem – Těsné“.

### PRI-04 · Střední · „Moje strategie“ porovnává body „ze 100“ s loňským minimem školy bez upozornění na stejnou škálu
- **Kde:** `index.html:171` („Kolik bodů zhruba čekám (ze 100)“), `index.html:167, 185` („loňské minimum bodů … na webu školy“, popisek „Loňské minimum“), `strategy.js:14–19` (`diff = expected - s.lastMin`)
- **Reprodukce:** školy zveřejňují „minimum posledního přijatého“ různě – jen body JPZ (0–100), celkové body s vahou JPZ 60 % a vysvědčením (často také 0–100 nebo 0–150) nebo procenta; aplikace vyzve k bodům JPZ „ze 100“ a odečte od nich číslo ze školního webu bez dotazu, v jaké škále je. Příklad: škola uvádí celkové minimum 55 b. (JPZ přepočtená na 60 % + vysvědčení), uchazeč čeká 62 b. z JPZ → „o 7 b. nad – Spíš jistota“, přitom jeho celkový součet může být pod 55. Modul i obrazovka shodně; jde o chybějící vstupní podmínku, ne o výpočet.
- **Správná hodnota / pravidlo a zdroj:** školský zákon § 60i odst. 3: hodnocení JPZ tvoří nejméně 60 % celkového hodnocení (sportovní gymnázium 40 %), zbytek jsou kritéria školy – rejstřík PS-05, https://www.zakonyprolidi.cz/cs/2004-561; ředitel může stanovit hranici úspěšnosti (PS-06). Loňské minimum školy je tedy obecně v jiné škále než body JPZ a porovnání dává smysl jen ve stejné škále.
- **Oprava:** u popisku pole „Loňské minimum“ (a v úvodním odstavci sekce) doplnit text: „Zadejte ve stejné škále jako vaše očekávané body – nejlépe jen body z JPZ (0–100). Pokud škola uvádí celkové body nebo procenta, přepočítejte je, nebo pole nechte prázdné.“; případně přidat volbu škály (JPZ 0–100 / celkové body) s přepočtem – jen pokud to nezkomplikuje formulář. Do varování `no-safe` nezasahovat.
- **Regresní test:** statický test (`tests/texts.test.js`), že `index.html` v sekci `#strategie` obsahuje řetězec „stejné škále“ a „body z JPZ“ (nebo zvolenou formulaci s těmito slovy) – dnes selže. Pokud přidáš volbu škály, test `evaluateStrategy` s přepočtem (např. celkové minimum 55 při škále 0–150 → přepočet na 0–100). Ručně na 360 px: text je vidět u pole, formulář se nerozbil.

### PRI-05 · Střední · Chybějí testy u důležitých větví a test .ics fixuje špatnou hodnotu
- **Kde:** `tests/matching.test.js`, `tests/strategy.test.js`, `tests/ics.test.js:27`
- **Reprodukce:** 25 testů prochází a pokrývá všechny 4 příklady ze zadání, permutace a stabilitu. Netestuje se: kapacita 0 (`deferredAcceptance` i `explain` „škola nemá žádné volné místo“), `minScore` (větev `reason: 'kriteria'`, `explain`), uchazeč bez priorit / škola bez uchazečů / prázdné vstupy, `rankApplicants` se shodou bez `tiebreak` (jen přes DA), `evaluateStrategy` s očekávanými body a žádnou školou (souvisí s nízkým PRI-07), převod formulář → modul (`num`, prázdné body = 0, `simInput`), `buildICS` s textem obsahujícím `;` (PRI-01 – test naopak chybu potvrzuje).
- **Správná hodnota / pravidlo a zdroj:** zadání, Kritéria hotovo (testy `node --test`, 4 příklady, stejný výsledek bez ohledu na pořadí); očekávané výsledky z nezávislého přepočtu revize (`prepocet.txt`, případy V1–V19): kapacita 0 – X 90 (A, B), A 0 míst, B 1 → X→B; `minScore` – A minimum 60, P 59 b. (A, B), Q 60 b. (A) → P→B, Q→A; uchazeč bez priorit → nepřijat (null); škola bez uchazečů → prázdné přiřazení; shoda bodů bez kritéria → `TieError`; řetězové vytlačení přes 3 školy (P→A, Q→B, R→C, S nepřijat).
- **Oprava:** doplnit testy pro případy výše do `tests/matching.test.js` (včetně `explain` pro kapacitu 0 a `minScore`), `tests/strategy.test.js` (`evaluateStrategy({ expected: 60, schools: [] })` a tři prázdné školy – zapiš dnešní chování `no-safe`; pokud opravíš nízký PRI-07, uprav očekávání tam), test převodu formulář → modul nad `parseScore` (PRI-02) a opravit očekávání v `tests/ics.test.js:28` na `'a\\, b\\; c\\\\d\\ne'` (= PRI-01).
- **Regresní test:** testy `escapeText`/`buildICS` se středníkem dnes selžou (PRI-01); ostatní doplněné testy pravděpodobně projdou hned – to je v pořádku, jsou samy opravou tohoto nálezu; do tabulky PR zapiš, které testy před opravou selhaly a které ne.

## Nízké nálezy (nepovinné, oprav jen pokud to nezasáhne nic jiného)
- PRI-06 · Krok 2 uvádí termíny JPZ jen pro čtyřleté obory bez upřesnění · v `index.html:61` napsat „(čtyřleté obory 12. a 13. dubna, víceletá gymnázia 14. a 15. dubna 2027)“ (sdělení MŠMT MSMT-525/2026-13, rejstřík PS-19, PS-20).
- PRI-07 · Varování „Žádná škola nemá rezervu“ a řádky „Škola 1–3“ se zobrazí dřív, než je zadaná jediná škola · `no-safe` v `strategy.js:26–29` vyvolat jen když aspoň jedna škola má zadané minimum (`rows.some(r => r.category !== 'nevim')`).
- PRI-08 · Seznam „Výsledek a proč“ řadí uchazeče se shodnými body podle kritéria opačně než škola · v `app.js:314` řadit pomocí `compareApplicants` z `matching.js`.
- PRI-09 · Stav „confirmed“ u negativního tvrzení o reformě; data zdrojů v patičce v ISO tvaru · u `rules.json` `reforma` doplnit poznámku „úřední harmonogram 2027 změnu neobsahuje; jde o záměr bez legislativního návrhu (stav k 5. 11. 2026)“ (rejstřík PS-13, R-09) a data zdrojů v `app.js:460` formátovat česky („18. 8. 2026“).

## Postup
1. Nejdřív si přečti zadání aplikace a zprávu z revize (odkazy výše). Nálezy nepřeformulovávej.
2. Ke každému nálezu v pořadí výše: (a) napiš regresní test, který teď **selže** a dokládá nález; (b) proveď opravu; (c) spusť všechny testy (`node --test`). Teprve pak další nález.
3. Když měníš pravidlo nebo hodnotu v `rules.json`, aktualizuj u ní zdroj (předpis, paragraf, URL) a datum ověření na den opravy.
4. Mimo uvedené nálezy nic neopravuj, nerefaktoruj a nepřepisuj (ani texty, ani styl, ani strukturu). Když při práci najdeš jinou chybu, zapiš ji do PR do sekce „Mimo rozsah“ a nech ji být.
5. Když se nález nepodaří zopakovat (test neselže, chování je jiné, než zpráva popisuje), **neopravuj naslepo**: zapiš do PR, co jsi zkusil a co jsi viděl, nález přeskoč a pokračuj dalším.
6. Na konci spusť všechny testy, otevři stránku v prohlížeči na šířce 360 px a ověř aspoň jeden opravený případ ručně.
7. Otevři PR do `main` s názvem „Opravy z nezávislé revize 5. 11. 2026“. Popis PR obsahuje tabulku **nález → test → stav** (opraveno / nezopakováno / přeskočeno s důvodem), seznam změněných souborů a sekci „Mimo rozsah“.

## Definice hotovo
- Každý kritický, vysoký a střední nález má řádek v tabulce PR se stavem a názvem testu.
- Všechny testy procházejí (`node --test`), žádný dřívější test nebyl smazán ani oslaben (změna očekávané hodnoty jen tam, kde to nález výslovně požaduje, s odkazem na zdroj).
- `rules.json` má u změněných hodnot aktuální zdroj a datum.
- Stránka funguje na 360 px bez vodorovného posuvníku a v konzoli nejsou chyby.
- Nic mimo nálezy nebylo změněno.

# Zadání 2. fáze: sestavení webu Spočítáno ve variantě B

Vybraná varianta je **B „Přátelský průvodce“** (`designs/b-pratelsky-pruvodce/`). Druhá fáze
z ní udělá skutečný web. Hotové kalkulačky z dosavadních repozitářů se do něj převedou,
chybějící se doplní a web se nasadí.

## Výchozí stav (ověřeno 5. 11. 2026)

12 ze 13 aplikací už existuje jako samostatný veřejný repozitář. Každý má čistý výpočetní
modul, `rules.json` a testy přes `node --test`. Všechny testy procházejí:

| Aplikace | Repozitář | Výpočetní moduly | Testy | Graf |
| --- | --- | --- | --- | --- |
| Plán48 | `frankie851/plan48` | `calc.js` | 34 | Chart.js z CDN |
| Penzijko kompas | `frankie851/penzijko-kompas` | `calc.js` | 25 | Chart.js z CDN |
| Mám EET? + OSVČ 2027 | `frankie851/mam-eet` | `rules.js`, `osvc.js` | 72 (+ e2e scénáře) | – |
| Slevy 2027 | `frankie851/slevy-2027` | `slevy.js` | 30 | – |
| Cestovní příkaz 2027 | `frankie851/cestovni-prikaz` | `cesty.js` | 26 | – |
| Inflační kalkulačka | `frankie851/inflacni-kalkulacka` | `inflation.js`, `data/cpi.json`, skript aktualizace z ČSÚ | 27 | Chart.js z CDN |
| Bydlometr | `frankie851/bydlometr` | `js/mortgage.js`, `js/rentbuy.js` | 63 | Chart.js z CDN |
| Spot, nebo fix? | `frankie851/spot-nebo-fix` | `calc.js`, `data/*` (OTE, TDD), skript aktualizace | 17 | Chart.js z CDN |
| Přijímačky bez paniky | `frankie851/prijimacky-bez-paniky` | `matching.js`, `strategy.js`, `scenarios.js`, `ics.js` | 25 | – |
| Výpověď 2026 | `frankie851/vypoved-2026` | `vypoved.js` | 24 | – |
| Rodičovská pro celou rodinu | `frankie851/rodicovska` | `rodina.js`, `timeline.js` | 29 | – |
| Exekuce, nebo oddlužení? | `frankie851/kalkulator-dluhu` | `dluhy.js` | 35 | – |
| **Zdaním to?** (prodej akcií a krypta + dividendy) | neexistuje | – | – | – |
| **Volno 2027** | neexistuje | – | – | – |

Rozdíly, které je třeba sjednotit:
- `rules.json` mají každý jinou strukturu a datum ověření je pod různými klíči
  (`meta`, `overeno`, `verze`).
- 5 aplikací načítá Chart.js z cdnjs. To web nesmí, a navíc to v cloudových relacích nefunguje.
- Aplikace načítají `rules.json` přes `fetch`, takže nefungují otevřené z disku.
- Neověřená pravidla jsou vypsaná v README u `mam-eet` a `cestovni-prikaz` a nesmí se
  při přenosu ztratit.

## Rozhodnutí pro 2. fázi

1. **Jeden repozitář `ceske-kalkulacky`**, statický web bez serveru, nasazení na GitHub Pages
   přes GitHub Actions. Generátor statického webu je **Eleventy 3**: layouty, šablony a data
   z JSON; do prohlížeče sám nepřidává žádný JavaScript.
2. **Výpočty se přebírají, nepřepisují.** Moduly a testy z repozitářů se zkopírují do
   `src/nastroje/<id>/` a `test/<id>/`. Kód se mění jen tam, kde je to nutné (moduly dostanou
   pravidla jako parametr, žádný `fetch`). Všechny původní testy musí dál procházet.
3. **Jednotný obal `rules.json`**: `{ "meta": { "overeno": "RRRR-MM-DD", "zdroje": [...],
   "neovereno": [...] }, ... }`. Vnitřní struktura pravidel zůstává, aby se nerozbily výpočty.
   Datum ve štítku „Pravidla ověřena k …“ se bere z `meta.overeno` při sestavení webu.
   Pravidla se vloží do stránky při sestavení (`<script type="application/json">`).
4. **Grafy bez knihoven:** vlastní malý modul pro SVG grafy (sloupcový, skládaný, čárový)
   ve stylu B a vždy s tabulkou jako textovou alternativou. Chart.js se odstraní.
5. **Písma Nunito a Fredoka se hostují na vlastním webu** (npm `@fontsource`, podmnožiny
   latin a latin-ext), ne z Google Fonts. Slib „nic neodesíláme“ pak platí i pro IP adresu
   návštěvníka.
6. **JavaScript jako vylepšení:** každá stránka bez JS ukáže formulář, vysvětlení a ukázkový
   výsledek (tak jako prototyp). S JS počítá živě. Volba světlý/tmavý režim se pamatuje
   v `localStorage`, bez JS dál funguje přepínač v CSS.
7. **Tón:** tykání na celém webu a **rodově neutrální formulace** (ne „zadal jsi“, ale
   „zadáno“ nebo „tvoje odpověď“). **Výjimkou je sekce Dluhy, která vyká**, jako bezplatné
   dluhové poradny. Je to citlivé téma a vykání vyjadřuje respekt. Sekce je vizuálně
   oddělená, takže změna tónu nepůsobí jako chyba. Nadpis „Nejste v tom sami“ zůstává.
8. **Opravy slabin varianty B z rozcestníku:**
   - Na mobilu je výsledek hned vidět: lepivá lišta s hlavním číslem a odkazem na výsledek.
   - Ilustrace jsou v jednom SVG spritu (`<use href=…>`), ne zkopírované v každé stránce.
   - Kalkulačky mají kroky jen tam, kde pomáhají. Formulář s 5 a méně poli je na jedné
     obrazovce.
9. **Bez reklam a affiliate odkazů** v celé 2. fázi. Žádné měření návštěvnosti.
10. **Název webu „Spočítáno“ zůstává pracovní** a je jen v `src/_data/site.json`. Doména zatím
    není. Web musí fungovat i pod podsložkou GitHub Pages (`pathPrefix`).

## Jak to spustit

Každá vlna je jedna relace Claude Code v cloudu a jeden pull request. Spouštěj je po sobě,
další až po sloučení předchozí.

1. Nejdřív slouč PR s návrhy designu (1. fáze), protože vlny 1–3 stavějí na
   `designs/b-pratelsky-pruvodce/` a `docs/`.
2. Na [claude.ai/code](https://claude.ai/code) vyber repozitář `ceske-kalkulacky`, přístup
   k síti **Trusted** a zapni plan mode.
3. Vlož prompt dané vlny. Po schválení plánu Claude pracuje sám a na konci otevře PR.
4. Zdrojové repozitáře aplikací jsou veřejné, Claude je naklonuje jen pro čtení.

Pořadí vln určují termíny: MOJE EET je od 1. 12. 2026, vklady do penzijka a DIP se dělají
do 31. 12., EET 2.0 startuje 1. 1. 2027 a přihláška k paušální dani je do 11. 1. 2027.
Proto se vlna 1 vyplatí nasadit ještě v listopadu.

---

## Vlna 1: základ webu, Plán48, Penzijko kompas, Mám EET? + OSVČ 2027

```markdown
# Úkol: Spočítáno – 2. fáze, vlna 1: základ webu a první čtyři nástroje

## Kontext
Stavím web Spočítáno, který spojí české kalkulačky a průvodce. V 1. fázi vznikly čtyři
návrhy designu a vybral jsem variantu B „Přátelský průvodce“. Přečti si:
- `docs/zadani-faze-2.md` – výchozí stav, závazná rozhodnutí 1–10 (technologie, tón,
  rules.json, grafy, písma), tabulka zdrojových repozitářů,
- `docs/informacni-architektura.md` – kategorie, URL, navigace, vazby, vyhledávání, pravidla
  pro Dluhy,
- `designs/b-pratelsky-pruvodce/` – vzor vzhledu (`tokens.css`, `styles.css`, 4 stránky),
- `docs/zadani.md` – podrobná zadání aplikací (pravidla, testovací příklady, obrazovky),
- `docs/rozhodnuti.md` a `tools/kontroly/` – kontroly z 1. fáze.

## Cíl vlny 1
1. Základ webu v Eleventy 3: layout, hlavička, navigace, patička, přepínač režimu, štítky,
   karty, formulářové prvky, karta výsledku, SVG grafy, tabulky, kontrolní seznam, krokovač,
   blok bezplatné pomoci, tiskový styl. Vše z tokenů a stylů varianty B, rozdělené na
   komponenty (Nunjucks makra) a jeden CSS soubor s vrstvami.
2. Stránky:
   - úvod,
   - 5 kategorií,
   - „Co se mění v roce 2027“,
   - `/zdroje/` (všechny zdroje ze všech `rules.json`),
   - O webu, Jak počítáme, Soukromí,
   - `/hledat/`,
   - 404,
   - sekce `/dluhy/` jen s rozcestníkem a blokem bezplatné pomoci (kalkulačka přijde ve vlně 2).

   Nástroje z dalších vln mají kartu se štítkem „Připravujeme“ a nikam nevedou.
3. Přenesené nástroje:
   - Plán48 (`frankie851/plan48`),
   - Penzijko kompas (`frankie851/penzijko-kompas`), jako sourozenecký nástroj se vzájemnými
     odkazy podle IA,
   - Mám EET? jako průvodce po krocích s výsledkem a záložka OSVČ 2027
     (`frankie851/mam-eet`).

   Moduly a testy převezmi, UI postav znovu z komponent varianty B. Graf Chart.js nahraď
   vlastním SVG grafem.
4. Vyhledávání: index se sestaví při buildu (název, perex, štítky, synonyma z IA kap. 8),
   hledání v prohlížeči bez diakritiky, bez JS stránka `/hledat/` se všemi nástroji.
5. GitHub Actions: testy, build, kontroly a nasazení na GitHub Pages z `main`.

## Pravidla
- Všechna pravidla z `docs/zadani.md` platí dál. Zejména: v kódu žádné natvrdo zapsané
  částky, u návrhu 2027 štítek „Návrh, zatím neschváleno“, u EET nikdy výjimka pro hotovost
  do 300 000 Kč.
- Přenášené `rules.json` obal jednotným `meta` (viz rozhodnutí 3) a přenes i seznamy
  neověřených pravidel z README zdrojových repozitářů do `meta.neovereno`.
- Každá stránka nástroje má štítek „Pravidla ověřena k [meta.overeno]“, zdroje, upozornění
  „Nejde o poradenství“ a blok „Souvisí“ podle IA.
- Žádné požadavky na cizí domény (ani Google Fonts), žádné cookies, žádné měření.
  Content-Security-Policy v `<meta>`.
- Tón: tykání, rodově neutrálně, krátké věty. Blok Dluhy na úvodní stránce vyká (rozhodnutí 7).

## Kritéria hotovo
- `npm test` spustí všechny původní testy přenesených nástrojů (Plán48 34, Penzijko kompas 25,
  Mám EET? 72) a všechny projdou. K tomu nové testy pro sdílené moduly (formátování čísel,
  SVG graf, vyhledávání).
- E2E testy v Puppeteeru vyplní ve skutečném UI kontrolní příklady ze zadání a ověří výsledek.
  Plán48: DPS 3 000 + ŽP 2 500 Kč → odpočet 45 600 Kč. Mám EET?: všech 7 scénářů.
  Penzijko kompas: věk 25, návrh 2027 → 8 160 Kč/rok.
- `tools/kontroly/` rozšiř tak, aby prošly všechny stránky v `_site/`. Na každé stránce
  0 chyb axe serious/critical ve světlém i tmavém režimu, nic nepřetéká na 360 px,
  0 cizích požadavků.
- Bez JavaScriptu je každá stránka čitelná a má ukázkový výsledek.
- Lighthouse (mobil): výkon ≥ 90, přístupnost 100.
- Web běží na GitHub Pages pod podsložkou repozitáře. V PR jsou snímky desktop 1440 px
  a mobil 390 px všech nových stránek.
- README česky: spuštění, jak přidat nástroj, jak upravit `rules.json` po změně zákona,
  nasazení.

## Postup
1. Plan mode: navrhni strukturu repozitáře, mapování souborů ze zdrojových repozitářů,
   změny v jejich modulech, podobu `meta` v `rules.json` a seznam komponent. Vypiš, co se
   ze zdrojových repozitářů nepřenese a proč. Počkej na schválení.
2. Pak základ webu a komponenty, potom nástroje jeden po druhém (testy → modul → UI → e2e),
   nakonec vyhledávání, CI a nasazení.
3. Rozhodnutí zapisuj do `docs/rozhodnuti.md` (oddíl „2. fáze“).
4. Na konci commitni, nahraj větev a otevři PR „Vlna 1: základ webu, Plán48, Penzijko kompas,
   Mám EET?“ se seznamem stránek, výsledky testů a kontrol a snímky.

## Mimo rozsah
Ostatní nástroje (vlny 2 a 3), vlastní doména, affiliate a reklama, úpravy zdrojových
repozitářů.
```

---

## Vlna 2: Slevy, Cestovní příkaz, Výpověď, Přijímačky, Rodičovská, Inflace, Dluhy, Volno 2027

> **Stav (5. 11. 2026):** vlna 2 je hotová. Exekuce, nebo oddlužení? je postavená, ale nezveřejněná, dokud uživatel ručně neověří odkazy na bezplatnou pomoc (viz `docs/rozhodnuti.md`, vlna 2).

```markdown
# Úkol: Spočítáno – 2. fáze, vlna 2: přenos dalších nástrojů a Volno 2027

## Kontext
Web Spočítáno už běží (vlna 1): Eleventy, komponenty varianty B, jednotné `rules.json`,
SVG grafy, vyhledávání, kontroly a nasazení. Přečti si `docs/zadani-faze-2.md`,
`docs/informacni-architektura.md`, `docs/rozhodnuti.md` (oddíl 2. fáze) a README.
Drž se vzorů z vlny 1. Nové komponenty přidávej jen tam, kde nestačí stávající.

## Cíl vlny 2
Přenést tyto nástroje, převzít jejich moduly a testy a UI postavit z komponent:
- Slevy 2027 (`frankie851/slevy-2027`, 30 testů)
- Cestovní příkaz 2027 (`frankie851/cestovni-prikaz`, 26 testů). Výstup k tisku nahradí
  tiskový styl stránky a `ukazka-vyuctovani.pdf` se nepřenáší.
- Výpověď 2026 (`frankie851/vypoved-2026`, 24 testů)
- Přijímačky bez paniky (`frankie851/prijimacky-bez-paniky`, 25 testů, včetně exportu
  termínů do kalendáře .ics)
- Rodičovská pro celou rodinu (`frankie851/rodicovska`, 29 testů)
- Inflační kalkulačka (`frankie851/inflacni-kalkulacka`, 27 testů, data ČSÚ). Skript pro
  aktualizaci dat pusť jako měsíční GitHub Action, která otevře PR.
- Exekuce, nebo oddlužení? (`frankie851/kalkulator-dluhu`, 35 testů), viz zvláštní pravidla
  níže.

A postavit nový nástroj:
- Volno 2027 (zadání jen v tabulce „Další nápady“ v `docs/zadani.md`). Nejdřív napiš krátké
  zadání do `docs/zadani-volno-2027.md`: svátky a dny se zavřenými obchody v roce 2027,
  návrh bloků dovolené pro nejdelší volno, kontrolní příklad „5.–6. 7. 2027 = čtyři dny
  volna bez dovolené“. Pak testy, modul a UI. Seznam svátků ověř v zákoně o státních svátcích
  a zákoně o prodejní době.

## Zvláštní pravidla pro Dluhy (závazné)
- Platí oddíl Dluhy v `docs/zadani.md` a kapitola 7 informační architektury: žádné reklamy,
  affiliate, nabídky půjček ani placení zprostředkovatelé, žádné sbírání kontaktů,
  zadané hodnoty se neukládají do URL ani do `localStorage`.
- Odkaz na bezplatnou pomoc musí být vidět bez posouvání na každé obrazovce i na mobilu
  (otestuj na 360 × 640 px).
- Před vydáním ověř oficiální seznamy bezplatné pomoci (dluhové poradny, akreditované osoby
  pro sepis insolvenčního návrhu) a oficiální kalkulátor splátek justice. Vypiš je
  v tabulce odkaz → kdo ho provozuje → datum ověření. Dokud nejsou ověřené, kalkulačka se
  nezveřejní a sekce Dluhy ukazuje jen rozcestník pomoci.
- Pod každým výsledkem věta „Orientační výpočet. Závazně to posoudí poradna, exekutor nebo
  insolvenční soud.“ Texty projdou kontrolou čtivosti (`scripts/ctenost.mjs`
  ve zdrojovém repozitáři).
- Tón: celá sekce Dluhy vyká (rozhodnutí 7), klidně, bez strašení a bez vtipkování.

## Kritéria hotovo
- Všechny původní testy přenesených nástrojů projdou (196 testů) a k tomu nové testy
  pro Volno 2027.
- E2E v UI: aspoň dva kontrolní příklady z `docs/zadani.md` u každého nástroje (u Dluhů
  všech 5).
- Kontroly všech stránek v `_site/`: 0 chyb axe serious/critical, nic nepřetéká na 360 px,
  0 cizích požadavků.
- Kategorie, vyhledávání, „Co se mění v roce 2027“, „Souvisí“ a `/zdroje/` obsahují
  nové nástroje. Karty „Připravujeme“ zbydou jen u vlny 3.
- PR „Vlna 2: …“ se snímky a výsledky.

## Postup
Plan mode: mapování souborů, změny modulů, tabulka ověření pomoci pro Dluhy a zadání
Volno 2027. Počkej na schválení. Pak nástroje po jednom (testy → modul → UI → e2e).
Rozhodnutí zapisuj do `docs/rozhodnuti.md`.

## Mimo rozsah
Bydlometr, Spot, nebo fix?, Zdaním to? (vlna 3).
```

---

## Vlna 3: Bydlometr, Spot, nebo fix?, Zdaním to?

```markdown
# Úkol: Spočítáno – 2. fáze, vlna 3: Bydlometr, Spot, nebo fix? a Zdaním to?

## Kontext
Web Spočítáno běží s nástroji z vln 1 a 2. Přečti si `docs/zadani-faze-2.md`,
`docs/informacni-architektura.md`, `docs/rozhodnuti.md` a README a drž se zavedených vzorů.

## Cíl vlny 3
1. Bydlometr (`frankie851/bydlometr`, 63 testů): refixace a nájem vs. koupě jako dvě záložky.
   Graf Chart.js nahraď SVG grafem.
2. Spot, nebo fix? (`frankie851/spot-nebo-fix`, 17 testů):
   - Přenes data (`data/`, `tariffs.json`, `dynamic.json`) a skript `scripts/update-data.mjs`.
   - Aktualizaci dat spouštěj jako GitHub Action jednou týdně. Výsledek se nekontroluje
     ručně, proto Action otevře PR a testy dat musí projít.
   - Na stránce ukaž datum posledních dat.
   - Hodinové ceny vykresli vlastním SVG grafem a pozor na výkon (stovky bodů → zjednodušení).
3. Zdaním to? – nový nástroj, který spojí:
   - prodej akcií, ETF a krypta: osvobození podle limitu příjmů a doby držby,
   - dividendy ze zahraničí: podrobné zadání je v `docs/zadani.md`, oddíl „Dividendy
     ze zahraničí“.

   Pro prodej akcií a krypta zatím existuje jen řádek v tabulce „Další nápady“ v
   `docs/zadani.md`. Nejdřív proto napiš `docs/zadani-zdanim-to.md` ve stejném formátu jako
   ostatní zadání (cíl, pravidla k ověření, výpočet, obrazovky, kontrolní příklady, kritéria
   hotovo). Pravidla ověř v zákoně o daních z příjmů (§ 4 osvobození, § 16a samostatný
   základ, § 38f zápočet zahraniční daně) a u finanční správy. Vypiš tabulku pravidlo →
   zdroj → potvrzeno ano/ne. Co se nepotvrdí, do `rules.json` nedávej.

   Import CSV z brokerů a burz je až druhý krok. První verze má ruční zadání.

## Kritéria hotovo
- Všechny původní testy (Bydlometr 63, Spot, nebo fix? 17) projdou a k tomu nové testy pro
  Zdaním to? s kontrolními příklady ze zadání.
- E2E v UI: aspoň dva kontrolní příklady u každého nástroje.
- Kontroly všech stránek v `_site/`: 0 chyb axe serious/critical, nic nepřetéká na 360 px,
  0 cizích požadavků.
- Na webu už nezbyla žádná karta „Připravujeme“. Vyhledávání, vazby a `/zdroje/` jsou
  kompletní.
- PR „Vlna 3: …“ se snímky a výsledky.

## Postup
Plan mode: mapování souborů, návrh GitHub Action pro data a zadání Zdaním to? s tabulkou
ověření. Počkej na schválení. Pak nástroje po jednom. Rozhodnutí zapisuj do
`docs/rozhodnuti.md`.

## Mimo rozsah
Import CSV z brokerů, vlastní doména, přesměrování starých webů ze zdrojových repozitářů
(samostatný krok po spuštění).
```

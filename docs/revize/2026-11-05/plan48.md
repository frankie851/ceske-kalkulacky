# Revize: Plán48 (`frankie851/plan48`)
Revidovaný commit: `48733fea370ca096397c964ed430fa48cd8ee11c` (4. 11. 2026) · živý web: https://frankie851.github.io/plan48/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Aplikace počítá státní příspěvek, limit 48 000 Kč i daňovou úsporu správně a všechny příklady ze zadání procházejí v modulu i na obrazovce, ale odpočet z penzijka krátí paušálně o 20 400 Kč ročně místo po měsících podle § 15 odst. 7 ZDP, takže rada „mimořádně na penzijko“ u lidí s vkladem pod 1 700 Kč měsíčně (většina účastníků) doporučuje o 7 000 až 18 700 Kč víc, než je k vyčerpání limitu potřeba, a README i test tuto chybu zakonzervovaly tvrzením opaku. Nejvážnější je tedy P48-01 (Vysoká); kritický nález není. Dobře je oddělený výpočetní modul bez DOM, všechny částky v `rules.json` s datem a štítkem návrhu, CSP + SRI, žádná analytika ani ukládání, 0 porušení axe, žádné přetékání na 360 px a živý web shodný s `main`.
Nálezy: Kritická 0 · Vysoká 1 · Střední 5 · Nízká 3

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🔴 | P48-01 (metoda krácení DPS, DP-12); dále P48-05 |
| 2 Výpočty | 🔴 | P48-01 |
| 3 Shoda se zadáním | 🟡 | P48-04 (podmínka 10 let / 60 let z „Hlídat v pravidlech“ chybí) |
| 4 Testy | 🟡 | P48-02 |
| 5 Mobil a přístupnost | 🟡 | P48-03 |
| 6 Texty a citlivá témata | 🟡 | P48-04 |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | — |

## Pravidla
| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Minimální měsíční vklad pro státní příspěvek | `rules.json:25` `minVklad: 500` | 500 Kč | § 14 odst. 1 ZDPS, https://www.zakonyprolidi.cz/cs/2011-427 (DP-01); 2. zdroj MF Základní informace | 5. 11. 2026 | shodné |
| Sazba příspěvku 20 % z 500–1 699 Kč, strop 340 Kč od 1 700 Kč | `rules.json:25` `sazba: 0.2`, `maxZaklad: 1700`; `calc.js:99` | 20 % z měsíčního příspěvku; 340 Kč od 1 700 Kč | § 14 odst. 2 písm. a), b) ZDPS (DP-02, DP-03); MF | 5. 11. 2026 | shodné; `Math.round` příspěvku státu (`calc.js:99`) zákon neřeší (zaokrouhluje jen vklad účastníka dolů, § 14 odst. 4), rozdíl max. 0,50 Kč/měs |
| Poživatel starobního důchodu bez příspěvku | `rules.json:27` `starobniDuchodBezNaroku: true`; `calc.js:84–86` | bez nároku | § 13 odst. 1 písm. a) ZDPS (DP-04); MF | 5. 11. 2026 | shodné |
| Limit odpočtu produktů na stáří | `rules.json:30` `limitRocni: 48000` | 48 000 Kč v úhrnu | § 15 odst. 6 ZDP, https://www.zakonyprolidi.cz/cs/1992-586/zneni-20270101 (DP-11) | 5. 11. 2026 | hodnota shodná; citace „§ 15a“ (`rules.json:16,19`, `calc.js:103`, `README.md:55`, patička) špatně – P48-05 |
| Krácení odpočtu DPS o částku s max. příspěvkem | `rules.json:31` `dpsRocniHranice: 20400`; `calc.js:109–110` (roční úhrn − 20 400) | „pouze část **měsíčního** příspěvku, která převyšuje částku, od které náleží nejvyšší státní příspěvek“ (1 700 Kč v každém měsíci) | § 15 odst. 7 ZDP (DP-12) | 5. 11. 2026 | **NEshoda metody** – shodné jen u rovnoměrných vkladů; u mimořádného vkladu a v radě „Co udělat“ rozdíl – P48-01 |
| Důchodce odečítá DPS od první koruny | `rules.json:32` `duchodceBezHranice: true`; `calc.js:109` | výklad MF („již od první vložené koruny“) | § 15 odst. 7 ZDP + MF Základní informace (DP-13) | 5. 11. 2026 | shodné s výkladem MF; stanovisko FS rejstřík nenašel |
| DIP a ŽP od první koruny | `calc.js:111–112` | bez spodní hranice | § 15 odst. 6 ZDP (DP-14) | 5. 11. 2026 | shodné |
| Příspěvek zaměstnavatele mimo odpočet i příspěvek | `calc.js:181`, `index.html:75` | nezapočítává se (osvobozen do 50 000 Kč, § 6 odst. 9 písm. m) ZDP) | DP-16 | 5. 11. 2026 | shodné |
| Sazby daně 15 % / 23 %, hranice 36násobek PM | `rules.json:34` `sazbyDane: [0.15, 0.23]`; `app.js:274` | 15 % do 36násobku PM, 23 % nad | § 16 odst. 1 ZDP (DP-17) | 5. 11. 2026 | shodné (text „část příjmů“ místo „část základu daně“ – P48-09) |
| Návrh 2027: do 30 let 40 % (max. 680 Kč), od 30 let 20 % | `rules.json:50–52` pásma 0–17, 18–29, 30+ | MF: 40 % do 30. narozenin; 680 Kč = dopočet 40 % × 1 700 | sněmovní tisk 285, https://www.psp.cz/sqw/historie.sqw?o=10&T=285 (DP-06) | 5. 11. 2026 (psp.cz: 1. čtení 24. 9., výbory 29. 10., 2. čtení neproběhlo) | shodné s návrhem; štítek „návrh, zatím neschváleno“ ano; zdroje jen média, tisk 285 neuveden – P48-07 |
| Návrh 2027: nezletilí od 100 Kč | `rules.json:50` `vekDo 17, minVklad 100` | MF: do 18. narozenin od 100 Kč | tisk 285 (DP-07) | 5. 11. 2026 | shodné |
| Podmínka daňové podpory 120 měsíců a 60 let, navrácení podpory | neuvedeno nikde (`grep` index.html, README) | § 15b odst. 1 a 4 ZDP | DP-15 | 5. 11. 2026 | chybí – P48-04 |
| Platnost sady 2026 a datum ověření | `rules.json:14–15` `datum 2026-11-04`, `platnostOd 2024-07-01`; UI „Stav ke dni 4. 11. 2026“ | pravidla od 1. 7. 2024 (příspěvek) / 1. 1. 2024 (odpočet) | DP-01, DP-11 | 5. 11. 2026 | shodné, datum v UI = rules.json |
| „Mimořádný vklad připsán do 20. 12.“ | `rules.json:7`, `app.js:55` | není právní pravidlo (praxe penzijních společností) | zdroj KB (nedostupný z prostředí) | — | neověřeno, označeno „obvykle“ |
| Výchozí výnos 5 %, poplatek 0,8 %, projekce do 60 let | `rules.json:4–6` | předpoklad aplikace, ne pravidlo | — | — | v pořádku, uživatel mění |

## Nezávislý přepočet
Referenční výpočet: `dukazy/skripty/plan48-prepocet.mjs` (od nuly, bez kódu aplikace), porovnání: `dukazy/skripty/plan48-porovnani.mjs`, výstup `dukazy/plan48/prepocet.txt` (2 běhy, shodné; 27 shod / 10 neshod z 37). Obrazovka: `dukazy/skripty/plan48-prohlizec.mjs`, výstup `dukazy/plan48/prohlizec.json` (2 běhy, shodné) a snímky.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| zadání: DPS 5 700 Kč/měs | věk 35, 15 %, 10 měsíců proběhlo | příspěvek 4 080 Kč/rok, odpočet 48 000 Kč, úspora 7 200 Kč | 4 080 / 48 000 / 7 200 | „4 080 Kč“, „48 000 Kč“, „7 200 Kč“, „Nic dalšího není potřeba…“ (`vysledek-360.png`, `vysledek-1440.png`) | ano |
| zadání: DPS 3 000 + ŽP 2 500 Kč/měs | věk 40, 15 % a 23 % | odpočet 15 600 + 30 000 = 45 600 Kč, nevyužito 2 400 Kč, úspora 6 840 / 10 488 Kč | 45 600 / 2 400 / 6 840 / 10 488 | „45 600 Kč“, „2 400 Kč“, „6 840 Kč“ → po klepnutí 23 % „10 488 Kč“; rada „pošlete ještě 2 400 Kč…“ | ano |
| zadání: DIP 4 000 Kč/měs | věk 40 | odpočet 48 000 Kč | 48 000 | — | ano |
| zadání: DPS 400 Kč/měs | věk 40 | příspěvek 0 | 0 | — | ano |
| zadání: věk 25, návrh 2027, DPS 1 700 | 10 měsíců | 8 160 Kč/rok (680 × 12) | 8 160 | „8 160 Kč“, „680 Kč měsíčně (40 %)“, štítek nahoře i u „Co udělat“ (`navrh-360.png`) | ano |
| hranice: DPS 499 / 500 / 1 699 / 1 700 / 1 701 Kč | věk 40 | 0 / 100 / 339,80 / 340 / 340 Kč měs.; odpočet u 1 701 Kč 12 Kč | 0 / 100 / **340** / 340 / 340; 12 Kč | — | ano kromě zaokrouhlení 339,80 → 340 (zákon neřeší) |
| DPS 501 Kč; 1 234,50 Kč | věk 40 | 100,20 Kč; 246,80 Kč | 100; 247 | — | jen zaokrouhlení |
| 0 / záporný −500 / „abc“ / 1 000 000 Kč | věk 40 | 0, 0, 0; 340 Kč a odpočet 48 000 | totéž | −500 → „0 Kč, vklad pod 500 Kč – bez nároku“ bez hlášky | ano (viz P48-03) |
| DPS 2 000 Kč/měs | věk 40 | odpočet 3 600 Kč, úspora 540 Kč | 3 600 / 540 | — | ano |
| DIP 40 000 + ŽP 30 000 ročně | — | odpočet 48 000, nevyužito 0 | totéž | — | ano |
| důchodce DPS 1 000 / 1 700 Kč | věk 66 | příspěvek 0; odpočet 12 000 / 20 400 Kč | totéž | — | ano |
| zaměstnavatel 2 000 k DPS 3 000 | věk 40 | odpočet 15 600 (bez vlivu) | 15 600 | — | ano |
| návrh: 17 let 100 Kč / 18 let 100 Kč / 29 let / 30 let / 25 let 3 000 Kč | — | 40 / 0 / 680 / 340 / 680 Kč měs. | totéž | — | ano |
| návrh: věk prázdný (0) | DPS 1 700 | pásmo 0–17 → 680 Kč (formálně správně pro věk 0) | 680 | věk smazán → „8 160 Kč“, „680 Kč měsíčně (40 %)“ | ano s modulem, ale zavádějící – P48-06 |
| vlastní: 11 × 1 000 + prosinec 31 000 Kč | — | odpočet 11 × 0 + (31 000 − 1 700) = **29 300 Kč** | 42 000 − 20 400 = **21 600 Kč** | nelze zadat (jen rovnoměrný vklad) | **NE** (P48-01) |
| vlastní: 11 × 1 000 + prosinec 30 000 Kč (případ z testu aplikace) | — | **28 300 Kč** | **20 600 Kč** (test to očekává) | — | **NE** (P48-01, P48-02) |
| vlastní: 11 × 0 + prosinec 48 000 Kč | — | **46 300 Kč** | **27 600 Kč** | — | **NE** (P48-01) |
| vlastní: 11 × 3 500 + prosinec 3 500 + 26 400 Kč (příklad KB) | — | 11 × 1 800 + 28 200 = 48 000 Kč | 48 000 Kč | — | ano (rovnoměrný základ ≥ 1 700) |
| rada: DPS 3 500/měs, 10 měsíců | věk 40 | doplatek na DIP/ŽP 26 400, na DPS 26 400 Kč | 26 400 / 26 400 | — | ano |
| rada: DPS 1 000/měs, 10 měsíců | věk 40 | navýšit na 1 700 na 2 měsíce (+280 Kč, propadlo 1 400 Kč); doplatek DIP/ŽP 48 000; **na DPS 48 000 Kč** | +280 / 1 400; 48 000; **55 000 Kč** | „…(případně **55 000 Kč** mimořádně na penzijko)…“ (`rada-360.png`) | **NE** (P48-01) |
| rada: DPS 0/měs, 10 měsíců | věk 40 | +680 Kč; na DPS **48 000 Kč** | **65 000 Kč** | „…(případně **65 000 Kč** mimořádně na penzijko)…“ | **NE** (P48-01) |
| rada: DPS 1 000/měs, 11 měsíců | věk 40 | na DPS **48 000 Kč** | **55 700 Kč** | — | **NE** (P48-01) |
| rada: důchodce DPS 1 000/měs, 10 měsíců | věk 66 | bez navýšení; doplatek 36 000 Kč | totéž | — | ano |
| vstup „1 500“ (s mezerou) | pole DPS | 1 500 Kč | Chrome mezeru ignoruje → 1 500 | „3 600 Kč“ (300 × 12) | ano |
| vstup „1500,50“ | pole DPS | 1 500,50 Kč | prohlížeč en-US: pole „150050“ → 150 050 Kč/měs | „4 080 Kč“, „48 000 Kč“, „Nic dalšího není potřeba“ – bez hlášky | **NE** (P48-03) |
| vstup věk 150; měsíců 15 | — | mimo rozsah → hláška | tiše oříznuto na 120 / 11 | „na zbývající měsíc“, bez hlášky | P48-03 |
| chybový stav: `rules.json` 404 | — | srozumitelná hláška | — | „Nepodařilo se načíst pravidla (rules.json): HTTP 404…“ role=alert (`chyba-360.png`) | ano |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl: státní příspěvek DPS, odpočet 48 000 (DPS+DIP+ŽP), kolik vložit do 31. 12. | částečně | výpočty a UI ano (`calc.js`, `index.html:84–126`); částka „mimořádně na penzijko“ u vkladu < 1 700 Kč chybná (P48-01) |
| Čisté HTML + CSS + JS (ES moduly), bez buildu a serveru | splněno | `index.html:16` `type="module"`, `package.json` bez závislostí |
| Graf: Chart.js z CDN (cdnjs) | splněno | `index.html:13–15` (4.4.1, SRI ověřen – `zdroje-a-zakony.txt`) |
| Výpočty v samostatném `calc.js` bez vazby na DOM | splněno | `calc.js` nepoužívá `document`/`window`; importován z Node v `plan48-porovnani.mjs` |
| Všechny zákonné parametry v `rules.json` (sady 2026 a navrh2027, datum a zdroj), v kódu žádné částky natvrdo | splněno | `rules.json:10–62`; `grep` čísel v `calc.js`/`app.js` najde jen 12 měsíců, 120 let, 11 měsíců |
| Testy: `node --test` nad `calc.js` | splněno | `dukazy/plan48/testy.txt`: 34/34 prošlo |
| Nasazení: GitHub Pages (návod v README) | splněno | `README.md:121–154`; živý web 200 |
| Státní příspěvek: < 500 = 0; 500–1 700 = 20 %; nad 1 700 = 340; důchodce bez nároku | splněno | přepočet H1–H6, O5 |
| Návrh 2027: do 30 let 40 % (max. 680), nezletilí od 100 Kč; štítek „návrh, zatím neschváleno“ vždy v UI | splněno (štítek částečně) | `rules.json:39,50–51`; `navrh-360.png` štítek nahoře a u „Co udělat“, ne u dlaždice příspěvku a projekce (P48-08) |
| Odpočet DPS: jen část nad 1 700 Kč měsíčně; DIP a ŽP od první koruny; max. 48 000; zaměstnavatel se nepočítá | částečně | DIP/ŽP/limit/zaměstnavatel ano; DPS krácena ročně (20 400), ne měsíčně (P48-01) |
| Daňová úspora = odpočet × sazba (15 %, přepínač 23 %) | splněno | obrazovka B: 6 840 → 10 488 Kč |
| Formulář: věk, sazba, vklad DPS/DIP/ŽP, zaměstnavatel, počet proběhlých měsíců | splněno | `index.html:39–82` |
| Výsledek: příspěvek za rok, využitý a nevyužitý odpočet, úspora, věta „Co udělat do 31. 12.“ | splněno | `index.html:87–114`, `vysledek-360.png` |
| Přepínač Pravidla 2026 / Návrh 2027 | splněno | `app.js:329–341`, radiogroup + šipky |
| Graf projekce do 60 let, výnos a poplatek nastavitelné | splněno | `index.html:129–147`, `calc.js:194–218` |
| Patička: „Nejde o investiční ani daňové poradenství“ + odkazy na zdroje | splněno | `index.html:152–155`; 4 z 7 odkazů z tohoto prostředí neověřitelné |
| Kritéria: DPS 5 700 → 48 000 / 7 200; DPS 3 000 + ŽP 2 500 → 45 600; DPS 400 → 0; věk 25 návrh DPS 1 700 → 8 160 | splněno | testy 1–4 v `testy.txt`, přepočet Z1–Z5, obrazovka A, B, C |
| Mobil 360 px bez vodorovného posuvníku | splněno | `uvod-kontrola.json`, `prohlizec.json`: scrollWidth 360/360 ve všech stavech |
| Žádná data neodcházejí ze stránky (bez analytiky) | splněno | síť: jen vlastní původ + cdnjs; CSP `connect-src 'self'`; localStorage prázdný |
| README česky: spuštění, úprava `rules.json`, nasazení | splněno | `README.md:23–154`; tvrzení ř. 57 o prosincovém vkladu neodpovídá kódu (P48-01) |
| „Hlídat v pravidlech“: DIP odpočet jen při trvání ≥ 10 let a výběru nejdřív v 60 | ne | žádná zmínka v `index.html` ani README (P48-04) |
| „Hlídat“: starobní důchodci bez příspěvku; příspěvek zaměstnavatele mimo odpočet | splněno | O5, O6 |
| Vstup „kolik už letos odešlo“ | částečně | realizováno jako počet proběhlých měsíců při stejném vkladu, ne jako částka (nepravidelné vklady nelze zadat) |
| Monetizace / affiliate s označením (volitelné) | — | žádné affiliate odkazy, netýká se |
| Ruční kontrola proti kalkulačkám Měšce a E15 | neověřeno | weby mimo povolený seznam prostředí |

## Nálezy
### P48-01 · Vysoká · Pravidla a data / Výpočty · Odpočet DPS krácen paušálně 20 400 Kč ročně místo po měsících; rada „mimořádně na penzijko“ nadhodnocená
- **Kde:** `calc.js:109–110` (`dpsCast = dpsRocne − 20 400`), `calc.js:170–173` (`doplatekDps = nevyuzity + doHranice`), `rules.json:31`, `app.js:41` (věta „případně X Kč mimořádně na penzijko“), `README.md:55–57`, `test/calc.test.js:94–97`
- **Reprodukce:** (a) Obrazovka, Pravidla 2026: věk 40, DPS 1 000 Kč/měs, 10 měsíců proběhlo → očekáváno podle § 15 odst. 7 ZDP („pouze část **měsíčního** příspěvku, která převyšuje částku, od které náleží nejvyšší státní příspěvek“, DP-12): po navýšení listopadu a prosince na 1 700 Kč se z prosincového mimořádného vkladu započte celá částka, k vyčerpání limitu stačí 48 000 Kč → skutečnost: „případně **55 000 Kč** mimořádně na penzijko“ (`rada-360.png`, `prohlizec.json` D_rada_dps1000, oba běhy). DPS 0 Kč/měs → 65 000 Kč místo 48 000 Kč; DPS 1 000, 11 měsíců → 55 700 Kč. (b) Modul `odpocet({dpsRocne: 11×1 000 + 30 000})` → očekáváno 11 × 0 + (30 000 − 1 700) = 28 300 Kč → skutečnost 20 600 Kč (`prepocet.txt` M1–M3). README ř. 57 tvrdí „Mimořádný vklad v prosinci se ale započte celý“, kód dělá opak.
- **Dopad na uživatele:** Účastník s vkladem pod 1 700 Kč (typický případ) dostane radu poslat na penzijko o 7 000–18 700 Kč víc, než k daňové úspoře potřebuje; přebytek je zamčený do 60 let bez daňového efektu, nebo uživatele vysoká částka od kroku odradí. U nepravidelných vkladů modul podhodnocuje odpočet až o 20 400 Kč (v UI nezadatelné, ale API/testy to tvrdí jako správné).
- **Doporučená oprava:** Počítat DPS část po měsících: `Σ max(0, vklad_m − 1 700)` z měsíčního profilu (proběhlé měsíce × původní vklad, zbývající × navýšený, prosinec + mimořádný vklad); v radě pak `doplatekDps = nevyuzity + max(0, 1 700 − prosincovýVklad)`. Přejmenovat `dpsRocniHranice` na měsíční hranici (1 700, u důchodce 0), opravit README ř. 55–57 a test ř. 94–97 na 28 300 Kč.
- **Ověření:** reprodukováno 2× (dva běhy prohlížeče, dva procesy porovnání) · skeptik:

### P48-02 · Střední · Testy · Test „mimořádný vklad v prosinci se započte celý“ zakonzervuje chybu, chybí test nepravidelného profilu a rady u vkladu < 1 700 Kč
- **Kde:** `test/calc.test.js:94–97` (očekává 20 600 Kč), `test/calc.test.js:137–145` (očekává `doplatekDps = 48 000 + 7 000`)
- **Reprodukce:** `node --test` → 34/34 prošlo (`testy.txt`), přestože podle § 15 odst. 7 ZDP je u 11 × 1 000 + 30 000 Kč správně 28 300 Kč a u rady „1 000 Kč/měs, 10 měsíců“ správně 48 000 Kč na DPS; testy potvrzují hodnoty modulu, ne zákona. Žádný test nekontroluje měsíční profil, zaokrouhlení 339,80 Kč ani chování prázdného věku v návrhu 2027.
- **Dopad na uživatele:** Nepřímý – chyba P48-01 se při úpravách neodhalí, test ji naopak chrání.
- **Doporučená oprava:** Po opravě P48-01 přepsat oba testy na zákonné hodnoty (28 300; 48 000) a přidat případy: měsíční profil s prosincovým vkladem, DPS 0 Kč + 10 měsíců, věk 0 / prázdný v návrhu.
- **Ověření:** reprodukováno 2× (výstup testů + přepočet M2, R2) · skeptik:

### P48-03 · Střední · Mobil a přístupnost · Žádné chybové hlášky ani validace: desetinná čárka, záporné číslo a hodnoty mimo rozsah se tiše přepočítají
- **Kde:** `index.html:39` (`novalidate`), `index.html:45,62,79` (`type="number"`, `min`/`max` bez hlášky), `app.js:63–79` (`cisloZ` vrací 0, `Math.min(120|11, …)`)
- **Reprodukce:** Prohlížeč (en-US Chromium): do pole DPS napsat „1500,50“ → očekáváno 1 500,50 Kč nebo hláška → skutečnost pole ukáže „150050“, dlaždice „4 080 Kč“, „48 000 Kč“, „Nic dalšího není potřeba“ (`prohlizec.json` E_cesky_zapis.carka, oba běhy). „−500“ → pole nevalidní (min 0), výsledek „0 Kč – vklad pod 500 Kč“ bez hlášky. Věk 150 → tiše 120; měsíců 15 → tiše 11 („na zbývající měsíc“). „1 500“ a „abc“ jsou v pořádku (mezera ignorována, písmena prázdný vstup).
- **Dopad na uživatele:** Překlep s čárkou dává zcela jiný výsledek bez varování; mimo-rozsahové hodnoty se mění bez vysvětlení.
- **Doporučená oprava:** Zobrazit hlášku u pole (`aria-describedby`, `role=alert`) při `validity.rangeUnderflow/rangeOverflow/stepMismatch` a při hodnotě mimo rozsah; zvážit `type="text" inputmode="decimal"` s vlastním parsováním čárky/mezery (`cisloZ` už to umí), nebo aspoň `step="any"` a kontrolu rozsahu s textem.
- **Ověření:** reprodukováno 2× · skeptik:

### P48-04 · Střední · Texty a citlivá témata / Shoda se zadáním · Chybí upozornění na podmínku daňové podpory (120 měsíců a 60 let) a navrácení podpory při předčasném výběru
- **Kde:** `index.html` (celá stránka), `README.md` – `grep -iE '120|10 let|60 let|dodan|navrácen'` najde jen projekci „do 60 let“
- **Reprodukce:** Zadání „Hlídat v pravidlech: u DIP vzniká nárok na odpočet jen při trvání aspoň 10 let a výběru nejdřív v 60 letech“; § 15b odst. 1 a 4 ZDP (DP-15): daňová podpora jen při výplatě po 120 měsících a nejdříve v roce dosažení 60 let, jinak navrácení podpory → skutečnost: aplikace radí „pošlete ještě 48 000 Kč na DIP, životní pojištění nebo mimořádně na penzijko“ bez této podmínky.
- **Dopad na uživatele:** Kdo si podle rady založí DIP/ŽP nebo pošle mimořádný vklad a peníze vybere dřív, musí odpočty dodanit (§ 15b odst. 4) – rada bez varování u citlivého finančního rozhodnutí.
- **Doporučená oprava:** Do poznámky pod „Co udělat do 31. 12.“ a do patičky doplnit větu o podmínce 120 měsíců / 60 let a dodanění s odkazem na § 15b ZDP; v `rules.json` přidat parametry `podporaMesicu: 120`, `podporaVek: 60` se zdrojem.
- **Ověření:** reprodukováno 2× (grep repozitáře, prohlídka obrazovek 360/1440) · skeptik:

### P48-05 · Střední · Pravidla a data · Odpočet citován jako „§ 15a ZDP“ v UI, rules.json, README i kódu; správně § 15 odst. 6–7 (a § 15b podmínky)
- **Kde:** `rules.json:16` (poznámka v patičce), `rules.json:19` (název zdroje „(§ 15a)“), `calc.js:103`, `README.md:55`
- **Reprodukce:** Patička „odpočet podle § 15a ZDP“ a odkaz „Zákon č. 586/1992 Sb., o daních z příjmů (§ 15a)“ → podle textu zákona (`zdroje-a-zakony.txt`) § 15a jen definuje produkty, limit 48 000 Kč je v § 15 odst. 6 a krácení u DPS v § 15 odst. 7 (DP-11, DP-12). Chyba je převzata ze zadání („ověř proti § 15a“ – chyba v zadání, viz rejstřík).
- **Dopad na uživatele:** Čísla nemění; kdo si chce pravidlo ověřit, hledá ve špatném paragrafu.
- **Doporučená oprava:** Nahradit „§ 15a“ za „§ 15 odst. 6 a 7 ZDP (podmínky § 15b)“ a odkaz vést na konsolidované znění `https://www.zakonyprolidi.cz/cs/1992-586#p15`.
- **Ověření:** reprodukováno 2× (text zákona na zakonyprolidi.cz + rejstřík DP-11) · skeptik:

### P48-06 · Střední · Výpočty (UI) · Prázdné pole Věk se v sadě Návrh 2027 bere jako věk 0 → pásmo nezletilých (40 %, nárok od 100 Kč)
- **Kde:** `app.js:63–66, 71` (`cisloZ` → 0), `calc.js:76–81` (`najdiPasmo(0)` → pásmo 0–17), `rules.json:50`
- **Reprodukce:** Návrh 2027, smazat obsah pole Věk, DPS 1 700 Kč → očekáváno upozornění „zadejte věk“ nebo výchozí dospělé pásmo → skutečnost „8 160 Kč“, „680 Kč měsíčně (40 %)“ (`prohlizec.json` C2_navrh_vek_prazdny, oba běhy); při DPS 100 Kč by ukázala nárok 40 Kč/měs. V sadě 2026 bez vlivu (jedno pásmo).
- **Dopad na uživatele:** Dospělý s nevyplněným věkem vidí dvojnásobný příspěvek; v projekci to zdvojnásobí státní část až do 30 let.
- **Doporučená oprava:** Prázdný/nevalidní věk neposílat do výpočtu (hláška u pole, výsledek skrýt) nebo brát výchozí věk z `value="35"`.
- **Ověření:** reprodukováno 2× · skeptik:

### P48-07 · Nízká · Pravidla a data · Zdroje návrhu 2027 jsou jen média, bez sněmovního tisku 285 a materiálů MF; mediální odkazy neověřitelné
- **Kde:** `rules.json:42–47` (poznámka a `zdroje` finance.cz, dumfinanci.cz, ČSPS), `rules.json:20–21` (KB, finance.cz)
- **Reprodukce:** Patička v sadě Návrh 2027 nabízí tři mediální odkazy; úřední zdroj (tisk 285, https://www.psp.cz/sqw/historie.sqw?o=10&T=285; MF TZ 24. 8. 2026) chybí, poznámka neuvádí číslo tisku ani stav projednávání (1. čtení 24. 9. 2026, výbory 29. 10. 2026). Čtyři mediální URL z tohoto prostředí nešly načíst (proxy 403 / ENOTFOUND), jejich obsah nepotvrzen.
- **Dopad na uživatele:** Nemůže si návrh ověřit u úředního zdroje; po schválení/zamítnutí návrhu nebude jasné, co se změnilo.
- **Doporučená oprava:** Přidat do `zdroje` tisk 285 a tiskovou zprávu MF, do poznámky „sněmovní tisk 285, po 1. čtení“ a datum stavu.
- **Ověření:** reprodukováno 2× (curl + WebFetch) · skeptik:

### P48-08 · Nízká · Texty a citlivá témata · Štítek „návrh, zatím neschváleno“ není u dlaždice státního příspěvku ani u projekce
- **Kde:** `index.html:32, 88` (štítek jen nahoře a v boxu „Co udělat“), `index.html:93–114, 129–147` bez `[data-stitek]`
- **Reprodukce:** Návrh 2027, věk 25, DPS 1 700 → dlaždice „8 160 Kč · 680 Kč měsíčně (40 %)“ a projekce „1 990 681 Kč“ bez štítku (`navrh-360.png`; `prohlizec.json` `stitekUDlazdic: false`, `stitekUProjekce: false`). Na 360 px je horní štítek při čtení dlaždic už odrolovaný; štítek v boxu „Co udělat“ je těsně nad nimi, proto jen Nízká.
- **Dopad na uživatele:** Při sdílení snímku dlaždice nebo grafu chybí kontext „jen návrh“.
- **Doporučená oprava:** Přidat `<span data-stitek>` k dlaždici příspěvku a k nadpisu projekce (stejný mechanismus jako u „Co udělat“).
- **Ověření:** reprodukováno 2× · skeptik:

### P48-09 · Nízká · Texty · Drobné nepřesnosti textů
- **Kde:** `app.js:274` („Sazba 23 % platí jen pro část příjmů nad 36násobek průměrné mzdy“ – § 16 odst. 1 ZDP mluví o části **základu daně**), `app.js:55` („obvykle musí být připsán do 20. 12.“ bez zdroje; zdroj KB v patičce neověřitelný), `README.md:154` („Ve web nejsou“ → „Na webu nejsou“), `README.md:72` („vláda ho schválila v 8/2026“ bez čísla tisku)
- **Reprodukce:** čtení textů; obrazovka `vysledek-1440.png`.
- **Dopad na uživatele:** Nemění čísla; drobně nepřesné vysvětlení.
- **Doporučená oprava:** „pro část základu daně nad 36násobek průměrné mzdy“; u 20. 12. doplnit „podle podmínek vaší penzijní společnosti“; opravit překlep.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
Žádné – `git branch -a` ukazuje jen `main` a `origin/main` (jediný commit `48733fe`). GitHub workflow v repozitáři není, nasazení „Deploy from a branch“ podle README; živý web vrací 200 a SHA-256 všech souborů (`app.js`, `calc.js`, `index.html`, `package.json`, `rules.json` v `dukazy/zivy-web-vs-main.txt`; `styles.css`, `README.md` v `dukazy/plan48/zdroje-a-zakony.txt`) se shoduje s `main`. Kontrola živé adresy (`zivy-kontrola.json`): konzole prázdná, žádné chybějící soubory, jediný cizí požadavek cdnjs (Chart.js, výjimka ze zadání), axe 0, XSS `<img onerror>` nevložen, localStorage prázdný, bez přetékání na 360/1440 px.

## Co se nepodařilo ověřit a předpoklady
- Mediální zdroje v `rules.json` (kb.cz, finance.cz ×2, dumfinanci.cz, csps.cz) jsou z tohoto prostředí nedostupné (proxy CONNECT 403 / ENOTFOUND, 3 pokusy curl + WebFetch) – obsah ani dostupnost nepotvrzeny; stejně tak kalkulačky Měšce a E15 ze zadání. Úřední zdroje (zakonyprolidi.cz, psp.cz, mf.gov.cz) načteny.
- Zaokrouhlení státního příspěvku na celé Kč (`Math.round`, `calc.js:99`): zákon ho nestanoví (§ 14 odst. 4 ZDPS zaokrouhluje jen vklad účastníka dolů); referenční výpočet nechává haléře, rozdíl ≤ 0,50 Kč/měs – nehodnoceno jako nález.
- Odpočet DPS důchodce „od první koruny“ přebírám z výkladu MF (DP-13); stanovisko Finanční správy rejstřík nenašel.
- Částka 680 Kč v návrhu 2027 je dopočet 40 % × 1 700 Kč (DP-06); text tisku 285/0 jsem nečetl, jen historii projednávání na psp.cz (stav k 5. 11. 2026: po 1. čtení a výborech, 2. čtení neproběhlo).
- Test „1500,50“ proběhl v Chromium s locale en-US; v české lokalizaci prohlížeče může číselné pole čárku přijmout jako desetinnou (pak 1 500,50 Kč) – nález P48-03 proto stojí hlavně na chybějící hlášce, ne na konkrétní hodnotě.
- Předpoklad u přepočtu rady: po navýšení vkladu na 1 700 Kč na zbývající měsíce je prosincový pravidelný vklad 1 700 Kč, takže mimořádný vklad se započte celý; kdyby uživatel navýšení neprovedl, je správná částka na DPS 48 000 + (1 700 − původní vklad), stále méně než radí aplikace.
- Projekce (výnos − poplatek, měsíční skládání, DIP bez příspěvku, ŽP mimo) je vlastní model aplikace, ne právní pravidlo; kontrolováno jen, že vložené částky odpovídají vkladům + příspěvku (test aplikace, `prohlizec.json` projekce A: vloženo 1 812 000 = 25 × 12 × (5 700 + 340)).

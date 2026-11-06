# Revize: Penzijko kompas (`frankie851/penzijko-kompas`)
Revidovaný commit: `7381900dfabf675e2ada72431ac448b9ba8a0a6e` (4. 11. 2026) · živý web: https://frankie851.github.io/penzijko-kompas/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Výpočty státního příspěvku, odpočtu i projekce souhlasí s mým nezávislým přepočtem ve všech případech ze zadání i v hraničních případech (46 ze 49; viz `dukazy/penzijko-kompas/prepocet.txt`), výpočetní modul je čistý a bez čísel natvrdo a obrazovka ukazuje přesně to, co modul. Nejvážnější je, že konec transformovaného fondu 31. 12. 2036 (jen návrh, sněmovní tisk 285) se počítá i píše jako fakt i v sadě „Platná pravidla 2026“ – u výchozího formuláře to nadhodnotí projekci „zůstat v transformovaném“ o 94 000 Kč v dnešních penězích (406 441 místo 312 447 Kč) a mění přínosy doporučení; dále desetinná čárka v polích `type=number` tiše zvětší hodnotu 100× („0,85“ % → 85 %) a 4 prvky nesplňují kontrast WCAG AA. Dobře je zpracovaná architektura (`calc.js` bez DOM, vše v `rules.json`), štítky „návrh, zatím neschváleno“ u ostatních návrhových pravidel, soukromí (žádná data neodcházejí, jen Chart.js z cdnjs) a chování při výpadku CDN.
Nálezy: Kritická 0 · Vysoká 3 · Střední 4 · Nízká 6

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🔴 | PEN-01 |
| 2 Výpočty | 🔴 | PEN-02 |
| 3 Shoda se zadáním | 🟡 | PEN-04 |
| 4 Testy | 🟡 | PEN-07 |
| 5 Mobil a přístupnost | 🔴 | PEN-03 |
| 6 Texty a citlivá témata | 🟡 | PEN-05 |
| 7 Soukromí a bezpečnost | 🟢 | PEN-11 (Nízká) |
| 8 Nasazení a větve | 🟢 | — |

## Pravidla
| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Minimální vklad pro státní příspěvek | `rules.json` sada 2026 `minVklad: 500` | 500 Kč | DP-01 (§ 14 odst. 1 ZDPS) | 5. 11. 2026 | shodné |
| Sazba příspěvku 20 % z 500–1 699 Kč | `rules.json` `sazba: 0.20` | 20 % | DP-02 (§ 14 odst. 2 písm. a) ZDPS) | 5. 11. 2026 | shodné; vklad se podle § 14 odst. 4 zaokrouhluje na Kč dolů, aplikace ne (rozdíl max. 0,20 Kč, po zobrazení v celých Kč neviditelný) |
| Maximum 340 Kč od 1 700 Kč | `rules.json` `maxPrispevek: 340` | 340 Kč | DP-03 (§ 14 odst. 2 písm. b) ZDPS) | 5. 11. 2026 | shodné |
| Starobní důchodce bez nároku | `rules.json` `duchodceMaNarok: false`; `calc.js:23` | bez nároku | DP-04 (§ 13 odst. 1 písm. a) ZDPS) | 5. 11. 2026 | shodné |
| Návrh: 40 % do 30. narozenin, max. 680 Kč | `rules.json` navrh2027 pásma `vekDo 18/30`, `sazba 0.40`, `maxPrispevek 680` | 40 %; 680 Kč je dopočet (40 % × 1 700) | DP-06 (tisk 285) | 5. 11. 2026 | shodné, štítek „návrh, zatím neschváleno“ zobrazen |
| Návrh: nezletilí od 100 Kč | `rules.json` `minVklad: 100` pro `vekDo: 18` | 100 Kč do 18. narozenin | DP-07 (tisk 285) | 5. 11. 2026 | shodné, štítek zobrazen |
| Návrh: strop úplaty 0,5 %, bez úplaty ze zhodnocení | `rules.json` `stropPoplatku: {sprava: 0.5, zhodnoceni: 0}` | 0,5 % / 0 % | DP-08 (tisk 285) | 5. 11. 2026 | shodné, štítek zobrazen na kartě „Poplatky tě stojí“ |
| Návrh: konec transformovaných fondů 31. 12. 2036 → konzervativní fond | `rules.json` `fondy.transformovany.konci`, `nastupce`; `calc.js:93–96, 110` | jen návrh (tisk 285), zákon konec nestanoví (§ 194 ZDPS zná jen zánik povolení) | DP-09 | 5. 11. 2026 | **PEN-01**: uplatněno a popsáno jako fakt i v sadě „Platná pravidla 2026“, bez štítku |
| Strategie životního cyklu 100 % akcií do 45, lineárně na 20 % v 65 | `rules.json` `fondy.zivotniCyklus.cyklus` | není zákon; návrh má jinou podobu (od 50 let) | DP-10 | 5. 11. 2026 | označeno jako předpoklad aplikace v patičce i v `rules.json` – v pořádku |
| Odpočet max. 48 000 Kč/rok | `rules.json` `odpocet.maxRocne: 48000` | 48 000 Kč | DP-11 (§ 15 odst. 6 ZDP) | 5. 11. 2026 | shodné; citace „§ 15a“ chybná (PEN-08) |
| Odpočet jen z části nad 1 700 Kč měsíčně | `rules.json` `nadVklad: 1700`; `calc.js:38` (vklad − 1 700) × 12 | část měsíčního příspěvku nad 1 700 Kč | DP-12 (§ 15 odst. 7 ZDP) | 5. 11. 2026 | shodné (měsíční metoda odpovídá zákonu) |
| Daňová úspora 15 % | `rules.json` `sazbaDane: 0.15`; text „úspora až“ | 15 % (23 % nad 36násobek PM) | DP-17 (§ 16 odst. 1 ZDP) | 5. 11. 2026 | shodné, formulace „až“ je správně opatrná |
| Příspěvek zaměstnavatele se nepočítá do příspěvku ani odpočtu | `calc.js:17–20`, `app.js:110` | ano | DP-16 (§ 6 odst. 9 ZDP), § 14 ZDPS („příspěvek účastníka“) | 5. 11. 2026 | shodné |
| Poplatky účastnických fondů 0,4 % + 10 % (konzervativní), 1 % + 15 % (ostatní) | `rules.json` `fondy.*.sprava/zhodnoceni` („typické“) | zákonná maxima: § 60 odst. 3 a 4 ZDPS | zakonyprolidi.cz/cs/2011-427 (znění od 1. 8. 2026, verze 20) – **chybí v rejstříku** | 5. 11. 2026 | hodnoty rovny zákonnému maximu; aplikace je označuje jen jako „typické“ ze sazebníku (sazebník KB neověřen, viz Neověřeno) |
| Poplatky transformovaného fondu 0,8 % + 10 % ze zisku | `rules.json` `fondy.transformovany` | zákonné maximum: § 192 odst. 3 ZDPS | zakonyprolidi.cz/cs/2011-427 – **chybí v rejstříku** | 5. 11. 2026 | shodné |
| Převod ke konkurenci 800 Kč, po 5 letech zdarma | `rules.json` `predpoklady.prevodKonkurence {800, 5}`; `calc.js:208` `< 5` | § 61 odst. 3 ZDPS: nejvýše 800 Kč; § 62 odst. 3: neúčtuje se „po více než 60 měsících trvání spořící doby u téže penzijní společnosti“ | zakonyprolidi.cz/cs/2011-427 – **chybí v rejstříku** (zadání i DP-73 to vedou jako údaj ze sazebníku) | 5. 11. 2026 | hodnota správná, zdroj v aplikaci neuveden, hranice „přesně 5 let“ se liší (PEN-10) |
| Přechod z TF do účastnického fondu téže společnosti zdarma | `calc.js:251`, `app.js:312` | § 191 odst. 3 ZDPS: „bezplatně“ | zakonyprolidi.cz/cs/2011-427 – **chybí v rejstříku** | 5. 11. 2026 | shodné |
| TF „nesmí vykázat záporné zhodnocení“ | `app.js:310` | § 187 odst. 1 ZDPS: majetek TF vždy ≥ závazky | zakonyprolidi.cz/cs/2011-427 | 5. 11. 2026 | odpovídá (zjednodušená formulace) |
| Výnosy 1,5 / 3,0 / 4,5 / 7,0 %, dluhopisy 3,0 %, inflace 2,5 %, věk penze 65 | `rules.json` `fondy.*.vynos`, `predpoklady` | nejsou pravidlo; podklady zadání: model MF akcie 7,5 %, dluhopisy 4,0 %, peněžní trh 2,5 %, inflace 2,5 % | DP-73 (neověřeno – předpoklad) | — | označeno jako předpoklad; bez zdroje a odlišné od MF (PEN-06) |
| Datum ověření | `rules.json` `overeno: 2026-11-04` (obě sady), `verze 2026-11-04` | patička zobrazuje „ověřeno 4. 11. 2026“ | — | 5. 11. 2026 | shodné |
| Zdroje v patičce | `rules.json` `zdroje`, `zdrojePoplatku` | zakonyprolidi 427/2011 a 586/1992 fungují (200), prezentace MF (200); **MF „Státní podpora penzijního spoření“ → HTTP 404** (2× curl, 1× WebFetch); finance.cz, kb.cz, finex.cz z tohoto prostředí nedostupné | — | 5. 11. 2026 | PEN-05 |

## Nezávislý přepočet
Referenční skript: `dukazy/skripty/penzijko-kompas-prepocet.mjs` (část A bez kódu aplikace, část B import `calc.js`), výstup `dukazy/penzijko-kompas/prepocet.txt` (49 případů). Obrazovka: `dukazy/skripty/penzijko-kompas-prohlizec.mjs` → `prohlizec.json`, `vysledek-360.png`, `vysledek-1440.png`, `vysledek-b-360.png`. Start projekce 11/2026, vklady na konci měsíce (konvence aplikace; vklad na začátku měsíce by zvedl výsledek o 0,41 %).

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| zadání: příspěvek | 35 let, 2026, 1 700 Kč | 340 Kč/měs, 4 080 Kč/rok | 340 / 4 080 | 340 Kč / 4 080 Kč (scénář B, karta 2026) | ano |
| zadání: příspěvek pod hranicí | 35 let, 2026, 400 Kč | 0 | 0 | — | ano |
| zadání: návrh | 25 let, návrh 2027, 1 700 Kč | 680 Kč/měs, 8 160 Kč/rok | 680 / 8 160 | 680 Kč / 8 160 Kč (scénář B) | ano |
| zadání: nezletilý | 10 let, návrh, 100 Kč | 40 Kč | 40 | — | ano |
| zadání: odpočet | 3 000 Kč/měs | 15 600 Kč/rok | 15 600 | — | ano |
| zadání: poplatek 1 %, 10 let | 100 000 Kč, 0 %, 1 % + 0 %, 120 měs. | 90 479,97 Kč (měsíční strhávání; 90 438 Kč ze zadání = roční strhávání 0,99¹⁰) | 90 479,97 | — | ano (odchylka od zadání 0,05 %, v toleranci 0,5 %) |
| vlastní: hranice pásma | 40 let, 2026: 499 / 500 / 1 699 / 1 700 / 1 701 Kč | 0 / 100 / 339,80 / 340 / 340 | shodné | — | ano |
| vlastní: zaokrouhlení § 14 odst. 4 | 40 let, 2026, 1 234,56 Kč | 246,80 Kč (z 1 234 Kč) | 246,91 Kč | — | ano (±0,5 %; po zobrazení 247 Kč shodné) |
| vlastní: nesmysly | 0 Kč, −500 Kč, 1 mld. Kč | 0 / 0 / 340 | 0 / 0 / 340 | — | ano |
| vlastní: věkové hranice návrhu | 17 vs. 18 let při 100 Kč; 29 vs. 30 let při 1 000 Kč; 0 let 100 Kč | 40 / 0; 400 / 200; 40 | shodné | — | ano |
| vlastní: důchodce | 66 let 2026, 25 let návrh (předčasný) | 0 / 0 | 0 / 0 | — | ano |
| vlastní: odpočet hranice | 1 700 / 1 701 / 5 700 / 10 000 / 0 / −100 Kč | 0 / 12 / 48 000 / 48 000 / 0 / 0; úspora 15 % | shodné | — | ano |
| vlastní: projekce bez výnosu a poplatků | 1 700 + 300 zam., 35 let, 12 měs. | 28 080 Kč nominálně, státní 4 080 Kč | shodné | — | ano |
| vlastní: poplatek ze zhodnocení | 100 000 Kč, +5 % resp. −5 %, 0 % + 15 %, 12 měs. | 104 250 Kč (poplatek 750) / 95 000 Kč (poplatek 0) | shodné | — | ano |
| vlastní: strop návrhu | 100 000 Kč, 0 %, akciový 1 % + 15 %, návrh, 120 měs. | 95 121,95 Kč | shodné | — | ano |
| **vlastní: výchozí formulář, sada 2026 – podle zákona (TF bez konce)** | 35 let, 1 000 Kč, 150 000 Kč, TF 0,8 + 10, 8 let | **655 378 Kč nominálně / 312 447 Kč reálně** | **852 538 / 406 441 Kč** (TF končí 2036 → konzervativní) | 406 441 Kč v dnešních penězích (852 538 Kč nominálně), stejně na živém webu | **NE – PEN-01** |
| vlastní: totéž s koncem TF 2036 (návrh) | výchozí formulář | 852 538 / 406 441 Kč | shodné | 406 441 / 852 538 Kč | ano (modul počítá vždy variantu návrhu) |
| vlastní: výchozí formulář, sada návrh 2027 | výchozí formulář | 902 557 / 430 287 Kč, poplatky 58 344 Kč | shodné | 430 287 Kč (902 557 Kč), poplatky 58 344 Kč, štítek „návrh“ | ano |
| vlastní: TF 180 měs. od 1/2026 (případ testu aplikace) | 100 000 Kč, 40 let | 117 396,54 Kč, 48 měs. v nástupci | shodné | — | ano |
| vlastní: životní cyklus | 35 let, 1 000 Kč, 0 Kč, 2026 | 796 688 / 379 815 Kč | shodné | tabulka: 624 836 / 1 310 635 Kč (se zůstatkem 150 000) = modul | ano |
| vlastní: akciový, návrh | 25 let, 1 700 Kč, 0 Kč | 4 603 530 / 1 714 496 Kč, státní 183 600 Kč | shodné | scénář B (se zam. 500 Kč): 2 115 157 Kč (5 679 331 Kč), státní 183 600 Kč = modul | ano |
| vlastní: krátký horizont, 65 let, 64 let, vše 0, poplatky 0, důchodce 60 | viz prepocet.txt ř. 44–49 | — | shodné (u „vše 0“ jen počitadlo nástupce 238 vs. 0 – PEN-01) | — | ano |
| vlastní: doporučení (výchozí formulář) | přínos kroků | zákon (TF bez konce): fond +312 389, zam. +94 294, **vklad −19 405 Kč**; s koncem TF: 218 394 / 119 235 / 22 494 Kč | 218 394 / 119 235 / 22 494 Kč, pořadí fond, zaměstnavatel, vklad | „+218 394 Kč“, „+119 235 Kč“, „+22 494 Kč“ | shodné s modulem; podle zákona by krok „navyš vklad“ vypadl (PEN-01) |
| vlastní: TF zůstat vs. přejít (výchozí) | sada 2026 | zákon: 312 447 vs. 624 836 Kč (rozdíl 312 389 Kč) | 406 441 vs. 624 836 Kč (rozdíl 218 394 Kč) | „Zůstat 406 441 Kč“, „Přejít 624 836 Kč“, „o 218 394 Kč víc“ | shodné s modulem, nikoli se zákonem (PEN-01) |
| vlastní: převod ke konkurenci | délka smlouvy 3 / 5 / 8 let | zákon: až 800 Kč do 60 měsíců včetně; po více než 60 měsících zdarma | 800 / 0 / 0 Kč | „smlouva trvá aspoň 5 let, převod je zdarma“ | hraničních 5 let přesně se liší (PEN-10) |
| prohlížeč: „1 500“ do vkladu | klávesnice | 1 500 Kč → 300 Kč | — | pole „1500“, 300 Kč | ano (mezeru prohlížeč zahodí) |
| **prohlížeč: „1500,50“ do vkladu** | klávesnice | 1 500,50 Kč → 300,10 Kč/měs | — | **pole „150050“, 340 Kč/měs, projekce 35 983 679 Kč reálně** | **NE – PEN-02** |
| **prohlížeč: „0,85“ do poplatku za správu** | klávesnice | 0,85 % → 405 631 Kč reálně | — | **pole „085“ = 85 %, 185 451 Kč reálně, „85 % za správu“** | **NE – PEN-02** |
| prohlížeč: „1.500“ do vkladu | klávesnice | česky 1 500 Kč | — | 1,5 Kč → 0 Kč příspěvek | NE (bez hlášky) – PEN-02 |
| prohlížeč: záporný vklad −500, poplatek −1, prázdný zůstatek | formulář | má být hláška | nacti() → 0 | 0 Kč všude, „0 % za správu“, žádná hláška | PEN-04 |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl: 4 otázky (stát přidá teď i 2027; kolik v 65 a poplatky; TF zůstat/přejít; co udělat) | splněno | `index.html:86–134`, `vysledek-360.png`, `prohlizec.json` scénář A |
| Technologie: čisté HTML + CSS + JS (ES moduly), žádný build ani server | splněno | `package.json` (jen `node --test`), `index.html:12` `type="module"` |
| Graf: Chart.js z CDN (cdnjs) | splněno | `index.html:11`; síť jen cdnjs (`uvod-kontrola.json`, `zivy-kontrola.json`) |
| Výpočty v `calc.js` bez vazby na DOM | splněno | `calc.js` nepoužívá `document`/`window`; `node --test` běží bez prohlížeče |
| `rules.json`: sady „2026“ a „navrh2027“ s datem a zdrojem, sada „fondy“ (typ, správa %, zhodnocení %, výchozí výnos %) | splněno | `rules.json:3–85` |
| V kódu žádné částky ani sazby natvrdo | splněno | `calc.js` obsahuje jen 12 a 100; test 25 to hlídá |
| Testy `node --test` nad `calc.js` | splněno | `testy.txt`: 25/25 |
| Nasazení GitHub Pages, návod v README | splněno | `README.md` „Nasazení na GitHub Pages“, živý web 200 |
| Příspěvek 2026: < 500 = 0; 500–1 700 = 20 %; nad 1 700 = 340 Kč; důchodce bez nároku | splněno | přepočet ř. 1–2, 7–15, 26 |
| Návrh 2027: do 30 let 40 % (max. 680); nezletilí od 100 Kč; štítek „návrh, zatím neschváleno“ | splněno | přepočet ř. 3–4, 16–23; štítek na kartách, u hlavního čísla, poplatků i kroků (`prohlizec.json`) |
| Odpočet jen nad 1 700 Kč/měs, max. 48 000 Kč, informativně | splněno | přepočet ř. 5, 28–33; text „informativně… plný výpočet udělá Plán48“ |
| Příspěvek zaměstnavatele se nepočítá do příspěvku ani odpočtu | splněno | `calc.js:20, 36`; text `app.js:110` |
| Poplatky: správa měsíčně z průměrného zůstatku, zhodnocení jen z kladného ročního výnosu; zjednodušení v patičce | splněno | `calc.js:117, 134`; patička bod 3 |
| Návrh 2027: strop 0,5 %, bez poplatku ze zhodnocení | splněno | `rules.json:40`, přepočet ř. 37 |
| TF: končí 31. 12. 2036, pak konzervativní; přechod jen do ÚF téže společnosti; převod ke konkurenci 800 Kč < 5 let | částečně | funguje (`calc.js:93–96, 208`), ale konec 2036 je i v sadě „Platná pravidla 2026“ bez štítku (PEN-01); zadání samo ho neoznačuje jako návrh (chyba v zadání, srov. DP-09) |
| Strategie životního cyklu označená jako předpoklad, ne zákon | splněno | patička bod 2, `rules.json` `poznamka` |
| Obrazovka 1: formulář (věk, vklad, zaměstnavatel, zůstatek, typ fondu, poplatky předvyplněné a přepsatelné, délka smlouvy) | částečně | `index.html:27–81`; předvyplnění `app.js:66–70`; chybí chybové hlášky a desetinná čárka (PEN-02, PEN-04) |
| Obrazovka 2: „Stát ti přidá“ měsíčně a ročně, 2026 vedle 2027 | splněno | `vysledek-360.png`, `prohlizec.json` karty |
| Obrazovka 3: graf, čára pro každý fond, reálně i nominálně | splněno | `app.js:134–214`, přepínač Reálně/Nominálně; 5 datových řad |
| Obrazovka 4: „Poplatky tě stojí“ – rozdíl v 65 mezi dnešními poplatky a stropem 0,5 % | splněno | `app.js:256–278`; scénář A: +50 018 Kč |
| Obrazovka 5: TF karta jen když ho má; zůstat vs. přejít; postup ve 3 krocích | splněno | `app.js:282–319`; scénář B (akciový) `tfSkryta: true` |
| Obrazovka 6: „Co udělat“ max. 3 kroky podle přínosu v Kč | splněno | `calc.js:284–287`; scénář A 3 kroky sestupně |
| Obrazovka 7: patička – „Nejde o investiční poradenství“, předpoklady, zdroje | částečně | `index.html:141`, `app.js:371–403`; jeden zdroj MF vrací 404 (PEN-05) |
| Kritéria: 6 testovacích případů | splněno | `test/calc.test.js:32–67`, `testy.txt` |
| Kritéria: mobil 360 px bez vodorovného posuvníku | splněno | `preteka: false` ve všech stavech (360 i 1440) |
| Kritéria: žádná data neodcházejí, nic mimo prohlížeč | splněno | síť jen vlastní původ + cdnjs; `localStorage {}`; bez cookies |
| Kritéria: README česky – spuštění, úprava `rules.json`, nasazení | splněno | `README.md` |
| Postup: seznam předpokladů | splněno | README „Zjednodušení a předpoklady“, patička |

## Nálezy
### PEN-01 · Vysoká · 1 Pravidla a data · Konec transformovaného fondu 2036 (návrh) se počítá a píše jako fakt i v sadě „Platná pravidla 2026“
- **Kde:** `calc.js:93–96, 110` (nástupce a `posledniRok` se použijí bez ohledu na `sada.stav`), `rules.json:50–51` (`konci`, `nastupce` bez označení návrhu), `app.js:310` (karta TF: „Transformované fondy skončí 31. 12. 2036, pak se peníze převedou…“), `app.js:383` (patička: „Transformovaný fond počítáme do 31. 12. 2036…“), `test/calc.test.js:166–179` (test to konzervuje pro sadu `2026`); obrazovka `vysledek-360.png`, `vysledek-1440.png`, živý web.
- **Reprodukce:** výchozí formulář (35 let, 1 000 Kč, 150 000 Kč, transformovaný fond 0,8 % + 10 %, přepínač „Pravidla 2026“) → očekáváno: podle platného ZDPS žádný konec TF není (§ 194 zná jen zánik povolení), datum 31. 12. 2036 je jen v tisku 285 (DP-09); projekce „zůstat“ by měla běžet v TF (1,5 %) až do 65 let → 655 378 Kč nominálně / 312 447 Kč reálně, nebo musí být u čísla štítek „návrh, zatím neschváleno“ → skutečnost: aplikace přepne v roce 2037 do konzervativního fondu (3 %) a ukáže 852 538 Kč / 406 441 Kč se štítkem „platí“; karta TF i patička uvádějí konec 2036 bez štítku. Přínosy kroků se tím mění (fond +218 394 místo +312 389 Kč; „navyš vklad“ +22 494 Kč, podle zákona −19 405 Kč, tj. krok by neměl být nabídnut). Reprodukováno v přepočtu (ř. 38–39, 47) a ve dvou nezávislých načteních stránky (360 a 1440 px) i na živém webu.
- **Dopad na uživatele:** účastník transformovaného fondu vidí pod štítkem „platí“ o 30 % (94 000 Kč reálně) vyšší odhad majetku v 65 letech a podhodnocený přínos přechodu; projekce stojí na neschváleném zákoně, který může být změněn nebo neprojít.
- **Doporučená oprava:** přesunout `konci`/`nastupce` do sady `navrh2027` (nebo přidat `fondy.transformovany.stav: "navrh"`) a v `projekce()` uplatnit nástupce jen když zvolená sada parametr obsahuje; v sadě 2026 počítat TF do konce horizontu; na kartě TF a v patičce doplnit štítek `stitek` návrhu u věty o roce 2036; upravit test 17 tak, aby pro sadu `2026` očekával `mesicePoNastupci === 0`.
- **Ověření:** reprodukováno 2× · skeptik: Potvrzeno (Opus, 5. 11. 2026 – projekce() reprodukována: 852 538 / 406 441 Kč vs. 655 378 / 312 447 Kč bez nástupce; zákon č. 427/2011 Sb. žádný konec TF nestanoví)

### PEN-02 · Vysoká · 2 Výpočty · Desetinná čárka a tečka v polích `type=number` tiše mění hodnotu 100× nebo 1 000×
- **Kde:** `index.html:41, 45, 49, 62, 66` (všechna peněžní a procentní pole `type="number"`), `app.js:46` (`replace(',', '.')` se nikdy neuplatní – prohlížeč čárku zahodí dřív); důkaz `dukazy/penzijko-kompas/prohlizec.json` (scénář C), `prohlizec-carka.json`, `cisla-360.png`.
- **Reprodukce:** do pole „Za správu“ napsat na klávesnici `0,85` → očekáváno 0,85 % za správu (projekce 405 631 Kč reálně), nebo chybová hláška → skutečnost: hodnota pole „085“ = 85 %, hlavní číslo 185 451 Kč reálně, karta poplatků „85 % za správu“, přínos stropu +513 561 Kč, bez jakékoli hlášky. Do pole „Tvůj měsíční vklad“ napsat `1500,50` → očekáváno 1 500,50 Kč a příspěvek 300 Kč → skutečnost: pole „150050“, příspěvek 340 Kč, projekce 35 983 679 Kč reálně. `1.500` (česky 1 500) → 1,5 Kč, příspěvek 0 Kč. Reprodukováno ve dvou nezávislých bězích prohlížeče (Chromium, locale en-US; chování v česky lokalizovaném prohlížeči se nepodařilo ověřit – viz Neověřeno).
- **Dopad na uživatele:** kdo přepíše poplatek nebo vklad po česku s čárkou, dostane bez varování zcela jiný odhad majetku, poplatků i doporučení (u poplatku 85 % je výsledek na pohled uvěřitelný: 185 451 Kč).
- **Doporučená oprava:** použít `type="text"` s `inputmode="decimal"` a vlastní parsování (odstranit mezery včetně pevných, čárku převést na tečku, tečku jako oddělovač tisíců ošetřit) s viditelnou chybovou hláškou při nečitelném vstupu; nebo aspoň validovat `validity.stepMismatch`/rozsah (`max` u poplatku je 5 %) a hlásit hodnotu mimo rozsah místo tichého přijetí 85 %.
- **Ověření:** reprodukováno 2× · skeptik: Nejisté (Opus, 5. 11. 2026 – v Chromiu s --lang=cs-CZ se čárka přijme jako desetinná a hodnoty jsou správné; posun 100×/1 000× nastává jen v anglicky lokalizovaném prohlížeči; trvá, že se nečte validity a chybí hláška. Ponecháno jako Vysoká · nejisté)

### PEN-03 · Vysoká · 5 Mobil a přístupnost · Kontrast textu v dlaždicích srovnání 4,44:1 (WCAG 1.4.3, axe „serious“ ×4)
- **Kde:** `styles.css:9` (`--text-3: #6f6e69`), `styles.css:215, 218` (`.srovnani > div` pozadí `--surface-2: #f0efec`, `.srovnani small` barva `--text-3`, 0,78 rem); prvky `#poplatky-obsah > .srovnani > div:nth-child(1|2) > small` a `#tf-obsah > .srovnani > div:nth-child(1|2) > small`.
- **Reprodukce:** načíst stránku ve světlém režimu, spustit axe-core (WCAG 2.2 A/AA) → očekáváno 0 „serious/critical“ → skutečnost: `color-contrast` serious, 4 uzly (texty „0,8 % za správu + 10 % ze zhodnocení / zaplatíš 93 228 Kč“ a „v 65 letech, dnešní peníze“); vypočtený poměr #6f6e69 na #f0efec = 4,44:1 (limit 4,5:1). Reprodukováno v `uvod-kontrola.json` (základní kontrola), `prohlizec.json` (scénář A, 4 uzly; scénář B 2 uzly, protože karta TF je skrytá) a `prohlizec-carka.json` (druhý běh). V tmavém režimu 0 nálezů (5,71:1).
- **Dopad na uživatele:** hůře čitelné údaje o výši poplatků a o tom, že částky jsou v dnešních penězích; porušení AA.
- **Doporučená oprava:** pro `.srovnani small` použít `--text-2` (6,9:1) nebo ztmavit `--text-3` ve světlém režimu aspoň na `#6a6964` (4,78:1 na `--surface-2`, 5,36:1 na `--surface`).
- **Ověření:** reprodukováno 2× · skeptik: Potvrzeno (Opus, 5. 11. 2026 – poměr 4,443:1 na 12,5px textu, axe serious na 4 uzlech reprodukován; skeptik dodává, že závažnost Vysoká je hraniční, do limitu chybí 0,06)

### PEN-04 · Střední · 3 Shoda se zadáním · Žádné chybové hlášky – záporný, prázdný či nesmyslný vstup se tiše bere jako 0
- **Kde:** `app.js:45–48` (`nacti()` vrací 0 pro vše, co není kladné číslo), `index.html:27` (`novalidate`), žádný prvek `role="alert"`; důkaz `prohlizec.json` scénář D, `chyba-360.png`.
- **Reprodukce:** vklad `-500`, poplatek za správu `-1`, zůstatek prázdný → očekáváno hláška u pole → skutečnost: příspěvek 0 Kč, „0 % za správu“, projekce 0 Kč, doporučení „Navyš vklad… Stát ti pak přidá 340 Kč místo 0 Kč“, žádné upozornění. Věk 150 → „Projekce se počítá do 65 let“, ale karta příspěvku dál ukazuje 200 Kč. Reprodukováno 2× (dva běhy skriptu).
- **Dopad na uživatele:** překlep (minus, smazané pole) projde bez povšimnutí a výsledky jsou nulové nebo zavádějící; zadání (oblast 5) chybové hlášky vyžaduje.
- **Doporučená oprava:** validovat rozsahy podle atributů `min`/`max` a zobrazit hlášku pod polem (`aria-describedby`, `aria-invalid`), výsledky při neplatném vstupu nepřepočítávat nebo označit.
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-05 · Střední · 6 Texty a citlivá témata · Zdroj „MF ČR – Státní podpora penzijního spoření“ v patičce vrací 404
- **Kde:** `rules.json:12` (`https://mf.gov.cz/cs/financni-trh/penzijni-sporeni`), zobrazeno v patičce `#zdroje` (živý web i klon).
- **Reprodukce:** otevřít odkaz → očekáváno stránka MF → skutečnost: HTTP 404 „Stránka nenalezena | Ministerstvo financí ČR“ (2× curl, 1× WebFetch, 5. 11. 2026). Přitom sada tvrdí „ověřeno 4. 11. 2026“. Funkční náhrada: https://mf.gov.cz/cs/financni-trh/soukrome-penzijni-systemy/iii-pilir-doplnkove-penzijni-sporeni-a-p/zakladni-informace (200).
- **Dopad na uživatele:** nemůže si ověřit pravidla u úřadu; snižuje důvěryhodnost data ověření.
- **Doporučená oprava:** nahradit URL funkční stránkou MF (viz výše) a ověřit i ostatní odkazy (finance.cz, kb.cz, finex.cz se z revizního prostředí nedaly načíst).
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-06 · Střední · 6 Texty a citlivá témata · Předpokládané výnosy nemají zdroj a liší se od modelu MF, který zadání uvádí jako podklad; výnos TF 1,5 % rozhoduje o radě „přejít“
- **Kde:** `rules.json:51–69` (`vynos` 1,5 / 3,0 / 4,5 / 7,0 %, `vynosDluhopisy` 3,0 %), `zdrojePoplatku` ani `zdroje` výnosy nekryjí; patička „Předpokládané roční výnosy před poplatky…“.
- **Reprodukce:** podklady zadání: MF model akcie 7,5 %, dluhopisy 4,0 %, peněžní trh 2,5 % (prezentace MF 3. 6. 2026) → aplikace 7,0 / 4,5 / 3,0 / 1,5 % bez uvedení původu. Karta TF: „Přechod ti podle předpokladů přinese o 218 394 Kč víc“ – rozdíl je tvořen výhradně předpokladem 1,5 % vs. 7 %/3 % (ověřeno přepočtem, prepocet.txt oddíl TF).
- **Dopad na uživatele:** nevratné rozhodnutí (z TF se nedá vrátit) je podloženo číslem, jehož původ není dohledatelný; částky se mohou jevit jako výstup pravidel.
- **Doporučená oprava:** doplnit do `rules.json` zdroj výnosů (MF model nebo historické výnosy fondů s odkazem) nebo převzít hodnoty MF; na kartě TF uvést vedle výsledku použité výnosy („při 1,5 % v TF a …“) a formulovat jako scénář.
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-07 · Střední · 4 Testy · Chybí testy důležitých větví a jeden test konzervuje návrh v sadě 2026
- **Kde:** `test/calc.test.js:166–179` (test 17 očekává přechod TF → konzervativní pro sadu `'2026'`), `calc.js:271–282` (větev doporučení `poplatky` bez testu), `calc.js:30–33` (`vkladProMaxPrispevek` bez testu), `calc.js:208` (hranice přesně 5 let), `test/calc.test.js:60–67` (test 6 s tolerancí 0,5 % kolem hodnoty 90 438, kterou model nedává – dává 90 480).
- **Reprodukce:** `node --test` → 25/25 projde; po opravě PEN-01 test 17 spadne (zakonzervovaná chyba). Žádný test nekontroluje, že sada `2026` nepoužívá žádný parametr návrhu, ani větev „Hledej fond s nižšími poplatky“, ani parsování vstupu (to je v `app.js`, netestovatelné bez DOM).
- **Dopad na uživatele:** nepřímý – budoucí úprava `rules.json` nebo `calc.js` může rozbít doporučení či označení návrhu, aniž by to testy zachytily.
- **Doporučená oprava:** test „sada 2026 nemění fond po roce 2036“, test větve `poplatky` (dražší poplatky → krok s kladným přínosem), test `vkladProMaxPrispevek` pro obě sady, u testu 6 uvést, že 90 480 Kč je hodnota měsíčního modelu; parsování vstupu vyčlenit do testovatelné funkce.
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-08 · Nízká · 1 Pravidla a data · Chybná citace „§ 15a ZDP“ pro odpočet
- **Kde:** `rules.json:11` („§ 15a“), `calc.js:35`, README; zadání ř. 150 totéž (chyba v zadání, viz DP-11).
- **Reprodukce:** limit 48 000 Kč a pravidlo „část nad 1 700 Kč“ jsou v § 15 odst. 6 a 7 ZDP; § 15a definuje produkty, § 15b podmínky (120 měsíců, 60 let). Hodnoty v aplikaci správné.
- **Dopad na uživatele:** jen dohledatelnost zdroje.
- **Doporučená oprava:** opravit text zdroje na „§ 15 odst. 6 a 7 ZDP“.
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-09 · Nízká · 6 Texty a citlivá témata · U nezletilých věta „Vyšší sazba platí do 18. narozenin“ je zavádějící
- **Kde:** `app.js:90–92` (přidá „do {vekDo}. narozenin“ podle pásma); obrazovka při věku 0–17 v kartě návrhu (`prohlizec.json` scénář D „prazdnyVekAVklad“).
- **Reprodukce:** věk 10, návrh 2027 → skutečnost: „Vyšší sazba platí do 18. narozenin.“ → očekáváno: 40 % platí do 30. narozenin; v 18 letech se mění jen minimální vklad ze 100 na 500 Kč (DP-06, DP-07).
- **Dopad na uživatele:** rodič může čekat pokles příspěvku v 18 letech.
- **Doporučená oprava:** formulovat podle toho, co se na hranici mění (sazba, nebo minimální vklad), např. porovnáním s následujícím pásmem.
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-10 · Nízká · 1 Pravidla a data · Poplatek za převod ke konkurenci: neuveden zákonný zdroj, hranice „přesně 5 let“ se liší od zákona
- **Kde:** `rules.json:89` (`prevodKonkurence` v `predpoklady`, bez zdroje), `calc.js:208` (`delkaSmlouvy < 5`), `app.js:316–318` („smlouva trvá aspoň 5 let, převod je zdarma“).
- **Reprodukce:** § 61 odst. 3 ZDPS: poplatek nejvýše 800 Kč; § 62 odst. 3: neúčtuje se, požádá-li účastník o převod „po více než 60 měsících trvání spořící doby“ → při přesně 5 letech může být ještě zpoplatněn; aplikace při 5 letech ukazuje „zdarma“. Hodnota 800 Kč i „až“ jsou správně.
- **Dopad na uživatele:** v hraničním měsíci může být překvapen poplatkem až 800 Kč; zdroj se tváří jako obchodní podmínka, ačkoli je to zákonný strop.
- **Doporučená oprava:** `zdarmaPoLetech` chápat jako „více než 60 měsíců“ (`<= 5` → poplatek), do `rules.json` doplnit zdroj § 61 odst. 3 a § 62 odst. 3 ZDPS; totéž u poplatků fondů (jde o zákonná maxima § 60 odst. 3–4 a § 192 odst. 3 ZDPS, nejen „typické“ sazby).
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-11 · Nízká · 7 Soukromí a bezpečnost · Chart.js z cdnjs bez `integrity` (SRI)
- **Kde:** `index.html:11`.
- **Reprodukce:** `<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" defer>` bez `integrity`/`crossorigin`. Jiné cizí požadavky, cookies, analytika ani `localStorage` nejsou; `innerHTML` dostává jen escapované texty a čísla; XSS do polí neprojde (pole jsou číselná); `git log -p` bez klíčů; výpadek CDN je ošetřen (tabulka + hláška, `graf-vypadek-360.png`).
- **Dopad na uživatele:** při kompromitaci CDN by mohl běžet cizí kód; nízká pravděpodobnost.
- **Doporučená oprava:** doplnit `integrity="sha384-…"` a `crossorigin="anonymous"` (hash pro 4.4.1 z cdnjs).
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-12 · Nízká · 1 Pravidla a data · `platnostOd` sady 2026 a mediální zdroj návrhu
- **Kde:** `rules.json:7` (`platnostOd: 2026-01-01` – pravidla platí od 1. 7. 2024, srov. DP-01), `rules.json:31` (Finance.cz jako zdroj sady návrhu; úřední je sněmovní tisk 285 na psp.cz, který chybí).
- **Reprodukce:** přepínač ukazuje „Pravidla 2026“ – věcně neškodné; u návrhu chybí odkaz na tisk 285 (stav projednávání se z Finance.cz nepozná).
- **Dopad na uživatele:** nemůže sledovat, zda návrh pokročil.
- **Doporučená oprava:** doplnit zdroj https://www.psp.cz/sqw/historie.sqw?o=10&T=285, případně `platnostOd: 2024-07-01`.
- **Ověření:** reprodukováno 2× · skeptik:

### PEN-13 · Nízká · 5 Mobil a přístupnost · Tabulka na šířce do 420 px skrývá sloupec „Poplatky“ bez upozornění
- **Kde:** `styles.css:204–205` (`th:nth-child(4), td:nth-child(4) { display: none }`).
- **Reprodukce:** 360 px → tabulka má 3 sloupce (Fond, Dnešní peníze, Nominálně), poplatky jednotlivých fondů nejsou dostupné; na 1440 px jsou (`vysledek-360.png` vs. `vysledek-1440.png`). Údaj o poplatcích vlastního fondu je v textu nad grafem, srovnání poplatků mezi fondy ale na mobilu chybí.
- **Dopad na uživatele:** ztráta srovnání bez vysvětlení; funkce jinak zachována.
- **Doporučená oprava:** nechat tabulku vodorovně posouvat (`.tabulka-obal` už má `overflow-x: auto`) nebo sloupec zkrátit místo skrytí.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
žádné (`git ls-remote --heads origin` → jen `main`; žádný GitHub workflow, nasazení „Deploy from a branch“)

## Co se nepodařilo ověřit a předpoklady
- **Sazebníky a články:** `kb.cz` (sazebník KB, dva různé odkazy v zadání a v `rules.json`), `finance.cz` a `finex.cz` jsou z revizního prostředí nedostupné (DNS blokováno, 2× curl + WebFetch). Poplatky jsem proto ověřil proti zákonným maximům (§ 60, § 192 ZDPS), nikoli proti sazebníku; druhý zdroj pro 800 Kč / 60 měsíců (sazebník NN ze zadání) nebyl dostupný.
- **Chování desetinné čárky v česky lokalizovaném prohlížeči:** Chromium v sandboxu ignoroval `--lang=cs-CZ` (navigator.language zůstal en-US), takže PEN-02 je potvrzen pro anglickou lokalizaci prohlížeče; v české lokalizaci Chrome/Firefox může pole čárku přijmout. Zadání tuto variantu výslovně požaduje, proto nález ponechávám.
- **Text sněmovního tisku 285:** čerpám z rejstříku (DP-06–DP-10); samotný text novely jsem nečetl, 2. čtení k 5. 11. 2026 neproběhlo.
- **Předpoklady přepočtu:** start projekce 11/2026, vklady a příspěvky na konci měsíce (stejně jako aplikace; vklad na začátku měsíce by zvedl výsledky o cca 0,4 %), výnosy a inflace převzaty z `rules.json` jako vstup modelu. Návrh 2027 aplikace uplatňuje už od 11/2026 (rozdíl proti startu 1/2027 je u výchozího formuláře 170 Kč) – zdokumentováno v patičce, bez nálezu.
- **Testovací hodnota 90 438 Kč ze zadání** odpovídá ročnímu strhávání poplatku (0,99¹⁰); měsíční model zadání dává 90 480 Kč. Aplikace i můj přepočet dávají 90 480 Kč, test prochází díky toleranci 0,5 % – nepřesnost zadání, ne aplikace.
- **Zadání vs. úřední zdroj (chyby v zadání):** konec TF 31. 12. 2036 je v zadání uveden v odstavci „Pravidla“ bez označení „návrh“ (podklady zadání ho přitom řadí do návrhu 2027); 800 Kč / 5 let je v zadání jako údaj ze sazebníku, ve skutečnosti § 61 odst. 3 a § 62 odst. 3 ZDPS; „§ 15a“ místo § 15 odst. 6–7 ZDP; 680 Kč je dopočet (DP-06).
- Víkendy, svátky, přestupný rok ani přelom roku nejsou pro aplikaci relevantní (měsíční model bez konkrétních dat); ověřeno jen přepnutí kalendářního roku v projekci (přechod TF v 1/2037).

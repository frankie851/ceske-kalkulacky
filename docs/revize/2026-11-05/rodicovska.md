# Revize: Rodičovská pro celou rodinu (`frankie851/rodicovska`)
Revidovaný commit: `9ff80c369dcb60f61e74c067b7d6e96302c554aa` (5. 11. 2026) · živý web: https://frankie851.github.io/rodicovska/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Jádro výpočtu nemocenských dávek je správné: DVZ, redukce po pásmech, zaokrouhlení, délky mateřské a otcovské, strop rodičovské i částky 350 000 / 700 000 a 400 000 / 800 000 Kč se shodují s mým nezávislým přepočtem i se zákonem (63 z 94 porovnávaných hodnot shodných, všechny rozdíly mají jednu z pěti příčin níže). Nejvážnější je, že časová osa rodičovského příspěvku končí měsíc před 3. narozeninami, ačkoli zákon počítá i měsíc, v němž dítě dovrší 3 roky (§ 30b odst. 1 písm. d) ZSSP) – příklad ze zadání „propadne 110 000 Kč“ je tak chybný i v zadání (správně 102 000 Kč); dále aplikace tvrdí, že rodičovská nenáleží souběžně s mateřskou (zákon: náleží rozdíl, § 30b odst. 3), nepřepočítává mateřskou trvající přes 1. leden podle nových redukčních hranic (§ 22 odst. 2 ZNP) a uvádí zastaralý limit 92 hodin v jeslích místo 120. Dobře je oddělení čistého výpočetního modulu od obrazovky, testy včetně porovnání s kalkulačkou MPSV, žádné cizí požadavky ani cookies, escapování všech výstupů, srozumitelná čeština a viditelné upozornění „Orientační výpočet, nejde o rozhodnutí úřadu“ s datem ověření.
Nálezy: Kritická 0 · Vysoká 4 · Střední 7 · Nízká 4

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🔴 | ROD-04 (92 místo 120 hodin), ROD-06, ROD-09, ROD-11 |
| 2 Výpočty | 🔴 | ROD-01, ROD-02, ROD-03, ROD-05 |
| 3 Shoda se zadáním | 🟡 | ROD-09 (otcovská jen do 28. dne), příklady zadání v rozporu se zákonem (ROD-01, ROD-05) |
| 4 Testy | 🟡 | ROD-10 |
| 5 Mobil a přístupnost | 🟡 | ROD-07, ROD-08 |
| 6 Texty a citlivá témata | 🟡 | ROD-06 (text o „schválení Senátem“), ROD-02 (text o souběhu) |
| 7 Soukromí a bezpečnost | 🟢 | — (ROD-14 jen Nízká) |
| 8 Nasazení a větve | 🟢 | — (ROD-15 jen Nízká) |

## Pravidla
Všechny hodnoty z `rules.json` (ověřeno `2026-11-05`), konstanty v `rodina.js`/`app.js`/`index.html` a tvrzení v textech; porovnáno s rejstříkem `pravidla.md` (PR-31 až PR-55) a s texty předpisů staženými 5. 11. 2026 ze zakonyprolidi.cz (ZNP = 187/2006 Sb., ZSSP = 117/1995 Sb.), ÚP ČR a MPSV. Odkazy v patičce: všech 9 vrací HTTP 200 (curl 5. 11. 2026), dva však nevedou na slibovaný obsah (ROD-11).

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Redukční hranice 2026 | `rules.json` 1 633 / 2 449 / 4 897 | 1 633 / 2 449 / 4 897 Kč | PR-35 – sdělení MPSV č. 397/2025 Sb. | 5. 11. 2026 | shodné |
| Redukční hranice 2027 | `rules.json` 1 723 / 2 584 / 5 167, „185/2026 Sb.“ | 1 723 / 2 584 / 5 167 Kč | PR-36 – sdělení MPSV č. 185/2026 Sb. | 5. 11. 2026 | shodné (včetně čísla sdělení) |
| Redukční hranice 2025 | `rules.json` 1 552 / 2 328 / 4 656 | 1 552 / 2 328 / 4 656 Kč | mpsv.gov.cz „Nemocenské pojištění v roce 2026“ (uvádí i hodnoty 2025); v rejstříku není | 5. 11. 2026 | shodné, aplikace je nepoužije (termín min. 1. 1. 2026) |
| DVZ = příjem × 12 / dny rozhodného období, na 2 des. místa | `rodina.js:64–67` | VZ / počet kal. dnů rozhodného období, „s přesností na 2 platná desetinná místa“ | PR-31 – ZNP § 18 odst. 1 | 5. 11. 2026 | shodné (986,30; sken 1–300 000 Kč bez rozdílu) |
| Rozhodné období 12 kal. měsíců před měsícem nástupu | `rodina.js:54–58` | ZNP § 18 odst. 3 | PR-32 | 5. 11. 2026 | shodné (365/366 dní) |
| Vyloučené dny | neřeší se (README „Zjednodušení“) | snižují počet dnů | PR-33 – ZNP § 18 odst. 1, 7 | 5. 11. 2026 | zjednodušení, přiznané v README a patičce |
| Redukce 100 / 60 / 30 %, pásma na haléře, výsledek nahoru na Kč | `rules.json ppm.redukce`, `rodina.js:70–77` | ZNP § 21 odst. 1 písm. b), odst. 2, 3 | PR-34 | 5. 11. 2026 | shodné ve výsledku; pásma se nezaokrouhlují, ale sken 1–300 000 Kč neukázal žádný rozdíl (`prepocet.txt` V1l, V1m) |
| Hranice podle data nástupu; dávka přes 1. leden se nepřepočítá | `rodina.js:86–91, 94–101`, README „Hranice se vybírají podle data nástupu“ | dávka, na kterou vznikl nárok před 1. 1. a trvá, se od 1. 1. upraví podle nových hranic | **ZNP § 22 odst. 2** https://www.zakonyprolidi.cz/cs/2006-187#p22 (v rejstříku chybí); 2. zdroj MPSV, příklady přechodu 2008/2009 | 5. 11. 2026 | **rozdíl – ROD-03** |
| PPM a otcovská 70 % DVZ, denně nahoru na Kč | `rules.json ppm.sazba 0.7, otcovska.sazba 0.7`, `rodina.js:80–83` | 70 %; dávka za kal. den nahoru na celé Kč | PR-37, PR-38 – ZNP § 37, § 38c, § 17 odst. 1 | 5. 11. 2026 | shodné (691 Kč z 987) |
| PPM 28 / 37 týdnů; otec 22 / 31 týdnů | `rules.json tydny 28, tydnyVicercata 37, otecMaxTydny 22, otecMaxTydnyVicercata 31` | ZNP § 33 písm. a)–d) | PR-39 | 5. 11. 2026 | shodné; střídání = otec do konce 28 týdnů (ČSSZ: do 22 týdnů otce se započítává doba matky kromě prvních 6 týdnů) – shodné (`prepocet.txt` V12a) |
| Nástup matky 8.–6. týden před porodem | `rules.json nastupTydnyPredMin 6 / Max 8`, `rodina.js:219` | ZNP § 34 odst. 1 písm. a) | PR-40 | 5. 11. 2026 | shodné |
| Převzetí PPM otcem od 7. týdne, aspoň 7 dní | `rules.json otecOdDne 42`, `app.js:171` | ZNP § 32 odst. 1 písm. e) | PR-41 | 5. 11. 2026 | shodné |
| 270 dní pojištění v posledních 2 letech | `rules.json narokDnyPojisteni 270`, `index.html:50` | ZNP § 32 odst. 2 | PR-42 | 5. 11. 2026 | shodné |
| Otcovská 14 dní, nástup do 6 týdnů od narození | `rules.json otcovska.dny 14, nastupDoDne 41`; **ale** `index.html:85 max="28"`, `rodina.js:269` | podpůrčí doba 2 týdny; nástup v období 6 týdnů (den 0–41) | PR-43 – ZNP § 38b odst. 1, § 38a odst. 4 | 5. 11. 2026 | délka shodná; **nástup omezen na 28. den – ROD-09** |
| RP celkem 350 000 / 700 000 Kč (narození od 1. 1. 2026) | `rules.json rodicovsky[0]` | ZSSP § 30 odst. 1 (2násobek od 1. 1. 2026, 290/2025 Sb.) | PR-44, PR-47 | 5. 11. 2026 | shodné |
| RP 400 000 / 800 000 Kč pro narození od 1. 1. 2027 | `rules.json rodicovsky[1]`, pozn. „schválená Senátem 29. 7. 2026“; README „až vyjde ve Sbírce“ | zákon č. 152/2026 Sb. (vyhlášen 26. 8. 2026, účinnost 1. 1. 2027) | PR-51 – https://www.zakonyprolidi.cz/cs/2026-152 | 5. 11. 2026 | hodnoty a datum shodné; **popis zastaralý – ROD-06** |
| Nejdéle do 3 let věku | `rules.json vekMesicu 36`; `rodina.js:195 vek = 36` (měsíce 0–35) | do 3 let; měsíc, v němž dítě dovršilo 3 roky, se počítá jako celý | PR-45 – ZSSP § 30 odst. 1; **§ 30b odst. 1 písm. d)** https://www.zakonyprolidi.cz/cs/1995-117#p30b (v rejstříku chybí); 2. zdroj MPSV „Rodičovský příspěvek“ | 5. 11. 2026 | **rozdíl – ROD-01** |
| Strop = max(15 000; 70 % × 30 × vyšší red. DVZ k datu narození) | `rules.json minStrop 15000, rpPodilDvz 0.7, rpDnu 30`, `rodina.js:113–119, 315–320` | ZSSP § 30 odst. 2, 3 písm. a), b) | PR-46 | 5. 11. 2026 | shodné (21 000; 59 997); DVZ matky k nástupu místo k datu narození – projeví se jen přes Nový rok (ROD-03) |
| Vícerčata: 30 000 Kč, 2násobek 70 % × 30 × DVZ | `rules.json minStropVicercata 30000, nasobekVicercata 2` | ZSSP § 30 odst. 3 písm. c) | PR-47 | 5. 11. 2026 | shodné (30 000; 42 000) |
| Změna výše po 3 celých měsících, ne zpětně, písemně u ÚP | `rules.json rpZmenaMesicu 3`, `app.js:94, 175` | ZSSP § 30 odst. 5 | PR-48 | 5. 11. 2026 | shodné (jen text) |
| Nižší zbytek se vyplatí s poslední měsíční částkou | `rodina.js:130–135` (zbytek jako samostatný měsíc) | ZSSP § 30 odst. 6 | PR-49 | 5. 11. 2026 | **rozdíl – ROD-05** (zadání má stejnou chybu) |
| Souběh RP s PPM: náleží rozdíl, je-li RP vyšší; měsíc narození a měsíc s PPM se počítají celé | `rodina.js:313–314` (RP až od měsíce po PPM), `app.js:155` text „nevyplácí se souběžně“ | ZSSP § 30b odst. 3, odst. 1 písm. a), b) | https://www.zakonyprolidi.cz/cs/1995-117#p30b (v rejstříku chybí); 2. zdroj ÚP ČR https://mpsv.gov.cz/up-cz/rodicovsky-prispevek | 5. 11. 2026 | **rozdíl – ROD-02** |
| Nárok na výplatu RP zaniká 3 měsíce zpětně | checklist `app.js:174` („Od <měsíc po PPM>“) | ZSSP § 54 odst. 2; ÚP: „maximálně tři měsíce zpětně“ | https://www.zakonyprolidi.cz/cs/1995-117#p54 (v rejstříku chybí) | 5. 11. 2026 | aplikace neuvádí; v kombinaci s ROD-02 radí žádat později, než RP náleží |
| Další dítě: jednorázová výplata zbytku | `app.js:180` text | ZSSP § 30a odst. 1 (podmínka DVZ nebo OSVČ) | PR-49 | 5. 11. 2026 | zmíněno bez podmínky – Nízká (ROD-13) |
| Jesle / školka u dítěte do 2 let | `rules.json jesleHodinMesicne 92`, `rodina.js:397`, `app.js:177` | **120 hodin** v kal. měsíci (od 1. 5. 2025) | PR-50 – ZSSP § 31 odst. 3 písm. a); ÚP ČR i MPSV „do 120 hodin“ | 5. 11. 2026 | **rozdíl – ROD-04** |
| RP při návratu do práce trvá (péče jinou zletilou osobou) | `rodina.js:244–246` | ZSSP § 31 odst. 3 písm. b) | https://www.zakonyprolidi.cz/cs/1995-117#p31 (v rejstříku chybí) | 5. 11. 2026 | shodné |
| Čistá mzda 2026: SP 7,1 %, ZP 4,5 %, 15 / 23 %, hranice 146 901 Kč, sleva 2 570 Kč, základ na sta nahoru | `rules.json cistaMzda.2026`, `rodina.js:155–162` | shodné hodnoty | PR-52 až PR-55 | 5. 11. 2026 | shodné (24 590 z 30 000; 112 422 ze 150 000); sada 2027 chybí (ROD-12) |
| Datum ověření v patičce | `rules.json overeno 2026-11-05` → „Pravidla ověřena: 5. 11. 2026“ | – | – | 5. 11. 2026 | shodné (`prohlizec.json` A, H) |

## Nezávislý přepočet
Skript `dukazy/skripty/rodicovska-prepocet.mjs` (od nuly, bez kódu aplikace) a `rodicovska-porovnani.mjs` (importuje `rodina.js` z klonu); úplná tabulka 94 řádků v `dukazy/rodicovska/prepocet.txt` (2 nezávislé běhy, shodné). Obrazovka: `dukazy/rodicovska/prohlizec.json` (scénáře A, B, C ve dvou bězích, shodné), snímky `vysledek-360.png`, `vysledek-1440.png`, `vysledek2-360.png`.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| Z1 DVZ a redukce (zadání) | 30 000 Kč, 365 dní | 986,30 → 987 Kč (2026 i 2027), 691 Kč/den | 986,30 → 987, 691 | 135 436 Kč = 196 × 691 (scénář A) | ano |
| Z2 strop RP (zadání) | red. DVZ 1 000 | 21 000 Kč | 21 000 Kč | — | ano |
| Z3 bez DVZ, 15 000 Kč/měs. (zadání) | 350 000 Kč od měsíce 0 | 350 000 Kč za **23** měsíců (poslední 20 000 Kč, § 30 odst. 6) | 350 000 Kč za 24 měsíců (23 × 15 000 + 5 000) | — | částka ano, počet měsíců **ne** (ROD-05; zadání má 24) |
| Z4 8 000 Kč od 6. měsíce (zadání) | porod 15. 3. 2026, matka 30 000, otec 40 000, PPM matka | vyčerpáno **248 000**, propadne **102 000** Kč (měsíce 6–36); PPM 135 436; strop 27 636; RP od září 2026 | 240 000 / 110 000; 135 436; 27 636; od září; varování ano | 240 000 Kč, propadne 110 000 Kč, „30 měsíců čerpání“, checklist „Do 28. 2. 2029“ (scénář A, 360 i 1440 px) | PPM, strop, začátek ano; propadne **ne** (ROD-01; zadání má 110 000) |
| Z5 vícerčata bez DVZ (zadání) | porod 1. 6. 2026, 30 000 Kč/měs. | strop 30 000, celkem 700 000, vyčerpáno 700 000, 23 měsíců (vyčerpání v dubnu 2028) | 30 000, 700 000, 700 000, 24 měsíců (květen 2028) | 700 000 Kč, strop 30 000, „kvě 2028 (23. měsíc)“, 24 měsíců (scénář B) | částky ano, měsíc vyčerpání **ne** (ROD-05) |
| V1 hranice pásem 2026/2027 | DVZ 1 633; 1 633,01; 2 449; 4 897; 10 000; 5 167 (2027) | 1 633; 1 634; 2 123; 2 857; 2 857; 3 015 | totéž | — | ano |
| V1l/m sken 1–300 000 Kč po 1 Kč | 365 dní, hranice 2026 | 0 rozdílů (pásma na haléře vs. bez) | 0 rozdílů vůči mně | — | ano |
| V2 rozhodné období, přestupný rok | nástup 1. 2. 2027; 10. 3. 2028 | 365; 366 dní; DVZ 983,61 → 689 Kč/den | totéž | — | ano |
| V3 vstupy 0, záporné, text, 1e9 | 0; −30 000; „abc“; 1 000 000 000 | 0; 0; 0; 32 876 712,33 | totéž | záporný/prázdný příjem → „Matka nemá nárok“ bez hlášky u pole (scénář D) | ano (modul), **ne** obrazovka (ROD-07) |
| V4 PPM přes Nový rok (vlastní) | porod 20. 1. 2027, matka 80 000, nástup 9. 12. 2026 | 23 × 1 524 + 173 × **1 578** = **308 046 Kč**; strop **47 334** | 196 × 1 524 = 298 704; strop 45 717 | — | **ne** (ROD-03; rozdíl −9 342 Kč) |
| V4f test aplikace „200 000 Kč, leden 2027“ | dtto, příjem 200 000 | od 1. 1. 2027 **2 111 Kč/den**, celkem 411 203 | 2 000 Kč/den, 392 000 | — | **ne** (ROD-03, ROD-10) |
| V5 nízký příjem – RP během PPM (vlastní) | porod 15. 3. 2026, matka 15 000, RP 15 000 | RP březen 4 274, duben 4 620, srpen 9 810, září 15 000; vyčerpání v měsíci 26 | 0, 0, 0, 15 000; měsíc 29 | tabulka: bře–srp 2026 jen PPM 10 726 / 10 380 / 5 190 Kč, RP 0 (scénář C) | **ne** (ROD-02) |
| V6 PPM čerpá otec od 7. týdne (vlastní) | porod 15. 3. 2026, matka bez nároku, otec 50 000, RP 34 440 | PPM 26. 4.–26. 9. 2026, 1 148 Kč/den, strop 34 440; RP březen **34 440**, duben **28 700** | PPM a strop shodné; RP březen 0, duben 0, první RP říjen (index 7) | — | PPM ano, RP **ne** (ROD-02) |
| V7 měsíc 3. narozenin (vlastní) | porod 15. 3. 2026, bez PPM, 9 000 Kč/měs. | 37 měsíců (bře 2026 – bře 2029), 333 000 / propadne 17 000 | 36 měsíců (do úno 2029), 324 000 / 26 000 | — | **ne** (ROD-01) |
| V8 otcovská (vlastní) | otec 30 000, od dne porodu; nástup 35. a 41. den; přes Nový rok (80 000) | 691 Kč/den, 9 674 Kč; start B+35 / B+41; 21 876 Kč | 691, 9 674; start vždy B+28; 21 336 Kč | — | částka ano; nástup **ne** (ROD-09); přes Nový rok **ne** (ROD-03) |
| V9 § 30 odst. 6 u návrhu výše | 11 700 Kč od 6. měsíce | vyčerpání v měsíci 34 (poslední 22 400); návrh 11 300 (31 měsíců) | měsíc 35 (poslední 10 700); návrh 11 700 | „zvolte aspoň 11 700 Kč“ (scénář A) | **ne** (ROD-05, ROD-01; konzervativní) |
| V10 čistá mzda | 30 000; 150 000; 20 800; 50 Kč | 24 590; 112 422; 17 837; 43 | totéž | — | ano |
| V11 RP podle data narození, hranice 2027, MPSV 50 000 | 31. 12. 2026 / 1. 1. 2027; vícerčata 2027; PPM 196 dní z 50 000 | 350 000 / 400 000; 800 000; 1 644; 225 008 | totéž | — | ano |
| V12 střídání od 7. týdne | matka 30 000, otec 60 000 | 84 + 112 = 196 dní; otec 1 286 Kč/den | totéž | — | ano |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl 1: z hrubých příjmů obou rodičů odhadne DVZ, mateřskou a otcovskou | splněno | `rodina.js:94–101`, `app.js:146–152` („Jak jsme počítali“), `prepocet.txt` Z1, V8 |
| Cíl 2: časová osa od porodu do 3 let, posuvník výše RP, kdy se vyčerpá | částečně | osa `timeline.js`, posuvník `index.html:100`; osa končí měsíc před 3. narozeninami (ROD-01), `vysledek-360.png` |
| Cíl 3: střídání rodičů, dřívější návrat do práce, měsíční příjem rodiny | splněno | `index.html:107–124`, `rodina.js:231–261`, test `rodina.test.js:164–196` |
| Cíl 4: upozorní, když část rodičovské propadne | splněno (částka o jeden měsíc vyšší) | `rodina.js:374–384`, `vysledek-360.png` („Část rodičovské propadne … 110 000 Kč“) |
| Technologie: čisté HTML + CSS + JS (ES moduly), SVG osa bez knihovny | splněno | `index.html:9`, `timeline.js` (řetězec SVG), žádné závislosti (`package.json`) |
| Výpočty v `rodina.js` (čisté funkce), parametry v `rules.json` po letech se zdrojem a datem | splněno | `rodina.js` bez DOM (import v Node funguje – `rodicovska-porovnani.mjs`), `rules.json` má `zdroj`, `url`, `overeno` |
| Plán jen do `localStorage` v try/catch, nic se neodesílá | splněno | `app.js:17–40`; síť jen vlastní původ (`prohlizec.json` A, H: `ciziPozadavky` prázdné) |
| Testy `node --test`, nasazení GitHub Pages | splněno | `testy.txt` (29/29), `.github/workflows/pages.yml` (testy před nasazením) |
| „Než začneš psát kód“: tabulka pravidlo → zdroj → datum (DVZ, hranice 2026/2027, zaokrouhlení, délky, otcovská, podmínky, RP, 400 000) | částečně | zdroje jsou v `rules.json` a README „Jak se počítá“, ne ve formě tabulky pravidlo → zdroj → datum; 92 hodin a § 30b nezachyceny |
| Výpočet: DVZ = příjmy / dny; redukce; PPM denně 70 % | splněno | `prepocet.txt` Z1, V1, V2 |
| Výpočet: strop RP = max(15 000; 70 % × 30 × vyšší DVZ); vícerčata dvojnásobek | splněno | `prepocet.txt` Z2, Z2d, Z5a |
| Výpočet: čerpání až do nuly nebo do 3 let; zbytek k 3. narozeninám propadlý | částečně | logika ano; hranice „3 let“ o měsíc dřív než zákon (ROD-01); zbytek nižší než měsíční částka jako samostatný měsíc (ROD-05) |
| Obrazovka 1: formulář (termín, vícerčata, příjmy obou, kdo na mateřskou, otcovská) | splněno | `index.html:25–89`, `uvod-360.png` |
| Obrazovka 2: osa po měsících s barevnými úseky a částkou; posuvník; přepínač „střídání rodičů“ | splněno | `index.html:93–140`, `vysledek-360.png`, legenda `app.js:207` |
| Obrazovka 3: souhrn – celkem, kdy se vyčerpá, kolik propadne | splněno | `app.js:136–144`, `vysledek-360.png` |
| Obrazovka 4: kontrolní seznam – kdy podat žádosti a kde | splněno (s chybným termínem žádosti o RP a posledního měsíce) | `app.js:160–186`; ROD-02, ROD-01 |
| Obrazovka 5: patička „Orientační výpočet, nejde o rozhodnutí úřadu“, datum ověření, zdroje | splněno | `index.html:165–173`, `prohlizec.json` H (`overeno: 5. 11. 2026`), odkazy viz ROD-11 |
| Kritérium: 30 000 Kč → DVZ 986,30, red. 987 | splněno | `rodina.test.js:17–22`, `prepocet.txt` Z1 |
| Kritérium: DVZ 1 000 → strop 21 000 | splněno | `rodina.test.js:24–27`, Z2 |
| Kritérium: bez DVZ 15 000 → 350 000 za 24 měsíců (23 × 15 000 + 5 000) | splněno vůči zadání; **zadání je v rozporu s § 30 odst. 6** (23 měsíců) | `rodina.test.js:29–40`, Z3 |
| Kritérium: od 6. měsíce 8 000 → 240 000 vyčerpáno, 110 000 propadne, upozornění | splněno vůči zadání; **zadání je v rozporu s § 30b odst. 1 písm. d)** (248 000 / 102 000) | `rodina.test.js:42–59`, Z4, scénář A |
| Kritérium: vícerčata bez DVZ → strop 30 000, celkem 700 000 | splněno | `rodina.test.js:61–72`, Z5, scénář B |
| Kritérium: mobil 360 px bez vodorovného posuvníku | splněno | `prohlizec.json` A/B/D `preteka: false`, `uvod-kontrola.json` |
| Kritérium: README česky – jak každý rok aktualizovat hranice a částky | splněno | `README.md` „Každoroční aktualizace“ |
| Postup: na konci porovnat výši mateřské s kalkulačkou MPSV nebo ČSSZ | splněno (tvrzení README o 80 případech jsem neověřil, 5 hodnot v testu souhlasí s mým výpočtem) | `test/mpsv-kalkulacka.test.js`, `prepocet.txt` V11f |

## Nálezy
### ROD-01 · Vysoká · Výpočty · Rodičovská končí měsíc před 3. narozeninami, měsíc dovršení 3 let se nepočítá
- **Kde:** `rodina.js:195` (`const vek = 36`), `rodina.js:125–138` (`cerpaniRp`, měsíce 0–35), `rodina.js:280` (konec osy = den před 1. dnem 36. měsíce), `app.js:182–183` (checklist „Do 28. 2. 2029: Poslední měsíc čerpání“), test `rodina.test.js:42–59`; zadání `docs/zadani.md` ř. 1075–1076.
- **Reprodukce:** porod 15. 3. 2026, rodičovská 8 000 Kč od 6. měsíce → očekáváno: RP náleží za měsíce září 2026 – **březen 2029** (31 měsíců), tj. 248 000 Kč vyčerpáno a 102 000 Kč propadne, protože podle ZSSP § 30b odst. 1 písm. d) se podmínka celodenní péče po celý měsíc považuje za splněnou „i v kalendářním měsíci, v němž dítě dosáhlo věku 3 let“ (https://www.zakonyprolidi.cz/cs/1995-117#p30b; MPSV „Rodičovský příspěvek“: „dítě dovršilo věk 3 (4) let, do kterého náleží rodičovský příspěvek“) → skutečnost: modul i obrazovka 240 000 / 110 000 Kč, „30 měsíců čerpání“, osa končí únorem 2029, checklist „Do 28. 2. 2029“ (`prepocet.txt` Z4, V7; `vysledek-360.png`). Stejný vstup bez PPM s 9 000 Kč/měs.: zákon 37 měsíců, modul 36.
- **Dopad na uživatele:** každému, kdo rodičovskou nevyčerpá dřív, aplikace ukáže o jednu měsíční částku vyšší „propadlou“ částku, o měsíc kratší čerpání a chybný poslední den; návrh „vyčerpat přesně do 3 let“ je o jeden měsíc přísnější (11 700 místo 11 300 Kč). Směr chyby je konzervativní, rozhodnutí podle ní nevede k přímé ztrátě, ale částka i termín jsou špatně.
- **Doporučená oprava:** počítat měsíce 0 až `vekMesicu` včetně (měsíc 3. narozenin), prodloužit horizont osy do konce měsíce 3. narozenin, použít `vekMesicu` z `rules.json` místo konstanty, opravit checklist („poslední měsíc = měsíc 3. narozenin“), upravit test i příklad v zadání (248 000 / 102 000 Kč).
- **Ověření:** reprodukováno 2× (dva běhy modulu, dva běhy v prohlížeči) · skeptik:

### ROD-02 · Vysoká · Výpočty · Rodičovská podle aplikace nenáleží souběžně s mateřskou; zákon přiznává rozdíl už od měsíce narození
- **Kde:** `rodina.js:313–314` (`rpOd = posledniPpm + 1`), `app.js:155` („Rodičovská se nevyplácí souběžně s mateřskou, začíná v kalendářním měsíci po jejím skončení“), `app.js:173–174` (checklist „Od <měsíc po PPM>: Rodičovský příspěvek: žádost na ÚP“), README bod 7.
- **Reprodukce:** (a) porod 15. 3. 2026, matka 15 000 Kč (PPM 346 Kč/den), RP 15 000 Kč → očekáváno podle ZSSP § 30b odst. 3 („rodičovský příspěvek náleží, jen je-li vyšší, a to ve výši rozdílu“) a § 30b odst. 1 písm. a), b) (měsíc narození a měsíc s PPM se počítají celé; ÚP ČR: „rodičovský příspěvek náleží od měsíce narození dítěte, pouze je-li vyšší než dávky nemocenského pojištění … doplácen rozdíl“): RP březen 4 274 Kč, duben 4 620 Kč, …, srpen 9 810 Kč → skutečnost: 0 Kč v březnu až srpnu, RP až od září (`prepocet.txt` V5; obrazovka scénář C: řádky bře–srp 2026 jen 10 726 / 10 380 / 5 190 Kč). (b) matka bez nároku, PPM čerpá otec od 7. týdne (50 000 Kč), RP 34 440 Kč → očekáváno březen 34 440 Kč, duben 28 700 Kč → skutečnost 0 a 0, první RP až v říjnu (V6f–h).
- **Dopad na uživatele:** rodiny s nízkou mateřskou (příjem zhruba do 21 000 Kč) nebo s mateřskou otce vidí v prvních měsících o tisíce až desetitisíce korun nižší příjem a dřívější vyčerpání o několik měsíců (V5: měsíc 26 vs. 29); kontrolní seznam radí žádat o RP až po skončení mateřské, přičemž nárok na výplatu zaniká 3 měsíce zpětně (ZSSP § 54 odst. 2) – ve většině případů jde jen o posun peněz v čase, při nízkém stropu a pozdní žádosti může část celkové částky propadnout.
- **Doporučená oprava:** počítat RP od měsíce narození jako `max(0, výše − PPM v měsíci)` (u PPM matky i otce), opravit text v „Jak jsme počítali“ a v kontrolním seznamu („žádost o RP lze podat hned po narození, nárok se uplatňuje nejvýš 3 měsíce zpětně“), přidat test.
- **Ověření:** reprodukováno 2× (dva běhy modulu; obrazovka scénář C) · skeptik:

### ROD-03 · Vysoká · Výpočty · Mateřská a otcovská trvající přes 1. leden se nepřepočítá podle nových redukčních hranic; strop RP z DVZ k nástupu
- **Kde:** `rodina.js:94–101` (`davkaRodice` – hranice jen podle data nástupu), `rodina.js:297–303` (jedna denní sazba po celou PPM), `rodina.js:315–319` (DVZ pro strop = DVZ z PPM k nástupu), README „Hranice se vybírají podle data nástupu na dávku, ne podle data porodu“, test `rodina.test.js:108–114`.
- **Reprodukce:** porod 20. 1. 2027, matka 80 000 Kč, nástup 9. 12. 2026 → očekáváno podle ZNP § 22 odst. 2 („Výše dávek, na které vznikl nárok před 1. lednem … a tento nárok trvá ještě tohoto dne, se upraví bez žádosti od tohoto dne podle nové výše denního vyměřovacího základu stanoveného podle částek redukčních hranic platných od 1. ledna“; https://www.zakonyprolidi.cz/cs/2006-187#p22; MPSV příklady přechodu 2008/2009 popisují tentýž přepočet): prosinec 1 524 Kč/den (red. DVZ 2 177), od 1. 1. 2027 **1 578 Kč/den** (red. DVZ 2 254), celkem 23 × 1 524 + 173 × 1 578 = **308 046 Kč**; strop RP podle DVZ k datu narození (§ 30 odst. 3 písm. b) ZSSP, hranice 2027) 21 × 2 254 = **47 334 Kč** → skutečnost: 1 524 Kč/den po celých 196 dní = 298 704 Kč (o 9 342 Kč méně), strop 45 717 Kč (`prepocet.txt` V4a–e). Test aplikace s příjmem 200 000 Kč zakonzervovává 2 000 Kč/den po celou dobu, zákon od 1. 1. 2027 2 111 Kč/den (V4f–g). Otcovská 28. 12. 2026 – 10. 1. 2027 z 80 000 Kč: 21 876 vs. 21 336 Kč (V8e).
- **Dopad na uživatele:** týká se porodů zhruba od srpna do února s příjmem nad 1. redukční hranicí (nad cca 49 700 Kč měsíčně); mateřská je podhodnocena o jednotky tisíc až přes 19 000 Kč a maximální volitelná výše rodičovské je nižší, než na jakou má rodina nárok – uživatel si může zvolit nižší měsíční částku, než by mohl.
- **Doporučená oprava:** v `planRodiny` počítat denní dávku po dnech podle roku, do kterého den spadá (DVZ zůstává, mění se jen redukce), pro strop RP použít redukci podle hranic roku narození, opravit test a README.
- **Ověření:** reprodukováno 2× (dva běhy modulu) · skeptik:

### ROD-04 · Vysoká · Pravidla a data · Limit docházky dítěte do 2 let do jeslí 92 hodin místo 120
- **Kde:** `rules.json:69` (`"jesleHodinMesicne": 92`), `rodina.js:394–399` (upozornění při návratu do práce), `app.js:177` (checklist „hlídejte limit 92 hodin měsíčně“).
- **Reprodukce:** porod 10. 5. 2026, návrat do práce od 10. měsíce → očekáváno „nejvýše 120 hodin v kalendářním měsíci“ (ZSSP § 31 odst. 3 písm. a) ve znění zákona č. 84/2025 Sb., účinnost 1. 5. 2025, https://www.zakonyprolidi.cz/cs/1995-117#p31; ÚP ČR a MPSV „Státní sociální podpora“: „v rozsahu do 120 hodin v kalendářním měsíci“) → skutečnost: „dítě mladší 2 let smí být v jeslích nebo školce nejvýš 92 hodin měsíčně“ (výstup modulu 5. 11. 2026; rejstřík PR-50).
- **Dopad na uživatele:** rodič plánující dřívější návrat do práce si zbytečně omezí docházku dítěte (nebo odmítne úvazek) kvůli limitu, který už 18 měsíců neplatí; výpočet částek to neovlivní.
- **Doporučená oprava:** `jesleHodinMesicne: 120` se zdrojem (84/2025 Sb., § 31 odst. 3 ZSSP) a test na hodnotu v textu upozornění.
- **Ověření:** reprodukováno 2× (zákon + ÚP ČR + MPSV; modul dvakrát) · skeptik: Potvrzeno (Opus, 5. 11. 2026 – rules.json:69 = 92; § 31 odst. 3 písm. a) ZSSP v aktuálním znění (verze 96) „nepřevyšujícím 120 hodin v kalendářním měsíci“; řetězec 92 hodin v zákoně není)

### ROD-05 · Střední · Výpočty · Zbytek nižší než měsíční částka se vyplácí jako samostatný měsíc navíc
- **Kde:** `rodina.js:130–135` (`cerpaniRp`), `app.js:141` („Rodičovská se vyčerpá … 24 měsíců čerpání“); zadání ř. 1074.
- **Reprodukce:** 350 000 Kč po 15 000 Kč → očekáváno podle ZSSP § 30 odst. 6 (zbývá-li po odpočtu aktuální částky méně než aktuální částka, „vyplatí se tato zbývající částka … spolu s částkou náležející za aktuální kalendářní měsíc“, rejstřík PR-49): 23 měsíců, poslední 20 000 Kč → skutečnost: 24 měsíců, poslední 5 000 Kč (`prepocet.txt` Z3b–d); vícerčata 700 000 / 30 000: obrazovka „kvě 2028 (23. měsíc dítěte), 24 měsíců čerpání“, podle zákona duben 2028 (Z5d, `vysledek2-360.png`).
- **Dopad na uživatele:** měsíc vyčerpání je o jeden pozdější a poslední dvě částky jsou rozložené jinak; celková částka sedí, nikdo nepřijde o peníze. Zadání obsahuje stejnou chybu („24 měsíců = 23 × 15 000 + 5 000“).
- **Doporučená oprava:** v `cerpaniRp` přičíst zbytek k poslední plné částce, je-li nižší než ona; upravit test a příklad v zadání (23 měsíců).
- **Ověření:** reprodukováno 2× · skeptik:

### ROD-06 · Střední · Pravidla a data · Zvýšení na 400 000 / 800 000 Kč je popsáno jako „novela schválená Senátem“, je to zákon č. 152/2026 Sb.
- **Kde:** `rules.json:64–66` (`pozn`, `zdroj`, `url` na tiskovou zprávu „Senát schválil…“), `rodina.js:393` (text se zobrazuje jako informační upozornění u každého termínu porodu od 1. 1. 2027), `README.md:70–71` („Až vyjde ve Sbírce, doplňte do `zdroj` číslo zákona“).
- **Reprodukce:** termín porodu 4. 4. 2027 → očekáváno: pravidlo platné ze zákona č. 152/2026 Sb. (vyhlášen 26. 8. 2026, účinnost 1. 1. 2027; https://www.zakonyprolidi.cz/cs/2026-152; rejstřík PR-51) → skutečnost: „Novela zákona o státní sociální podpoře schválená Senátem 29. 7. 2026, pro děti narozené od 1. 1. 2027.“ (výstup modulu; živý web ukazuje pro výchozí termín 2027 „Celkem 400 000 Kč“, `prohlizec.json` H).
- **Dopad na uživatele:** částky jsou správné, ale text budí dojem, že jde o neschválený nebo nejistý stav; uživatel může s 400 000 Kč nepočítat.
- **Doporučená oprava:** `pozn`: „zákon č. 152/2026 Sb., účinný od 1. 1. 2027“, `url` na zakonyprolidi.cz/e-Sbírku, smazat výzvu v README.
- **Ověření:** reprodukováno 2× · skeptik:

### ROD-07 · Střední · Mobil a přístupnost · Chybné vstupy bez hlášky; při neplatném termínu zůstane starý souhrn a kontrolní seznam
- **Kde:** `app.js:53–64` (`prectiFormular` – `Number(el.value)` bez kontroly `validity`), `app.js:70–73` (`prepocitej` při neplatném termínu smaže jen osu), `index.html:25` (`novalidate`).
- **Reprodukce:** (a) termín porodu 31. 12. 2025 nebo prázdný → očekáváno: chybová hláška a vyprázdněné nebo označené výsledky → skutečnost: hláška „Zadejte termín porodu od 1. 1. 2026“ ano, ale souhrn (7 dlaždic s částkami předchozího plánu), posuvník, tabulka i kontrolní seznam zůstanou z předchozího výpočtu (`chyba-360.png`, `prohlizec.json` D `souhrnZustal: 7`). (b) příjem matky −30 000 nebo prázdný → prohlížeč hlásí `rangeUnderflow`, aplikace bez hlášky u pole počítá „Matka nemá podle zadání nárok na mateřskou“ a 350 000 Kč od narození (D). (c) „30000,50“ v cs-CZ → `stepMismatch`, aplikace mlčky počítá s 30 000,50 Kč (E_cs-CZ).
- **Dopad na uživatele:** po překlepu v termínu vidí uživatel pod chybovou hláškou cizí čísla; záporný či prázdný příjem je tiše vyložen jako „bez nároku“.
- **Doporučená oprava:** při neplatném termínu vyprázdnit souhrn, tabulku a checklist (nebo je označit), u polí kontrolovat `validity` a ukázat hlášku (`aria-describedby`), záporný příjem odmítnout.
- **Ověření:** reprodukováno 2× (dva nově načtené běhy) · skeptik:

### ROD-08 · Střední · Mobil a přístupnost · Desetinná čárka v příjmu se v prohlížeči s lokalizací en-US zahodí (30000,50 → 3 000 050 Kč)
- **Kde:** `index.html:42, 46` (`<input type="number" … step="100">`), `app.js:57`.
- **Reprodukce:** příjem matky „30000,50“ → očekáváno 30 000,50 Kč (nebo odmítnutí) → skutečnost: v Chromiu s `--lang=cs-CZ` hodnota `30000.50` (jen `stepMismatch`, výpočet správný); s `--lang=en-US` hodnota **`3000050`**, aplikace bez varování počítá s příjmem 3 000 050 Kč (`prohlizec.json` E_en-US; „1500,5“ → 15 005). Mezera v „30 000“ se při psaní zahodí a hodnota je 30 000 v obou lokalizacích.
- **Dopad na uživatele:** jen v prohlížeči s anglickou lokalizací a jen při zadání haléřů (u měsíčního hrubého příjmu výjimečné); výsledkem je maximální mateřská a strop 59 997 Kč bez upozornění.
- **Doporučená oprava:** `step="1"` nebo `inputmode="decimal"` s vlastním parsováním (`,` → `.`) z `type="text"`, případně kontrola `validity.badInput`/`stepMismatch` s hláškou.
- **Ověření:** reprodukováno 2× (cs-CZ i en-US, nové procesy) · skeptik:

### ROD-09 · Střední · Pravidla a data · Nástup na otcovskou lze zadat jen do 28. dne po porodu, zákon dovoluje do 6 týdnů
- **Kde:** `index.html:85` (`max="28"`), `rodina.js:269` (`Math.min(P.otecOdDne - 14, …)`), přitom `index.html:168` a `app.js:168` tvrdí „Nástup je možný do 6 týdnů od narození“ a `rules.json otcovska.nastupDoDne 41`.
- **Reprodukce:** otcovská od 35. nebo 41. dne → očekáváno nástup 19. 4., resp. 25. 4. 2026 (ZNP § 38a odst. 4: nástup „v období 6 týdnů ode dne narození“; § 38b odst. 1: podpůrčí doba 2 týdny – dávka tedy může skončit až 8 týdnů po porodu; ČSSZ „Otcovská“) → skutečnost: modul posune start vždy na 12. 4. 2026 (28. den), pole víc nedovolí (`prepocet.txt` V8c, V8d).
- **Dopad na uživatele:** otec, který chce otcovskou čerpat až v 5.–6. týdnu (např. po návratu matky z porodnice), si ji nenaplánuje; částka se nemění, mění se jen měsíc výplaty.
- **Doporučená oprava:** `max="41"` a `Math.min(rules.otcovska.nastupDoDne, …)`.
- **Ověření:** reprodukováno 2× · skeptik:

### ROD-10 · Střední · Testy · Testy zakonzervovávají chybné hodnoty a chybí testy důležitých větví
- **Kde:** `test/rodina.test.js:29–40` (24 měsíců, poslední 5 000 Kč – ROD-05), `:42–59` a `:116–125` (240 000 / 110 000 a 160 000 – ROD-01), `:108–114` (2 000 Kč/den po celou PPM přes Nový rok – ROD-03), `:191–196` (ověřuje jen existenci upozornění na jesle, ne hodnotu 92/120 – ROD-04).
- **Reprodukce:** `node --test` → 29/29 prošlo (`testy.txt`), ale čtyři testy potvrzují hodnoty, které jsou v rozporu se zákonem (viz ROD-01, 03, 05); žádný test nepokrývá souběh RP s PPM (§ 30b odst. 3), měsíc 3. narozenin, přepočet od 1. ledna, nástup otcovské po 28. dni ani chování `app.js` (parsování formuláře, neplatný termín).
- **Dopad na uživatele:** nepřímý – budoucí oprava výpočtu testy „rozbije“, takže chyby mají tendenci přežít.
- **Doporučená oprava:** po opravách ROD-01/03/05 přepsat očekávané hodnoty podle zákona a doplnit testy na § 30b odst. 3, § 30b odst. 1 písm. d), § 22 odst. 2, hodnotu 120 hodin a nástup otcovské 29.–41. den.
- **Ověření:** reprodukováno 2× (testy spuštěny 5. 11. 2026, výstup `testy.txt`; čtení kódu) · skeptik:

### ROD-11 · Střední · Pravidla a data · Dva odkazy v patičce nevedou na slibovaný obsah, zdroje míchají domény
- **Kde:** `rules.json zdroje[0]` („ČSSZ – Peněžitá pomoc v mateřství a dávky nemocenského pojištění“, `https://www.cssz.cz/cz/pojisteni-osvc/davky/davky-nemocenskeho-pojisteni.htm`), `zdroje[1]` a `otcovska.url` („ČSSZ – Otcovská“, `https://cssz.cz/otcovska`), `rodicovsky[1].url` (tisková zpráva o Senátu místo Sbírky).
- **Reprodukce:** curl -L 5. 11. 2026 → očekáváno stránka o PPM, resp. o otcovské → skutečnost: první odkaz končí na `https://www.cssz.gov.cz/web/cz/obecne-informace-osvc` (obecné informace pro OSVČ, přičemž aplikace OSVČ výslovně nepočítá), druhý na úvodní stránce `https://www.cssz.gov.cz/` (správná adresa je `https://www.cssz.gov.cz/web/cz/otcovska`, HTTP 200). Ostatních 7 odkazů vede na deklarované stránky (`mpsv.gov.cz/nemocenske-pojisteni` obsahuje hranice 2025 i 2026; e-Sbírka 185/2026 se skládá v prohlížeči).
- **Dopad na uživatele:** kdo si chce pravidla ověřit, skončí na nesouvisející stránce; důvěryhodnost patičky klesá.
- **Doporučená oprava:** odkazovat na `cssz.gov.cz/web/cz/penezita-pomoc-v-materstvi`, `cssz.gov.cz/web/cz/otcovska`, u částek RP na zakonyprolidi.cz/e-Sbírku (117/1995 Sb. § 30, 152/2026 Sb.).
- **Ověření:** reprodukováno 2× (curl dvakrát, `prohlizec.json` H `zdroje`) · skeptik:

### ROD-12 · Nízká · Pravidla a data · Čistá mzda nemá parametry pro rok 2027
- **Kde:** `rules.json cistaMzda` (jen 2026), `rodina.js:148–152` (poslední známý rok + příznak `odhad`), upozornění „Pro čistou mzdu v dalších letech jsou použity sazby roku 2026.“
- **Reprodukce:** měsíce roku 2027 → očekáváno hranice 23 % 154 989 Kč/měs. (NV č. 177/2026 Sb.: průměrná mzda 51 663 Kč; rejstřík PR-54) → skutečnost 146 901 Kč s poctivým upozorněním (`prepocet.txt` V10e).
- **Dopad na uživatele:** rozdíl jen u hrubé mzdy mezi 146 901 a 154 989 Kč a jen v orientační čisté mzdě; sazby pojistného a sleva se nemění.
- **Doporučená oprava:** doplnit `cistaMzda.2027` (`hraniceDan2Mesic 154989`, zdroj NV 177/2026 Sb.).
- **Ověření:** reprodukováno 2× · skeptik:

### ROD-13 · Nízká · Výpočty · Drobná zjednodušení bez vlivu na běžné částky
- **Kde:** `rodina.js:195` (`vek = 36` – `vekMesicu` z `rules.json` se nepoužívá), `rodina.js:315–319` (matce bez zaškrtnutých 270 dní se DVZ pro strop RP nestanoví, ačkoli DVZ pro nemocenské v souvislosti s porodem lze mít i bez 270 dnů – ZSSP § 30 odst. 2), `app.js:180` (jednorázová výplata zbytku při dalším dítěti bez podmínky DVZ/OSVČ podle § 30a odst. 1), `README.md` tabulka „150 000 Kč | 2027 | 2 944 (max)“ (maximum 2027 je 3 015 Kč, 2 944 je hodnota pro DVZ 4 931,51).
- **Reprodukce:** čtení kódu; `prepocet.txt` V11e.
- **Dopad na uživatele:** žádný při běžném použití; u matky zaměstnané krátce může být strop RP podhodnocen.
- **Doporučená oprava:** použít `rp.vekMesicu`, zmínit podmínku § 30a v checklistu, opravit README.
- **Ověření:** reprodukováno 2× · skeptik:

### ROD-14 · Nízká · Soukromí a bezpečnost · Obnova plánu z `localStorage` bez validace; formulář předvyplněný smyšlenými příjmy
- **Kde:** `app.js:203–204` (`stav = {…VYCHOZI_VSTUP, …ulozeny}` bez kontroly typů), `rodina.js:166–182` (`VYCHOZI_VSTUP` 40 000 / 50 000 Kč, otcovská zapnutá).
- **Reprodukce:** podvržený záznam `{"rpVyse":"<img …>","kdoPpm":"<img …>"}` → očekáváno ignorování neplatných hodnot → skutečnost: žádné vložení HTML (vše escapováno, dialog ani `<img>` se neobjevil – `prohlizec.json` F), ale souhrn ukáže „po NaN Kč měsíčně“ a „0 Kč vyčerpáno, 350 000 Kč propadne“. Uložení ukládá i příjmy obou rodičů (`prohlizec.json` G) – jen na výslovné kliknutí, s tlačítkem smazání a větou v patičce; hodnotím jako přijatelné.
- **Dopad na uživatele:** nesmyslný výstup jen při poškozeném úložišti; předvyplněné příjmy mohou uživatele, který formulář přehlédne, nechat počítat s cizími čísly.
- **Doporučená oprava:** při načtení validovat typy a rozsahy (čísla, výčet `kdoPpm`), zvážit prázdné příjmy ve výchozím stavu.
- **Ověření:** reprodukováno 2× · skeptik:

### ROD-15 · Nízká · Nasazení a větve · Chybějící favicon → chyba v konzoli na živém webu
- **Kde:** `index.html` (bez `<link rel="icon">`), workflow kopíruje jen 6 souborů.
- **Reprodukce:** načtení https://frankie851.github.io/rodicovska/ → očekáváno čistá konzole → skutečnost: `GET https://frankie851.github.io/favicon.ico` 404 a „Failed to load resource“ (`prohlizec.json` H; totéž lokálně v `uvod-kontrola.json`). Jiné chyby, cizí požadavky ani cookies nejsou.
- **Dopad na uživatele:** žádný funkční.
- **Doporučená oprava:** přidat `<link rel="icon" href="data:,">` nebo malou ikonu.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
Žádné – repozitář má jen `origin/main` (`git branch -a`, 5. 11. 2026).

## Co se nepodařilo ověřit a předpoklady
- **§ 22 odst. 2 ZNP (přepočet od 1. ledna):** text zákona je jednoznačný, ale aktuální stránky ČSSZ/MPSV o PPM 2026 pravidlo výslovně nezmiňují; druhým zdrojem je jen stránka MPSV s příklady přechodu 2008/2009 (stejný mechanismus). Předpoklad u ROD-03: pro strop RP se u matky na PPM bere její DVZ z PPM redukovaný hranicemi roku narození („k datu narození“); praxi potvrzení ČSSZ/ÚP jsem neověřil.
- **„6. měsíc dítěte“ v zadání** vykládám jako index 6 (měsíc narození = 0), stejně jako aplikace; při výkladu „šestý měsíc života“ by správná hodnota byla ještě o měsíc jiná.
- **Tvrzení README o shodě s kalkulačkou MPSV v 80 případech** jsem neověřil (xlsx jsem nestahoval); 5 referenčních hodnot v `test/mpsv-kalkulacka.test.js` souhlasí s mým výpočtem.
- **Odkaz na e-Sbírku (185/2026 Sb.)** vrací přes curl jen kostru (1 040 B); v prohlížeči jsem ho neotevíral, hodnoty sdělení jsou ověřené přes zakonyprolidi.cz (PR-36).
- **mpsv.gov.cz** vrací pro existující stránky HTTP 200 s obsahem a pro neexistující 404 (ověřeno kontrolní adresou), takže odkazy MPSV v patičce považuji za funkční.
- **Scénář dvou procesů v prohlížeči (reprodukováno 2×)** jsem u scénářů D–G provedl v jednom novém načtení; u A a B ve dvou nezávislých bězích se shodným výsledkem.
- Vyloučené dny, kratší pojištění (§ 18 odst. 4–6 ZNP) a OSVČ aplikace vědomě neřeší a říká to – nehodnotím jako nález.

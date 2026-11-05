# Revize: Výpověď 2026 (`frankie851/vypoved-2026`)
Revidovaný commit: `e5c7b54d4138fc0f89581c7a6adf4442d780fa4c` (5. 11. 2026) · živý web: https://frankie851.github.io/vypoved-2026/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Konec výpovědní doby, odstupné 1×/2×/3× i podpora 2026 (5/8/11 měsíců, 80/50/40 %, strop 38 537 Kč, zaokrouhlení nahoru, výběr sady podle data žádosti, návrh z tisku 300 oddělený a označený) počítá aplikace správně a všech 7 příkladů ze zadání sedí v modulu i na obrazovce; výpočetní modul je čistý a bez DOM, web nic neodesílá ani neukládá, axe 0 porušení, žádné přetékání na 360 px. Nejvážnější je VYP-01: aplikace používá rozdělení § 52 písm. d)/e) platné do 31. 5. 2025, takže u výpovědi podle písm. d) z obecných zdravotních důvodů ukáže „zákonné minimum odstupného“ 12× výdělku (např. 480 000 Kč), které nenáleží, u písm. e) ukáže 0 Kč místo 12× podle § 67 odst. 3 a u pracovního úrazu označí jednorázovou náhradu podle § 271ca za odstupné; testy a README tuto chybu zakonzervovaly. Dále (VYP-02) u výpovědi podle § 52 písm. h) aplikace vykreslí plnou tabulku podpory a tvrdí, že způsob skončení podporu neovlivňuje, ačkoli § 39 odst. 2 ZoZ nárok vylučuje.
Nálezy: Kritická 1 · Vysoká 1 · Střední 3 · Nízká 4

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🔴 | VYP-01 (§ 52 d)/e), § 67 odst. 3, § 271ca); dále VYP-02, VYP-05, VYP-08 |
| 2 Výpočty | 🔴 | VYP-01 |
| 3 Shoda se zadáním | 🟡 | — (zadání samo pomíjí § 67 odst. 3 a § 271ca – chyba v zadání; porovnání s kalkulačkou ÚP nedoloženo) |
| 4 Testy | 🟡 | VYP-04 |
| 5 Mobil a přístupnost | 🟡 | VYP-03 („40.000“ → 40 Kč bez hlášky) |
| 6 Texty a citlivá témata | 🔴 | VYP-02 („Způsob skončení … výši podpory neovlivňují“ u § 52 h)) |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | — (VYP-09 jen kosmetika) |

## Pravidla
Všechny hodnoty ověřeny 5. 11. 2026 proti textům na zakonyprolidi.cz (výňatky v `dukazy/vypoved-2026/zdroje.txt`); ID odkazují na `pravidla.md`. ZP = zákon č. 262/2006 Sb. (znění od 1. 11. 2026), ZoZ = zákon č. 435/2004 Sb. (znění od 1. 7. 2026).

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Počátek výpovědní doby dnem doručení | `rules.json:10`, `vypoved.js:137` (`pricistMesice(doruceni, …)`) | „začíná dnem, v němž byla výpověď doručena druhé smluvní straně“ | ZP § 51 odst. 1, https://www.zakonyprolidi.cz/cs/2006-262#p51 (PR-01); 2. zdroj 120/2025 Sb. čl. I bod 8 | 5. 11. 2026 | shodné |
| Konec: den se stejným číslem, jinak poslední den měsíce | `rules.json:11`, `vypoved.js:36–44` | „končí dnem, který se s tímto dnem číslem shoduje; není-li takový den v posledním měsíci, … poslední den měsíce“ | ZP § 51 odst. 1 (PR-02) | 5. 11. 2026 | shodné (31. 12. 2026 → 28. 2. 2027, 31. 1. → 31. 3., 31. 12. 2027 → 29. 2. 2028 ověřeno přepočtem) |
| Základní délka 2 měsíce | `rules.json:7` `zakladniMesice: 2` | nejméně 2 měsíce | ZP § 51 odst. 2 (PR-03) | 5. 11. 2026 | shodné; delší sjednaná doba (odst. 3) se nepočítá, patička to říká |
| Kratší doba 1 měsíc u § 52 písm. f)–h) | `rules.json:8–9` `kratsiMesice: 1`, `kratsiDuvody: ["f","g","h"]`; `vypoved.js:121` | 1 měsíc „z důvodu uvedeného v § 52 písm. f) až h)“ | ZP § 51 odst. 2 písm. a) (PR-04) | 5. 11. 2026 | shodné (přesně f, g, h; a)–e) a výpověď zaměstnance 2 měsíce) |
| Výpovědní důvody § 52 písm. d) a e) | `index.html:42–43`: d) „pracovní úraz nebo nemoc z povolání“, e) „dlouhodobě nemohu dělat svou práci (jiné důvody)“ | d) = dlouhodobá zdravotní nezpůsobilost podle lékařského posudku (bez rozlišení příčiny); e) = dosažení nejvyšší přípustné expozice | ZP § 52 písm. d), e) ve znění 120/2025 Sb. čl. I bod 9 (PR-06) | 5. 11. 2026 | **NEshoda** – popisky podle znění do 31. 5. 2025 – VYP-01 |
| Zrušení ve zkušební době – konec dnem doručení | `rules.json:15–17`, `vypoved.js:131`, `index.html:62` | PP skončí dnem doručení zrušení, není-li v něm uveden den pozdější; zákaz v prvních 14 dnech DPN | ZP § 66 odst. 1–2 (PR-07) | 5. 11. 2026 | shodné (pozdější den a 14 dnů DPN aplikace neřeší – VYP-06) |
| Odstupné 1×/2×/3× podle trvání PP (< 1 / ≥ 1 a < 2 / ≥ 2 roky) u § 52 a)–c) nebo dohody z týchž důvodů | `rules.json:19–24`, `vypoved.js:166–171` (`delkaLet < doLet`) | nejméně 1× (< 1 rok), 2× (≥ 1 a < 2), 3× (≥ 2) průměrného výdělku | ZP § 67 odst. 1 písm. a)–c) (PR-08) | 5. 11. 2026 | shodné včetně hranic přesně 1 a 2 roky (přepočet O1–O6) |
| Započtení předchozího PP u téhož zaměstnavatele (do 6 měsíců) | nikde (`grep "6 měsíc"` → nic) | do doby trvání se počítá i předchozí PP, skončil-li nejvýše 6 měsíců před vznikem nového | ZP § 67 odst. 2 (PR-09) | 5. 11. 2026 | chybí – VYP-05 |
| Odstupné 12× | `rules.json:26–27` `duvodUraz: "d"`, `nasobekUraz: 12`; `vypoved.js:153–158`; `README.md:30` | nejméně 12× jen u výpovědi z § 52 **písm. e)** nebo dohody z téhož důvodu | ZP § 67 odst. 3 (PR-10) | 5. 11. 2026 | **NEshoda** – aplikace 12× u d) a 0 u e) – VYP-01 |
| Jednorázová náhrada 12× při skončení PP pro pracovní úraz / nemoc z povolání | prezentováno jako „odstupné“ u § 52 d) (`vypoved.js:157`) | jednorázová náhrada 12× průměrného měsíčního výdělku u § 52 písm. d) z důvodu pracovního úrazu, nemoci z povolání nebo jejího ohrožení; není to odstupné | ZP § 271ca odst. 1 (PR-11) | 5. 11. 2026 | částka shodná jen pro úraz/nemoc z povolání, titul špatně – VYP-01 |
| Průměrný výdělek = průměrný hrubý měsíční výdělek | `index.html:76` | průměrný měsíční výdělek (§ 67 odst. 4), hrubý (§ 352) | ZP § 67 odst. 4, § 351–354 (PR-12) | 5. 11. 2026 | shodné |
| Výplata odstupného v nejbližším výplatním termínu | `vypoved.js:272` | po skončení PP v nejbližším výplatním termínu, nedohodnou-li se písemně jinak | ZP § 67 odst. 5 (PR-13) | 5. 11. 2026 | shodné |
| Ochranná doba | `app.js:187` jen upozornění | zákaz výpovědi v ochranné době (§ 53 odst. 1); výpovědní doba se o ochrannou dobu prodlužuje, netrvá-li zaměstnanec na opaku (§ 53 odst. 2); výjimky § 54 | ZP § 53–54 (PR-14) | 5. 11. 2026 | shodné věcně, formulace „o zbytek výpovědní doby“ nepřesná – VYP-06 |
| Náhrada za nevyčerpanou dovolenou jen při skončení PP | `rules.json:30–32`, `vypoved.js:254` | přísluší pouze při skončení PP, ve výši průměrného výdělku | ZP § 222 odst. 2–3 (PR-15) | 5. 11. 2026 | shodné |
| Potvrzení o zaměstnání při skončení PP | `vypoved.js:248` (§ 313) | zaměstnavatel povinen vydat při skončení PP | ZP § 313 odst. 1 (PR-16) | 5. 11. 2026 | shodné |
| Oznámení zdravotní pojišťovně do 8 dnů | `vypoved.js:263–266` (`posunDny(denPo, 8)`) | do 8 dnů ode dne, kdy se stal OBZP / kdy nastala skutečnost rozhodná pro platbu státem | zákon č. 48/1997 Sb. § 10 odst. 4–5, https://www.zakonyprolidi.cz/cs/1997-48#p10 (PR-17) | 5. 11. 2026 | shodné při počítání od dne po skončení (konec + 9); přísnější čtení dává konec + 8 (viz Předpoklady) |
| Podmínka nároku: 12 měsíců pojištění za 2 roky | `app.js:189`, `vypoved.js:260` | doba důchodového pojištění alespoň 12 měsíců v posledních 2 letech | ZoZ § 39 odst. 1 písm. a), § 41 odst. 1, https://www.zakonyprolidi.cz/cs/2004-435#p39 (PR-18) | 5. 11. 2026 | shodné |
| Vyloučení nároku po skončení PP pro zvlášť hrubé porušení povinností (§ 52 písm. g) ve variantě zvlášť hrubého porušení, písm. h)) | nikde; `app.js:189` naopak „Způsob skončení … výši podpory neovlivňují“ | nárok nemá uchazeč, s nímž byl v posledních 6 měsících skončen pracovněprávní vztah pro porušení povinnosti zvlášť hrubým způsobem (písm. a)) nebo pro porušení jiné povinnosti podle § 301a ZP zvlášť hrubým způsobem (písm. b), pozn. 79 = § 52 písm. h) ZP) | ZoZ § 39 odst. 2 písm. a), b); 2. zdroj zákon č. 365/2011 Sb. (vložení písm. b)), https://www.zakonyprolidi.cz/cs/2011-365 | 5. 11. 2026 | **chybí** – VYP-02; v rejstříku není (doplnit) |
| Žádost do 3 pracovních dnů → podpora ode dne po skončení | `vypoved.js:86–100, 259` | požádá-li do 3 pracovních dnů po skončení zaměstnání, přizná se ode dne následujícího po skončení | ZoZ § 42 odst. 4 (PR-19); ÚP „Co dělat při ztrátě zaměstnání“ | 5. 11. 2026 | shodné (K1–K7: víkendy, 1. 1., 1. 5., 5.–6. 7., 17. 11., Velikonoce 2026/2027 správně) |
| Svátky | `vypoved.js:80–84` (11 pevných + Velký pátek + Velikonoční pondělí) | 7 státních + 6 ostatních svátků | zákon č. 245/2000 Sb. § 1–2 (FD-59) | 5. 11. 2026 | shodné (13 dnů; Velikonoce 2027 = 28. 3. ověřeno dvěma algoritmy) |
| Podpůrčí doba 5 / 8 / 11 měsíců podle věku ke dni žádosti | `rules.json:47–49` `odVeku 0/52/57` | do 52 let 5, nad 52 do 57 let 8, nad 57 let 11 měsíců; rozhoduje věk ke dni podání žádosti | ZoZ § 43 odst. 1–2, § 51a (PR-20); ÚP tabulka „do 52 / 52–57 / nad 57“ | 5. 11. 2026 | shodné; věk přesně 52/57 → delší doba (zákon výslovně neřeší, aplikace upozorňuje) |
| Sazby 80/50/40 % (2+2+zbytek do 52 let; 3+3+zbytek nad 52 let) | `rules.json:47–49` `faze` | § 50 odst. 3 věta první a druhá | ZoZ § 50 odst. 3 (PR-21, PR-22); ÚP; MPSV analýza 1/2026 | 5. 11. 2026 | shodné |
| Rekvalifikace 80 % | neuvádí se | 80 % | ZoZ § 50 odst. 3 věta poslední (PR-23) | 5. 11. 2026 | informativně, aplikace nenabízí |
| Strop podpory 2026 = 0,8 × 48 171 = 38 536,80 → 38 537 Kč | `rules.json:43` `strop: 38537` | průměrná mzda za 1.–3. Q 2025 = 48 171 Kč; nejvýše 0,8násobek | ZoZ § 50 odst. 6; sdělení MPSV č. 537/2025 Sb., https://www.zakonyprolidi.cz/cs/2025-537 (PR-24); 2. zdroj MPSV TZ 31. 8. 2026 („38 537 Kč“) | 5. 11. 2026 | shodné (hranice ověřena: čistý 48 171 Kč bez stropu, 48 172 Kč se stropem) |
| Zaokrouhlení na celé koruny nahoru | `vypoved.js:202` `Math.ceil(Math.round(x·%)/100)` | „zaokrouhluje na celé koruny nahoru“ | ZoZ § 50 odst. 5 (PR-25) | 5. 11. 2026 | shodné (30 001 → 24 001; 12 345,67 → 9 877) |
| Odstupné podporu neodkládá; žádná snížená sazba 45 % | `vypoved.js:272`, `app.js:189` | § 44a a § 44b zrušeny; § 50 odst. 3 bez snížené sazby | ZoZ § 44a (zrušeno), § 50 odst. 3; 120/2025 Sb. čl. VI (PR-26, PR-27) | 5. 11. 2026 | shodné pro rok 2026 (text ale zamlčuje § 39 odst. 2 – VYP-02) |
| Sada 2027 „platný zákon“: stejné sazby, strop předběžně 38 537 Kč | `rules.json:52–67` `predbezne: true` | sdělení o průměrné mzdě za 1.–3. Q 2026 k 5. 11. 2026 nevyhlášeno (Sbírka 2026 do č. 213/2026 bez něj) | ZoZ § 50 odst. 6 (PR-29) | 5. 11. 2026 | správně označeno jako předběžné; hodnota neexistuje |
| Návrh 2027 (tisk 300): 65/50/45 % bez ohledu na věk, strop 0,6× (ilustračně 28 903 Kč), rekvalifikace 60 % | `rules.json:68–82` `jeNavrh: true`, `app.js:178` text „Návrh zatím není zákon“ | tisk 300: vláda 31. 8. 2026, rozeslán 8. 9. 2026, 1. čtení 16. a 20. 10. 2026, ve Výboru pro sociální politiku, 2./3. čtení neproběhla; 0,6 × 48 171 = 28 902,60 → 28 903 Kč | psp.cz https://www.psp.cz/sqw/historie.sqw?o=10&t=300 (WebFetch); MPSV TZ 31. 8. 2026 (PR-28) | 5. 11. 2026 | shodné, jako návrh označeno správně (sloupec „Pokud projde návrh“) |
| Podpora bez zjistitelného výdělku (násobky průměrné mzdy) | neřeší se (čistý 0 → 0 Kč) | 0,4 / 0,2 / 0,15násobek průměrné mzdy | ZoZ § 51 odst. 1 (PR-30) | 5. 11. 2026 | informativně |
| Datum ověření | `rules.json:2` `overeno: "2026-11-05"`, `index.html:135` → `app.js:210` | — | — | — | shodné (patička zobrazuje hodnotu z rules.json) |
| Zdroje v patičce (6 odkazů) | `rules.json:84–91` | epravo 200, up.gov.cz ×2 200, mpsv.gov.cz ×2 200, psp.cz jen přes WebFetch (curl neprojde) | `dukazy/vypoved-2026/zdroje.txt` | 5. 11. 2026 | fungují a odpovídají tvrzením; chybí primární texty zákonů a sdělení 537/2025 Sb. – VYP-08 |

## Nezávislý přepočet
Referenční výpočet od nuly: `dukazy/skripty/vypoved-2026-prepocet.mjs` (bez kódu aplikace); porovnání s modulem `vypoved.js`: `dukazy/skripty/vypoved-2026-porovnani.mjs`, výstup `dukazy/vypoved-2026/prepocet.txt` (2 běhy, shodné; **59 shod / 5 odchylek z 64 případů** – všechny odchylky jsou § 52 d)/e) a hlídání data před 1. 6. 2025). Obrazovka: `dukazy/skripty/vypoved-2026-prohlizec.mjs` → `dukazy/vypoved-2026/prohlizec.json` (2 běhy, 14 scénářů, shodné) a snímky `vysledek-360.png`, `vysledek-1440.png`, `duvod-d-360.png`, `duvod-h-360.png`, `navrh-2027-360.png`, `chyba-360.png`, `xss-dohoda-360.png`, `zivy-360.png`, `zivy-1440.png`.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| zadání: doručení 10. 7. 2026, 2 měsíce | zaměstnanec | 10. 9. 2026 | 2026-09-10 | „10. 9. 2026“, „Výpovědní doba 2 měsíce … čtvrtek“ (`vysledek-360.png`, `vysledek-1440.png`) | ano |
| zadání: 31. 12. 2026, 2 měsíce | zaměstnavatel, § 52 c) | 28. 2. 2027 | 2027-02-28 | „28. 2. 2027“ (`duvod-d-360.png`, zadáno s písm. d)) | ano |
| zadání: § 52 písm. g) → 1 měsíc | doručení 10. 7. 2026 | 10. 8. 2026 | 2026-08-10 | § 52 h): „10. 8. 2026“, „Výpovědní doba 1 měsíc“ (`duvod-h-360.png`) | ano |
| zadání: 1,5 roku, 40 000 Kč, § 52 c) | — | 80 000 Kč (2×) | 80 000 (2×) | „80 000 Kč“, „Organizační důvod (§ 52 písm. c) – 2× průměrný výdělek“ | ano |
| zadání: výpověď zaměstnance | 5 let, 40 000 Kč | 0 Kč | 0 | „0 Kč – Při výpovědi ze strany zaměstnance odstupné nenáleží“ (`navrh-2027-360.png`) | ano |
| zadání: věk 40, čistý 30 000 Kč, žádost 11. 9. 2026 | — | 24 000, 24 000, 15 000, 15 000, 12 000 = 90 000 Kč | totéž, sada 2026 | tabulka 24 000 / 24 000 / 15 000 / 15 000 / 12 000, „Celkem 90 000 Kč“, žádost předvyplněna 11. 9. 2026 | ano |
| zadání: věk 40, čistý 60 000 Kč | žádost 2. 3. 2026 | 38 537, 38 537, 30 000, 30 000, 24 000 Kč (strop) | totéž, 1.–2. měsíc `omezenoStropem` | žádost 1. 3. 2027: „38 537 Kč *“, „38 537 Kč *“, 30 000, 30 000, 24 000, „* Částka je omezena…“ | ano |
| hranice: 31. 1. 2026 + 2 / + 1 měsíc | — | 31. 3. 2026 / 28. 2. 2026 | totéž | — | ano |
| přestupný rok: 31. 12. 2027 + 2; 29. 2. 2028 + 2 | — | 29. 2. 2028; 29. 4. 2028 | totéž | — | ano |
| 30. 12. 2026 + 2; 31. 10. 2026 + 1 (h); 15. 11. 2026 + 2 | — | 28. 2. 2027; 30. 11. 2026; 15. 1. 2027 | totéž | — | ano |
| doručení v sobotu 5. 9. 2026; konec na svátek 17. 11. 2026 | — | 5. 11. 2026; 17. 11. 2026 (víkend/svátek neposouvá) | totéž | — | ano |
| zkušební doba; dohoda (sjednán 31. 7. 2026); neplatné datum 30. 2. | — | den doručení; 31. 7. 2026; chyba | totéž | dohoda s dřívějším koncem → hláška „Sjednaný den skončení nemůže být dřív…“ | ano |
| doručení 15. 5. 2025 (před účinností 120/2025 Sb.) | zaměstnanec | nové pravidlo neplatí (upozornit) | 2025-07-15 bez upozornění | — | odchylka – VYP-07 |
| odstupné: 0,99 / 1 / 1,99 / 2 / 25 let × 30 000 Kč | § 52 a)–c) | 30 000 / 60 000 / 60 000 / 90 000 / 90 000 Kč | totéž | — | ano |
| odstupné: délka 0; hrubý 0 Kč; 1 234,50 Kč × 3 | — | 30 000; 0; 3 703,50 Kč | totéž | — | ano |
| dohoda z důvodu § 52 c); dohoda „jiný“; f)/g)/h); zkušební doba; −1 | — | 120 000; 0; 0; 0; chyba | totéž | — | ano |
| **§ 52 písm. d) – obecný zdravotní důvod**, 5 let, 40 000 Kč | zaměstnavatel | **0 Kč** (§ 67 odst. 1 jen a)–c), odst. 3 jen e), § 271ca jen úraz) | **480 000 Kč (12×)** „Pracovní úraz nebo nemoc z povolání (§ 52 písm. d)“ | „480 000 Kč“ (`duvod-d-360.png`) | **NE** – VYP-01 |
| **§ 52 písm. d) – pracovní úraz**, 0,3 roku, 40 000 Kč | zaměstnavatel | odstupné 0; **jednorázová náhrada § 271ca 480 000 Kč** | 480 000 Kč jako „odstupné“ | „Odstupné (zákonné minimum) 480 000 Kč“ | částka ano, titul NE – VYP-01 |
| **§ 52 písm. e) – nejvyšší přípustná expozice**, 40 000 Kč (výpověď i dohoda) | — | **480 000 Kč** (§ 67 odst. 3) | **0 Kč** „zákonné odstupné nenáleží“ | „0 Kč“ (`prohlizec.json` B-duvod-e) | **NE** – VYP-01 |
| věk 51 / 52 / 56 / 57 / 64, 30 000 Kč | 2026 | 5 / 8 / 8 / 11 / 11 měsíců; 90 000 / 141 000 / 141 000 / 177 000 / 177 000 Kč | totéž (52 a 57 s poznámkou „hraniční věk“) | věk 55 (2027): 8 měsíců, 141 000 Kč (`navrh-2027-360.png`) | ano |
| zaokrouhlení: 30 001 Kč; 12 345,67 Kč | věk 40 | 24 001 …; 9 877, 9 877, 6 173, 6 173, 4 939 Kč | totéž | — | ano |
| hranice stropu: čistý 48 171 Kč / 48 172 Kč | věk 40 | 38 537 bez stropu / 38 537 se stropem | totéž (označení stropu shodné) | — | ano |
| čistý 1 000 000 Kč, věk 60; čistý 0 Kč | — | 11 × 38 537 = 423 907 Kč; 0 Kč | totéž | — | ano (čistý 0 → § 51 ZoZ aplikace neřeší, informativně) |
| žádost 31. 12. 2026 / 1. 1. 2027 / 2025 / 2028 | věk 40, 30 000 Kč | sada 2026 / 2027 předběžně + návrh / chyba / mimo rozsah | totéž | — | ano |
| návrh 2027: věk 40, 30 000 Kč; 60 000 Kč; věk 55, 30 000 Kč | — | 19 500, 19 500, 15 000, 15 000, 13 500 = 82 500; 28 903 ×4, 27 000 = 142 612; 8 měs. 123 000 Kč | totéž | sloupec „Pokud projde návrh“: 19 500 … 123 000 Kč; 28 903 Kč * … 142 612 Kč | ano |
| termíny ÚP: konec 10. 9. 2026; 31. 12. 2026; 25. 3. 2027; 30. 4. 2026; 3. 7. 2026; 4. 4. 2026; 16. 11. 2026 | — | 15. 9. 2026; 6. 1. 2027; 1. 4. 2027; 6. 5. 2026; 9. 7. 2026; 9. 4. 2026; 20. 11. 2026 | totéž | „do 15. 9. 2026“; „do 3. 3. 2027“ (konec 28. 2. 2027) | ano |
| termín zdravotní pojišťovna: konec 10. 9. 2026 | — | 19. 9. 2026 (8 dnů od dne po); přísněji 18. 9. 2026 | 2026-09-19 | „do 19. 9. 2026“ | ano (výklad, viz Předpoklady) |
| vstup „40 000“, „40 000“ (NBSP), „40000,50“, „1.5“ | cs-CZ i en-US | 40 000; 40 000; 40 000,50; 1,5 | — | 80 000 Kč; 80 000 Kč; 80 001 Kč (24 001 Kč); 80 000 Kč | ano |
| vstup „40.000“ / „30.000“ (tečka jako oddělovač tisíců) | cs-CZ i en-US | 40 000 / 30 000 Kč nebo hláška | `cislo()` → 40 / 30 | **„80 Kč“, podpora „24 Kč“, „z čistého výdělku 30 Kč“, bez hlášky** | **NE** – VYP-03 |
| vstup „-1“, „40,5“ (věk), „abc“, „-5“; prázdný formulář | — | hlášky | — | 4 hlášky / 6 hlášek, `role=alert` (`chyba-360.png`) | ano |
| **§ 52 písm. h)**, věk 40, čistý 30 000 Kč | žádost 11. 8. 2026 | upozornit: nárok na podporu nevzniká (§ 39 odst. 2 písm. b) ZoZ) | modul podporu počítá bez ohledu na důvod (`podpora()` důvod nezná) | tabulka 24 000 … 90 000 Kč + „Způsob skončení ani odstupné výši podpory neovlivňují“ (`duvod-h-360.png`) | **NE** – VYP-02 |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl 1: z data doručení a důvodu spočítat poslední den PP | splněno | `vypoved.js:112–137`; přepočet Z1–Z3, V1–V11 shodné; `vysledek-360.png` |
| Cíl 2: zákonné minimum odstupného | částečně | 1×/2×/3× správně (Z4, Z5, O1–O10); § 52 d)/e) a § 271ca špatně – VYP-01 |
| Cíl 3: podpora po měsících podle data podání žádosti | částečně | `vypoved.js:183–233`, Z6, Z7, P1–P17 shodné; u § 52 h) ukazuje podporu, která nenáleží – VYP-02 |
| Cíl 4: kontrolní seznam (zápočtový list, dovolená, ÚP, zdravotní pojišťovna) | splněno | `vypoved.js:241–273`; `vysledek-1440.png`; termíny K1–K7 shodné |
| Čisté HTML + CSS + JS (ES moduly), žádný build ani server | splněno | `index.html:9` `type="module"`, `package.json` bez závislostí; pouze `fetch('rules.json')` z vlastního původu |
| Výpočty v `vypoved.js` (čisté funkce) | splněno | žádné `document`/`window` v `vypoved.js`; modul importován z Node v `vypoved-2026-porovnani.mjs` |
| Parametry v `rules.json` po letech (2026, 2027) se zdrojem a datem; podpora podle data žádosti | splněno | `rules.json:34–83` (2026, 2027, 2027-navrh, `overeno`, `zdroj`); `vyberPravidel` (P12, P13, P16, P17) |
| Testy `node --test`; nasazení GitHub Pages | splněno | `dukazy/vypoved-2026/testy.txt` 24/24; živý web HTTP 200, shoda s main (`zivy-web-vs-main.txt`) |
| „Než začneš psát kód“: tabulka pravidlo → zdroj → datum (VD, kratší VD, zkušební doba, ochranná doba, odstupné, dovolená, podpora 2026 i 2027, maximum) | částečně | `README.md:22–36` a `rules.json` mají pravidla se zdroji a jedním datem; zdravotní důvody d)/e) podle starého znění (VYP-01); ochranná doba jen jako poznámka |
| Pravidlo: VD začíná dnem doručení, končí dnem se stejným číslem, jinak posledním dnem měsíce | splněno | `vypoved.js:36–44`, PR-01/PR-02 |
| Pravidlo: „Odstupné jen při výpovědi z organizačních důvodů (§ 52 a–c) nebo dohodě z týchž důvodů“ | splněno dle zadání, ale **chyba v zadání** | zákon zná i 12× u § 52 e) (§ 67 odst. 3) a náhradu § 271ca; aplikace mezeru vyplnila zastaralým rozdělením (VYP-01) |
| Pravidlo: podpora podle věku ke dni žádosti, strop měsíčně | splněno | `index.html:72` „Věk v den podání žádosti“, `rules.json` strop, P1–P10 |
| Obrazovka 1: formulář (datum doručení, kdo, důvod s popisy, délka PP, hrubý a čistý výdělek, věk, zkušební doba) | splněno | `index.html:20–97`, `uvod-360.png` |
| Obrazovka 2: poslední den velkým písmem, odstupné, tabulka podpory po měsících se součtem | splněno | `index.html:99–119`, `styles.css:.konec` (clamp 2–3 rem), `vysledek-360.png` |
| Obrazovka 3: kontrolní seznam s termíny, lze vytisknout | splněno | tlačítko Vytisknout, `@media print` skrývá formulář, seznam i zdroje viditelné (`prohlizec.json` G-tisk) |
| Obrazovka 4: patička „Orientační výpočet, nejde o právní poradenství“, datum ověření, zdroje | splněno | `index.html:130–141`; datum = `rules.json.overeno`; 6 odkazů funguje (`zdroje.txt`) |
| Kritérium: 10. 7. 2026 → 10. 9. 2026 | splněno | test 1; přepočet Z1; obrazovka |
| Kritérium: 31. 12. 2026 → 28. 2. 2027 | splněno | test 2; Z2; obrazovka |
| Kritérium: § 52 g) → 1 měsíc | splněno | test 4; Z3 |
| Kritérium: 1,5 roku, 40 000 Kč, c) → 80 000 Kč | splněno | test 9; Z4; obrazovka |
| Kritérium: výpověď zaměstnance → 0 | splněno | test 10; Z5; obrazovka |
| Kritérium: věk 40, 30 000 Kč, 2026 → 24 000, 24 000, 15 000, 15 000, 12 000 | splněno | test 15; Z6; obrazovka |
| Kritérium: věk 40, 60 000 Kč → strop 38 537 Kč | splněno | test 16; Z7; obrazovka |
| Web na 360 px bez vodorovného posuvníku | splněno | `scrollWidth 360 = innerWidth` ve všech stavech (prázdný, výsledek, návrh, chyba, živý web) |
| Nic se neukládá ani neodesílá | splněno | žádné `localStorage`/cookies (dump `{}`), žádné cizí požadavky (jen `data:` ikona kalendáře a favicon 404 vlastního původu) |
| Postup: nejdřív tabulka pravidel a schválení; na konci porovnat podporu s kalkulačkou ÚP/MPSV | nelze ověřit / ne | v repozitáři není záznam o schválení ani o porovnání; web ÚP (uradprace.cz) nedostupný, MPSV kalkulačka nenalezena |

## Nálezy
### VYP-01 · Kritická · Pravidla a data / Výpočty · Zdravotní výpovědní důvody podle znění do 31. 5. 2025: 12× „odstupné“ u § 52 písm. d), 0 Kč u písm. e), náhrada § 271ca vydávána za odstupné
- **Kde:** `rules.json:26–28` (`duvodUraz: "d"`, `nasobekUraz: 12`, `zdroj: "§ 67 odst. 1"`), `vypoved.js:153–158` a `:161–163`, `index.html:42–43` (popisky d) „pracovní úraz nebo nemoc z povolání“, e) „jiné důvody“), `app.js:44` (nápověda u dohody), `README.md:30`, `vypoved.test.js:109–123`
- **Reprodukce:** (a) modul `odstupne({kdo:'zamestnavatel', duvod:'d', delkaLet:5, prumernyHruby:40000})` → očekáváno 0 Kč odstupného: od 1. 6. 2025 (120/2025 Sb. čl. I bod 9) je písm. d) jednotný důvod „pozbyl … dlouhodobě způsobilost konat dále dosavadní práci“ bez rozlišení příčiny; odstupné přísluší jen u § 52 a)–c) (§ 67 odst. 1) a 12× jen u písm. e) (§ 67 odst. 3); u písm. d) náleží 12× pouze jako jednorázová náhrada podle § 271ca, a to jen je-li příčinou pracovní úraz, nemoc z povolání nebo její ohrožení (https://www.zakonyprolidi.cz/cs/2006-262#p67, #p271ca) → skutečnost 480 000 Kč, text „Pracovní úraz nebo nemoc z povolání (§ 52 písm. d) – nejméně 12× průměrný výdělek“. (b) `duvod:'e'` (výpověď i dohoda), 40 000 Kč → očekáváno 480 000 Kč (§ 67 odst. 3) → skutečnost 0 Kč „zákonné odstupné nenáleží“. (c) Obrazovka: doručení 31. 12. 2026, důvod d), 5 let, 40 000 Kč → „Odstupné (zákonné minimum) 480 000 Kč“ (`duvod-d-360.png`); po přepnutí na e) „0 Kč“ (`prohlizec.json` B-duvod-d, B-duvod-e). Přepočet O11–O14 v `prepocet.txt`.
- **Dopad na uživatele:** Zaměstnanec s výpovědí podle § 52 písm. d) z běžných zdravotních důvodů (po 1. 6. 2025 nejčastější zdravotní důvod) uvidí nárok na 12 platů, který nemá, a může podle něj odmítnout dohodu nebo plánovat finance; zaměstnanec s výpovědí podle písm. e) uvidí 0 Kč a o 12násobek si neřekne; u úrazu je plnění označeno špatným titulem (jiný režim vracení podle § 68, jiný vztah k § 77 odst. 2).
- **Doporučená oprava:** Popisky v `index.html`: d) „Zdraví: podle lékařského posudku nemohu dlouhodobě dělat svou práci – § 52 písm. d)“, e) „Dosáhl/a jsem nejvyšší přípustné expozice – § 52 písm. e)“. U d) doplnit přepínač příčiny (pracovní úraz / nemoc z povolání / její ohrožení → zobrazit zvlášť „Jednorázová náhrada podle § 271ca: 12× průměrný měsíční výdělek“, odstupné 0; jinak 0 Kč). V `rules.json` nahradit `duvodUraz` za `duvodExpozice: "e"` (§ 67 odst. 3) a `nahrada271ca: {duvod:"d", nasobek:12}`, opravit `zdroj`; upravit `odstupne()` a texty v `app.js:44`, README a testy 13–14 (viz VYP-04).
- **Ověření:** reprodukováno 2× (modul: 2 běhy `porovnani`; obrazovka: 2 běhy `prohlizec`) · skeptik: Potvrzeno (Opus, 5. 11. 2026 – odstupne() reprodukováno: d) → 480 000 Kč, e) → 0 Kč u výpovědi i dohody; § 52 písm. d)/e), § 67 odst. 3 a § 271ca odst. 1 v platném znění potvrzují nález)

### VYP-02 · Vysoká · Texty a citlivá témata / Pravidla a data · U výpovědi podle § 52 písm. h) (a g) pro zvlášť hrubé porušení) aplikace ukáže plnou podporu a tvrdí, že způsob skončení podporu neovlivňuje
- **Kde:** `app.js:189` („Způsob skončení ani odstupné výši podpory neovlivňují.“), `vypoved.js:225–233` (`podpora()` důvod skončení vůbec nedostává), `index.html:45–46`
- **Reprodukce:** doručení 10. 7. 2026, zaměstnavatel, důvod h), věk 40, čistý 30 000 Kč → očekáváno upozornění, že podle § 39 odst. 2 písm. b) ZoZ nárok na podporu nemá uchazeč, s nímž byl v posledních 6 měsících skončen pracovněprávní vztah pro porušení jiné povinnosti podle § 301a ZP zvlášť hrubým způsobem (pozn. 79 = § 52 písm. h) ZP; https://www.zakonyprolidi.cz/cs/2004-435#p39, 2. zdroj zákon č. 365/2011 Sb.), a obdobně u písm. g), šlo-li o porušení zvlášť hrubým způsobem (§ 39 odst. 2 písm. a)) → skutečnost: tabulka 24 000, 24 000, 15 000, 15 000, 12 000 Kč, „Celkem 90 000 Kč“, poznámka „Způsob skončení ani odstupné výši podpory neovlivňují“ (`duvod-h-360.png`, `prohlizec.json` B-duvod-h).
- **Dopad na uživatele:** Člověk propuštěný pro zvlášť hrubé porušení počítá s 90 000 Kč podpory, kterou mu úřad práce nepřizná; věta o způsobu skončení je u citlivého tématu zavádějící (platí jen pro zrušení 45% sazby a § 44a).
- **Doporučená oprava:** U důvodu h) nahradit tabulku podpory upozorněním „Při skončení pro zvlášť hrubé porušení povinností v posledních 6 měsících nárok na podporu nevzniká (§ 39 odst. 2 ZoZ)“; u g) přidat dotaz „šlo o zvlášť hrubé porušení (důvod pro okamžité zrušení)?“ nebo aspoň upozornění; větu v `app.js:189` přeformulovat („Výpověď dohodou ani odstupné podporu nesnižují ani neodkládají; výjimkou je skončení pro zvlášť hrubé porušení povinností – § 39 odst. 2 ZoZ“); doplnit § 39 odst. 1 písm. c) (poživatel starobního důchodu).
- **Ověření:** reprodukováno 2× (2 běhy `prohlizec`, modul důvod nezná – strukturálně) · skeptik:

### VYP-03 · Střední · Mobil a přístupnost / Výpočty (UI) · „40.000“ se přečte jako 40 Kč – tečka je vždy desetinná, bez hlášky
- **Kde:** `app.js:20–24` (`cislo()`: odstraní mezery, čárku změní na tečku, regex `^\d+(\.\d+)?$`), pole `hruby`, `cisty`, `delka` (`index.html:68–82`)
- **Reprodukce:** hrubý „40.000“, čistý „30.000“, 1,5 roku, § 52 c), věk 40 → očekáváno 40 000 / 30 000 Kč (český zápis s tečkou jako oddělovačem tisíců), nebo hláška → skutečnost: „Odstupné 80 Kč“, podpora „24 Kč“, „Počítáno z čistého výdělku 30 Kč“, žádná hláška; stejně v cs-CZ i en-US (`prohlizec.json` E-cisla-cs-CZ / E-cisla-en-US, „tecka tisice 40.000“). Ostatní zápisy („40 000“, NBSP, „40000,50“, „1.5“) fungují.
- **Dopad na uživatele:** Nesmyslně nízké částky bez vysvětlení; uživatel zápis s tečkou v tisících používá běžně (výplatní pásky, banky).
- **Doporučená oprava:** V `cislo()` považovat tečku následovanou přesně třemi číslicemi (a bez čárky) za oddělovač tisíců, nebo zápis s tečkou odmítnout hláškou „Desetinnou část oddělte čárkou“; přidat kontrolu rozumného rozsahu výdělku (např. < 1 000 Kč → upozornění).
- **Ověření:** reprodukováno 2× · skeptik:

### VYP-04 · Střední · Testy · Testy zakonzervují chybu § 52 d)/e); chybějící testy parsování vstupu a hraničních stavů UI
- **Kde:** `vypoved.test.js:109–113` (test „§ 52 písm. d) (pracovní úraz) → 12×“ očekává 480 000), `:115–123` (očekává 0 u písm. e)); `app.js:20–24` (`cislo()` mimo testovatelný modul); chybí test pro § 39 odst. 2 ZoZ (VYP-02), pro „40.000“ (VYP-03), pro věk 52/57 ve spojení se stropem a pro `konecDohody < doruceni` (jen v UI)
- **Reprodukce:** `npm test` → 24/24 prošlo (`testy.txt`), přestože modul dává u d) 480 000 Kč a u e) 0 Kč v rozporu s § 67 odst. 3 a § 271ca → testy ověřují špatnou hodnotu.
- **Dopad na uživatele:** Nepřímý – zelené testy budí dojem ověřeného výpočtu a oprava VYP-01 bez změny testů selže.
- **Doporučená oprava:** Testy 13–14 přepsat (d) obecný → 0; d) úraz → náhrada § 271ca 12×; e) → odstupné 12×); přesunout `cislo()` do `vypoved.js` a otestovat („1 500“, „1500,50“, „40.000“, „-1“, „abc“); přidat test § 39 odst. 2 a test pro `konecDohody < doruceni`.
- **Ověření:** reprodukováno 2× (2 běhy porovnání) · skeptik:

### VYP-05 · Střední · Pravidla a data / Texty · Chybí § 67 odst. 2 – započtení předchozího pracovního poměru u téhož zaměstnavatele
- **Kde:** `index.html:67–69` (nápověda „Ke dni skončení. Půl roku = 0,5.“), `rules.json:19–29`, `README.md`
- **Reprodukce:** uživatel s PP 0,8 roku, který u téhož zaměstnavatele pracoval do 3 měsíců před nástupem další 2 roky, zadá „0,8“ → očekáváno: nápověda, že se započítává i předchozí PP, skončil-li nejvýše 6 měsíců před vznikem nového (ZP § 67 odst. 2, https://www.zakonyprolidi.cz/cs/2006-262#p67; PR-09), tedy 3× → skutečnost 1× (30 000 Kč místo 90 000 Kč); aplikace nikde § 67 odst. 2 nezmiňuje (`grep` v repu bez výsledku).
- **Dopad na uživatele:** Podhodnocené odstupné u lidí s opakovaným zaměstnáním u téhož zaměstnavatele (agenturní, sezonní, návrat po krátké pauze).
- **Doporučená oprava:** Do nápovědy pole délky: „Počítejte i předchozí pracovní poměr u stejného zaměstnavatele, pokud mezi nimi nebyla pauza delší než 6 měsíců (§ 67 odst. 2 ZP).“ a totéž do README/rules.json.
- **Ověření:** reprodukováno 2× (grep, obrazovka) · skeptik:

### VYP-06 · Nízká · Texty a citlivá témata · Drobné nepřesnosti textů (ochranná doba, zkušební doba, „praxe úřadu práce“)
- **Kde:** `app.js:187` („pracovní poměr se prodlouží o zbytek výpovědní doby“), `app.js:184` („dosavadní praxe úřadu práce“ bez zdroje), `index.html:62` a `vypoved.js:131` (zrušení ve zkušební době vždy = den doručení, bez možnosti zadat pozdější den; § 66 odst. 1 – zákaz zrušení v prvních 14 dnech DPN – nezmíněn), `app.js:189` (poživatel starobního důchodu nemá nárok – § 39 odst. 1 písm. c) ZoZ – chybí)
- **Reprodukce:** § 53 odst. 2 ZP: „ochranná doba se do výpovědní doby nezapočítává; pracovní poměr skončí teprve uplynutím zbývající části výpovědní doby po skončení ochranné doby“ – prodloužení je o délku ochranné doby, ne „o zbytek výpovědní doby“; hraniční věk 52/57 opírá aplikace o „praxi ÚP“, doložitelná je jen tabulka ÚP „52–57 let → 8 měsíců“ (`zdroje.txt`).
- **Dopad na uživatele:** Mate, ke škodě nevede (patička i poznámka správně odkazují na § 53/§ 54).
- **Doporučená oprava:** Přeformulovat poznámku k § 53 („konec se posune o dobu, po kterou trvala ochranná doba“); u hraničního věku citovat tabulku ÚP; u zkušební doby umožnit zadat pozdější den z oznámení a zmínit 14 dnů DPN; doplnit starobní důchod k podmínkám podpory.
- **Ověření:** reprodukováno 2× · skeptik:

### VYP-07 · Nízká · Výpočty · Doručení před 1. 6. 2025 a žádost před koncem pracovního poměru nejsou hlídány
- **Kde:** `vypoved.js:129–137` (`konecPomeru` bez kontroly data), `app.js:124–135` (validace `datumZadosti` jen na prázdnost)
- **Reprodukce:** doručení 15. 5. 2025, zaměstnanec → aplikace 15. 7. 2025 podle § 51 ve znění od 1. 6. 2025 (120/2025 Sb. čl. I bod 8 nahradil § 51 celý), bez upozornění, že pro dřívější doručení platilo jiné znění (`prepocet.txt` V12); žádost 15. 12. 2026 u konce 28. 2. 2027 → sada 2026 bez upozornění, že žádost nemůže předcházet skončení.
- **Dopad na uživatele:** Okrajové (v listopadu 2026 už takové PP skončily; žádost před koncem je chyba zadání).
- **Doporučená oprava:** Hláška pro `doruceni < 2025-06-01` („Kalkulačka počítá výpovědi doručené od 1. 6. 2025“) a pro `datumZadosti <= konec`.
- **Ověření:** reprodukováno 2× · skeptik:

### VYP-08 · Nízká · Pravidla a data · Zdroje jen sekundární; `rules.json` cituje „§ 67 odst. 1“ i pro 12násobek
- **Kde:** `rules.json:84–91` (epravo místo Sbírky/zakonyprolidi pro 120/2025 Sb.; žádný odkaz na text ZP § 51/52/67/271ca, ZoZ § 43/50 ani na sdělení MPSV č. 537/2025 Sb., z něhož plyne strop), `rules.json:28` (`zdroj: "§ 67 odst. 1 zákoníku práce"` u bloku obsahujícího 12×)
- **Reprodukce:** všech 6 odkazů funguje (HTTP 200; psp.cz jen přes prohlížeč – `zdroje.txt`) a obsahově odpovídá; strop 38 537 Kč je doložen jen stránkou ÚP a PDF MPSV, nikoli sdělením 537/2025 Sb.
- **Dopad na uživatele:** Nemění čísla; ztěžuje ověření.
- **Doporučená oprava:** Doplnit https://www.zakonyprolidi.cz/cs/2006-262#p51 (a #p52, #p67, #p271ca), https://www.zakonyprolidi.cz/cs/2004-435#p43 (#p50), https://www.zakonyprolidi.cz/cs/2025-537 a https://www.zakonyprolidi.cz/cs/2025-120; opravit citaci na § 67 odst. 1 a 3.
- **Ověření:** reprodukováno 2× · skeptik:

### VYP-09 · Nízká · Nasazení a větve · Chybějící favicon → chyba 404 v konzoli lokálně i na živém webu
- **Kde:** `index.html` (bez `<link rel="icon">`), živá adresa `https://frankie851.github.io/favicon.ico` → 404
- **Reprodukce:** načtení stránky → konzole „Failed to load resource: 404“ (`uvod-kontrola.json`, `zivy-kontrola.json`, obě rozlišení).
- **Dopad na uživatele:** Žádný (kosmetika, šum v konzoli).
- **Doporučená oprava:** Přidat `<link rel="icon" href="data:,">` nebo malé SVG.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
`claude/vypoved-2026-calculator-4wx7op`: hlava `cd5111e` je rodičem merge commitu `e5c7b54` (PR #1), `git diff main...origin/claude/vypoved-2026-calculator-4wx7op --stat` je prázdný a `git rev-list --count main..origin/…` = 0 – větev nic nemění, žádný nález neřeší. Doporučení: smazat (už sloučena). GitHub workflow v repozitáři není (`.github` chybí), Pages se nasazují z větve; živý web HTTP 200, SHA-256 všech souborů shodné s `main` (`zivy-web-vs-main.txt`), konzole jen favicon 404, žádné cizí požadavky, axe 0, přetékání 0 (`zivy-kontrola.json`).

## Co se nepodařilo ověřit a předpoklady
- **Porovnání s kalkulačkou ÚP/MPSV** (požadavek zadání): uradprace.cz nedostupný, na up.gov.cz/mpsv.gov.cz kalkulačka nenalezena (3 pokusy); nahrazeno vlastním přepočtem podle zákona a tabulky ÚP.
- **psp.cz** jen přes WebFetch (curl selže); stav tisku 300 (1. čtení 16. a 20. 10. 2026, ve výboru) převzat odtud.
- **Strop podpory 2027** neexistuje (sdělení MPSV za 1.–3. Q 2026 nevyhlášeno; Sbírka 2026 do č. 213/2026) – aplikace správně označuje jako předběžný (PR-29).
- **Hraniční věk přesně 52 / 57 let**: zákon („do 52 let“ / „nad 52“) hraniční den výslovně neřeší; tabulka ÚP uvádí „52–57 let → 8 měsíců“; aplikace volí delší dobu a upozorňuje – nehodnoceno jako nález.
- **Lhůta 8 dnů pro zdravotní pojišťovnu**: aplikace počítá od dne po skončení PP (konec + 9); přísnější čtení § 10 odst. 5 zákona č. 48/1997 Sb. dává konec + 8. Předpoklad: rozhodná skutečnost (stát se OBZP) nastává dnem po skončení – nehodnoceno jako nález, jen poznámka.
- **Historické znění § 51 ZP před 1. 6. 2025** nebylo na zakonyprolidi.cz bez JavaScriptu dostupné; doloženo jen tím, že 120/2025 Sb. čl. I bod 8 nahradil § 51 celý (VYP-07 proto formulován bez tvrzení o přesném starém výpočtu).
- **Druhý zdroj k § 39 odst. 2 ZoZ**: stránky ÚP/MPSV o podpoře nebyly nalezeny (4 URL 404); jako 2. zdroj použit text novely č. 365/2011 Sb., která písm. b) vložila.
- **Postup ze zadání** (tabulka pravidel → schválení → kód) nelze z repozitáře doložit (3 commity, bez PR diskuse v klonu).
- Testovací vstupy jsou smyšlené; náhodný výběr 2 lokalizací (cs-CZ, en-US) pro zadávání čísel – pole jsou `type=text`, takže se lokalizace neprojevila.

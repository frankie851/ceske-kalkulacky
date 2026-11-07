# Zadání: Zdaním to? (prodej akcií, ETF a kryptoaktiv + dividendy ze zahraničí)

Zdaním to? ke každému prodeji akcií, ETF nebo kryptoaktiv řekne, jestli je osvobozený od daně,
a hlídá roční limit příjmů. Druhá záložka připraví dividendy ze zahraničí do přiznání:
přepočet na koruny, česká daň, zápočet zahraniční daně a doplatek po zemích.

Vychází z řádku „Zdaním to?“ v tabulce „Další nápady na aplikace“ a z oddílu
„Zadání pro Claude Code: Dividendy ze zahraničí“ v `docs/zadani.md` a z promptu vlny 3
v `docs/zadani-faze-2.md`.

> **Stav (6. 11. 2026):** pravidla jsou **ověřená z oficiálních textů** podle souboru
> `zdanim-to-overeni-2026.json`, který dodal uživatel. Zdroje: ZDP v úplném znění z e-Sbírky
> od 1. 8. 2026, pokyny GFŘ a smlouvy o zamezení dvojího zdanění. Hodnoty v `rules.json`
> jsou převzaté jen z tohoto souboru. Jedinou výjimkou je sazba 15 % u § 8 a § 10, která je
> ze schválené tabulky pravidel. Položky se stavem „nejasné“ se počítají podle doporučení
> ze souboru a v UI mají vždy viditelné upozornění.
> Předchozí verze tabulky ze sekundárních zdrojů je v historii gitu.
>
> **Doplněno 6. 11. 2026:** pravidla jsou porovnaná s doslovným textem ZDP v úplném znění
> od 1. 8. 2026 (výběr v [`docs/zdroje/zdp-2026-08-01-vyber.md`](zdroje/zdp-2026-08-01-vyber.md):
> § 4 odst. 1 písm. t), u), zj), zk), § 4 odst. 3, § 16, § 16a, § 38f). Pravidla v `rules.json`
> mají citaci (`zdroj.citace`) a stránka ji ukazuje v části „Jak počítáme“. Sazba 15 % je tím
> doložená z § 16 odst. 1 písm. a).
> Po nahrání úplného znění ZDP jsou doplněné i § 8 odst. 4 a 8, § 10 odst. 4 a 5, § 38, § 38g
> a § 38v (oznámení osvobozených příjmů nad 5 000 000 Kč).

## Cíl

Statická stránka v češtině ve dvou záložkách:

1. **Prodeje** (`/penize/zdanim-to/`): ruční zadání prodejů. Řádek obsahuje:
   - druh: cenné papíry, kryptoaktiva, nebo elektronický peněžní token,
   - datum nákupu a datum prodeje,
   - příjem v Kč a náklady v Kč,
   - u krypta zaškrtávátko „termínový prodej sjednaný do 3 let“.

   Výsledek po položkách je jedna z možností:
   - osvobozeno hodnotovým testem,
   - osvobozeno časovým testem,
   - částečně osvobozeno (krypto nad 40 mil. Kč),
   - zdanitelné.

   Souhrn je „Zdaníš X Kč rozdílu“, nebo „Nic nedaníš“.
2. **Dividendy ze zahraničí** (`/penize/zdanim-to/dividendy/`). Vstupy:
   - režim § 8, nebo § 16a (15 %), který platí pro všechny výplaty,
   - způsob přepočtu (za rok 2026 jen denní kurz ČNB),
   - řádky výplat: země, hrubá částka, měna, sražená daň, kurz.

   Výsledek:
   - tabulka po zemích se stropem zápočtu podle smluv,
   - „Doplatíš X Kč“, nebo „Nic nedoplácíš“,
   - přeplacená zahraniční daň,
   - návod k přiznání pro zvolený režim,
   - limity pro podání přiznání.

Nic se neukládá ani neodesílá. Tón: tykání, rodově neutrálně, krátké věty. V patičce stránek
nástroje je věta „Nejde o daňové poradenství. Pravidla ověřena k 6. 11. 2026.“ (datum
z `meta.overeno`).

## Pravidla (podle `zdanim-to-overeni-2026.json`, ověřeno 6. 11. 2026)

| Bod | Pravidlo | Hodnota v `rules.json` | Právní základ, zdroj | Stav |
| --- | --- | --- | --- | --- |
| 1 | Limit 40 mil. Kč jen u kryptoaktiv osvobozených časovým testem, nad limit neosvobozená poměrná část (úhrn − 40 000 000) / úhrn; cenné papíry bez limitu od 1. 1. 2026 | `prodeje.limit40mil.limity = { cenny-papir: null, kryptoaktivum: 40000000 }` | § 4 odst. 3 ZDP ve znění zák. č. 360/2025 Sb. ([PDF](https://www.epravo.cz/_dataPublic/sbirky/2025/Sb_2025_360_PZZ.pdf)) | potvrzeno |
| 2 | Samostatné limity 100 000 Kč pro cenné papíry a kryptoaktiva; elektronický peněžní token je z hodnotového testu vyňatý (písm. zj); časový test (zk) a limit 40 mil. Kč (§ 4 odst. 3) výjimku pro EMT nemají | `prodeje.hodnotovyTest.limity`, `spolecny: false`, typ `emt` s `hodnotovyTest: false` | § 4 odst. 1 písm. t) a zj) ZDP ([FS Krypto 29. 4. 2026](https://financnisprava.gov.cz/assets/cs/prilohy/d-placeni-dani/Krypto-29_4_2026.pdf)) | potvrzeno |
| 2 | Do úhrnu 100 000 Kč se počítají i prodeje splňující časový test | `zahrnoutOsvobozeneCasovymTestem: true` (doporučení: konzervativně + upozornění) | § 4 odst. 1 písm. t), zj) ZDP – „úhrn“ bez výjimky; oficiální metodika FS nenalezena | **nejasné** |
| 3 | Osvobození krypta od 15. 2. 2025 i u krypta nabytého dříve (držba před účinností se započítává); časový test 3 roky; budoucí (termínový) převod uskutečněný do 3 let od nabytí se neosvobozuje – podle § 4 odst. 1 písm. u) **i u cenných papírů** | `prodeje.casovyTest.let = 3`, `prodeje.krypto`, `prodeje.cennePapiry`, pole `terminovy` u všech typů | § 4 odst. 1 písm. zj), zk) ZDP, zák. č. 32/2025 Sb. ([MF](https://mfcr.cz/assets/attachments/2025-01-22_Info-106-99-MF-903-2024-74.pdf)) | potvrzeno |
| 3 | Směna krypto za krypto je zdanitelná (ocenění podle předpisu o oceňování); časový test nepřerušuje výměna vydavatelem, sloučení/splynutí, dědění v řadě přímé / manžel | `prodeje.krypto.smena` (návod u formuláře) | § 10 odst. 1 písm. b) bod 3 ZDP, Informace GFŘ ([PDF](https://financnisprava.gov.cz/assets/cs/prilohy/d-seznam-dani/Info_kryptomeny_GFR.pdf)) | potvrzeno |
| 4 | Zisky a ztráty jen uvnitř druhu (§ 10/1/b/2 cenné papíry, § 10/1/b/3 krypto), záporný výsledek druhu 0, žádný převod ztráty; u částečného osvobození krátit výdaje poměrem | `prodeje.zapocteni` | § 10 odst. 4 ZDP, pokyny k příloze č. 2 ([PDF](https://financnisprava.gov.cz/assets/cs/prilohy/dt-upozorneni-mf-k-tiskopisum/25_5405-P2_MFin_5405-P2_vzor13.pdf)) | potvrzeno |
| 4 | Kód druhu pro krypto v příloze č. 2 (není samostatný kód) | `prodeje.zapocteni.kodKryptaP2` | tamtéž | **nejasné** |
| 5 | Výchozí § 8 odst. 4 (ř. 38, zápočet příloha č. 3 ř. 321–330 → ř. 58); volba § 16a (15 %, příloha č. 4 ř. 414 → ř. 74a, na ř. 38 neuvádět) jen pro všechny příjmy podle § 8 odst. 8 věty první; zápočet zvlášť za každý stát (§ 38f odst. 8); řádky podle tiskopisu 2025 | `dividendy.rezimy` | § 8 odst. 4 a 8, § 16a, § 38f ZDP; [Pokyny k DAP 2025](https://adisspr.mfcr.cz/dpr/adis/idpr_pub/dpf/dp7/doc/pokyny_dap_2025.pdf) | potvrzeno |
| 5 | Zápočet zahraniční daně v režimu § 16a (příloha č. 4) | `rezimy.varianty.par16a.zapocet` (hodnota null) – zápočet jen orientačně | § 38f ZDP; pokyny k příloze č. 4 neotevřeny | **nejasné** |
| 6 | Smluvní sazby pro portfoliové dividendy: USA, Německo, Velká Británie, Irsko, Švýcarsko a Kanada 15 %; Nizozemsko a Francie 10 %; strop zápočtu = smluvní sazba × hrubá dividenda | `dividendy.zeme.*.smluvniSazba` se smlouvou a článkem | SZDZ čl. 10 odst. 2 ([přehled MF](https://mf.gov.cz/cs/zahranici-a-eu/smlouvy-o-zamezeni-dvojiho-zdaneni/prehled-platnych-smluv)), § 38f odst. 3 | potvrzeno; čl. 10 odst. 2 ověřen z textu všech 8 smluv 7. 11. 2026 ([`docs/zdroje/smlouvy-cl10.md`](zdroje/smlouvy-cl10.md)) |
| 6 | W-8BEN (USA) | `zeme.US.w8ben.stav = nejasne`, bez sazeb | „US procedura, neověřeno z CZ zdroje“ | **nejasné** |
| 7 | Jednotný kurz za 2026 nevydán (průměr kurzů ke konci měsíců, nelze před 31. 12. 2026); poslední GFŘ-D-75 za 2025: USD 21,84, EUR 24,66, GBP 28,8, CHF 26,33, CAD 15,61 | `kurzy.jednotny = { 2025: {…}, 2026: null }` | § 38 odst. 7 ZDP, [Finanční zpravodaj 2/2026](https://www.mfcr.cz/assets/attachments/2026-01-14_Financni-zpravodaj-cislo-2-2026.pdf) | potvrzeno |
| 8 | Denní kurz ČNB, nebo jednotný kurz; v jednom období nikdy obojí | `kurzy.kombinovatLze = false` | § 38 odst. 1 písm. b) a odst. 7 ZDP | potvrzeno |
| 9 | Limity přiznání: celkem 50 000 Kč (do 2026) / 100 000 Kč (od 2027), vedle zaměstnání 20 000 / 40 000 Kč | `priznani.limity` | zák. č. 180/2026 Sb. ([PDF](https://www.epravo.cz/_dataPublic/sbirky/2026/Sb_2026_180_PZZ.pdf)), § 38g ZDP | potvrzeno |
| 9 | Zahraniční dividendy a § 16a v limitu přiznání: započítávají se | `priznani.dividendyVLimitu` | § 38g odst. 1 a 2 ZDP; oficiální stanovisko nenalezeno | **nejasné** |
| – | Sazba 15 % pro část základu do 36násobku průměrné mzdy; 23 % nad něj se nepočítá; zaokrouhlení základu na sta Kč dolů se nepočítá | `dane.sazba = 0.15`, `dane.sazba.vyssiSazba` | § 16 odst. 1 a 2 ZDP | potvrzeno |
| – | Jiná země (smlouva není v přehledu): dvojí zdanění se vylučuje podle mezinárodní smlouvy, bez ní zápočet podle § 38f nevzniká | `dividendy.zeme.XX.bezSmlouvy.zapocet = 0` + upozornění | § 38f odst. 1 ZDP | potvrzeno (volba uživatele: opatrně 0) |
| – | Doklady k zápočtu: potvrzení zahraničního správce daně, v odůvodněných případech plátce nebo depozitáře; seznam potvrzení k přiznání | `dividendy.doklady` (kroky návodu) | § 38f odst. 5 a 10 ZDP | potvrzeno |
| – | Osvobozený příjem vyšší než 5 000 000 Kč oznámit správci daně do konce lhůty pro přiznání (u krypta nad 40 mil. jen osvobozená část); pokuta za neoznámení 0,1 % (bez výzvy), 10 % (po výzvě), 15 % (nesplněno) | `prodeje.oznameni.limit = 5000000`, `oznameni.pokuta`, upozornění `oznameni` | § 38v odst. 1, § 38w odst. 1 ZDP | potvrzeno |
| – | Osvobozené příjmy všech prodejů v roce se pro oznámení **sčítají** (volba uživatele, opatrná varianta; zákon mluví o „příjmu“) | `oznameni.scitani = true` | § 38v odst. 1 ZDP | **nejasné** |
| – | Náklady: nabývací cena, u cenných papírů i poplatky za nákup a výdaje spojené s prodejem; u věci ze směny cena podle zákona o oceňování | `prodeje.naklady` (nápověda u formuláře) | § 10 odst. 5 ZDP | potvrzeno |

Nejasné body jsou i v `meta.neovereno`, na stránce v bloku „Co zákon ani finanční správa jasně
neřeší“.

## Výpočet

### Prodeje (`prodeje.js`, čisté funkce)

`osvobozeniProdeje(prodeje, rok, rules)`. Prodej je objekt:

```
{ typ: 'cenny-papir' | 'kryptoaktivum' | 'emt',
  nakup: 'RRRR-MM-DD', prodej: 'RRRR-MM-DD',
  prijem, naklady,     // Kč
  terminovy }          // boolean, jen u typů s terminovy v rules
```

Kontrola údajů:
- neúplná položka má stav `neuplne`,
- prodej z jiného roku má stav `mimo-rok`.

Pořadí výpočtu:

1. **Dva druhy zvlášť** (`rules.prodeje.druhy`): cenné papíry a kryptoaktiva. Typ `emt` patří
   do druhu kryptoaktiva.
2. **Hodnotový test.** Úhrn tvoří všechny hrubé příjmy druhu v roce, i prodeje po 3 letech
   (nejasné, upozornění `uhrn-casovy`). EMT do úhrnu nevstupuje. Když úhrn ≤ limit druhu, mají
   všechny prodeje druhu kromě EMT stav `hodnotovy`.
3. **Jinak časový test** po prodejích. Konec lhůty je stejný den o 3 roky později (když den
   neexistuje, poslední den měsíce). Osvobozený je prodej až po konci lhůty (`osvobozenoOd`).
   Budoucí (termínový) prodej sjednaný do 3 let časový test nesplní (u cenných papírů i krypta). Stav je `casovy`, nebo `zdanitelne`.
4. **Jen kryptoaktiva:**
   - když úhrn příjmů ve stavu `casovy` > 40 mil. Kč, platí `pomer = (úhrn − limit) / úhrn`,
   - tyto položky dostanou stav `castecne`,
   - zdanitelná část = příjem × poměr − náklady × poměr.
5. **Zdanitelný zbytek po druzích:**
   - sečte se zdanitelný rozdíl položek `zdanitelne` a části `castecne`,
   - záporný výsledek druhu = 0,
   - mezi druhy se nic nezapočítává a ztráta se nepřevádí,
   - orientační daň = sazba × součet druhů.
6. **Směna krypto → krypto** se zadává jako prodej. Příjem je hodnota získaného krypta v Kč,
   získané krypto má nový nákup s datem směny (návod u formuláře).

Upozornění ve výsledku:

| Upozornění | Stav |
| --- | --- |
| `uhrn-casovy` | nejasné |
| `kod-krypta-p2` (zdanitelné krypto) | nejasné |
| `krypto-40mil` | potvrzeno |
| `ztraty` | potvrzeno |

### Dividendy (`dividendy.js`, čisté funkce)

`spocitejDividendy(vyplaty, { rok, rezim }, rules)`.
- Výplata je `{ zeme, hruba, mena, srazeno, kurz, zpusobKurzu }`.
- `rezim` je `'par8'` (výchozí), nebo `'par16a'` a platí pro všechny výplaty.

Kurzy:
- `dostupneZpusoby(rules, rok)` vrátí jednotný kurz jen tehdy, když je v `kurzy.jednotny[rok]`.
  Za rok 2026 je to jen denní kurz.
- Kombinace způsobů je chyba `kombinace-kurzu`.
- Jednotný kurz za nevydaný rok je chyba `jednotny-nevydan`.
- Jednotný kurz musí být v jedné měně stejný.

Výpočet:
- Základ = hrubá dividenda × kurz. Česká daň = sazba režimu × základ: § 16a má sazbu
  v `rezimy.varianty.par16a.sazba`, § 8 bere `dane.sazba`.
- Zápočet se počítá zvlášť za každý stát jako min(sražená daň, smluvní sazba × základ, česká
  daň).
- Země bez smlouvy v přehledu („Jiná země“, `bezSmlouvy`): zápočet 0 + upozornění `bez-smlouvy`
  (§ 38f odst. 1: postupuje se podle smlouvy; když ji země s ČR má, zápočet jde podle ní).
- V režimu § 16a má výsledek `zapocetOrientacni: true` a upozornění `zapocet-16a` (nejasné).
- U přeplatku v USA vznikne upozornění `w8ben` (nejasné).
- Doplatek = česká daň − zápočet (min. 0). Přeplaceno = sražená daň − zápočet.

V modulech nejsou žádné částky ani sazby, vše je v `rules.json` (test `bez-cisel`).

## Obrazovky

1. **Prodeje**
   - Karta „Tvoje prodeje“ s řádky a tlačítky „Přidat“ a „Odebrat“. Zaškrtávátko pro
     termínový prodej se ukazuje jen u krypta a EMT.
   - Rozbalovací návod ke směně krypto za krypto.
   - Výsledek: velké číslo, úhrny po druzích, upozornění se štítky stavu a položky s důvodem.
   - Karta „Jak počítáme“: kroky se štítkem Potvrzeno/Nejasné a odkazem na právní základ.
2. **Dividendy**
   - Přepínač „§ 8 / § 16a (15 %)“ a pevný text „Přepočet na koruny: Denní kurz ČNB“
     s poznámkou, že jednotný kurz za 2026 zatím nevyšel.
   - Řádky výplat a tabulka po zemích (u § 16a „Zápočet (orientačně)“) se stropem podle smluv.
   - Upozornění, návod pro zvolený režim s řádky přiznání a tabulka limitů přiznání
     2026 / od 2027.
3. Bez JavaScriptu obě stránky ukážou formulář s ukázkovými hodnotami a výsledek spočítaný při
   sestavení (`data-ukazka`). Po načtení JS se nic neposune, mění se jen čísla.

## Kontrolní příklady

Dividendy, kurz 23 Kč/USD, režim § 8:

| Vstup | Základ | Česká daň | Zápočet | Doplatek | Přeplaceno |
| --- | --- | --- | --- | --- | --- |
| USA, 100 USD, sraženo 15 USD | 2 300 Kč | 345 Kč | 345 Kč | 0 Kč | 0 Kč |
| USA, 100 USD, sraženo 30 USD | 2 300 Kč | 345 Kč | 345 Kč | 0 Kč | 345 Kč |
| 100 USD ze státu bez srážky | 2 300 Kč | 345 Kč | 0 Kč | 345 Kč | 0 Kč |
| Nizozemsko, 100 EUR × 25, sraženo 15 EUR | 2 500 Kč | 375 Kč | 250 Kč (10 %) | 125 Kč | 125 Kč |
| jednotný a denní kurz v jednom roce | chyba s vysvětlením | | | | |

Prodeje:

| Vstup | Výsledek |
| --- | --- |
| Cenný papír, nákup 1. 3. 2022, prodej 2. 3. 2025 za 500 000 Kč | osvobozeno časovým testem (od 2. 3. 2025) |
| Cenný papír, nákup 1. 3. 2022, prodej 1. 3. 2025 | časový test nesplněn (přesně 3 roky) |
| Prodej po 6 letech 60 000 Kč + prodej po 1 roce 30 000 Kč | obojí hodnotovým testem (úhrn 90 000 Kč) |
| Prodej po 6 letech 90 000 Kč + po 1 roce 50 000 Kč | úhrn 140 000 Kč: první časovým testem, druhý zdanitelný; upozornění „nejasné“ (bez prvního by úhrn byl 50 000 Kč) |
| EMT 500 000 Kč + krypto 50 000 Kč | krypto hodnotovým testem (úhrn 50 000 Kč), EMT zdanitelné |
| Krypto po 6 letech, termínový prodej sjednaný do 3 let | zdanitelné |
| Krypto časově osvobozené 30 + 20 mil. Kč, náklady 6 + 4 mil. Kč | poměr 20 %, zdanitelný rozdíl 8 000 000 Kč |
| Cenné papíry po 6 letech 50 mil. Kč | osvobozeno (bez horního limitu) |
| Cenné papíry zisk 50 000 Kč, krypto ztráta 100 000 Kč | zdaní se 50 000 Kč, krypto 0 |

Ukázka na stránce (rok 2026) → „Zdaníš 20 000 Kč rozdílu“:
- ETF koupené 1. 3. 2022 a prodané 2. 3. 2026 za 60 000 Kč: časový test,
- akcie po dvou letech za 120 000 Kč s náklady 100 000 Kč: zdanitelné, úhrn 180 000 Kč,
- krypto za 30 000 Kč: hodnotový test.

Dividendy → „Doplatíš 435 Kč“, přeplaceno v USA 345 Kč:
- USA 100 USD se srážkou 15 USD,
- USA 100 USD se srážkou 30 USD,
- Velká Británie 100 GBP bez srážky.

## Kritéria hotovo

- `npm test` projde, včetně těchto testů:
  - kontrolní příklady,
  - test hodnot proti ověřovacímu souboru,
  - test, že moduly neobsahují natvrdo zapsané částky.
- `npm run test:e2e` projde (`test/e2e/zdanim-to.test.js`):
  - § 16a a návod,
  - termínový prodej a EMT,
  - jen denní kurz,
  - limity,
  - patička,
  - 0 chyb konzole,
  - ukázka bez JS,
  - CLS < 0,05.
- `npm run kontrola` (axe ve světlém i tmavém režimu, 360 px) a Lighthouse výkon ≥ 90,
  přístupnost 100.

## Další kroky

1. Až GFŘ vyhlásí jednotný kurz za 2026, doplnit `kurzy.jednotny["2026"]`. Přepínač způsobu
   přepočtu se pak ukáže sám.
2. Až vyjdou pokyny k přiznání za 2026, ověřit řádky a zápočet v příloze č. 4. Pak zrušit
   „nejasné“ u § 16a.
3. Import CSV z XTB a Trading 212 (`parsers/xtb.js`, `parsers/trading212.js`) s anonymními
   testovacími soubory, později Interactive Brokers a Revolut.
4. Denní kurzy ČNB skriptem do `data/cnb-RRRR.json` (web nevolá ČNB z prohlížeče). Z nich by
   šel i průběžný odhad jednotného kurzu označený „předběžné“.

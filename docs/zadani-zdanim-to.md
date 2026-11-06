# Zadání: Zdaním to? (prodej akcií, ETF a kryptoaktiv + dividendy ze zahraničí)

Zdaním to? ke každému prodeji akcií, ETF nebo kryptoaktiv řekne, jestli je osvobozený od daně,
a hlídá roční limit příjmů. Druhá záložka připraví dividendy ze zahraničí do přiznání:
přepočet na koruny, česká daň, zápočet zahraniční daně a doplatek po zemích.

Vychází z řádku „Zdaním to?“ v tabulce „Další nápady na aplikace“ a z oddílu
„Zadání pro Claude Code: Dividendy ze zahraničí“ v `docs/zadani.md` a z promptu vlny 3
v `docs/zadani-faze-2.md`.

> **Stav (6. 11. 2026):** tabulku pravidel níže **schválil uživatel** a nástroj je zveřejněný.
> Sporné body zůstávají na stránce označené a nástroj je nepočítá, jen na ně upozorní. Oficiální weby
> (financnisprava.gov.cz, e-Sbírka, zakonyprolidi.cz) se z cloudové relace otevřít nedaly,
> pravidla jsou proto ověřená jen ze sekundárních zdrojů. Bez `ZOBRAZIT_SKRYTE=1` web ukazuje
> kartu „Připravujeme“ ze `src/_data/pripravujeme.json`.

## Cíl

Statická stránka v češtině ve dvou záložkách:

1. **Prodeje** (`/penize/zdanim-to/`): ruční zadání prodejů (druh, datum nákupu, datum prodeje,
   příjem v Kč, náklady v Kč). Výsledek po položkách: osvobozeno časovým testem (s datem, od kdy
   test platí), osvobozeno hodnotovým testem, nebo zdanitelné. Souhrn „Zdaníš X Kč rozdílu“, nebo
   „Nic nedaníš“.
2. **Dividendy ze zahraničí** (`/penize/zdanim-to/dividendy/`): rok, způsob přepočtu (denní kurz
   ČNB, nebo jednotný kurz GFŘ), řádky výplat (země, hrubá částka, měna, sražená daň, kurz).
   Výsledek po zemích, „Doplatíš X Kč“ nebo „Nic nedoplácíš“, přeplacená zahraniční daň
   s tipem na W-8BEN a návod k přiznání.

Nic se neukládá ani neodesílá. Tón: tykání, rodově neutrálně, krátké věty.

## Pravidla k ověření a stav (tabulka ke schválení)

Stav: **shoda zdrojů** = víc nezávislých sekundárních zdrojů říká totéž (oficiální text se nepodařilo
otevřít); **sporné** = zdroje se rozcházejí; **neověřeno** = zdroj jsme nenašli.

| # | Pravidlo | Zdroj | Stav | Co s tím nástroj dělá |
| --- | --- | --- | --- | --- |
| 1 | Prodej cenných papírů je osvobozený po **časovém testu > 3 roky** mezi nákupem a prodejem, každá tranše zvlášť (§ 4 odst. 1 ZDP) | TPA, az-data, Finemia, EURODANĚ (dohledal zadavatel), [ARROWS](https://arws.cz/novinky-v-arrows/zdaneni-investicnich-prijmu-2026), [Crowe](https://www.crowe.com/cz/cs-cz/news/zmena-v-limitech-pro-osvobozeni-u-investic) | shoda zdrojů | Počítá (`prodeje.casovyTest.let = 3`), u položky ukáže den, od kterého je prodej osvobozený |
| 2 | **Hodnotový test:** osvobozené, když **úhrn příjmů (ne zisku)** z prodeje za rok nepřesáhne **100 000 Kč** | tytéž zdroje, [ARROWS](https://arws.cz/novinky-v-arrows/zdaneni-investicnich-prijmu-2026) („hrubé příjmy, nikoliv zisk“) | shoda zdrojů | Počítá (`prodeje.hodnotovyTest.limit`) |
| 3 | Hodnotový test zvlášť pro cenné papíry a zvlášť pro kryptoaktiva | [Forvis Mazars](https://www.forvismazars.com/cz/), [Dostupný advokát](https://dostupnyadvokat.cz/en/blog/cryptocurrency-taxation), [BDO](https://www.bdo.cz/) | shoda zdrojů | Počítá dva úhrny |
| 4 | Do úhrnu 100 000 Kč se počítají i příjmy osvobozené časovým testem | – | neověřeno | Počítá je (opatrnější varianta, méně osvobození), píše to u výsledku a v „neověřeno“ |
| 5 | Kryptoaktiva (převody od 15. 2. 2025): časový test 3 roky a hodnotový test 100 000 Kč; neplatí pro kryptoaktiva v podnikání | [Forvis Mazars](https://www.forvismazars.com/cz/), [Dostupný advokát](https://dostupnyadvokat.cz/en/blog/cryptocurrency-taxation), [Crowe](https://www.crowe.com/cz/cs-cz/news/kryptomeny-a-osvobozeni-z-prodeje) | shoda zdrojů | Počítá; podnikání jen jako upozornění |
| 6 | **Limit 40 mil. Kč** pro osvobození časovým testem se od 1. 1. 2026 u cenných papírů **ruší** | TPA, az-data, Finemia, EURODANĚ, [Crowe](https://www.crowe.com/cz/cs-cz/news/zmena-v-limitech-pro-osvobozeni-u-investic), [BusinessInfo](https://www.businessinfo.cz/clanky/prodeje-firem-nad-40-milionu-se-uz-danit-nebudou-pravidla-se-zmeni-od-ledna-2026/), [E15](https://www.e15.cz/finexpert/danove-priznani/od-ledna-plati-novy-limit-pro-zdaneni-prijmu-z-obchodovani-s-cennymi-papiry-a-podily-v-obchodnich-korporacich-1423019) | shoda zdrojů | `limit40mil.cennePapiry = null`, nepočítá se |
| 7 | **Limit 40 mil. Kč u kryptoaktiv zůstává** | ano: TPA, az-data, [Crowe](https://www.crowe.com/cz/cs-cz/news/zmena-v-limitech-pro-osvobozeni-u-investic), [BusinessInfo](https://www.businessinfo.cz/clanky/prodeje-firem-nad-40-milionu-se-uz-danit-nebudou-pravidla-se-zmeni-od-ledna-2026/), [Divly](https://divly.com/cs/guides/zdaneni-kryptomen-v-cesku), [Money](https://money.cz/novinky-a-tipy/rychle-zpravy/limitni-osvobozeni-prijmu-z-prodeje-kryptoaktiva-ve-vysi-40-000-000-kc/) a materiál KV KDP na webu FS ([Krypto 29. 4. 2026](https://financnisprava.gov.cz/assets/cs/prilohy/d-placeni-dani/Krypto-29_4_2026.pdf), znám jen z výtahu vyhledávače); jiné články ho nezmiňují; BDO a EY se liší v tom, zda je limit společný s cennými papíry | **sporné** (převaha zdrojů: zůstává; po otevření materiálu FS lze přepnout na shodu) | Nepočítá. Jen upozornění, když časově osvobozené příjmy z krypta přesáhnou 40 mil. Kč |
| 8 | Zisky a ztráty z prodejů stejného druhu se v roce vzájemně započtou, celkovou ztrátu uplatnit nejde | – | neověřeno | Zdanitelný rozdíl = součet (příjem − náklady) zdanitelných položek druhu, nejméně 0 |
| 9 | Sazba daně 15 % (dividendy i orientační daň z rozdílu; 23 % pro vysoké příjmy se nepočítá) | ZDP § 16, § 36; všechny zdroje k dividendám | shoda zdrojů | `dane.sazba = 0.15` |
| 10 | **Srážka v USA:** 30 % bez W-8BEN, 15 % s ním | [Finex](https://finex.cz/w-8ben-formular/) a další | shoda zdrojů | Tip na W-8BEN u přeplacené daně |
| 11 | **Smluvní sazba USA 15 %** (portfolio dividendy) | Finex, RuleCalc, zadání | shoda zdrojů | `zeme.US.smluvniSazba = 0.15` |
| 12 | Smluvní sazby Německo, Velká Británie, Nizozemsko, Irsko, Francie, Švýcarsko, Kanada | tabulka DAUČ a Patria se z relace nedaly otevřít | **neověřeno** | `null`. Zápočet omezí jen českou daní a upozorní, že může být nižší |
| 13 | **Zápočet** = min(sražená daň, smluvní sazba × základ, česká daň), za každou zemi zvlášť (§ 38f, prostý zápočet) | [Finex](https://finex.cz/zdaneni-dividend-jak-postupovat-pri-vyplneni-danoveho-priznani/), [Finmag](https://www.finmag.cz/finance/309218-investice-a-dane-ii-dividendy), zadání | shoda zdrojů | Počítá, přeplatek nad smluvní sazbou ukáže zvlášť |
| 14 | Přepočet buď **denním kurzem ČNB**, nebo **jednotným kurzem GFŘ**; v jednom roce **nekombinovat** | [DAUČ](https://www.dauc.cz/clanky/13545/drzba-zahranicnich-akcii-fyzickou-osobou-jak-zdanit-vyplacenou-dividendu), zadání | shoda zdrojů | Chyba při kombinaci; u jednotného kurzu musí mít všechny výplaty v jedné měně stejný kurz |
| 15 | **Jednotný kurz GFŘ za 2026** | poslední nalezený pokyn je GFŘ-D-75 za rok 2025 ([Finanční zpravodaj 2/2026](https://www.dauc.cz/aktuality/1727/ministerstvo-financi-financni-zpravodaj-cislo-2-2026)); za 2026 vyjde až v roce 2027 | nevydán | `kurzy.jednotny["2026"] = null`, kurz se zadává ručně |
| 16 | **Kam patří zahraniční dividendy v přiznání:** dílčí základ § 8 + příloha č. 3 (ř. 38), nebo samostatný základ § 16a + příloha č. 4 (ř. 330) | § 8 + př. 3: [Finex](https://finex.cz/zdaneni-dividend-jak-postupovat-pri-vyplneni-danoveho-priznani/); § 16a + př. 4: [RuleCalc](https://rulecalc.com/cs/dan/dan-fo-samostatny-zaklad) | **sporné** | Ukáže obě varianty („podle části zdrojů…“) s čísly a větu, že je třeba ověřit v pokynech k přiznání |
| 17 | **Limity pro povinné přiznání:** dnes 20 000 Kč u příjmů podle § 7–10 vedle zaměstnání, celkový limit 50 000 Kč; od roku 2027 podle zdrojů 40 000 Kč a 100 000 Kč (schválila Sněmovna, další průchod nepotvrzen) | [Podnikatel.cz](https://www.podnikatel.cz/clanky/vyse-prijmu-od-ktere-musite-podat-danove-priznani-vzroste-na-100-tisic-korun/), [BusinessInfo](https://www.businessinfo.cz/clanky/mene-byrokracie-danove-priznani-budou-osvc-podavat-az-od-100-tisic-rocnich-prijmu/), [Money](https://money.cz/novinky-a-tipy/dane/pripravovane-zmeny-v-dani-z-prijmu-fyzickych-osob-pro-rok-2027/) | 2026: shoda zdrojů; 2027: **sporné** | Jen informace se štítkem stavu, nástroj sám povinnost nerozhoduje |
| 18 | Zda se zahraniční dividendy uvádějí v přiznání vždy, nebo se započítávají do limitů v bodě 17 | zdroje se rozcházejí (RuleCalc × Finex) | **sporné** | Jen upozornění |

Co se nepotvrdí shodně z více zdrojů, nástroj nepočítá: ukáže to jako upozornění se štítkem
„Neověřeno“ a odkazem „ověř u finanční správy“. Všechny sporné body jsou v `rules.json`
v `meta.neovereno` (blok „Co zatím neověřujeme a nepočítáme“).

## Výpočet

### Prodeje (`prodeje.js`, čisté funkce)

`osvobozeniProdeje(prodeje, rok, rules)`; prodej = `{ typ: 'cenny-papir' | 'kryptoaktivum',
nakup: 'RRRR-MM-DD', prodej: 'RRRR-MM-DD', prijem, naklady }` (Kč).

1. Kontrola údajů: známý druh, platná data, prodej ne dřív než nákup, částky ≥ 0. Neúplná
   položka dostane stav `neuplne` a do výpočtu se nepočítá.
2. Prodej mimo zvolený rok: stav `mimo-rok`.
3. **Časový test:** konec lhůty = stejný den o `casovyTest.let` let později (když den v měsíci
   neexistuje, poslední den měsíce). Osvobozeno, když je prodej až po konci lhůty. Položka
   dostane datum `osvobozenoOd` (den po konci lhůty).
4. **Hodnotový test:** úhrn příjmů za rok zvlášť pro cenné papíry a kryptoaktiva (včetně příjmů
   osvobozených časovým testem, viz bod 4 tabulky). Když úhrn ≤ limit, jsou ostatní položky druhu
   osvobozené hodnotovým testem.
5. Ostatní položky jsou zdanitelné. Zdanitelný rozdíl druhu = max(0, Σ (příjem − náklady)).
   Orientační daň = sazba × zdanitelný rozdíl.
6. Upozornění (nepočítá se): krypto nad 40 mil. Kč časově osvobozených příjmů (sporné).

### Dividendy (`dividendy.js`, čisté funkce)

`spocitejDividendy(vyplaty, { rok }, rules)`; výplata = `{ zeme, hruba, mena, srazeno, kurz,
zpusobKurzu: 'denni' | 'jednotny' }`.

- Kombinace denního a jednotného kurzu v jednom roce → chyba s vysvětlením. Jednotný kurz musí
  být pro všechny výplaty v jedné měně stejný → jinak chyba. Chybějící kurz se u jednotného
  způsobu doplní z `kurzy.jednotny[rok]`, když existuje; jinak chyba.
- Základ = hrubá dividenda × kurz (Kč). Česká daň = sazba × základ.
- Zápočet = min(sražená daň v Kč, smluvní sazba × základ, česká daň); když smluvní sazba
  není ověřená, jen min(sražená, česká daň) + upozornění.
- Doplatek = česká daň − zápočet (min. 0). Přeplaceno v zahraničí = sražená daň − zápočet.
- Výsledek po zemích a celkem. Zaokrouhlení podle pokynů k přiznání se nepočítá.

V modulech nejsou žádné částky ani sazby, vše je v `rules.json`.

## Obrazovky

1. **Prodeje:** karta „Tvoje prodeje“ s řádky (druh, datum nákupu, datum prodeje, příjem,
   náklady), tlačítka „Přidat prodej“ a „Odebrat“. Výsledek: velké číslo zdanitelného rozdílu,
   věta „Zdaníš X Kč rozdílu“ / „Nic nedaníš“, seznam položek s důvodem („Časový test splněn od
   2. 3. 2025“, „Hodnotový test: úhrn 30 000 Kč z limitu 100 000 Kč“), úhrny po druzích, karta
   sporných bodů se štítkem „Neověřeno“ a odkazem „Ověř u finanční správy“.
2. **Dividendy:** způsob přepočtu (denní / jednotný), řádky výplat, výsledek po zemích
   (tabulka), „Doplatíš X Kč“, přeplaceno v zahraničí s tipem na W-8BEN, návod k přiznání ve
   dvou variantách (§ 8 + příloha 3 / § 16a + příloha 4) s větou, že je třeba ověřit
   v pokynech k přiznání, a limity pro povinné přiznání se štítky stavu.
3. Bez JavaScriptu obě stránky ukážou formulář s ukázkovými hodnotami a výsledek spočítaný při
   sestavení (`data-ukazka`). Po načtení JS se nic neposune, mění se jen čísla.

## Kontrolní příklady

Dividendy, kurz 23 Kč/USD:

| Vstup | Základ | Česká daň | Zápočet | Doplatek | Přeplaceno |
| --- | --- | --- | --- | --- | --- |
| USA, 100 USD, sraženo 15 USD | 2 300 Kč | 345 Kč | 345 Kč | 0 Kč | 0 Kč |
| USA, 100 USD, sraženo 30 USD (bez W-8BEN) | 2 300 Kč | 345 Kč | 345 Kč | 0 Kč | 345 Kč |
| 100 USD ze státu bez srážky | 2 300 Kč | 345 Kč | 0 Kč | 345 Kč | 0 Kč |
| jednotný a denní kurz v jednom roce | chyba s vysvětlením | | | | |

Prodeje:

| Vstup | Výsledek |
| --- | --- |
| Cenný papír, nákup 1. 3. 2022, prodej 2. 3. 2025 | osvobozeno časovým testem (od 2. 3. 2025) |
| Cenný papír, nákup 1. 3. 2022, prodej 1. 3. 2025 | časový test nesplněn (přesně 3 roky) |
| Cenný papír po 2 letech, úhrn příjmů za rok 80 000 Kč | osvobozeno hodnotovým testem |
| Cenný papír po 2 letech, úhrn příjmů 150 000 Kč | zdanitelné |
| Krypto 60 000 Kč + cenné papíry 90 000 Kč v jednom roce | obojí osvobozeno hodnotovým testem (úhrny zvlášť) |

Ukázka na stránce (rok 2026): ETF koupené 1. 3. 2022 a prodané 2. 3. 2026 za 60 000 Kč (časový
test), akcie po dvou letech za 120 000 Kč s náklady 100 000 Kč (zdanitelné, úhrn 180 000 Kč),
krypto za 30 000 Kč (hodnotový test) → „Zdaníš 20 000 Kč rozdílu“.
Dividendy: USA 100 USD se srážkou 15 USD a 100 USD se srážkou 30 USD, Velká Británie 100 GBP
bez srážky → „Doplatíš 435 Kč“, přeplaceno v USA 345 Kč.

## Kritéria hotovo

- `node --test "src/nastroje/zdanim-to/test/*.test.js"` projde včetně kontrolních příkladů
  a testu, že moduly neobsahují natvrdo zapsané částky ani sazby.
- `npx eleventy`: `/penize/zdanim-to/` v `_site` neexistuje, karta „Připravujeme“ zůstává.
- `ZOBRAZIT_SKRYTE=1 npx eleventy --output=_site-vse` a `SITE_DIR=_site-vse` kontrola webu
  i e2e `test/e2e/skryte/zdanim-to.test.js` projdou: kontrolní příklady v UI, přidání a odebrání
  řádku, 0 chyb konzole, ukázka bez JS, nic v `localStorage`.
- Posun rozvržení po načtení CLS < 0,05 (mobil 412 × 823, CPU × 6).

## Další kroky

1. Schválit tabulku pravidel (body 7, 12, 16, 17, 18 jsou sporné nebo neověřené), doplnit
   smluvní sazby z oficiálních textů smluv a jednotný kurz GFŘ za 2026, až vyjde.
2. Teprve pak odstranit `"skryty": true` a záznam v `pripravujeme.json`.
3. Import CSV z XTB a Trading 212 (`parsers/xtb.js`, `parsers/trading212.js`) s anonymními
   testovacími soubory, později Interactive Brokers a Revolut.
4. Denní kurzy ČNB skriptem do `data/cnb-RRRR.json` (web nevolá ČNB z prohlížeče).

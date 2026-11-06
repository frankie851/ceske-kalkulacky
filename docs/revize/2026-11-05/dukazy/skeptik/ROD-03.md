# Skeptik – ROD-03 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Přímým voláním `planRodiny` na commitu 9ff80c3 (porod 20. 1. 2027, matka 80 000 Kč, nástup 9. 12. 2026) vychází denní dávka 1 524 Kč po všech 196 dní, dohromady 298 704 Kč a strop RP 45 717 Kč. Aplikace bere hranice jen k datu nástupu (`rodina.js:94–101`) a jednu `ppmInfo.denni` pro celou PPM (`rodina.js:297–303`). Se stejným DVZ 2 630,14 a hranicemi 2027 z rules.json (1723/2584/5167) vychází redukovaný DVZ 2 254, tedy 1 578 Kč/den, celkem 23 × 1 524 + 173 × 1 578 = 308 046 Kč (rozdíl −9 342 Kč), a strop 0,7 × 30 × 2 254 = 47 334 Kč. Pro příjem 200 000 Kč vychází 2 000 Kč/den místo 2 111 Kč/den, což test `rodina.test.js:108–114` zakonzervovává. § 22 odst. 2 zák. 187/2006 Sb. doslova přikazuje upravit od 1. ledna bez žádosti dávky, na které vznikl nárok před tímto dnem, podle nových redukčních hranic. § 30 odst. 3 písm. b) zák. 117/1995 Sb. váže strop RP na DVZ pro PPM „k datu narození nejmladšího dítěte“, ne k nástupu.

Co jsem udělal: Spustil v Node skript s importem `rodina.js` a `rules.json` pro příjmy 80 000 a 200 000 Kč a přepočítal hranice 2027 přes `redukovanyDvz`. Curlem stáhl ze zakonyprolidi.cz text § 22 odst. 2 zák. 187/2006 Sb. a § 30 odst. 2–3 zák. 117/1995 Sb. Údaj o otcovské (21 876 vs. 21 336 Kč) zvlášť nepřepočítal.

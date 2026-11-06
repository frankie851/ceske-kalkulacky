# Skeptik – SPOT-01 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Příloha č. 6 vyhlášky č. 408/2015 Sb. (zakonyprolidi.cz/cs/2015-408, znění 1. 9. 2026 – 31. 12. 2026) říká doslova: „4 … D01d; D02d; D61d“, „6 … hybridní vytápění – D35d“, „7 … přímotopný systém – D45d; D57d, tepelné čerpadlo – D56d“. Aplikace v `tariffs.json` (`sazbyInfo`) ale přiřazuje D45d/D56d/D57d → TDD6 a D61d → TDD7. Totéž chybné mapování je v komentáři `scripts/update-data.mjs:31` a v README na ř. 107. `app.js` `tddKey()` bere třídu přímo z `sazbyInfo`, takže se načte `data/tdd/TDD6.json`. Přepočet přes `calc.js` s daty z repozitáře dává pro EG.D D56d, 9 MWh, fix 3 500 a marži 400 Kč/MWh s TDD6 (stav aplikace): spot 48 710, dyn 48 476, fix 45 527 Kč. S TDD7 (správně): spot 49 207, dyn 48 933, fix 45 596 Kč. Rozdíl spot − fix je tedy 3 183 místo 3 611 Kč. U ČEZ D57d vychází spot +493 Kč (v nálezu +494, zaokrouhlení) a dyn +453 Kč.

Co jsem udělal: Stáhl vyhlášku 408/2015 ze zakonyprolidi.cz přes curl a vytáhl text přílohy č. 6. V klonu na commitu 1c1f7b2 prošel `tariffs.json`, `app.js`, `scripts/update-data.mjs` a README. Napsal vlastní Node skript, který stejně jako `app.js` volá `calc.js` (`computeVariants` a `regulatedFor`) a spočítá všechny tři varianty s profilem TDD6 i TDD7.

# Skeptik – VYP-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Podle § 39 odst. 2 písm. b) zákona č. 435/2004 Sb. nemá na podporu nárok uchazeč, se kterým zaměstnavatel v posledních 6 měsících před zařazením do evidence skončil pracovní poměr kvůli zvlášť hrubému porušení jiné povinnosti podle § 301a ZP. To je přesně § 52 písm. h) ZP. Písm. a) téhož odstavce platí stejně pro zvlášť hrubé porušení pracovních povinností, tedy pro tu variantu § 52 písm. g). Aplikace ale důvod skončení do výpočtu podpory vůbec nepředává: `app.js:141` volá `podpora({ vek, cistyVydelek: cisty, datumZadosti }, rules)` a `podpora()` ve `vypoved.js:225–233` ho nemá ani v signatuře. Pro věk 40 let a čistý výdělek 30 000 Kč proto vyjde 24 000 / 24 000 / 15 000 / 15 000 / 12 000 Kč, celkem 90 000 Kč, a k tomu bez podmínky věta „Způsob skončení ani odstupné výši podpory neovlivňují.“ (`app.js:189`). Pro důvod h), případně pro zvlášť hrubou variantu g), je tato věta věcně chybná.

Co jsem udělal: Stáhl curlem § 39 ZoZ ze zakonyprolidi.cz a přečetl odst. 1 i 2. Přečetl `app.js`, `vypoved.js` a `index.html` (commit e5c7b54) a v Node spustil `podpora()` s `rules.json` pro věk 40 a 30 000 Kč; výsledek [24000, 24000, 15000, 15000, 12000] = 90 000 Kč.

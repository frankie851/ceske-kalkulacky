# Skeptik – CES-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: § 157 odst. 4 zákona č. 262/2006 Sb. v platném znění (https://www.zakonyprolidi.cz/cs/2006-262#p157) opravdu říká: „Při použití přívěsu k silničnímu motorovému vozidlu zaměstnavatel sazbu základní náhrady za 1 km jízdy zvýší nejméně o 15 %“. Tvrzení aplikace, že se pravidlo „nepodařilo ověřit“, je proto nepravdivé. Na commitu bb4e580 vrací `spocitejCestu` pro 100 km osobním autem v roce 2026 bez přívěsu zakladniHal = 59000 (590,00 Kč při sazbě 5,90 z rules.json). S `prives: true` vyhodí ChybaVstupu z `cesty.js:190–193` místo aspoň 678,50 Kč. Zaškrtávátko v `index.html:91–94` je disabled. README řadí přívěs mezi „záměrně nepočítané“ věci. Test `cesty.test.js:167–171` odmítnutí přímo vynucuje. Zadání přitom žádá „u přívěsu navýšení podle zákona“.

Co jsem udělal: V kopii klonu pustil node skript, který volá `spocitejCestu` s `prives` false a true, a přečetl dotčená místa v kódu, README a testu. Přes curl stáhl zakonyprolidi.cz/cs/2006-262 a v textu dohledal § 157 odst. 4.

# Skeptik – EET-01 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Podle § 14 odst. 5 věty druhé zákona č. 589/1992 Sb. (zakonyprolidi.cz/cs/1992-589, aktuální znění verze 76) je u hlavní činnosti minimální měsíční vyměřovací základ 25 % průměrné mzdy v roce zahájení činnosti a ve 2 následujících letech. Na to odkazuje § 5b odst. 2 písm. a) („§ 14 odst. 5 věty první nebo druhé“). Aplikace s tím nepočítá: `socialIns` v `osvc.js:105–116` bere vždy `socialMinBaseMain` (35 %, `rules.json` `minBaseShareMain: 0.35`), formulář nemá žádnou volbu „začínám podnikat“ a poznámka `noteNotIncluded` (`rules.json:943`) toto zjednodušení neuvádí. Pro 800 000 Kč, paušál 60 % a hlavní činnost vyjde sociální pojistné 63 363 Kč (minimum 216 996 Kč), přiznání 122 371 Kč, paušál 115 944 Kč a doporučení „Ušetříš 6 427 Kč“. Se základem 25 % (12 × 12 916 = 154 992 < 176 000) by vyšlo sociální 51 392 Kč a přiznání 110 400 Kč. Doporučení se tedy obrací. Rozdíl dělá až 18 105 Kč a týká se zisku do zhruba 394 538 Kč.

Dvě drobné nepřesnosti nálezu: paušál v aplikaci vychází 115 944 Kč, ne 115 932 Kč, takže přiznání je levnější o 5 544 Kč, ne o 5 532 Kč. Nález také vynechává výjimku ze zákona: 25 % neplatí, pokud člověk byl OSVČ kdykoli během 20 let před rokem zahájení. Doporučený přepínač by to měl zohlednit.

Co jsem udělal: V Node spustil `compare()` z `/tmp/revize/repos/mam-eet/osvc.js` (commit e5bf47f) s uvedeným vstupem a přepočítal variantu s 25% minimem. Text § 14 odst. 5 a § 5b odst. 2 stáhl curlem ze zakonyprolidi.cz/cs/1992-589.

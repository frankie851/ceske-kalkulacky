# Skeptik – SLV-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Funkce `zvyhodneniDeti()` v `slevy.js` (ř. 101–117) kontroluje jen to, že se dítě už narodilo, a rozsah měsíců od–do. Věkovou hranici 18 ani 26 let nehlídá. Formulář přitom přijme rok narození od `rules.rok - 26`, tedy od 2001 (`app.js` ř. 134 a 260), a na studium dítěte se neptá. Zopakováno na commitu d88ba42. Dítě narozené 3/2001, v domácnosti 1–12: aplikace dá 12 měsíců a 15 204 Kč. Dítě narozené 6/2009 dopadne stejně. Podle § 35c odst. 6 písm. b) ZDP má zletilé dítě nárok „až do dovršení věku 26 let“, a to jen při soustavné přípravě (nebo nemoci či zdravotním stavu). Podle odst. 10 se počítá 1/12 za každý měsíc, na jehož počátku byly podmínky splněny. Dítě narozené 3/2001 má proto nárok za leden až březen, tedy 3 × 1 267 = 3 801 Kč, a aplikace ho přeplácí o 11 403 Kč. Nápověda (`app.js` ř. 118) uživatele ke zkrácení pole „do“ nevyzve.

Co jsem udělal: Přes node importoval `slevy.js` a `rules.json` z klonu a pustil `zvyhodneniDeti` na obou případech. Pak curlem stáhl ZDP ze zakonyprolidi.cz a ověřil znění § 35c odst. 6 písm. b) a odst. 10.

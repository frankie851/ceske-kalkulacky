# Skeptik – ROD-04 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: V klonu na commitu 9ff80c3 je v `rules.json:69` hodnota `"jesleHodinMesicne": 92`. Z ní berou text upozornění v `rodina.js:394–399` (zobrazí se vždy, když `v.navrat` platí a `navratOdMesice` < 24, tedy i při návratu od 10. měsíce) a položka checklistu v `app.js:177`. Aktuální znění zákona č. 117/1995 Sb. na zakonyprolidi.cz (verze 96, platná 1. 9. 2026 – 31. 12. 2026) v § 31 odst. 3 písm. a) uvádí, že dítě mladší 2 let může zařízení navštěvovat „v rozsahu nepřevyšujícím 120 hodin v kalendářním měsíci“. Řetězec „92 hodin“ se v aktuálním textu zákona vůbec nevyskytuje. Aplikace tak ukazuje neplatný limit. Částky to neovlivňuje, rodiče ale může zbytečně omezit.

Co jsem udělal: Přečetl příslušné řádky v `rules.json`, `rodina.js` a `app.js` a ověřil podmínku, za které se upozornění zobrazí. Aktuální znění zákona stáhl curlem z https://www.zakonyprolidi.cz/cs/1995-117 a vyhledal v něm text § 31 odst. 3 písm. a).

# Skeptik – SPOT-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Cenový výměr ERÚ č. 14/2025 (ERV 18/2025, erv182025.pdf, str. 45, sazba D 61d) opravdu stanoví: „Doba platnosti nízkého tarifu je stanovena celoročně od pátku 12.00 hodin do neděle 22.00 hodin“. Ceny ČEZ jsou VT 3 306,67 a NT 116,50 Kč/MWh a v `tariffs.json` sedí. Aplikace ale v `tariffs.json` (`ntHours.D61d`) bere NT ve všední dny 0–6 a 22–24 a o víkendu a svátcích celý den. `ntMaskFor` v `calc.js:182–185` to rozlišuje jen podle `q.weekend`, takže v pátek odpoledne nic nepřidá a v neděli po 22:00 NT neukončí. Podíl NT zopakován přesně: 54,7 % čtvrthodin v aplikaci proti 34,7 % podle výměru. Regulované složky v aplikaci vycházejí 4 375,87 Kč s DPH, shodně s nálezem. Se správnou maskou ale vychází 5 601,92 Kč, ne 5 448,80 Kč z nálezu. Podhodnocení je tedy spíš kolem 1 226 Kč za rok (1 013 Kč bez DPH) než 1 073 Kč; chyba je o něco větší, než nález uvádí.

Co jsem udělal: Stáhl erv182025.pdf přes curl a v textu dohledal podmínku pro D 61d. Pak v Node naimportoval `calc.js` z klonu (commit 1c1f7b2) a spočítal `regulatedFor`/`regulatedVariable` pro ČEZ, D61d, 3×25 A, 2 MWh a TDD7 nad mřížkou 2025-11-01 až 2026-10-31, jednou s maskou aplikace a jednou se správnou maskou (pátek od 12:00 do neděle 22:00).

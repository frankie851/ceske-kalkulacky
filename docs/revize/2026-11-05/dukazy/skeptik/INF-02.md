# Skeptik – INF-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Vyvráceno

Proč: Statická část sedí: `index.html:123` má `<div class="table-scroll">` bez `tabindex`/`role`/`aria-label`, `styles.css:194` má `max-height: 360px; overflow: auto`, tabulka má 261 řádků a axe-core opravdu hlásí `scrollable-region-focusable` (serious) na `.table-scroll`. Hlavní tvrzení nálezu se ale nepotvrdilo. V Chromiu 153 skočí Tab ze `summary` na `DIV.table-scroll`, ne na odkaz ČSÚ, protože Chrome od verze 130 sám zaostří posuvnou oblast bez fokusovatelného obsahu (Firefox to dělá už dlouho). Po zaostření posunou PageDown a End oblast klávesnicí ze `scrollTop` 0 na 8548 (scrollHeight 8908, clientHeight 360), takže se dá dojít až k nejstarším měsícům. Tvrzení „bez myši jen prvních ~10 řádků“ a závažnost Vysoká tedy neplatí. Zbývá drobnost s nízkou závažností: oblast nemá přístupné jméno a roli, nemá viditelný fokus a v Safari se nemusí dát zaostřit. Doplnit `tabindex="0" role="region" aria-label` je dál rozumné.

Co jsem udělal: Kopii klonu (commit b9e1980) servíroval přes `python3 -m http.server` a v puppeteeru rozbalil `details`, spočítal řádky, třikrát stiskl Tab ze `summary`, zkusil PageDown/End na `.table-scroll` a pustil axe-core s pravidlem `scrollable-region-focusable`.

Rozhodnutí hlavního revizora: nález snížen z Vysoké na Nízkou s poznámkou (podle pravidel revize); verdikt aplikace se nemění (INF-01 trvá).

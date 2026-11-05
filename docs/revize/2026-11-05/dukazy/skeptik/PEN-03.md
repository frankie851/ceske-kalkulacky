# Skeptik – PEN-03 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Ve `styles.css:9` je `--text-3: #6f6e69` a `.srovnani small` (ř. 218) ho kreslí na `--surface-2: #f0efec` (ř. 215). Kontrastní poměr podle vzorce WCAG vychází 4,443:1. Text má 0,78 rem (asi 12,5 px), nejde tedy o velké písmo a podle WCAG 1.4.3 pro něj platí minimum 4,5:1. Axe ve světlém režimu při 360×800 nahlásil `color-contrast` se závažností „serious“ přesně na 4 uzlech z nálezu (4.44, #6f6e69/#f0efec). Tmavý režim je bez nálezu. Navržená oprava funguje: `#6a6964` dává 4,78:1 a `--text-2` 6,90:1. Výhrada: závažnost „Vysoká“ je spíš nadsazená, protože do limitu chybí jen 0,06.

Co jsem udělal: Ověřil commit 7381900 a poměry spočítal v Pythonu. Kopii klonu servíroval přes `python3 -m http.server` a v puppeteeru (Chromium, výchozí formulář, světlý i tmavý režim) spustil axe-core s tagy wcag2a/wcag2aa/wcag21aa/wcag22aa.

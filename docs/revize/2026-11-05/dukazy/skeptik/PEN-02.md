# Skeptik – PEN-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Nejisté

Proč: Na commitu 7381900 se chyba ukáže jen při anglické lokalizaci prohlížeče. Headless Chromium s `--lang=en-US` čárku zahodí: „0,85“ v poli „Za správu“ se uloží jako `085` (85 %), vklad „1500,50“ jako `150050` (příspěvek 340 Kč). Žádná hláška se neobjeví, protože `nacti()` v `app.js:46` bere `form.elements[name].value` a na `validity` se nedívá. S `--lang=cs-CZ` (navigator.language = cs-CZ) ale Chromium čárku přijme jako desetinnou: „0,85“ dá `0.85` (valid) a „1500,50“ dá `1500.50` se správným příspěvkem 300 Kč. U české lokalizace, kterou má většina cílových uživatelů, se tedy hlavní tvrzení o posunu 100× až 1 000× nepotvrdilo. V obou lokalizacích platí jen slabší případ: „1.500“ znamená 1,5 Kč a příspěvek je 0 Kč. Firefox ani Safari nezkoušeny. Chyba je skutečná pro anglicky nastavené prohlížeče a obecně pro to, že se nečte `validity`, ale závažnost „Vysoká“ a tvrzení „tiše mění hodnotu“ pro českého uživatele jsou přehnané.

Co jsem udělal: Kopii klonu servíroval přes `python3 -m http.server`. Pomocí puppeteer skriptu pole vyprázdnil, napsal do nich „0,85“, „1500,50“ a „1.500“ a přečetl `input.value`, `validity` a texty s Kč, zvlášť pro Chromium s `--lang=en-US` a s `--lang=cs-CZ`. Přečetl také `index.html:35–70` a `app.js:45–48`.

Poznámka hlavního revizora: nález ponechán se závažností Vysoká a označením „nejisté“ podle pravidel revize; při opravě má přednost doplnění kontroly `validity` a hlášky, protože uživatelé s anglicky nastaveným prohlížečem (firemní počítače, telefony) existují.

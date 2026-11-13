// Přijímačky bez paniky – texty pro web (tykání, rodově neutrálně).
// Převzaté moduly (scenarios.js, strategy.js, matching.js) a rules.json jsou beze změny a některé
// jejich texty vykají nebo mají rodové tvary.
// Tady je jejich podoba pro web: klíčem je PŮVODNÍ znění. Když se původní text v rules.json nebo
// ve scenarios.js změní, klíč přestane sedět a stránka ukáže nové znění tak, jak je (fakta mají
// přednost před tónem). Kontrola `neprevedeneTexty()` při buildu takové texty vypíše.

const TYKANI = new Map([
  // rules.json → rules[].text
  ['V 1. kole se můžete přihlásit až na 3 obory bez talentové zkoušky a až na 2 obory s talentovou zkouškou. Konzervatoře podané v listopadu se do těch 2 talentových oborů počítají. Celkem tedy nejvýše 5 oborů.',
    'V 1. kole se dá přihlásit až na 3 obory bez talentové zkoušky a až na 2 obory s talentovou zkouškou. Konzervatoře podané v listopadu se do těch 2 talentových oborů počítají. Celkem tedy nejvýše 5 oborů.'],
  ['Obory řadíte od nejvíce po nejméně žádaný. Po konci lhůty pro podání přihlášek nejde změnit pořadí ani obory. Na papírových přihláškách musí být pořadí všude stejné.',
    'Obory se řadí od nejvíce po nejméně žádaný. Po konci lhůty pro podání přihlášek nejde změnit pořadí ani obory. Na papírových přihláškách musí být pořadí všude stejné.'],
  ['Jednotnou zkoušku (čeština 60 min, matematika 70 min, každý test max. 50 bodů) můžete psát dvakrát. Z každého předmětu zvlášť se započítá lepší výsledek.',
    'Jednotnou zkoušku (čeština 60 min, matematika 70 min, každý test max. 50 bodů) jde psát dvakrát. Z každého předmětu zvlášť se započítá lepší výsledek.'],
  ['Budete přijati na obor s nejvyšší prioritou, na který vás opravňují výsledky. Uchazeč s horšími výsledky vás nepředběhne jen proto, že má obor na vyšší prioritě. Podle MŠMT algoritmus „nenutí žáky a rodiče ke strategizování“: můžete se hlásit tam, kam opravdu chcete, a šance jinde se tím nesníží.',
    'Uchazeči se dostanou na obor s nejvyšší prioritou, na který jim stačí výsledky. Nikdo s horšími výsledky je nepředběhne jen proto, že má obor na vyšší prioritě. Podle MŠMT algoritmus „nenutí žáky a rodiče ke strategizování“: školy se dají seřadit podle toho, kam dítě opravdu chce, a šance jinde se tím nesníží.'],
  ['Pořadí na škole musí být jednoznačné, dva uchazeči nemůžou sdílet stejné místo. Při shodě bodů rozhodují pomocná kritéria školy. Škola smí jako pomocné kritérium použít i to, kolikátý je obor ve vaší přihlášce. V krajním případě rozhodne los.',
    'Pořadí na škole musí být jednoznačné, dva uchazeči nemůžou sdílet stejné místo. Při shodě bodů rozhodují pomocná kritéria školy. Škola smí jako pomocné kritérium použít i to, kolikátý je obor v přihlášce. V krajním případě rozhodne los.'],
  ['Výsledky 1. a 2. kola najdete v DiPSy a ve škole. Písemné rozhodnutí se nezasílá a přijetí v 1. ani 2. kole se nepotvrzuje. Pokud se přijetí vzdáte, nezískáte tím místo jinde, jen možnost hlásit se do dalšího kola.',
    'Výsledky 1. a 2. kola jsou v DiPSy a ve škole. Písemné rozhodnutí se nezasílá a přijetí v 1. ani 2. kole se nepotvrzuje. Kdo se přijetí vzdá, nezíská tím místo jinde, jen možnost hlásit se do dalšího kola.'],
  ['Odvolání se podává do 3 pracovních dnů od oznámení rozhodnutí, a to podle správního řádu, ne přes DiPSy. Pokud vás přijali na vyšší prioritu, odvolání proti nepřijetí na nižší prioritu nemůže uspět.',
    'Odvolání se podává do 3 pracovních dnů od oznámení rozhodnutí, a to podle správního řádu, ne přes DiPSy. Po přijetí na vyšší prioritu nemůže odvolání proti nepřijetí na nižší prioritu uspět.'],
  // rules.json → events[].note
  ['Jen pokud je škola koná. Konkrétní dny najdete v kritériích školy, pozvánka přijde nejpozději 14 dní předem.',
    'Jen pokud je škola koná. Konkrétní dny jsou v kritériích školy, pozvánka přijde nejpozději 14 dní předem.'],
  // scenarios.js → watch, takeaway
  ['Sledujte 2. kolo: Adam neuspěje na průmyslovce a přijde na gymnázium. Má víc bodů než Cyril, takže Cyrila z dočasného místa vytlačí – i když Cyril má gymnázium na 1. místě.',
    'Sleduj 2. kolo: Adam neuspěje na průmyslovce a přijde na gymnázium. Má víc bodů než Cyril, takže Cyrila z dočasného místa vytlačí – i když Cyril má gymnázium na 1. místě.'],
  ['Škola řadí uchazeče podle bodů a svých kritérií. To, kolikátou prioritou pro vás je, pořadí na škole nemění. Škola to smí použít nanejvýš jako pomocné kritérium při shodě bodů.',
    'Škola řadí uchazeče podle bodů a svých kritérií. To, kolikátou prioritou pro tebe je, pořadí na škole nemění. Škola to smí použít nanejvýš jako pomocné kritérium při shodě bodů.'],
  ['Jistota na posledním místě vám nevezme šanci u vyšších priorit – algoritmus ji použije, jen když vyšší priority nevyjdou. Zkuste Kubovi doplnit 3. prioritu a spustit simulaci znovu.',
    'Jistota na posledním místě ti nevezme šanci u vyšších priorit – algoritmus ji použije, jen když vyšší priority nevyjdou. Zkus Kubovi doplnit 3. prioritu a spustit simulaci znovu.'],
]);

/** Text pro web: tykání, pokud známe původní znění; jinak původní text beze změny. */
export function ty(text) {
  return TYKANI.get(text) ?? text;
}

// Slova, podle kterých build pozná vykání, které nemá převod (jen kontrola, nic nemění).
const VYKANI = /\b(vás|vám|váš|vaše|vaší|vašeho|můžete|najdete|zkuste|sledujte|doplňte|zvažte|chcete|budete|dostanete|vzdáte|nezískáte|řadíte)\b/i;

/** Texty z rules.json a scénářů, které vykají a nemají převod do tykání (vypíše je build). */
export function neprevedeneTexty(pravidla, scenare) {
  const texty = [
    ...pravidla.rules.map((r) => r.text),
    ...pravidla.events.map((e) => e.note).filter(Boolean),
    ...scenare.flatMap((s) => [s.lead, s.watch, s.takeaway]),
  ];
  return texty.filter((t) => !TYKANI.has(t) && VYKANI.test(t));
}

// Věty z explain() (matching.js, převzatý beze změny) mají rodové tvary „Přijat(a)“, „nesplnil(a)“
// a „poslední přijatý“. Na webu je převádíme na rodově neutrální znění. Když se znění v modulu
// změní, převod přestane sedět a build vypíše věty, které rodové tvary pořád mají (rodoveTvary()).
const RODOVE_PREVODY = [
  [/: nesplnil\(a\) kritéria/, ': nesplňuje kritéria'],
  [/^Přijat\(a\) na (\d+)\. prioritu: /, 'Místo na $1. prioritě: '],
  [/^Nepřijat\(a\) v tomto kole/, 'V tomto kole bez místa'],
  [/\(poslední přijatý: /, '(poslední s místem: '],
];
const RODOVE = /\([a-záý]{1,2}\)|přijat|nesplnil/i;

/** Věta z explain() v rodově neutrálním znění (neznámé znění zůstane beze změny). */
export function neutralne(veta) {
  return RODOVE_PREVODY.reduce((t, [vzor, nahrada]) => t.replace(vzor, nahrada), veta);
}

/** Věty z explain(), které i po převodu mají rodové tvary (vypíše je build). */
export function rodoveTvary(vety) {
  return vety.filter((v) => RODOVE.test(neutralne(v)));
}

/** Kategorie strategie (id z strategy.js → popisek na webu). */
export const KATEGORIE = {
  jistota: 'Jistota',
  tesne: 'Reálná',
  riziko: 'Riskantní',
  nevim: 'Chybí údaje',
};

/** Popis kategorie v jedné větě. */
export const KATEGORIE_POPIS = {
  jistota: 'Očekávané body jsou nad loňským minimem aspoň o zvolenou rezervu.',
  tesne: 'Body vycházejí nad loňské minimum, ale rezerva je malá.',
  riziko: 'Očekávané body jsou pod loňským minimem.',
  nevim: 'Doplň očekávané body a loňské minimum.',
};

/** Upozornění strategie podle id z evaluateStrategy (tykání). Neznámé id → původní text. */
export function textUpozorneni(w, rezerva) {
  const t = {
    'missing-expected': 'Doplň, kolik bodů zhruba čekáš – třeba z testů nanečisto.',
    'missing-min': 'U některé školy chybí loňské minimum. Bývá na webu školy u výsledků přijímacího řízení.',
    'no-safe': `Žádná škola nemá rezervu aspoň ${rezerva} b. nad loňským minimem. Zvaž přidat školu, kam se dá dostat s velkou pravděpodobností – nejlépe na poslední místo. Šance u vyšších priorit to nesníží.`,
    duplicate: 'Stejná škola je uvedená víckrát.',
  };
  return t[w.id] ?? w.text;
}

export const SKUPINY = {
  ss: 'Čtyřleté obory',
  vg: 'Víceletá gymnázia',
  kons: 'Konzervatoře',
};

export const STAV_TERMINU = {
  confirmed: 'Ověřeno',
  unverified: 'Neověřeno – sleduj CERMAT a web školy',
  tip: 'Doporučení, nejde o úřední termín',
};

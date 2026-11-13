// Výpověď 2026 – výpočet výsledku a jeho HTML. Sdílí ho build (vypoved-2026.11tydata.js,
// ukázka bez JavaScriptu) i prohlížeč (app.js), takže obě podoby vypadají stejně.
// Žádný DOM a žádné částky natvrdo: čísla jdou z rules.json přes vypoved.js.
import { konecPomeru, vypovedniDoba, odstupne, nahradaUraz, podpora, kontrolniSeznam, denVTydnu, kontrolaZadosti } from './vypoved.js';
import { kc, cislo, procenta, datum } from '../../js/format.js';
import { esc, sloupcovyGraf } from '../../js/graf.js';
import { stitekHtml } from '../../js/stav-pravidel.js';

/** Důvody výpovědi (§ 52 písm. a–h) a „jiný“ jen pro dohodu. Popisy rodově neutrálně. */
export const DUVODY = [
  { hodnota: 'a', text: 'a) Zrušení zaměstnavatele nebo jeho části' },
  { hodnota: 'b', text: 'b) Přemístění zaměstnavatele nebo jeho části' },
  { hodnota: 'c', text: 'c) Nadbytečnost (organizační změna)' },
  { hodnota: 'd', text: 'd) Zdraví: lékařský posudek, nemůžu dál dělat svou práci' },
  { hodnota: 'e', text: 'e) Nejvyšší přípustná expozice na pracovišti' },
  { hodnota: 'f', text: 'f) Nesplněné požadavky, slabé výsledky' },
  { hodnota: 'g', text: 'g) Porušení pracovních povinností' },
  { hodnota: 'h', text: 'h) Zvlášť hrubé porušení režimu nemocného' },
  { hodnota: 'jiny', text: 'Jiný důvod (dohoda bez důvodu z § 52)' },
];

export const KDO = [
  { hodnota: 'zamestnavatel', text: 'Výpověď od zaměstnavatele' },
  { hodnota: 'zamestnanec', text: 'Výpověď ode mě' },
  { hodnota: 'dohoda', text: 'Dohoda' },
];

const mesicu = (n) => `${n} ${n === 1 ? 'měsíc' : n >= 2 && n <= 4 ? 'měsíce' : 'měsíců'}`;

/** Den po zadaném dni (ISO). */
export function denPo(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** SVG ikona ze spritu (sprite = URL souboru sprite.svg včetně pathPrefix). */
export function ikona(id, sprite) {
  return `<svg class="ikona" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#${esc(id)}"/></svg>`;
}

// Popisy úkolů z vypoved.js převedené na tykání (modul se nemění; chybí-li id, použije se text modulu).
const POPISY = {
  'zapoctovy-list': 'Zaměstnavatel ho musí vydat při skončení pracovního poměru (§ 313 ZP). Úřad práce ho bude chtít.',
  dovolena: 'Za nevyčerpanou dovolenou náleží náhrada mzdy (§ 222 odst. 2 ZP), obvykle s poslední výplatou. Zkontroluj ji na výplatní pásce.',
  'urad-prace': 'Když požádáš o zprostředkování zaměstnání do 3 pracovních dnů po skončení, podpora náleží ode dne po skončení pracovního poměru. Později až ode dne podání žádosti. Podmínka: aspoň 12 měsíců důchodového pojištění za poslední 2 roky.',
  'zdravotni-pojistovna': 'V evidenci úřadu práce za tebe pojistné platí stát. Bez registrace a bez jiného příjmu oznam pojišťovně do 8 dnů změnu a plať pojistné jako osoba bez zdanitelných příjmů. Ověř si to u své pojišťovny.',
  odstupne: 'Odstupné se vyplácí po skončení pracovního poměru v nejbližším výplatním termínu, pokud není dohodnuto jinak. Výplatu podpory neodkládá.',
};
const POPIS_URAD_BEZ_PODPORY = 'Podpora ti podle zákona nenáleží, registrace se ale vyplatí: v evidenci úřadu práce za tebe platí zdravotní pojištění stát a úřad ti pomůže s hledáním práce.';
const PEVNE = new Set(['urad-prace', 'zdravotni-pojistovna']);

/**
 * Spočítá výsledek. vstup = { doruceni, kdo, duvod, pricinaUraz, zvlastHrube, zkusebniDoba, konecDohody, delkaLet, vek, hruby, cisty, datumZadosti }.
 * Při neplatném vstupu vyhodí chybu z vypoved.js.
 */
export function spocitej(vstup, rules) {
  const v = {
    doruceni: vstup.doruceni,
    kdo: vstup.kdo,
    duvod: vstup.kdo === 'zamestnanec' ? undefined : vstup.duvod,
    zkusebniDoba: vstup.kdo !== 'dohoda' && Boolean(vstup.zkusebniDoba),
    konecDohody: vstup.kdo === 'dohoda' ? vstup.konecDohody : undefined,
  };
  const konec = konecPomeru(v, rules);
  // Revize 5. 11. 2026, VYP-07: žádost o podporu až po skončení pracovního poměru.
  const chybaZadosti = kontrolaZadosti(vstup.datumZadosti, konec);
  if (chybaZadosti) throw new Error(chybaZadosti);
  const doba = vypovedniDoba(v, rules);
  const od = odstupne({ ...v, delkaLet: vstup.delkaLet, prumernyHruby: vstup.hruby }, rules);
  const nahrada = nahradaUraz({ ...v, pricinaUraz: Boolean(vstup.pricinaUraz), prumernyHruby: vstup.hruby }, rules);
  const p = podpora({
    vek: vstup.vek,
    cistyVydelek: vstup.cisty,
    datumZadosti: vstup.datumZadosti,
    kdo: v.kdo,
    duvod: v.duvod,
    zvlastHrube: Boolean(vstup.zvlastHrube),
  }, rules);

  let popisKonce;
  if (v.zkusebniDoba) popisKonce = 'Zrušení ve zkušební době: pracovní poměr končí dnem doručení, pokud v oznámení není pozdější den.';
  else if (v.kdo === 'dohoda') popisKonce = 'Dohoda: pracovní poměr končí sjednaným dnem, výpovědní doba neběží.';
  else popisKonce = `Výpovědní doba ${mesicu(doba)} začíná dnem doručení (${datum(v.doruceni)}) a končí dnem se stejným číslem v měsíci.`;

  const roky = Object.keys(rules.podpora).filter((k) => /^\d{4}$/.test(k)).sort();
  const vekHranice = rules.podpora[p.rok].pasma.map((x) => x.odVeku).filter((x) => x > 0);
  const poznamky = [];
  if (!p.vylouceno && (p.hlavni.mesice.some((m) => m.omezenoStropem) || p.navrh?.mesice.some((m) => m.omezenoStropem))) {
    poznamky.push('Částka s hvězdičkou (*) je omezená maximální měsíční výší podpory.');
  }
  if (p.hlavni.stav === 'predbezne' && !p.vylouceno) {
    poznamky.push(`Strop podpory pro rok ${p.rok} zatím nebyl vyhlášen. Počítáme s částkou ${kc(p.hlavni.strop)} z roku ${roky[0]}, skutečná částka se bude lišit.`);
  }
  if (p.navrh) {
    const sazby = [...new Set(p.navrh.mesice.map((m) => m.procento))].join('/');
    poznamky.push(`Sloupec „Pokud projde návrh“ ukazuje ${p.navrh.nazev.replace(/\s*\(.*\)$/, '').toLowerCase()}: sazby ${sazby} % a strop ${rules.podpora[rules.podpora[p.rok].navrh].stropVypocet}. Návrh zatím není zákon a může se změnit.`);
  }
  if (p.mimoRozsah) {
    poznamky.push(`Pro rok ${vstup.datumZadosti.slice(0, 4)} zatím pravidla nemáme, počítáme s pravidly pro rok ${p.rok}.`);
  }
  if (vekHranice.includes(vstup.vek) && !p.vylouceno) {
    poznamky.push(`Hraniční věk ${vstup.vek} let: delší podpůrčí doba náleží „nad ${vstup.vek} let věku“ a rozhoduje věk v den podání žádosti (§ 43 zákona o zaměstnanosti). Počítáme s tím, že ode dne ${vstup.vek}. narozenin už máš delší dobu. Ověř si to na úřadu práce.`);
  }
  if (v.kdo === 'zamestnavatel' && !v.zkusebniDoba) {
    poznamky.push('Když by výpovědní doba skončila v ochranné době (třeba při pracovní neschopnosti nebo mateřské), ochranná doba se do ní nepočítá. Konec se posune o dobu, po kterou ochranná doba ve výpovědní době trvala (§ 53 odst. 2 ZP). Když na prodloužení netrváš, řekni to zaměstnavateli. U některých důvodů to neplatí (§ 54 ZP).');
  }
  if (v.kdo === 'zamestnavatel' && v.zkusebniDoba) {
    const z = rules.zakonikPrace.zkusebniDoba;
    poznamky.push(`Zaměstnavatel nesmí zrušit pracovní poměr ve zkušební době v prvních ${z.zakazPriNeschopnostiDnu} kalendářních dnů tvé pracovní neschopnosti nebo karantény (${z.zakazZdroj.pravniZaklad.replace('zákoníku práce', 'ZP')}).`);
  }
  if (v.kdo === rules.vylouceniPodpory.kdo && rules.vylouceniPodpory.priZvlastHrubem.includes(v.duvod) && !vstup.zvlastHrube) {
    poznamky.push('Když výpověď podle písm. g) dostaneš za zvlášť hrubé porušení povinností, podpora ti nenáleží (§ 39 odst. 2 zákona o zaměstnanosti). Zaškrtni to ve formuláři.');
  }
  poznamky.push('Podpora náleží při aspoň 12 měsících důchodového pojištění za poslední 2 roky, a když nepobíráš starobní důchod (§ 39 odst. 1 zákona o zaměstnanosti). Dohoda ani odstupné podporu nesnižují ani neodkládají. Výjimkou je skončení ze strany zaměstnavatele pro zvlášť hrubé porušení povinností (§ 39 odst. 2).');

  const seznam = kontrolniSeznam({ konec })
    .filter((u) => u.id !== 'odstupne' || od.castka > 0)
    .map((u) => ({ ...u, popis: (p.vylouceno && u.id === 'urad-prace' ? POPIS_URAD_BEZ_PODPORY : POPISY[u.id]) ?? u.popis, pevny: PEVNE.has(u.id) }));

  return { vstup, konec, den: denVTydnu(konec), doba, v, popisKonce, od, nahrada, p, poznamky, seznam };
}

/** Hlavní karta výsledku: poslední den velkým písmem, statistiky. */
export function kartaHtml(m, { sprite, ukazka = false } = {}) {
  const uradPrace = m.seznam.find((u) => u.id === 'urad-prace');
  const delka = m.v.zkusebniDoba ? 'zrušení ve zkušební době' : m.v.kdo === 'dohoda' ? 'dohoda, bez výpovědní doby' : `výpovědní doba ${mesicu(m.doba)}`;
  const stat = [
    { hodnota: kc(m.od.castka), popis: 'odstupné (zákonné minimum)', zvyraznit: m.od.castka > 0 },
  ];
  if (m.nahrada.castka > 0) stat.push({ hodnota: kc(m.nahrada.castka), popis: 'jednorázová náhrada podle § 271ca (není to odstupné)', zvyraznit: true });
  stat.push(m.p.vylouceno
    ? { hodnota: kc(0), popis: 'podpora v nezaměstnanosti nenáleží (§ 39 odst. 2 zákona o zaměstnanosti)', zvyraznit: false }
    : { hodnota: kc(m.p.hlavni.celkem), popis: `podpora v nezaměstnanosti celkem za ${mesicu(m.p.hlavni.podpurciDoba)}`, zvyraznit: true });
  if (uradPrace) stat.push({ hodnota: datum(uradPrace.termin), popis: 'nejpozději na úřad práce, aby podpora běžela hned', zvyraznit: false });
  return `<section class="result" id="vysledek" aria-labelledby="vysledek-nadpis"${ukazka ? ' data-ukazka' : ''}>
  <div class="result-top">
    <div>
      <p class="result-kicker">${ukazka ? 'Ukázkový výsledek' : 'Výsledek'}</p>
      <h2 id="vysledek-nadpis" tabindex="-1">Poslední den pracovního poměru</h2>
      <p class="big-num" data-vysledek-cislo>${esc(datum(m.konec))}</p>
      <p class="big-num-label">${esc(m.den)} · ${esc(delka)}</p>
    </div>
    <svg class="result-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#nastroj-obecny"/></svg>
  </div>
  <p class="result-expl">${esc(m.popisKonce)}</p>
  <ul class="stats">${stat.map((x) => `<li class="stat${x.zvyraznit ? ' sage' : ''}"><b>${esc(x.hodnota)}</b><span>${esc(x.popis)}</span></li>`).join('')}</ul>
</section>`;
}

function castkaBunka(mesic, label) {
  return `<td class="r" data-label="${esc(label)}">${esc(kc(mesic.castka))}${mesic.omezenoStropem ? ' *' : ''}<span class="vyp-sazba">${esc(procenta(mesic.procento))} výdělku</span></td>`;
}

/** Odstupné, podpora (graf + tabulka), poznámky. */
export function detailyHtml(m, rules, { sprite, sirkaGrafu = 640 } = {}) {
  const p = m.p;
  const odstupneHtml = `<section class="card" aria-labelledby="odstupne-nadpis">
  <h2 id="odstupne-nadpis">Odstupné</h2>
  <p class="vyp-castka">${esc(kc(m.od.castka))}</p>
  <p class="mb-0">${esc(m.od.duvod)}${m.od.castka > 0 ? ' Kolektivní smlouva nebo vnitřní předpis může určit víc.' : ''}</p>
  ${m.nahrada.castka > 0 ? `<h3 class="vyp-nahrada-nadpis">Jednorázová náhrada podle § 271ca</h3>
  <p class="vyp-castka">${esc(kc(m.nahrada.castka))}</p>
  <p class="mb-0">${esc(`${m.nahrada.nasobek}× průměrný měsíční výdělek. ${m.nahrada.text} Zaměstnavatel ji vyplatí po skončení v nejbližším výplatním termínu.`)}</p>` : ''}
</section>`;
  const poznamkyHtml = `<section class="card" aria-labelledby="poznamky-nadpis">
  <h2 id="poznamky-nadpis">Na co si dát pozor</h2>
  <ul class="watch">${m.poznamky.map((t) => `<li>${ikona('ikona-vystraha', sprite)}<span>${esc(t)}</span></li>`).join('')}</ul>
</section>`;
  if (p.vylouceno) {
    return `${odstupneHtml}
<section class="card" aria-labelledby="podpora-nadpis">
  <h2 id="podpora-nadpis">Podpora v nezaměstnanosti</h2>
  <p class="vyp-castka">${esc(kc(0))}</p>
  <p class="mb-0">${esc(p.duvodVylouceni)} Ověř si to na úřadu práce.</p>
</section>
${poznamkyHtml}`;
  }
  const navrhStitek = stitekHtml(p.navrh?.stav ?? 'navrh', { sprite });
  const predbezne = p.hlavni.stav === 'predbezne';
  const hlavniNazev = `Platný zákon ${p.rok}${predbezne ? ' (předběžně)' : ''}`;
  const sloupce = ['Měsíc', p.navrh ? hlavniNazev : `Podpora ${p.rok}`, ...(p.navrh ? ['Pokud projde návrh'] : [])];
  const radky = p.hlavni.mesice.map((mes, i) => `<tr><th scope="row">${mes.poradi}. měsíc</th>${castkaBunka(mes, sloupce[1])}${p.navrh ? castkaBunka(p.navrh.mesice[i], sloupce[2]) : ''}</tr>`).join('');
  const soucet = `<tr class="vyp-soucet"><th scope="row">Celkem</th><td class="r" data-label="${esc(sloupce[1])}"><strong>${esc(kc(p.hlavni.celkem))}</strong></td>${p.navrh ? `<td class="r" data-label="${esc(sloupce[2])}"><strong>${esc(kc(p.navrh.celkem))}</strong></td>` : ''}</tr>`;
  const graf = sloupcovyGraf({
    titulek: `Podpora po měsících (${hlavniNazev.toLowerCase()})`,
    id: 'vypoved-podpora',
    polozky: p.hlavni.mesice.map((mes) => ({ nazev: `${mes.poradi}.`, hodnota: mes.castka, trida: mes.procento === p.hlavni.mesice[0].procento ? 'graf-rada-1' : 'graf-rada-2' })),
    osaY: { format: (n) => cislo(n / 1000, n % 1000 ? 1 : 0), popisek: 'Tisíce Kč za měsíc' },
    popis: `${p.hlavni.mesice.map((mes) => `${mes.poradi}. měsíc ${kc(mes.castka)}`).join(', ')}.`,
    sirka: sirkaGrafu,
    vyska: Math.round(Math.min(300, Math.max(220, sirkaGrafu * 0.55))),
  });

  return `${odstupneHtml}
<section class="card" aria-labelledby="podpora-nadpis">
  <div class="card-head">
    <h2 id="podpora-nadpis">Podpora v nezaměstnanosti</h2>
    ${predbezne ? stitekHtml('predbezne', { sprite, text: 'Strop předběžně' }) : ''}
  </div>
  <p>Žádost podaná ${esc(datum(m.vstup.datumZadosti))}: podpůrčí doba ${esc(mesicu(p.hlavni.podpurciDoba))}, strop ${esc(kc(p.hlavni.strop))} měsíčně. Počítáno z čistého výdělku ${esc(kc(m.vstup.cisty))}.</p>
  ${graf}
  ${p.navrh ? `<p class="vyp-navrh">${navrhStitek}<span>Sloupec „Pokud projde návrh“ počítá s vládním návrhem pro rok ${esc(p.rok)}.</span></p>` : ''}
  <div class="table-wrap" role="region" aria-label="Tabulka: podpora po měsících" tabindex="0">
    <table class="vyp-podpora">
      <caption>Podpora po měsících</caption>
      <thead><tr>${sloupce.map((s, i) => `<th scope="col"${i ? ' class="r"' : ''}>${esc(s)}</th>`).join('')}</tr></thead>
      <tbody>${radky}${soucet}</tbody>
    </table>
  </div>
</section>
${poznamkyHtml}`;
}

/** Kontrolní seznam s termíny (úřad práce, pojišťovna…). */
export function seznamHtml(m, { sprite, idPrefix = 'ukol', dluhy = '' } = {}) {
  const polozky = m.seznam.map((u) => {
    const id = `${idPrefix}-${u.id}`;
    const kdy = u.termin
      ? `<span class="when${u.pevny ? ' firm' : ''}">${ikona('ikona-kalendar', sprite)}<span class="sr-only">${u.pevny ? 'Pevný termín: ' : 'Doporučený termín: '}</span>do ${esc(datum(u.termin))}</span>`
      : '';
    return `<li><input type="checkbox" id="${id}"><label for="${id}"><span class="box">${ikona('ikona-zaskrtnuti', sprite)}</span><span><span class="task">${esc(u.nazev)}</span>${kdy}</span></label><p class="vyp-ukol-text">${esc(u.popis)}</p></li>`;
  }).join('');
  return `<section class="card vyp-seznam" aria-labelledby="${idPrefix}-nadpis">
  <div class="card-head">
    <h2 id="${idPrefix}-nadpis">Co udělat a do kdy</h2>
    <span class="badge badge-new">Konec: ${esc(datum(m.konec))}</span>
  </div>
  <p class="muted">Odškrtávej si to jedno po druhém. Seznam si můžeš i vytisknout.</p>
  <ul class="checklist">${polozky}</ul>
  ${dluhy ? `<p class="small muted vyp-dluhy">Bojíš se, že nezvládneš splátky? <a href="${esc(dluhy)}">Bezplatná pomoc s dluhy</a></p>` : ''}
</section>`;
}

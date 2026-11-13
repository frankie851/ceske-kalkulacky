// Slevy 2027 – texty kroků dotazníku a HTML výsledku. Sdílí je build (slevy-2027.11tydata.js,
// ukázka bez JavaScriptu) i prohlížeč (app.js), takže obě podoby vypadají stejně.
// Žádný DOM a žádné částky natvrdo: čísla jdou z rules.json a z výsledku slevy.js.
import { vyhodnot, predskolniVek } from './slevy.js';
import { kc, procenta, datum } from '../../js/format.js';
import { esc } from '../../js/graf.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

/* =====================================================================
   Odpovědi z formuláře → vstup pro slevy.js (bez DOM, testovatelné)
   ===================================================================== */

/**
 * Číslo z pole v korunách: sdílené prectiCislo („40 000“, „40.000“, „40000 Kč“), jen celá nezáporná
 * čísla. Prázdné pole = 0, haléře, minus nebo nečitelný zápis = NaN (formulář ukáže hlášku).
 */
export function celeZPole(text) {
  const n = prectiCislo(text, { zaporne: false });
  if (n === null) return 0;
  return Number.isInteger(n) ? n : NaN;
}
const cele = celeZPole;

/**
 * Převede stav průvodce (řetězce z polí) na vstup pro vyhodnot(). Školka se započte jen
 * u dítěte v předškolním věku, i když ve stavu zůstala ze starší odpovědi (revize SLV-01).
 */
/** Narození ze stavu: den znát nemusíme, jen jestli jsou narozeniny 1. dne měsíce (revize SLV-10). */
const narozeniZeStavu = (n) => ({ rok: cele(n.rok), mesic: n.mesic, ...(n.prvni ? { den: 1 } : {}) });

export function odpovediZeStavu(s, rules) {
  return {
    narozeni: narozeniZeStavu(s.narozeni),
    mzda: cele(s.mzda.mesicne) ? { mesicne: cele(s.mzda.mesicne), mesice: s.mzda.mesice } : null,
    studium: { ...s.studium, druh: s.studium.druh === 'doktorskeJine' ? 'vs' : s.studium.druh },
    deti: s.deti.map((d) => {
      const narozeni = narozeniZeStavu(d.narozeni);
      const skolka = Boolean(d.skolka) && predskolniVek(narozeni, rules);
      return {
        narozeni,
        ztpp: d.ztpp, od: d.od, do: d.do, studuje: Boolean(d.studuje),
        skolka,
        skolne: skolka ? cele(d.skolne) : 0,
        domacnosti: skolka && d.dveDomacnosti ? 2 : 1,
        dohodaStrop: skolka && d.dveDomacnosti ? cele(d.dohodaStrop) : 0,
      };
    }),
    manzel: { ...s.manzel, prijem: cele(s.manzel.prijem) },
    invalidita: s.invalidita,
    hypoteka: { uroky: cele(s.hypoteka.uroky), bytovaPotrebaPred2021: s.hypoteka.bytovaPotrebaPred2021 },
    stari: Object.fromEntries(Object.entries(s.stari).map(([k, v]) => [k, cele(v)])),
    dary: { dary: cele(s.dary.dary), krev: cele(s.dary.krev) },
    odbory: s.odbory,
    prijmy: Object.fromEntries(Object.entries(s.prijmy).map(([k, v]) => [k, cele(v)])),
  };
}

export const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];

const pct = (podil) => procenta(Math.round(podil * 10000) / 100);
const mesicu = (n) => `${n} ${n === 1 ? 'měsíc' : n >= 2 && n <= 4 ? 'měsíce' : 'měsíců'}`;

/** SVG ikona ze spritu (sprite = URL souboru sprite.svg včetně pathPrefix). */
export function ikona(id, sprite, trida = '') {
  return `<svg class="ikona${trida ? ` ${trida}` : ''}" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#${esc(id)}"/></svg>`;
}

/* =====================================================================
   Kroky dotazníku (nadpis, krátký název do krokovače, nápověda)
   ===================================================================== */

export function textyKroku(rules) {
  const s = rules.slevy;
  const o = rules.odpocty;
  const rok = rules.rok;
  const deti = rules.deti.rocne;
  return [
    {
      id: 'zaklad', nazev: 'Narození a mzda',
      nadpis: 'Kolik ti je a kolik vyděláváš?',
      napoveda: `Rok narození rozhoduje o slevě na studenta. Mzdu vyplňovat nemusíš: bez ní ukážeme maximální nároky. S ní ohlídáme, že slevy nesníží daň pod nulu, a spočítáme bonus na děti.`,
    },
    {
      id: 'studium', nazev: 'Studium',
      nadpis: `Studuješ v roce ${rok}?`,
      napoveda: `Sleva na studenta se od roku ${rok} vrací: ${kc(s.student.rocne)} ročně. Platí za každý měsíc, na jehož začátku se soustavně připravuješ na budoucí povolání (i o prázdninách mezi školami), do ${s.student.vekMax} let, v prezenčním doktorském studiu do ${s.student.vekMaxDoktorske} let. Celoživotní vzdělávání se nepočítá.`,
    },
    {
      id: 'deti', nazev: 'Děti',
      nadpis: 'Máš děti?',
      napoveda: `Přidej vyživované děti ve společné domácnosti (do 18 let, nebo do 26 let, pokud studují). Pořadí určuje výši zvýhodnění: první dítě ${kc(deti[0])}, druhé ${kc(deti[1])}, třetí a další ${kc(deti[2])} ročně. Bez dětí rovnou pokračuj.`,
    },
    {
      id: 'skolka', nazev: 'Školkovné',
      nadpis: 'Chodí některé dítě do školky?',
      napoveda: `Sleva za umístění dítěte (školkovné) se od roku ${rok} vrací: skutečně zaplacené školné, nejvýš ${kc(s.skolkovne.stropNaDite)} na dítě (minimální mzda). Žije-li dítě střídavě ve dvou domácnostech, dělí se strop napůl, pokud se rodiče písemně nedohodnou jinak. Ve společné domácnosti ji uplatní jen jeden z rodičů, a to až v ročním zúčtování nebo v přiznání.`,
    },
    {
      id: 'manzel', nazev: 'Manžel nebo manželka',
      nadpis: 'Manžel nebo manželka',
      napoveda: `Sleva na manžela nebo manželku (${kc(s.manzel.rocne)} ročně) je jen při společné domácnosti s vlastním dítětem mladším ${s.manzel.vekDitete} let a při vlastním ročním příjmu manžela nebo manželky nejvýš ${kc(s.manzel.limitPrijmu)}. Rodičovský příspěvek, dávky státní sociální podpory ani superdávka se do příjmu nepočítají, mateřská a nemocenská ano.`,
    },
    {
      id: 'invalidita', nazev: 'Invalidita a ZTP/P',
      nadpis: 'Invalidita nebo průkaz ZTP/P',
      napoveda: 'Slevy na invaliditu a na průkaz ZTP/P se sčítají. Uplatníš je každý měsíc u zaměstnavatele.',
    },
    {
      id: 'hypoteka', nazev: 'Hypotéka',
      nadpis: 'Hypotéka nebo úvěr na bydlení',
      napoveda: `Zaplacené úroky si odečteš ze základu daně: u bydlení pořízeného od roku 2021 nejvýš ${kc(o.uroky.limit)} ročně, u bydlení pořízeného dřív ${kc(o.uroky.limitPred2021)}. Rozhoduje, kdy bylo bydlení pořízené, ne datum podpisu smlouvy. Limit platí na celou domácnost – když úroky uplatňujete dva, dělíte si ho.`,
    },
    {
      id: 'stari', nazev: 'Spoření na stáří',
      nadpis: 'Spoření na stáří',
      napoveda: `Penzijko, DIP, životní pojištění a pojištění dlouhodobé péče mají společný limit ${kc(o.stari.limit)} ročně. U penzijka se v každém měsíci počítá jen část vkladu nad ${kc(o.stari.penzijkoHraniceMesicne)}. Mimořádný vklad zadej zvlášť, počítáme ho do prosince. Příspěvky zaměstnavatele sem nepatří.`,
    },
    {
      id: 'dary', nazev: 'Dary a krev',
      nadpis: 'Dary a dárcovství krve',
      napoveda: `Dary neziskovým organizacím, obcím nebo církvím odečteš, pokud dají dohromady aspoň ${kc(o.dary.minKc)} (nebo víc než ${pct(o.dary.minPodilZakladu)} základu daně), nejvýš ${pct(o.dary.maxPodilZakladu)} základu daně. Bezpříspěvkový odběr krve se počítá jako dar ${kc(o.dary.darKrve)}.`,
    },
    {
      id: 'prijmy', nazev: 'Jiné příjmy',
      nadpis: 'Máš i jiné příjmy?',
      napoveda: `Od roku ${rok} se malé dohody nedaní srážkovou daní, ale zálohou. Samy o sobě přiznání nevyžadují. Druhý úvazek nebo dohoda nad limit u jiného zaměstnavatele ano. Ostatní příjmy (pronájem, podnikání a další) do ${kc(rules.priznani.limitOstatnichPrijmuZamestnance)} ročně přiznání nevyžadují.`,
    },
  ];
}

/* =====================================================================
   Výsledek
   ===================================================================== */

/** Štítky „Tvoje situace“ z odpovědí. */
export function situace(odp, rules) {
  const st = [];
  if (odp.narozeni?.rok) st.push(`Narození: ${MESICE[(odp.narozeni.mesic || 1) - 1]} ${odp.narozeni.rok}`);
  if (odp.mzda?.mesicne) {
    st.push(`Hrubá mzda ${kc(odp.mzda.mesicne)} měsíčně${(odp.mzda.mesice ?? 12) < 12 ? `, ${mesicu(odp.mzda.mesice)}` : ''}`);
  }
  if (odp.studium?.studuje) {
    const od = odp.studium.od ?? 1;
    const doM = odp.studium.do ?? 12;
    st.push(od === 1 && doM === 12 ? `Studium po celý rok ${rules.rok}` : `Studium ${MESICE[od - 1]}–${MESICE[doM - 1]}`);
  }
  const deti = odp.deti ?? [];
  if (deti.length) st.push(`Děti: ${deti.length}`);
  const ve = deti.filter((d) => d.skolka).length;
  if (ve) st.push(`Ve školce: ${ve}`);
  if (odp.manzel?.ma) st.push('Manžel nebo manželka ve společné domácnosti');
  if (odp.invalidita?.stupen) st.push(`Invalidita ${odp.invalidita.stupen}. stupně`);
  if (odp.invalidita?.ztpp) st.push('Průkaz ZTP/P');
  if (odp.hypoteka?.uroky) st.push(`Úroky z úvěru na bydlení ${kc(odp.hypoteka.uroky)}`);
  const stari = Object.entries(odp.stari ?? {}).filter(([k]) => k !== 'penzijkoMimoradny').reduce((a, [, b]) => a + (Number(b) || 0), 0);
  if (stari) st.push(`Spoření na stáří ${kc(stari)} ročně`);
  if (odp.dary?.dary || odp.dary?.krev) st.push('Dary nebo odběry krve');
  const pr = odp.prijmy ?? {};
  if (pr.maleDohody || pr.soubezne || pr.ostatni) st.push('Jiné příjmy');
  if (!odp.studium?.studuje && !deti.length && st.length <= 2) st.push('Bez dalších slev');
  return st;
}

function kdeAKdy(p, priznani, rules) {
  const t = rules.terminy;
  if (p.zruseno) return { kde: 'Nelze uplatnit', kdy: '–' };
  if (p.kde === 'prohlaseni') {
    return {
      kde: priznani.povinne
        ? 'Prohlášení poplatníka u zaměstnavatele (měsíčně), vyrovnání v daňovém přiznání'
        : 'Prohlášení poplatníka u zaměstnavatele (měsíčně); co se nestihne, v ročním zúčtování',
      kdy: `Podpis ${t.prohlaseni.text}`,
    };
  }
  if (p.kde === 'priznani') return { kde: 'Daňové přiznání', kdy: `${t.priznaniPapir.text}, ${t.priznaniElektronicky.text}` };
  return { kde: 'Žádost o roční zúčtování u zaměstnavatele (jen ročně)', kdy: `Žádost ${t.rocniZuctovani.text}` };
}

function poznamka(p, odp, rules) {
  const s = rules.slevy;
  const o = rules.odpocty;
  if (p.zruseno) return p.poznamka;
  switch (p.id) {
    case 'student':
      return p.rocne === 0
        ? `Nárok nevzniká: věková hranice je ${s.student.vekMax} let, u prezenčního doktorského studia ${s.student.vekMaxDoktorske} let.`
        : `${mesicu(p.mesice)} × ${kc(s.student.mesicne)}.`;
    case 'manzel':
      if (p.duvod === 'prijem') return `Nárok nevzniká: příjem manžela nebo manželky přesahuje ${kc(s.manzel.limitPrijmu)}.`;
      if (p.duvod === 'bezDitete') return `Zatím bez nároku: dítě mladší ${s.manzel.vekDitete} let zadej i v kroku „Děti“. Podle jeho narození spočítáme, za kolik měsíců sleva náleží.`;
      if (p.rocne === 0) return `Nárok nevzniká: v roce ${rules.rok} nežije ve společné domácnosti dítě mladší ${s.manzel.vekDitete} let.`;
      return p.mesice < 12
        ? `Za ${p.mesice} z 12 měsíců (na jejich začátku bylo dítěti méně než ${s.manzel.vekDitete} roky).`
        : 'Uplatní se až po skončení roku.';
    case 'skolkovne': {
      const dve = (odp.deti ?? []).some((d) => d.skolka && (d.domacnosti ?? 1) > 1);
      return `Za každé dítě skutečně zaplacené školné, nejvýš ${kc(s.skolkovne.stropNaDite)}${dve ? ' (u dítěte ve dvou domácnostech polovina, pokud není písemná dohoda)' : ''}. Sleva nevytváří bonus.`;
    }
    case 'deti':
      return p.rozpis.map((r) => `${r.index + 1}. dítě: ${kc(r.rocne)}${r.ztpp ? ' (ZTP/P dvojnásobek)' : ''}${r.mesice < 12 ? ` za ${r.mesice} měs.` : ''}`).join(' · ');
    case 'stari':
    case 'uroky':
      return `Snižuje základ daně o ${kc(p.rocne)}, na dani ušetříš asi ${kc(p.uspora)}.`;
    case 'dary':
      if (p.rocne === 0) return `Dary nedosahují minima ${kc(o.dary.minKc)} (ani ${pct(o.dary.minPodilZakladu)} základu daně).`;
      return `Snižuje základ daně o ${kc(p.rocne)}, ušetříš asi ${kc(p.uspora)}.${p.omezeno ? ` Omezeno stropem ${pct(o.dary.maxPodilZakladu)} základu daně.` : ''}${p.stropNeznamy ? ` Strop je ${pct(o.dary.maxPodilZakladu)} základu daně.` : ''}`;
    default:
      return null;
  }
}

function stitkyPolozky(p, rules) {
  const b = [];
  if (p.novinka) b.push(`<span class="badge badge-new">Novinka ${rules.rok}</span>`);
  if (p.zmena) b.push(`<span class="badge badge-new">Změna ${rules.rok}</span>`);
  if (p.zruseno) b.push('<span class="badge badge-plain">Zrušeno</span>');
  return b.length ? `<span class="slevy-stitky">${b.join('')}</span>` : '';
}

/** Model výsledku: vyhodnocení a odvozené součty. */
export function modelVysledku(odpovedi, rules) {
  const v = vyhodnot(odpovedi, rules);
  const platne = v.polozky.filter((p) => !p.zruseno);
  const mesicne = platne.filter((p) => p.kde === 'prohlaseni' && p.mesicne).reduce((s, p) => s + p.mesicne, 0);
  const rocne = platne.filter((p) => p.kde !== 'prohlaseni').reduce((s, p) => s + (p.typ === 'odpocet' ? p.uspora : p.rocne), 0);
  return { v, mesicne, rocne };
}

function vetaRealne(v, rules) {
  if (v.realne === null) {
    return 'Bez zadané mzdy ukazujeme maximální nároky. Slevy ale snižují daň nejvýš na nulu, takže při nízkém příjmu se nevyčerpají celé.';
  }
  return `Při zadané mzdě to reálně dělá ${kc(v.realne)} ročně: daň ${kc(v.dan.danPred)} klesne na ${kc(v.dan.dan)}${v.dan.bonus ? `, k tomu daňový bonus ${kc(v.dan.bonus)}` : ''}.`;
}

/** Karta výsledku, upozornění k přiznání, tabulka nároků, novinky a odkaz na Plán48. */
export function vysledekHtml(m, odp, rules, { sprite, ukazka = false, plan48 = '' } = {}) {
  const { v } = m;
  const t = rules.terminy;
  const stitky = situace(odp, rules).map((s) => `<li class="badge badge-plain">${esc(s)}</li>`).join('');

  const statistiky = [
    { hodnota: kc(m.mesicne), popis: 'měsíčně navíc ve výplatě díky prohlášení u zaměstnavatele', zvyraznit: true },
  ];
  if (m.rocne > 0) statistiky.push({ hodnota: kc(m.rocne), popis: v.priznani.povinne ? 'jednorázově v daňovém přiznání' : 'jednorázově v ročním zúčtování', zvyraznit: true });
  if (v.dan) statistiky.push({ hodnota: kc(v.dan.dan), popis: `daň za rok ${rules.rok} po slevách (bez slev ${kc(v.dan.danPred)})`, zvyraznit: false });

  const bonus = v.dan && !v.dan.narokNaBonus && v.polozky.some((p) => p.id === 'deti')
    ? `<p class="note">${ikona('ikona-info', sprite)}<span>Na daňový bonus nárok nevzniká: roční příjem z práce je nižší než ${esc(kc(rules.deti.bonusMinRocniPrijemNasobekMinMzdy * rules.minimalniMzda.mesicne))} (${rules.deti.bonusMinRocniPrijemNasobekMinMzdy}× minimální mzda).</span></p>`
    : '';

  let priznani = '';
  if (v.priznani.povinne) {
    const duvody = [];
    if (v.priznani.duvody.includes('soubezne')) duvody.push('Máš souběžný příjem od dalšího zaměstnavatele.');
    if (v.priznani.duvody.includes('ostatni')) duvody.push(`Ostatní příjmy přesahují ${kc(rules.priznani.limitOstatnichPrijmuZamestnance)}.`);
    priznani = `<aside class="notice notice-info" aria-label="Daňové přiznání">${ikona('ikona-info', sprite)}<div>
  <p><strong>Za rok ${rules.rok} podáváš daňové přiznání.</strong></p>
  <p>${esc(duvody.join(' '))} Roční položky proto uplatníš v přiznání (${esc(t.priznaniPapir.text)}, ${esc(t.priznaniElektronicky.text)}).</p>
</div></aside>`;
  } else if (v.priznani.maleDohody) {
    priznani = `<aside class="notice notice-info" aria-label="Malé dohody">${ikona('ikona-info', sprite)}<div>
  <p>Příjmy z malých dohod se do povinnosti podat přiznání nepočítají. Když se to vyplatí, můžeš je do přiznání zahrnout dobrovolně – pak ale všechny a sražená záloha se započte.</p>
</div></aside>`;
  }

  const sloupce = ['Sleva', 'Měsíčně', 'Ročně', 'Kde uplatnit', 'Do kdy'];
  const radky = v.polozky.map((p) => {
    const { kde, kdy } = kdeAKdy(p, v.priznani, rules);
    const pozn = poznamka(p, odp, rules);
    const rocne = p.typ === 'odpocet' && !p.zruseno
      ? `${esc(kc(p.uspora))}<span class="slevy-pozn">odpočet ${esc(kc(p.rocne))}</span>`
      : esc(kc(p.rocne));
    return `<tr${p.zruseno ? ' class="slevy-zruseno"' : ''} data-polozka="${esc(p.id)}">`
      + `<th scope="row"><span class="slevy-nazev">${esc(p.nazev)}</span>${stitkyPolozky(p, rules)}${pozn ? `<span class="slevy-pozn">${esc(pozn)}</span>` : ''}</th>`
      + `<td class="r" data-label="${sloupce[1]}">${p.mesicne ? esc(kc(p.mesicne)) : '–'}</td>`
      + `<td class="r" data-label="${sloupce[2]}" data-rocne>${rocne}</td>`
      + `<td data-label="${sloupce[3]}">${esc(kde)}</td>`
      + `<td data-label="${sloupce[4]}">${esc(kdy)}</td></tr>`;
  }).join('');

  const s = rules.slevy;
  const pr = rules.priznani;
  const novinky = [
    `Vrací se sleva na studenta (${kc(s.student.rocne)} ročně) a školkovné (až ${kc(s.skolkovne.stropNaDite)} na dítě).`,
    `Zaměstnanec podává daňové přiznání až při ostatních příjmech nad ${kc(pr.limitOstatnichPrijmuZamestnance)}, obecná hranice je ${kc(pr.limitPrijmu)}.`,
    `Malé dohody (DPP pod ${kc(pr.limitMaleDppMesicne)} měsíčně, jiné dohody a zaměstnání malého rozsahu pod ${kc(pr.limitMalyRozsahMesicne)} měsíčně) se už nedaní srážkovou daní, ale zálohou. Povinnost podat přiznání to samo nezakládá.`,
    `Strop pro odpočet darů je zase ${pct(rules.odpocty.dary.maxPodilZakladu)} základu daně. Zvýšený strop platil jen do roku ${rules.rok - 1}.`,
  ];

  return `<p class="muted small mb-0">${ukazka ? 'Ukázková situace:' : 'Tvoje situace:'}</p>
<ul class="scenario">${stitky}</ul>
<section class="result" id="vysledek" aria-labelledby="vysledek-nadpis"${ukazka ? ' data-ukazka' : ''}>
  <div class="result-top">
    <div>
      <p class="result-kicker">${ukazka ? 'Ukázkový výsledek' : 'Výsledek'}</p>
      <h2 id="vysledek-nadpis" tabindex="-1">Na slevách a zvýhodnění za rok ${rules.rok} můžeš získat</h2>
      <p class="big-num slevy-cislo" data-vysledek-cislo>Až ${esc(kc(v.soucetAz))}</p>
      <p class="big-num-label">ročně</p>
    </div>
    <svg class="result-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#nastroj-obecny"/></svg>
  </div>
  <p class="result-expl">${esc(vetaRealne(v, rules))}</p>
  <ul class="stats">${statistiky.map((x) => `<li class="stat${x.zvyraznit ? ' sage' : ''}"><b>${esc(x.hodnota)}</b><span>${esc(x.popis)}</span></li>`).join('')}</ul>
  ${bonus}
</section>
${priznani}
<section class="card slevy-naroky" aria-labelledby="naroky-nadpis">
  <h2 id="naroky-nadpis">Na co máš nárok</h2>
  <div class="table-wrap" role="region" aria-label="Tabulka: slevy, zvýhodnění a odpočty" tabindex="0">
    <table class="stack-table">
      <caption class="sr-only">Slevy, zvýhodnění a odpočty za rok ${rules.rok}</caption>
      <thead><tr>${sloupce.map((x, i) => `<th scope="col"${i === 1 || i === 2 ? ' class="r"' : ''}>${x}</th>`).join('')}</tr></thead>
      <tbody>${radky}</tbody>
    </table>
  </div>
  <p class="table-note">U odpočtů ukazujeme odhad úspory na dani (${pct(rules.sazbaDane.zakladni)} z odečtené částky). Do součtu „Až“ se počítá tato úspora.</p>
</section>
<div class="split">
  <section class="card" aria-labelledby="novinky-nadpis">
    <div class="card-head">
      <h2 id="novinky-nadpis">Co je v roce ${rules.rok} nového</h2>
      <span class="badge badge-new">Mění se v roce ${rules.rok}</span>
    </div>
    <ul class="slevy-novinky">${novinky.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
  </section>
  <section class="card" aria-labelledby="plan48-nadpis">
    <h2 id="plan48-nadpis">Penzijko a DIP naplno</h2>
    <p>Kolik ti stát přidá na penzijko a jak do konce roku využít celý limit odpočtu ${esc(kc(rules.odpocty.stari.limit))}, spočítá Plán48.</p>
    <p class="mb-0"><a class="btn btn-ghost" href="${esc(plan48)}">Otevřít Plán48${ikona('ikona-sipka', sprite)}</a></p>
  </section>
</div>`;
}

// Úprava tónu textů z modulu slevy.js (tykání, rodově neutrálně). Modul se nemění.
const TON = [['pokud jste nepracovali celý rok', 'pokud pracovní poměr netrval celý rok']];
const tykani = (text) => TON.reduce((t, [z, na]) => t.replace(z, na), text);

/** Kontrolní seznam: co udělat (s termíny z rules.terminy) a jaké doklady si připravit. */
export function seznamHtml(m, rules, { sprite, idPrefix = 'ukol' } = {}) {
  const { kroky, doklady } = m.v.kontrolniSeznam;
  const terminy = Object.values(rules.terminy).filter((x) => x && x.datum && x.text);
  let n = 0;
  const polozka = (text, termin) => {
    n += 1;
    const id = `${idPrefix}-${n}`;
    const kdy = termin
      ? `<span class="when firm">${ikona('ikona-kalendar', sprite)}<span class="sr-only">Pevný termín: </span>nejpozději ${esc(datum(termin.datum))}</span>`
      : '';
    return `<li><input type="checkbox" id="${id}"><label for="${id}"><span class="box">${ikona('ikona-zaskrtnuti', sprite)}</span><span><span class="task">${esc(tykani(text))}</span>${kdy}</span></label></li>`;
  };
  const ukoly = kroky.map((k) => polozka(k, terminy.find((x) => k.includes(x.text)))).join('');
  const dokl = doklady.length
    ? `<ul class="checklist">${doklady.map((d) => polozka(d, null)).join('')}</ul>`
    : '<p class="mb-0">K samotné slevě na poplatníka žádné doklady nepotřebuješ.</p>';
  return `<section class="card slevy-seznam" aria-labelledby="${idPrefix}-nadpis">
  <div class="card-head">
    <h2 id="${idPrefix}-nadpis">Kontrolní seznam: co podepsat a co přinést</h2>
    <span class="badge badge-plain">Daň za rok ${rules.rok}</span>
  </div>
  <p class="muted">Odškrtávej si to jedno po druhém. Seznam si můžeš i vytisknout.</p>
  <h3>Co udělat a do kdy</h3>
  <ul class="checklist">${ukoly}</ul>
  <h3>Jaké doklady si připravit</h3>
  ${dokl}
</section>`;
}

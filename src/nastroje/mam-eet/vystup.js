// Výstup průvodce „Mám EET?“ a kalkulačky OSVČ 2027 jako HTML řetězce.
// Sdílí ho build (ukázkový výsledek v *.11tydata.js) i prohlížeč (app.js, osvc-app.js),
// takže stránka bez JavaScriptu i s ním vypadá stejně. Žádný DOM, žádné částky natvrdo:
// čísla jdou z rules.json přes rules.js a osvc.js. Texty, které v rules.json nejsou,
// jsou v objektu TEXTY.
import { evaluate, buildChecklist, compareCosts, pruneAnswers, fill, uiVars } from './rules.js';
import { compare, params } from './osvc.js';
import { kc, datum } from '../../js/format.js';
import { esc } from '../../js/graf.js';

export const TEXTY = {
  vysledek: 'Výsledek',
  ukazkovyVysledek: 'Ukázkový výsledek',
  tvojeSituace: 'Tvoje situace:',
  ukazkovaSituace: 'Ukázková situace:',
  offPopis: 'roční přirážka k paušální dani v režimu EET OFF ({mesicne} měsíčně)',
  mustPopis: 'od tohoto dne evidovat tržby v EET 2.0',
  zdroj: 'Zdroj',
  startBadge: 'Start EET 2.0: {datum}',
  seznamNadpis: 'Co udělat a do kdy',
  kalkUvod: 'Kolik tě která cesta stojí za rok.',
  kalkCaption: 'Náklady za rok podle zvolené cesty',
  kalkMoznost: 'Možnost',
  kalkNaklad: 'Náklad za rok',
  kalkOff: 'EET OFF (přirážka {mesicne} měsíčně)',
  kalkMoje: 'Evidence v bezplatné aplikaci {nazev}',
  kalkVlastni: 'Evidence ve vlastní pokladně',
  kalkVlastniPrazdne: 'zadej vlastní cenu',
  kalkRezim: 'Jak budeš evidovat?',
  kalkMojeKratce: '{nazev} (zdarma)',
  kalkVlastniKratce: 'Vlastní pokladna',
  odpovedAno: 'ano',
  odpovedNe: 'ne',
  prijmy: 'Příjmy za rok {rok}: {castka}',
  jednotky: 'Evidenční jednotky: {pocet}',
  nevidomost: 'Průkaz ZTP/P kvůli zraku: {odpoved}',
  sam: 'Bez zaměstnanců, tržby osobně: {odpoved}',
  // OSVČ 2027
  osvcNadpis: 'Nejlevněji vychází: {varianta}',
  osvcPopis: 'ročně, tedy {mesicne} měsíčně',
  osvcCaption: 'Roční odvody ve třech variantách',
  osvcLista: 'Nejlevněji: {varianta}',
};

const t = (klic, vars) => fill(TEXTY[klic], vars);

/** SVG ikona ze spritu (sprite = URL souboru sprite.svg včetně pathPrefix). */
export function ikona(id, sprite, trida = '') {
  return `<svg class="ikona${trida ? ` ${trida}` : ''}" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#${esc(id)}"/></svg>`;
}

function odkazZdroje(z, sprite) {
  if (!z?.url) return '';
  return `<span class="src">${ikona('ikona-odkaz', sprite)}${esc(TEXTY.zdroj)}: <a href="${esc(z.url)}">${esc(z.title || z.url)}</a></span>`;
}

/* =====================================================================
   Mám EET?
   ===================================================================== */

/** Text odpovědi na otázku (pro shrnutí a štítky situace). */
export function textOdpovedi(q, hodnota, rules) {
  if (hodnota === undefined || hodnota === null) return '';
  if (q.type === 'yesno') return hodnota ? rules.ui.yes : rules.ui.no;
  if (q.type === 'number') return q.id === 'income' ? kc(hodnota) : `${hodnota} ${q.unit ?? ''}`.trim();
  const seznam = rules[q.optionsFrom] ?? [];
  const ids = Array.isArray(hodnota) ? hodnota : [hodnota];
  return ids.map((id) => seznam.find((o) => o.id === id)?.label ?? id).join(', ');
}

/** Štítky „Tvoje situace“: jen odpovědi, které na zvolené cestě dotazníkem rozhodují. */
export function situace(odpovedi, rules) {
  const a = pruneAnswers(odpovedi, rules);
  const q = (id) => rules.questions.find((x) => x.id === id);
  const stitky = [];
  if (a.form) stitky.push(textOdpovedi(q('form'), a.form, rules));
  if (a.payments) for (const id of a.payments) stitky.push(textOdpovedi(q('payments'), id, rules));
  if (a.sector && rules.sectors.find((s) => s.id === a.sector)?.exempt) stitky.push(textOdpovedi(q('sector'), a.sector, rules));
  if (a.flatTax) stitky.push(textOdpovedi(q('flatTax'), a.flatTax, rules));
  if (Number.isFinite(a.income)) stitky.push(t('prijmy', { rok: rules.eetOff.incomeYear, castka: kc(a.income) }));
  if (a.blind !== undefined) stitky.push(t('nevidomost', { odpoved: a.blind ? TEXTY.odpovedAno : TEXTY.odpovedNe }));
  if (a.alone !== undefined) stitky.push(t('sam', { odpoved: a.alone ? TEXTY.odpovedAno : TEXTY.odpovedNe }));
  if (Number.isFinite(a.units)) stitky.push(t('jednotky', { pocet: a.units }));
  return stitky;
}

/** Datový model výsledku průvodce (stejný pro build i prohlížeč). */
export function modelEet(odpovedi, rules) {
  const r = evaluate(odpovedi, rules);
  const off = r.verdict === 'off';
  const must = r.verdict === 'must';
  return {
    r,
    verdikt: r.verdict,
    nadpis: r.headline,
    cislo: off ? kc(r.eetOff.surchargeAnnual) : must ? datum(rules.launch.date) : null,
    popis: off ? t('offPopis', { mesicne: kc(r.eetOff.surchargeMonthly) }) : must ? TEXTY.mustPopis : null,
    vysvetleni: must ? `${r.sub} ${rules.launch.pilotNote}` : r.sub,
    situace: situace(odpovedi, rules),
    seznam: buildChecklist(r, rules),
  };
}

/** Karta výsledku + důvody + EET OFF a MOJE eet. */
export function vysledekEetHtml(m, rules, { sprite, ukazka = false } = {}) {
  const ui = rules.ui;
  const r = m.r;
  const stitky = m.situace.map((s) => `<li class="badge badge-plain">${esc(s)}</li>`).join('');
  const duvody = r.reasons.map((d) => `<li><div><p>${esc(d.text)}</p>${odkazZdroje(d.source, sprite)}</div></li>`).join('');
  const poznamky = r.notes.map((n) => `<p class="note">${ikona('ikona-info', sprite)}<span>${esc(n)}</span></p>`).join('');

  let eetOff = '';
  if (r.eetOff) {
    const e = r.eetOff;
    const texty = e.eligible ? [e.deadlineText, e.fixedForYear] : [e.text];
    const zdroje = e.eligible ? [e.source, e.deadlineSource, e.amountsSource] : [e.source];
    eetOff = `<section class="card eet-karta" aria-labelledby="eet-off-nadpis">
  <h2 id="eet-off-nadpis">${esc(ui.eetOffTitle)}</h2>
  ${texty.map((x) => `<p>${esc(x)}</p>`).join('')}
  <div class="eet-zdroje">${zdroje.map((z) => odkazZdroje(z, sprite)).join('')}</div>
</section>`;
  }
  let moje = '';
  if (r.mojeEet?.text) {
    const zdroje = [r.mojeEet.source, r.mojeEet.suitable ? r.mojeEet.certificateSource : null];
    moje = `<section class="card eet-karta" aria-labelledby="moje-eet-nadpis">
  <h2 id="moje-eet-nadpis">${esc(rules.mojeEet.name)}</h2>
  <p>${esc(r.mojeEet.text)}</p>
  <div class="eet-zdroje">${zdroje.map((z) => odkazZdroje(z, sprite)).join('')}</div>
</section>`;
  }

  return `<p class="muted small mb-0">${esc(ukazka ? TEXTY.ukazkovaSituace : TEXTY.tvojeSituace)}</p>
<ul class="scenario">${stitky}</ul>
<section class="result eet-vysledek eet-vysledek-${esc(m.verdikt)}" id="vysledek" aria-labelledby="vysledek-nadpis"${ukazka ? ' data-ukazka' : ''}>
  <div class="result-top">
    <div>
      <p class="result-kicker">${esc(ukazka ? TEXTY.ukazkovyVysledek : TEXTY.vysledek)}</p>
      <h2 id="vysledek-nadpis" class="verdict" tabindex="-1">${esc(m.nadpis)}</h2>
      ${m.cislo ? `<p class="big-num">${esc(m.cislo)}</p>` : ''}
      ${m.popis ? `<p class="big-num-label">${esc(m.popis)}</p>` : ''}
    </div>
    <svg class="result-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#nastroj-mam-eet"/></svg>
  </div>
  <p class="result-expl">${esc(m.vysvetleni)}</p>
</section>
<div class="split mt-6">
  <section class="card" aria-labelledby="proc-nadpis">
    <h2 id="proc-nadpis">${esc(ui.whyTitle)}</h2>
    ${r.intro ? `<p>${esc(r.intro)}</p>` : ''}
    <ol class="reasons">${duvody}</ol>
    ${poznamky}
  </section>
  ${eetOff || moje ? `<div class="stack">${eetOff}${moje}</div>` : ''}
</div>`;
}

/** Model kalkulačky EET OFF vs. evidence. */
export function modelKalkulacky(r, rules, { useMojeEet = true, ownCostAnnual = null } = {}) {
  const mojeAllowed = r.mojeEet?.suitable !== false;
  const moje = mojeAllowed && useMojeEet;
  const c = compareCosts({ useMojeEet: moje, ownCostAnnual }, rules);
  const vlastni = Number.isFinite(ownCostAnnual) && ownCostAnnual > 0 ? ownCostAnnual : null;
  const radky = [
    { id: 'off', nazev: t('kalkOff', { mesicne: kc(rules.eetOff.surchargeMonthly) }), castka: kc(c.surcharge), hl: c.cheaper === 'off' },
  ];
  if (mojeAllowed) {
    radky.push({ id: 'moje', nazev: t('kalkMoje', { nazev: rules.mojeEet.name }), castka: kc(rules.mojeEet.priceAnnual), hl: moje && c.cheaper === 'evidence' });
  }
  radky.push({ id: 'vlastni', nazev: TEXTY.kalkVlastni, castka: vlastni === null ? TEXTY.kalkVlastniPrazdne : kc(vlastni), hl: !moje && c.cheaper === 'evidence' });
  return { mojeAllowed, moje, veta: c.sentence, radky };
}

/** Tabulka kalkulačky (tělo se při změně přepisuje celé). */
export function kalkulackaTabulkaHtml(k) {
  const radky = k.radky.map((x) => `<tr${x.hl ? ' class="hl"' : ''}><th scope="row">${esc(x.nazev)}</th><td class="r${x.id === 'vlastni' && !/\d/.test(x.castka) ? ' wrap-normal' : ''}">${esc(x.castka)}</td></tr>`).join('');
  return `<div class="table-wrap" role="region" aria-label="Tabulka: ${esc(TEXTY.kalkCaption)}" tabindex="0">
  <table><caption>${esc(TEXTY.kalkCaption)}</caption>
  <thead><tr><th scope="col">${esc(TEXTY.kalkMoznost)}</th><th scope="col" class="r">${esc(TEXTY.kalkNaklad)}</th></tr></thead>
  <tbody>${radky}</tbody></table>
</div>`;
}

/** Karta kalkulačky EET OFF vs. evidence (s ovládacími prvky; oživí je app.js). */
export function kalkulackaHtml(r, rules, { sprite, idPrefix = 'kalk' } = {}) {
  const c = rules.calculator;
  const k = modelKalkulacky(r, rules);
  const vlastniId = `${idPrefix}-vlastni`;
  const rezim = k.mojeAllowed
    ? `<fieldset class="field">
    <legend>${esc(TEXTY.kalkRezim)}</legend>
    <div class="seg">
      <input type="radio" name="${idPrefix}-rezim" id="${idPrefix}-rezim-moje" value="moje" checked><label for="${idPrefix}-rezim-moje">${esc(t('kalkMojeKratce', { nazev: rules.mojeEet.name }))}</label>
      <input type="radio" name="${idPrefix}-rezim" id="${idPrefix}-rezim-own" value="own"><label for="${idPrefix}-rezim-own">${esc(TEXTY.kalkVlastniKratce)}</label>
    </div>
  </fieldset>`
    : '';
  return `<section class="card eet-kalkulacka" aria-labelledby="${idPrefix}-nadpis" data-kalkulacka>
  <h2 id="${idPrefix}-nadpis">${esc(rules.ui.calcTitle)}</h2>
  <p class="muted">${esc(c.intro)} ${esc(TEXTY.kalkUvod)}</p>
  <div class="eet-kalk-ovladani">
  ${rezim}
  <div class="field" data-kalk-vlastni${k.mojeAllowed ? ' hidden' : ''}>
    <label for="${vlastniId}">${esc(c.ownCostLabel)}</label>
    <div class="input"><input id="${vlastniId}" name="${vlastniId}" type="text" inputmode="numeric" autocomplete="off" value=""><span class="unit" aria-hidden="true">${esc(rules.meta.currency)}</span></div>
  </div>
  </div>
  <div data-kalk-tabulka>${kalkulackaTabulkaHtml(k)}</div>
  <p class="eet-kalk-veta" data-kalk-veta aria-live="polite"><strong>${esc(k.veta)}</strong></p>
  <p class="note">${ikona('ikona-info', sprite)}<span>${esc(c.timeNote)}</span></p>
  ${r.taxCredit ? `<p class="note">${ikona('ikona-info', sprite)}<span>${esc(r.taxCredit.text)}</span></p>` : ''}
  <div class="eet-zdroje">${odkazZdroje(r.eetOff.amountsSource, sprite)}${r.taxCredit ? odkazZdroje(r.taxCredit.source, sprite) : ''}</div>
</section>`;
}

/** Kontrolní seznam s termíny (třídy .checklist). idPrefix odliší checkboxy. */
export function seznamHtml(m, rules, { sprite, idPrefix = 'ukol' } = {}) {
  const c = rules.checklist;
  const ui = rules.ui;
  const vars = uiVars(rules);
  let n = 0;
  const polozka = (i) => {
    n += 1;
    const id = `${idPrefix}-${n}`;
    const kdy = [];
    if (i.deadline) {
      const pevny = i.deadlineKind === 'hard';
      kdy.push(`<span class="when${pevny ? ' firm' : ''}">${ikona('ikona-kalendar', sprite)}${esc(pevny ? ui.deadlineHard : ui.deadlineRecommended)}: ${esc(datum(i.deadline))}</span>`);
    }
    if (i.availableFrom) {
      kdy.push(`<span class="when">${ikona('ikona-hodiny', sprite)}${esc(ui.availableFrom)}: ${esc(datum(i.availableFrom))}</span>`);
    }
    return `<li><input type="checkbox" id="${id}"><label for="${id}"><span class="box">${ikona('ikona-zaskrtnuti', sprite)}</span><span><span class="task">${esc(i.title)}</span>${kdy.length ? `<span class="eet-kdy">${kdy.join('')}</span>` : ''}</span></label><p class="eet-ukol-text">${esc(i.text)}</p>${odkazZdroje(i.source, sprite)}</li>`;
  };
  const skupiny = m.seznam.map((g) => `${g.title ? `<h3>${esc(g.title)}</h3>` : ''}<ul class="checklist">${g.items.map(polozka).join('')}</ul>`).join('');
  return `<section class="card eet-seznam" aria-labelledby="${idPrefix}-nadpis">
  <div class="card-head">
    <h2 id="${idPrefix}-nadpis">${esc(TEXTY.seznamNadpis)}</h2>
    <span class="badge badge-new">${esc(t('startBadge', { datum: datum(rules.launch.date) }))}</span>
  </div>
  ${m.verdikt === 'not' ? '' : `<p class="muted">${esc(fill(c.intro, vars))}</p>`}
  ${skupiny}
</section>`;
}

/* =====================================================================
   OSVČ 2027
   ===================================================================== */

/** Datový model srovnání tří variant. */
export function modelOsvc(vstup, rules) {
  const o = rules.osvc2027;
  const tx = o.texts;
  const res = compare(vstup, rules);
  const nej = res.variants.find((v) => v.id === res.cheapestId);
  const fr = o.expenseFlatRates.find((f) => f.id === vstup.flatRateId);
  const ukazPasma = res.variants[0].available || res.variants[0].code === 'overMax';
  return {
    res,
    nejlevnejsi: nej,
    nadpis: t('osvcNadpis', { varianta: nej.name }),
    cislo: kc(nej.annual),
    popis: t('osvcPopis', { mesicne: kc(nej.monthly) }),
    lista: t('osvcLista', { varianta: nej.name }),
    pasma: ukazPasma
      ? res.bands.map((b) => (b.eligible
        ? fill(tx.bandOk, { band: b.band.label, limit: kc(b.limit), monthly: kc(b.band.monthly) })
        : fill(tx.bandNo, { band: b.band.label, flat: fr.label, limit: kc(b.limit) })))
      : [],
  };
}

/** Výsledek OSVČ: karta, tabulka variant, pásma, poznámky a rozpis výpočtu. */
export function vysledekOsvcHtml(m, rules, { sprite, ukazka = false } = {}) {
  const o = rules.osvc2027;
  const tx = o.texts;
  const res = m.res;
  const sloupce = [tx.colVariant, tx.colAnnual, tx.colMonthly, tx.colDiff];
  const radky = res.variants.map((v) => {
    const nej = v.id === res.cheapestId;
    const nazev = `<th scope="row">${esc(v.name)}${nej ? ` <span class="badge badge-ok osvc-nej">${esc(tx.cheapestBadge)}</span>` : ''}</th>`;
    if (!v.available) {
      return `<tr class="osvc-nedostupne" data-varianta="${esc(v.id)}">${nazev}<td colspan="3" data-label="${esc(tx.unavailable)}"><strong>${esc(tx.unavailable)}:</strong> ${esc(v.reason ?? '')}</td></tr>`;
    }
    return `<tr${nej ? ' class="hl"' : ''} data-varianta="${esc(v.id)}">${nazev}`
      + `<td class="r" data-label="${esc(sloupce[1])}"><strong>${esc(kc(v.annual))}</strong></td>`
      + `<td class="r" data-label="${esc(sloupce[2])}">${esc(kc(v.monthly))}</td>`
      + `<td class="r" data-label="${esc(sloupce[3])}">${v.diff === 0 ? '—' : `+${esc(kc(v.diff))}`}</td></tr>`;
  }).join('');
  const zdroje = [
    { url: o.incomeTax.source, title: o.incomeTax.sourceTitle },
    { url: o.social.source, title: o.social.sourceTitle },
    { url: o.health.source, title: o.health.sourceTitle },
    { url: o.flatTax.conditionsSource, title: o.flatTax.conditionsSourceTitle },
  ];
  return `<section class="result" id="osvc-vysledek-karta" aria-labelledby="osvc-vysledek-nadpis"${ukazka ? ' data-ukazka' : ''}>
  <div class="result-top">
    <div>
      <p class="result-kicker">${esc(tx.resultTitle)}</p>
      <h2 id="osvc-vysledek-nadpis">${esc(m.nadpis)}</h2>
      <p class="big-num">${esc(m.cislo)}</p>
      <p class="big-num-label">${esc(m.popis)}</p>
    </div>
    <svg class="result-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#nastroj-mam-eet"/></svg>
  </div>
  <p class="result-expl">${esc(res.summary)}</p>
</section>
<section class="card" aria-labelledby="osvc-varianty-nadpis">
  <h2 id="osvc-varianty-nadpis">${esc(TEXTY.osvcCaption)}</h2>
  <div class="table-wrap" role="region" aria-label="Tabulka: ${esc(TEXTY.osvcCaption)}" tabindex="0">
    <table class="stack-table osvc-varianty">
      <caption class="sr-only">${esc(TEXTY.osvcCaption)}</caption>
      <thead><tr>${sloupce.map((s, i) => `<th scope="col"${i ? ' class="r"' : ''}>${esc(s)}</th>`).join('')}</tr></thead>
      <tbody>${radky}</tbody>
    </table>
  </div>
  ${m.pasma.length ? `<h3 class="mt-5">${esc(tx.bandsTitle)}</h3><ul class="osvc-pasma">${m.pasma.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
  ${res.notes.map((n) => `<p class="note">${ikona('ikona-info', sprite)}<span>${esc(n)}</span></p>`).join('')}
  <details class="osvc-rozpis">
    <summary>${esc(tx.breakdownTitle)}</summary>
    <ul>${res.breakdown.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
    <div class="eet-zdroje">${zdroje.map((z) => odkazZdroje(z, sprite)).join('')}</div>
  </details>
</section>`;
}

/** Text „Tvoje měsíční záloha“ pod termínem první platby. */
export function prvniPlatba(res, rules) {
  const tx = rules.osvc2027.texts;
  const flat = res.variants.find((v) => v.id === 'flat');
  const off = res.variants.find((v) => v.id === 'eetOff');
  const castka = [flat, off].filter((v) => v.available).map((v) => `${kc(v.monthly)} (${v.name})`).join(', ');
  return castka ? fill(tx.firstPaymentAmount, { amount: castka }) : '';
}

/** Položky „Stav ověření parametrů“ (statické, počítají se při buildu). */
export function stavyOvereni(rules) {
  const o = rules.osvc2027;
  const tx = o.texts;
  const p = params(rules);
  const ti = o.incomeTax;
  const stav = (s) => ({ official: tx.statusOfficial, secondary: tx.statusSecondary, derived: tx.statusDerived }[s] ?? s);
  const polozky = [
    { text: fill(tx.statusItemAverageWage, { value: kc(o.averageWage.monthly) }), item: o.averageWage },
    { text: fill(tx.statusItemSocial, { main: kc(p.socialMinAdvanceMain), side: kc(p.socialMinAdvanceSide), threshold: kc(p.sideThreshold) }), item: o.social },
    { text: fill(tx.statusItemHealth, { main: kc(p.healthMinAdvance) }), item: o.health },
    { text: fill(tx.statusItemTax, { credit: kc(ti.taxpayerCredit), children: ti.childCredits.map((x) => kc(x)).join(' / '), threshold: kc(p.highRateThreshold) }), item: ti },
    ...o.flatTax.bands.map((b) => ({ text: fill(tx.statusItemBand, { band: b.label, monthly: kc(b.monthly) }), item: b })),
  ];
  return polozky.map(({ text, item }) => ({
    text, stav: stav(item.status), status: item.status, poznamka: item.note ?? null,
    zdroj: { nazev: item.sourceTitle, url: item.source },
  }));
}

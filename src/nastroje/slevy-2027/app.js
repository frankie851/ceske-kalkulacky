// Slevy 2027 – průvodce po krocích (jedna skupina otázek na obrazovku, Zpět / Pokračovat).
// Výpočet je v slevy.js, texty kroků a HTML výsledku ve vystup.js (sdílí je i build).
// Odpovědi drží jen proměnná `stav` v paměti stránky: nic se neukládá ani neodesílá.
import { textyKroku, modelVysledku, vysledekHtml, seznamHtml, ikona, MESICE } from './vystup.js';
import { esc } from '../../js/graf.js';
import { kc } from '../../js/format.js';

const $ = (id) => document.getElementById(id);
const rules = JSON.parse($('pravidla').textContent);
const koren = $('slevy');
const sprite = koren.dataset.sprite;
const plan48 = koren.dataset.plan48;
const app = $('slevy-app');
const texty = textyKroku(rules);
const ROK = rules.rok;

let krok = 0;
let stav = novyStav();

function novyStav() {
  return {
    narozeni: { rok: '', mesic: 1 },
    mzda: { mesicne: '', mesice: 12 },
    studium: { studuje: false, od: 1, do: 12, druh: 'vs' },
    deti: [],
    manzel: { ma: false, prijem: '', peceODite: false, ztpp: false },
    invalidita: { stupen: 0, ztpp: false },
    hypoteka: { uroky: '', stareSmlouva: false },
    stari: { penzijko: '', dip: '', zivotni: '', dlouhodobaPece: '' },
    dary: { dary: '', krev: '' },
    odbory: false,
    prijmy: { maleDohody: '', soubezne: '', ostatni: '' },
  };
}

const noveDite = () => ({ narozeni: { rok: '', mesic: 1 }, ztpp: false, od: 1, do: 12, skolka: false, skolne: '', dveDomacnosti: false, dohodaStrop: '' });

/* ---------- Čísla z polí ---------- */

const bezMezer = (t) => String(t ?? '').replace(/[\s  ]/g, '');
const jeCele = (t) => bezMezer(t) === '' || /^\d+$/.test(bezMezer(t));
const cele = (t) => (bezMezer(t) === '' ? 0 : Number(bezMezer(t)));
const CHYBA_CISLA = 'Zadej celé číslo bez haléřů, nebo pole nech prázdné.';

/** Vrátí chyby pro číselná pole, která nejsou celé nezáporné číslo. */
function overCisla(dvojice) {
  const chyby = {};
  for (const [id, hodnota] of dvojice) if (!jeCele(hodnota)) chyby[id] = CHYBA_CISLA;
  return chyby;
}

/* ---------- Šablony polí (stejné třídy jako makra v komponenty/formular.njk) ---------- */

function chybaHtml(id, chyba) {
  if (!chyba) return '';
  return `<p class="error-msg" id="${id}-chyba">${ikona('ikona-vystraha', sprite)}<span><span class="sr-only">Chyba: </span><span class="error-text">${esc(chyba)}</span></span></p>`;
}

function popisPole(id, chyba, napoveda) {
  const p = [chyba ? `${id}-chyba` : null, napoveda ? `${id}-napoveda` : null].filter(Boolean).join(' ');
  return p ? ` aria-describedby="${p}"` : '';
}

function pole({ id, label, hodnota = '', jednotka, napoveda, chyba }) {
  return `<div class="field${chyba ? ' is-error' : ''}">
  <label for="${id}">${esc(label)}</label>
  <div class="input"><input id="${id}" name="${id}" type="text" inputmode="numeric" autocomplete="off" value="${esc(hodnota)}"${popisPole(id, chyba, napoveda)}${chyba ? ' aria-invalid="true"' : ''}>${jednotka ? `<span class="unit" aria-hidden="true">${esc(jednotka)}</span>` : ''}</div>
  ${chybaHtml(id, chyba)}
  ${napoveda ? `<span class="hint" id="${id}-napoveda">${jednotka ? `<span class="sr-only">V jednotkách ${esc(jednotka)}. </span>` : ''}${esc(napoveda)}</span>` : ''}
</div>`;
}

function vyber({ id, label, moznosti, hodnota, napoveda, chyba }) {
  return `<div class="field${chyba ? ' is-error' : ''}">
  <label for="${id}">${esc(label)}</label>
  <div class="input input-select"><select id="${id}" name="${id}"${popisPole(id, chyba, napoveda)}${chyba ? ' aria-invalid="true"' : ''}>${moznosti.map((m) => `<option value="${esc(m.hodnota)}"${String(m.hodnota) === String(hodnota) ? ' selected' : ''}>${esc(m.text)}</option>`).join('')}</select></div>
  ${chybaHtml(id, chyba)}
  ${napoveda ? `<span class="hint" id="${id}-napoveda">${esc(napoveda)}</span>` : ''}
</div>`;
}

const mesice = MESICE.map((m, i) => ({ hodnota: i + 1, text: m }));
const mesic = (id, label, hodnota, chyba) => vyber({ id, label, moznosti: mesice, hodnota, chyba });

function dlazdice(typ, nazev, moznosti) {
  return `<ul class="options">${moznosti.map((m, i) => {
    const id = `${nazev}-${i + 1}`;
    return `<li class="opt"><input type="${typ}" id="${id}" name="${nazev}" value="${esc(m.hodnota)}"${m.vybrano ? ' checked' : ''}><label for="${id}"><span class="box">${ikona('ikona-zaskrtnuti', sprite)}</span>${esc(m.text)}</label></li>`;
  }).join('')}</ul>`;
}

function anoNe(nazev, legenda, ano) {
  return `<fieldset class="volby"><legend>${esc(legenda)}</legend>${dlazdice('radio', nazev, [
    { hodnota: 'ano', text: 'Ano', vybrano: ano },
    { hodnota: 'ne', text: 'Ne', vybrano: !ano },
  ])}</fieldset>`;
}

const zaskrtnuti = (nazev, text, ano) => dlazdice('checkbox', nazev, [{ hodnota: 'ano', text, vybrano: ano }]);
const ano = (fd, nazev) => fd.get(nazev) === 'ano';

/* ---------- Kroky dotazníku ---------- */

function diteHtml(d, i, ch) {
  return `<fieldset class="slevy-dite">
  <legend>${i + 1}. dítě</legend>
  <div class="slevy-mrizka">
    ${pole({ id: `ditRok${i}`, label: 'Rok narození', hodnota: d.narozeni.rok, chyba: ch[`ditRok${i}`] })}
    ${mesic(`ditMesic${i}`, 'Měsíc narození', d.narozeni.mesic)}
    ${mesic(`ditOd${i}`, `V domácnosti v roce ${ROK} od`, d.od)}
    ${mesic(`ditDo${i}`, 'do', d.do, ch[`ditDo${i}`])}
  </div>
  ${zaskrtnuti(`ditZtpp${i}`, 'Dítě má průkaz ZTP/P', d.ztpp)}
  <button type="button" class="btn btn-ghost slevy-odebrat" data-akce="odebrat" data-index="${i}">Odebrat ${i + 1}. dítě</button>
</fieldset>`;
}

const predskolni = (s) => s.deti.map((d, i) => ({ d, i })).filter(({ d }) => cele(d.narozeni.rok) >= ROK - 7);

const KROKY = {
  zaklad: {
    html: (s, ch) => `<div class="slevy-mrizka">
      ${pole({ id: 'narRok', label: 'Rok narození', hodnota: s.narozeni.rok, chyba: ch.narRok })}
      ${mesic('narMesic', 'Měsíc narození', s.narozeni.mesic)}
    </div>
    <div class="slevy-mrizka">
      ${pole({ id: 'mzda', label: 'Hrubá měsíční mzda (nepovinné)', hodnota: s.mzda.mesicne, jednotka: 'Kč', napoveda: 'U hlavního zaměstnavatele.', chyba: ch.mzda })}
      ${vyber({ id: 'mzdaMesice', label: `Kolik měsíců v roce ${ROK} pracuješ?`, hodnota: s.mzda.mesice, moznosti: Array.from({ length: 12 }, (_, i) => ({ hodnota: 12 - i, text: String(12 - i) })) })}
    </div>`,
    cti: (fd, s) => {
      s.narozeni = { rok: fd.get('narRok') ?? '', mesic: Number(fd.get('narMesic')) || 1 };
      s.mzda = { mesicne: fd.get('mzda') ?? '', mesice: Number(fd.get('mzdaMesice')) || 12 };
    },
    over: (s) => {
      const ch = overCisla([['mzda', s.mzda.mesicne]]);
      const r = bezMezer(s.narozeni.rok);
      if (!/^\d{4}$/.test(r) || cele(r) < ROK - 100 || cele(r) > ROK) ch.narRok = 'Zadej rok narození, třeba 1990.';
      return ch;
    },
  },
  studium: {
    html: (s, ch) => `${anoNe('studuje', 'Studuješ střední, vyšší odbornou nebo vysokou školu?', s.studium.studuje)}
    <div data-zavisi="studuje">
      <div class="slevy-mrizka">
        ${mesic('studOd', `Studium v roce ${ROK} od`, s.studium.od)}
        ${mesic('studDo', 'do', s.studium.do, ch.studDo)}
      </div>
      ${vyber({ id: 'studDruh', label: 'Druh studia', hodnota: s.studium.druh, moznosti: [
        { hodnota: 'ss', text: 'střední nebo vyšší odborná škola' },
        { hodnota: 'vs', text: 'VŠ – bakalářské nebo magisterské' },
        { hodnota: 'doktorske', text: 'VŠ – doktorské, prezenční forma' },
        { hodnota: 'doktorskeJine', text: 'VŠ – doktorské, kombinovaná nebo distanční forma' },
      ] })}
    </div>`,
    cti: (fd, s) => {
      s.studium = { studuje: ano(fd, 'studuje'), od: Number(fd.get('studOd')) || 1, do: Number(fd.get('studDo')) || 12, druh: fd.get('studDruh') || 'vs' };
    },
    over: (s) => (s.studium.studuje && s.studium.od > s.studium.do ? { studDo: 'Měsíc „do“ musí být stejný nebo pozdější než měsíc „od“.' } : {}),
  },
  deti: {
    html: (s, ch) => `<div class="slevy-deti" id="slevy-deti">${s.deti.length
      ? s.deti.map((d, i) => diteHtml(d, i, ch)).join('')
      : '<p class="note slevy-zadne">Zatím bez dětí. Přidej je tlačítkem, nebo rovnou pokračuj.</p>'}</div>
    <p class="slevy-pridat"><button type="button" class="btn btn-ghost" data-akce="pridat">+ Přidat dítě</button></p>`,
    cti: (fd, s) => {
      s.deti.forEach((d, i) => {
        if (!fd.has(`ditRok${i}`)) return;
        d.narozeni = { rok: fd.get(`ditRok${i}`) ?? '', mesic: Number(fd.get(`ditMesic${i}`)) || 1 };
        d.od = Number(fd.get(`ditOd${i}`)) || 1;
        d.do = Number(fd.get(`ditDo${i}`)) || 12;
        d.ztpp = ano(fd, `ditZtpp${i}`);
      });
    },
    over: (s) => {
      const ch = {};
      s.deti.forEach((d, i) => {
        const r = bezMezer(d.narozeni.rok);
        if (!/^\d{4}$/.test(r) || cele(r) > ROK || cele(r) < ROK - 26) ch[`ditRok${i}`] = `Zadej rok narození dítěte (${ROK - 26} až ${ROK}).`;
        if (d.od > d.do) ch[`ditDo${i}`] = 'Měsíc „do“ musí být stejný nebo pozdější než měsíc „od“.';
      });
      return ch;
    },
  },
  skolka: {
    html: (s, ch) => {
      const deti = predskolni(s);
      if (!deti.length) return '<p class="note slevy-zadne">Žádné dítě v předškolním věku. Můžeš pokračovat.</p>';
      return deti.map(({ d, i }) => `<fieldset class="slevy-dite">
        <legend>${i + 1}. dítě (narození ${esc(bezMezer(d.narozeni.rok))})</legend>
        ${zaskrtnuti(`skolka${i}`, 'Chodí do mateřské školy, dětské skupiny nebo podobného zařízení', d.skolka)}
        <div data-zavisi="skolka${i}">
          ${pole({ id: `skolne${i}`, label: `Školné zaplacené za rok ${ROK}`, hodnota: d.skolne, jednotka: 'Kč', napoveda: 'Jen úplata za umístění, ne stravné.', chyba: ch[`skolne${i}`] })}
          ${zaskrtnuti(`dveDom${i}`, 'Dítě žije střídavě i v jiné domácnosti (například u druhého rodiče)', d.dveDomacnosti)}
          <div data-zavisi="dveDom${i}">
            ${pole({ id: `dohoda${i}`, label: 'Písemná dohoda: tvůj podíl na limitu (nepovinné)', hodnota: d.dohodaStrop, jednotka: 'Kč', napoveda: `Jen při písemné dohodě jiné než napůl. Bez dohody je strop ${kc(Math.floor(rules.slevy.skolkovne.stropNaDite / 2))}.`, chyba: ch[`dohoda${i}`] })}
          </div>
        </div>
      </fieldset>`).join('');
    },
    cti: (fd, s) => {
      s.deti.forEach((d, i) => {
        if (!fd.has(`skolne${i}`)) return;
        d.skolka = ano(fd, `skolka${i}`);
        d.skolne = fd.get(`skolne${i}`) ?? '';
        d.dveDomacnosti = ano(fd, `dveDom${i}`);
        d.dohodaStrop = fd.get(`dohoda${i}`) ?? '';
      });
    },
    over: (s) => overCisla(predskolni(s).flatMap(({ d, i }) => (d.skolka ? [[`skolne${i}`, d.skolne], [`dohoda${i}`, d.dveDomacnosti ? d.dohodaStrop : '']] : []))),
  },
  manzel: {
    html: (s, ch) => `${anoNe('maManzela', 'Žiješ s manželem nebo manželkou ve společné domácnosti?', s.manzel.ma)}
    <div data-zavisi="maManzela">
      ${pole({ id: 'manzelPrijem', label: `Jeho nebo její vlastní příjem za rok ${ROK}`, hodnota: s.manzel.prijem, jednotka: 'Kč', napoveda: 'Například mateřská, nemocenská nebo mzda. Bez rodičovského příspěvku a dávek státní sociální podpory.', chyba: ch.manzelPrijem })}
      ${zaskrtnuti('peceODite', `Žijeme spolu s naším dítětem mladším ${rules.slevy.manzel.vekDitete} let`, s.manzel.peceODite)}
      ${zaskrtnuti('manzelZtpp', 'Manžel nebo manželka má průkaz ZTP/P', s.manzel.ztpp)}
    </div>`,
    cti: (fd, s) => {
      s.manzel = { ma: ano(fd, 'maManzela'), prijem: fd.get('manzelPrijem') ?? '', peceODite: ano(fd, 'peceODite'), ztpp: ano(fd, 'manzelZtpp') };
    },
    over: (s) => (s.manzel.ma ? overCisla([['manzelPrijem', s.manzel.prijem]]) : {}),
  },
  invalidita: {
    html: (s) => `${vyber({ id: 'invalidita', label: 'Pobíráš invalidní důchod?', hodnota: s.invalidita.stupen, moznosti: [
      { hodnota: 0, text: 'ne' },
      { hodnota: 1, text: 'ano, I. stupeň' },
      { hodnota: 2, text: 'ano, II. stupeň' },
      { hodnota: 3, text: 'ano, III. stupeň' },
    ] })}
    ${zaskrtnuti('vlastniZtpp', 'Mám průkaz ZTP/P', s.invalidita.ztpp)}`,
    cti: (fd, s) => { s.invalidita = { stupen: Number(fd.get('invalidita')) || 0, ztpp: ano(fd, 'vlastniZtpp') }; },
    over: () => ({}),
  },
  hypoteka: {
    html: (s, ch) => `${pole({ id: 'uroky', label: `Úroky zaplacené za rok ${ROK}`, hodnota: s.hypoteka.uroky, jednotka: 'Kč', napoveda: 'Najdeš je v potvrzení od banky. Bez úvěru nech pole prázdné.', chyba: ch.uroky })}
    ${zaskrtnuti('stareSmlouva', 'Úvěrová smlouva je uzavřená před 1. 1. 2021', s.hypoteka.stareSmlouva)}`,
    cti: (fd, s) => { s.hypoteka = { uroky: fd.get('uroky') ?? '', stareSmlouva: ano(fd, 'stareSmlouva') }; },
    over: (s) => overCisla([['uroky', s.hypoteka.uroky]]),
  },
  stari: {
    html: (s, ch) => `<div class="slevy-mrizka">
      ${pole({ id: 'penzijko', label: 'Penzijní spoření za rok', hodnota: s.stari.penzijko, jednotka: 'Kč', chyba: ch.penzijko })}
      ${pole({ id: 'dip', label: 'DIP za rok', hodnota: s.stari.dip, jednotka: 'Kč', chyba: ch.dip })}
      ${pole({ id: 'zivotni', label: 'Životní pojištění za rok', hodnota: s.stari.zivotni, jednotka: 'Kč', chyba: ch.zivotni })}
      ${pole({ id: 'dlouhodobaPece', label: 'Pojištění dlouhodobé péče za rok', hodnota: s.stari.dlouhodobaPece, jednotka: 'Kč', chyba: ch.dlouhodobaPece })}
    </div>
    <p class="note">${ikona('ikona-info', sprite)}<span>Kolik ti stát přidá na penzijko a jak využít celý limit, spočítá <a href="${esc(plan48)}">Plán48</a>.</span></p>`,
    cti: (fd, s) => {
      s.stari = { penzijko: fd.get('penzijko') ?? '', dip: fd.get('dip') ?? '', zivotni: fd.get('zivotni') ?? '', dlouhodobaPece: fd.get('dlouhodobaPece') ?? '' };
    },
    over: (s) => overCisla(Object.entries(s.stari)),
  },
  dary: {
    html: (s, ch) => `<div class="slevy-mrizka">
      ${pole({ id: 'dary', label: `Dary celkem za rok ${ROK}`, hodnota: s.dary.dary, jednotka: 'Kč', chyba: ch.dary })}
      ${pole({ id: 'krev', label: 'Počet bezpříspěvkových odběrů krve', hodnota: s.dary.krev, chyba: ch.krev })}
    </div>
    ${zaskrtnuti('odbory', 'Platím členské příspěvky odborům', s.odbory)}`,
    cti: (fd, s) => { s.dary = { dary: fd.get('dary') ?? '', krev: fd.get('krev') ?? '' }; s.odbory = ano(fd, 'odbory'); },
    over: (s) => overCisla([['dary', s.dary.dary], ['krev', s.dary.krev]]),
  },
  prijmy: {
    html: (s, ch) => {
      const p = rules.priznani;
      return `${pole({ id: 'maleDohody', label: 'Malé dohody u jiného zaměstnavatele za rok', hodnota: s.prijmy.maleDohody, jednotka: 'Kč', napoveda: `DPP pod ${kc(p.limitMaleDppMesicne)} měsíčně, jiná dohoda nebo zaměstnání malého rozsahu pod ${kc(p.limitMalyRozsahMesicne)} měsíčně – u zaměstnavatele bez podepsaného prohlášení.`, chyba: ch.maleDohody })}
      ${pole({ id: 'soubezne', label: 'Jiný souběžný příjem ze zaměstnání za rok', hodnota: s.prijmy.soubezne, jednotka: 'Kč', napoveda: 'Druhý pracovní poměr nebo dohoda nad uvedené limity u jiného zaměstnavatele.', chyba: ch.soubezne })}
      ${pole({ id: 'ostatni', label: 'Pronájem, podnikání a jiné příjmy za rok', hodnota: s.prijmy.ostatni, jednotka: 'Kč', chyba: ch.ostatni })}`;
    },
    cti: (fd, s) => { s.prijmy = { maleDohody: fd.get('maleDohody') ?? '', soubezne: fd.get('soubezne') ?? '', ostatni: fd.get('ostatni') ?? '' }; },
    over: (s) => overCisla(Object.entries(s.prijmy)),
  },
};

/* ---------- Krokovač (pruh „Krok 2 z 10“) ---------- */

function krokovac(aktualni, hotovo = false) {
  const pocet = texty.length;
  const polozky = texty.map((t, i) => {
    const done = hotovo || i < aktualni;
    const cur = !hotovo && i === aktualni;
    return `<li${done ? ' class="done"' : cur ? ' class="current" aria-current="step"' : ''}><span class="sr-only">${i + 1}. ${esc(t.nazev)}${done ? ' – hotovo' : cur ? ' – právě tady' : ''}</span></li>`;
  }).join('');
  const label = hotovo
    ? `<span>Hotovo, všech ${pocet} kroků</span><span class="muted">Odpovědi nikam neposíláme</span>`
    : `<span>Krok ${aktualni + 1} z ${pocet} · ${esc(texty[aktualni].nazev)}</span>${aktualni + 1 < pocet ? `<span class="muted">Další: ${esc(texty[aktualni + 1].nazev)}</span>` : ''}`;
  return `<div class="bar-progress"><p class="bar-label">${label}</p><ol class="bar-steps" aria-label="Kroky průvodce"${hotovo ? ' aria-hidden="true"' : ''}>${polozky}</ol></div>`;
}

/* ---------- Vykreslení kroku ---------- */

function fokusNa(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  const r = el.getBoundingClientRect();
  if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'start' });
}

function nastavZavislosti() {
  for (const blok of app.querySelectorAll('[data-zavisi]')) {
    const vstup = app.querySelector(`input[name="${blok.dataset.zavisi}"]:checked`);
    blok.hidden = !vstup || vstup.value !== 'ano';
  }
}

function vykresliKrok({ fokus = true, chyby = {}, fokusId = null } = {}) {
  const t = texty[krok];
  const k = KROKY[t.id];
  const posledni = krok === texty.length - 1;
  app.innerHTML = `<section class="slevy-krok" aria-labelledby="krok-nadpis">
  ${krokovac(krok)}
  <form class="quiz" id="slevy-formular" novalidate aria-describedby="krok-napoveda">
    <h2 class="quiz-q" id="krok-nadpis" tabindex="-1">${esc(t.nadpis)}</h2>
    <p class="hint slevy-napoveda" id="krok-napoveda">${esc(t.napoveda)}</p>
    ${k.html(stav, chyby)}
    <div class="quiz-actions">
      ${krok > 0 ? `<button type="button" class="btn btn-ghost" data-akce="zpet">${ikona('ikona-sipka-zpet', sprite)}Zpět</button>` : ''}
      <button type="submit" class="btn btn-primary">${posledni ? 'Ukázat výsledek' : 'Pokračovat'}${ikona('ikona-sipka', sprite)}</button>
    </div>
  </form>
</section>`;
  nastavZavislosti();
  const prvniChyba = Object.keys(chyby)[0];
  if (prvniChyba) fokusNa($(prvniChyba));
  else if (fokusId) fokusNa($(fokusId));
  else if (fokus) fokusNa($('krok-nadpis'));
}

function precti() {
  const form = $('slevy-formular');
  if (form) KROKY[texty[krok].id].cti(new FormData(form), stav);
}

function dalsi() {
  precti();
  const chyby = KROKY[texty[krok].id].over(stav);
  if (Object.keys(chyby).length) { vykresliKrok({ chyby }); return; }
  if (krok < texty.length - 1) { krok += 1; vykresliKrok(); } else vykresliVysledek();
}

function zpet() {
  precti();
  if (krok > 0) { krok -= 1; vykresliKrok(); }
}

/* ---------- Výsledek ---------- */

/** Převede odpovědi z formuláře na vstup pro slevy.js. */
function odpovedi() {
  const s = stav;
  return {
    narozeni: { rok: cele(s.narozeni.rok), mesic: s.narozeni.mesic },
    mzda: cele(s.mzda.mesicne) ? { mesicne: cele(s.mzda.mesicne), mesice: s.mzda.mesice } : null,
    studium: { ...s.studium, druh: s.studium.druh === 'doktorskeJine' ? 'vs' : s.studium.druh },
    deti: s.deti.map((d) => ({
      narozeni: { rok: cele(d.narozeni.rok), mesic: d.narozeni.mesic },
      ztpp: d.ztpp, od: d.od, do: d.do,
      skolka: d.skolka && cele(d.narozeni.rok) >= ROK - 7,
      skolne: cele(d.skolne),
      domacnosti: d.dveDomacnosti ? 2 : 1,
      dohodaStrop: d.dveDomacnosti ? cele(d.dohodaStrop) : 0,
    })),
    manzel: { ...s.manzel, prijem: cele(s.manzel.prijem) },
    invalidita: s.invalidita,
    hypoteka: { uroky: cele(s.hypoteka.uroky), stareSmlouva: s.hypoteka.stareSmlouva },
    stari: Object.fromEntries(Object.entries(s.stari).map(([k, v]) => [k, cele(v)])),
    dary: { dary: cele(s.dary.dary), krev: cele(s.dary.krev) },
    odbory: s.odbory,
    prijmy: Object.fromEntries(Object.entries(s.prijmy).map(([k, v]) => [k, cele(v)])),
  };
}

function vykresliVysledek() {
  const odp = odpovedi();
  const m = modelVysledku(odp, rules);
  app.innerHTML = `<section class="slevy-hotovo" aria-label="Výsledek průvodce">
  ${krokovac(texty.length, true)}
  ${vysledekHtml(m, odp, rules, { sprite, plan48 })}
  ${seznamHtml(m, rules, { sprite })}
  <div class="form-actions slevy-akce">
    <button type="button" class="btn btn-ghost" data-akce="upravit">${ikona('ikona-sipka-zpet', sprite)}Zpět k otázkám</button>
    <button type="button" class="btn btn-ghost" data-akce="znovu">Začít znovu</button>
  </div>
</section>`;
  fokusNa($('vysledek-nadpis'));
}

/* ---------- Události ---------- */

app.addEventListener('submit', (e) => { e.preventDefault(); dalsi(); });
app.addEventListener('change', (e) => { if (e.target.matches('input[type="radio"], input[type="checkbox"]')) nastavZavislosti(); });
app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-akce]');
  if (!b) return;
  const akce = b.dataset.akce;
  if (akce === 'zpet') zpet();
  else if (akce === 'pridat') {
    precti();
    stav.deti.push(noveDite());
    vykresliKrok({ fokusId: `ditRok${stav.deti.length - 1}` });
  } else if (akce === 'odebrat') {
    precti();
    stav.deti.splice(Number(b.dataset.index), 1);
    vykresliKrok({ fokusId: stav.deti.length ? `ditRok${Math.min(Number(b.dataset.index), stav.deti.length - 1)}` : null });
    if (!stav.deti.length) fokusNa(app.querySelector('[data-akce="pridat"]'));
  } else if (akce === 'upravit') {
    krok = texty.length - 1;
    vykresliKrok();
  } else if (akce === 'znovu') {
    stav = novyStav();
    krok = 0;
    vykresliKrok();
  }
});

/* ---------- Start ---------- */

$('slevy-bez-js')?.remove();
vykresliKrok({ fokus: false });

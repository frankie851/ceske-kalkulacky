// Volno 2027 – ukázkový výsledek spočítaný při buildu stejným modulem jako v prohlížeči.
// Stránka bez JavaScriptu ukáže návrhy pro 1 den dovolené, kalendář roku, svátky a zavřené obchody.
import fs from 'node:fs';
import { nejlepsiNavrhy, svatkyRoku, zavreneObchodyRoku, prehledRoku, denVTydnu, jeVikend, jeVolno, posunDny } from './volno.js';
import * as v from './vystup.js';

const pravidla = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const rok = pravidla.rok;
const maxNavrhu = pravidla.maxNavrhu;
const VYCHOZI = 1;

const navrhy = nejlepsiNavrhy(rok, VYCHOZI, pravidla, { max: maxNavrhu });
const texty = v.textyVysledku(navrhy, VYCHOZI, rok);
const prehled = prehledRoku(rok, pravidla);

// Srovnání pro 1–5 dnů dovolené (nejlepší návrh pro každý počet; bez JS je vidět celé)
const srovnani = Array.from({ length: pravidla.maxDnuDovolene }, (_, i) => {
  const [n] = nejlepsiNavrhy(rok, i + 1, pravidla, { max: 1 });
  return n
    ? [v.dny(i + 1), `${v.dny(n.delka)} volna`, `${v.rozsah(n.od, n.do)} (${v.nazevVolna(n)})`, v.dnyDovolene(n.dovolena)]
    : [v.dny(i + 1), '–', '–', '–'];
});

const ZAVRENO = { 'cely-den': 'zavřeno', 'od-poledne': 'od 12:00 zavřeno' };
const svatky = svatkyRoku(rok, pravidla);
const zavrene = zavreneObchodyRoku(rok, pravidla);

const sRokem = (iso) => v.kratkeDatum(iso, true);
const { vycet, veta, mnozne } = v;

// Zajímavosti z dat (vše spočítané, nic natvrdo)
const nejdelsi = prehled.prodlouzeneVikendy.filter((b) => b.delka === prehled.nejdelsiBezDovolene?.delka);
const uprostred = prehled.svatkyVPracovniDen.filter((s) => denVTydnu(s.datum) === 2);
// Svátek v úterý (pondělí pracovní) nebo ve čtvrtek (pátek pracovní): jeden den dovolené = 4 dny volna
const mosty = prehled.svatkyVPracovniDen.filter((s) =>
  (denVTydnu(s.datum) === 1 && !jeVolno(posunDny(s.datum, -1), pravidla))
  || (denVTydnu(s.datum) === 3 && !jeVolno(posunDny(s.datum, 1), pravidla)));
const zajimavosti = [
  prehled.svatkyOVikendu.length && {
    titulek: `${mnozne(prehled.svatkyOVikendu.length, 'svátek', 'svátky', 'svátků')} o víkendu`,
    text: `${vycet(prehled.svatkyOVikendu.map((s) => `${s.nazev} (${v.kratkeDatum(s.datum)}, ${v.denSlovem(s.datum)})`))}. Tyhle svátky ti volno navíc nedají, v Česku se za ně volno nenahrazuje.`,
  },
  nejdelsi.length && {
    titulek: `Nejdelší volno bez dovolené: ${v.dny(nejdelsi[0].delka)}`,
    text: veta(vycet(nejdelsi.map((b) => `${v.rozsah(b.od, b.do)} (${v.nazevVolna(b)})`))),
  },
  prehled.prodlouzeneVikendy.length && {
    titulek: `${mnozne(prehled.prodlouzeneVikendy.length, 'prodloužený víkend', 'prodloužené víkendy', 'prodloužených víkendů')} bez dovolené`,
    text: veta(vycet(prehled.prodlouzeneVikendy.map((b) => `${v.rozsah(b.od, b.do)} (${v.dny(b.delka)})`))),
  },
  mosty.length && {
    titulek: mosty.length === 1 ? 'Svátek v úterý nebo ve čtvrtek' : 'Svátky v úterý a ve čtvrtek',
    text: `${vycet(mosty.map((s) => `${s.nazev} (${v.sDnem(s.datum)})`))}. Stačí den dovolené v pondělí nebo v pátek a máš čtyři dny volna.`,
  },
  uprostred.length && {
    titulek: uprostred.length === 1 ? 'Svátek uprostřed týdne' : 'Svátky uprostřed týdne',
    text: `${vycet(uprostred.map((s) => `${s.nazev} (${v.sDnem(s.datum)})`))}. S jedním dnem dovolené z něj moc nevytěžíš, vyplatí se spíš dva dny.`,
  },
].filter(Boolean).map((z) => ({ ...z, text: z.text.charAt(0).toUpperCase() + z.text.slice(1) }));

export default {
  volno: {
    rok,
    vychozi: VYCHOZI,
    vychoziText: v.dny(VYCHOZI),
    moznosti: Array.from({ length: pravidla.maxDnuDovolene }, (_, i) => ({
      hodnota: String(i + 1), text: v.dny(i + 1), vybrano: i + 1 === VYCHOZI,
    })),
    texty,
    navrhyHtml: v.navrhyHtml(navrhy),
    kalendarHtml: v.kalendarHtml(rok, pravidla, v.dovolenaZNavrhu(navrhy)),
    srovnani,
    statistiky: [
      { hodnota: String(prehled.pocetSvatku), popis: `svátků v roce ${rok}` },
      { hodnota: String(prehled.svatkyVPracovniDen.length), popis: 'z nich v pracovní den', zvyraznit: true },
      { hodnota: String(prehled.volnychDnu), popis: 'volných dní (víkendy a svátky)' },
    ],
    svatkyRadky: svatky.map((s) => [
      sRokem(s.datum),
      v.denSlovem(s.datum) + (jeVikend(s.datum) ? ' (víkend)' : ''),
      s.nazev,
      s.zavreno ? ZAVRENO[s.zavreno] : 'otevřeno',
    ]),
    zavrene: zavrene.map((z) => ({
      datum: v.sDnem(z.datum, true),
      nazev: z.nazev,
      kdy: z.zavreno === 'od-poledne' ? `od ${z.od}` : 'celý den',
      odPoledne: z.zavreno === 'od-poledne',
    })),
    otevreneSvatky: vycet(svatky.filter((s) => !s.zavreno).map((s) => `${s.nazev} (${v.kratkeDatum(s.datum)})`)),
    plochaNad: pravidla.zavreneObchody.plochaNad,
    vyjimky: pravidla.zavreneObchody.vyjimky,
    zajimavosti,
  },
};

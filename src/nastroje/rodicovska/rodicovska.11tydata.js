// Rodičovská pro celou rodinu – ukázkový výsledek spočítaný při buildu stejnými moduly jako v prohlížeči.
// Stránka bez JavaScriptu ukáže formulář s těmito hodnotami, výsledek a časovou osu.
// Termín porodu je deterministický: datum ověření pravidel + 150 dní (ne dnešek), aby build
// vždy vyšel stejně. V prohlížeči se výchozí termín posune na dnešek + 150 dní.
import fs from 'node:fs';
import { planRodiny, VYCHOZI_VSTUP, pridejDny } from './rodina.js';
import { svgOsa } from './timeline.js';
import { kc, cislo } from '../../js/format.js';
import * as v from './vystup.js';

const pravidla = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const P = pravidla.ppm;
const DNI_DO_PORODU = 150;
const SIRKA_OSY = 400;

const vstup = { ...VYCHOZI_VSTUP, terminPorodu: pridejDny(pravidla.meta.overeno, DNI_DO_PORODU) };
const plan = planRodiny(vstup, pravidla);
const vek = plan.rp.vekMesicu;
const pole = (n) => cislo(n).replace(/ /g, ' ');
const ano = (vybrano) => [
  { hodnota: 'ano', text: 'Ano', vybrano: Boolean(vybrano) },
  { hodnota: 'ne', text: 'Ne', vybrano: !vybrano },
];
const tydnu = [];
for (let t = P.nastupTydnyPredMin; t <= P.nastupTydnyPredMax; t++) {
  tydnu.push({ hodnota: String(t), text: `${t} týdnů před termínem`, vybrano: t === plan.vstup.ppmTydnuPred });
}
const vysledek = v.vysledek(plan);
const souhrn = v.radkySouhrnu(plan, pravidla);

export default {
  rodicovska: {
    vstup,
    terminMin: [...pravidla.rodicovsky].map((r) => r.narozeniOd).sort()[0],
    pole: {
      termin: vstup.terminPorodu,
      prijemMatka: pole(vstup.prijemMatka),
      prijemOtec: pole(vstup.prijemOtec),
      otcovskaOd: String(vstup.otcovskaOdDne),
      stridaniOd: String(vstup.stridaniOdMesice),
      navratOd: String(vstup.navratOdMesice),
    },
    moznosti: {
      vicercata: [{ hodnota: 'ne', text: 'Jedno dítě', vybrano: !vstup.vicercata }, { hodnota: 'ano', text: 'Vícerčata', vybrano: vstup.vicercata }],
      narokMatka: ano(vstup.narokMatka),
      narokOtec: ano(vstup.narokOtec),
      kdoPpm: [
        { hodnota: 'matka', text: 'Matka', vybrano: vstup.kdoPpm === 'matka' },
        { hodnota: 'otec', text: 'Otec', vybrano: vstup.kdoPpm === 'otec' },
        { hodnota: 'nikdo', text: 'Nikdo', vybrano: vstup.kdoPpm === 'nikdo' },
      ],
      tydnu,
      otcovska: ano(vstup.otcovska),
      stridani: ano(vstup.stridani),
      navrat: ano(vstup.navrat),
    },
    napovedy: {
      prijemMatka: v.napovedaPrijmu(vstup.prijemMatka, pravidla),
      prijemOtec: v.napovedaPrijmu(vstup.prijemOtec, pravidla),
      narokMatka: `Nárok má, kdo byl nemocensky pojištěný aspoň ${cislo(P.narokDnyPojisteni)} dní za poslední 2 roky. Počítáme jen se zaměstnanci, ne s OSVČ.`,
      kdoPpm: `Matka nastupuje ${P.nastupTydnyPredMax} až ${P.nastupTydnyPredMin} týdnů před termínem. Otec může mateřskou převzít nejdřív od 7. týdne po porodu.`,
      otcovskaOd: `0 = v den porodu, nejvýš ${cislo(pravidla.otcovska.nastupDoDne)}. Otcovská trvá ${cislo(pravidla.otcovska.dny)} dní v kuse a musí začít do 6 týdnů od narození.`,
      stridaniOd: 'Od kterého měsíce věku dítěte přebírá péči druhý rodič (0 = měsíc narození).',
      navratOd: `Od kterého měsíce věku dítěte pracují oba rodiče. Rodičovský příspěvek běží dál.`,
    },
    otcovskaMax: pravidla.otcovska.nastupDoDne,
    vekMax: vek - 1,
    shrnuti: v.shrnutiKroku(plan, pravidla),
    rp: {
      min: v.KROK_VYSE,
      max: plan.rp.strop,
      krok: v.KROK_VYSE,
      hodnota: plan.rp.vyse,
      text: kc(plan.rp.vyse),
      napoveda: v.napovedaRp(plan, pravidla),
      novela: plan.rp.pozn ? `${kc(plan.rp.celkem)}: zákon č. ${plan.rp.zakon}` : null,
    },
    // Výsledek
    vysledek,
    varovani: v.varovani(plan, vstup, pravidla),
    legenda: v.legenda,
    osa: svgOsa(plan, { sirka: SIRKA_OSY }),
    sloupceMesicu: v.sloupceMesicu,
    radkyMesicu: v.radkyMesicu(plan),
    sloupceSouhrnu: v.sloupceSouhrnu,
    radkySouhrnu: souhrn,
    zvyraznitSouhrn: v.zvyraznitSouhrn(souhrn),
    jakPocitame: v.jakPocitame(plan, pravidla),
    kontrolniSeznam: v.kontrolniSeznam(plan, pravidla),
  },
};

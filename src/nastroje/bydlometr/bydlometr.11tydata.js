// Bydlometr – ukázkový výsledek spočítaný při buildu stejným modulem jako v prohlížeči (vystup.js).
// Bez JavaScriptu stránka ukáže obě části: refixaci pro defaults.refixExample (porovnání čtyř variant
// a zátěžový test), poplatek za mimořádnou splátku a nájem vs. koupě pro defaults.rentbuyExample
// (graf, bod zvratu, citlivost, tabulka po letech). Deterministické: data z rules.json a defaults.json,
// výchozí data kalkulačky poplatku z meta.overeno, ne z dnešního data.
import fs from 'node:fs';
import * as v from './vystup.js';
import { kc, datum } from '../../js/format.js';

const cti = (soubor) => JSON.parse(fs.readFileSync(new URL(soubor, import.meta.url), 'utf8'));
const pravidla = cti('./rules.json');
const defaults = cti('./defaults.json');
const data = { pravidla, defaults };
const val = (item) => item.value;

/** Parametry makra pole() pro pole z vystup.js. */
const pole = (p, hodnota, mesto) => ({
  id: p.id,
  label: p.label,
  hodnota: v.textPole(p, hodnota),
  jednotka: p.jednotka,
  inputmode: p.inputmode || 'numeric',
  napoveda: v.napovedaPole(p, data, mesto),
  chybaMisto: true,
});
const poKrocich = (seznam, vstup, mesto) => {
  const kroky = {};
  for (const p of seznam) (kroky[p.krok] ||= []).push(pole(p, vstup[p.klic], mesto));
  return kroky;
};

// Refixace
const vstupRefixace = v.vychoziRefixace(data);
const refixace = v.refixace(vstupRefixace, pravidla);

// Poplatek za mimořádnou splátku
const vstupPoplatku = v.vychoziPoplatek(data);
const poplatek = v.poplatek(vstupPoplatku, pravidla);

// Nájem vs. koupě
const vstupNajmu = v.vychoziNajem(data);
const najem = v.najem(vstupNajmu, pravidla);
const vek = pravidla.ltv;

// Do stránky jde jen to, co prohlížeč potřebuje: hodnota a zdroj pro nápovědu pod polem
// (celý defaults.json s popisy a odkazy je v repozitáři, zdroje ukazuje layout z rules.json).
function proKlienta(o) {
  if (o === null || typeof o !== 'object') return o;
  if ('value' in o && 'source' in o) {
    const { value, source, short, date } = o;
    return short ? { value, source, short, date } : { value, source, date };
  }
  return Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'meta').map(([k, x]) => [k, proKlienta(x)]));
}

export default {
  bydlometr: {
    defaults: proKlienta(defaults),
    refixace: {
      ...refixace,
      surove: undefined,
      kroky: poKrocich(v.POLE_REFIXACE, vstupRefixace),
    },
    poplatek: {
      ...poplatek,
      pole: v.POLE_POPLATEK.map((p) => pole(p, vstupPoplatku[p.klic])),
      data: v.DATA_POPLATKU.map((p) => ({ id: p.id, label: p.label, typ: 'date', hodnota: vstupPoplatku[p.klic], chybaMisto: true })),
      platnost: datum(val(pravidla.prepayment.lawChangeDate)),
      vyuzito: [{ hodnota: 'vyuzito', text: `Letos už byla bezplatná splátka (${v.podil(val(pravidla.prepayment.freeShareOfOriginalLoan))}) využitá` }],
    },
    najem: {
      ...najem,
      surove: undefined,
      kroky: poKrocich(v.POLE_NAJEM, vstupNajmu, vstupNajmu.city),
      shrnuti: v.shrnutiNajmu(vstupNajmu, data),
      ...v.moznosti(data, vstupNajmu),
      napovedaDane: `${v.podil(val(pravidla.interestDeduction.taxRateHigh))} platí jen pro část příjmů nad zákonný limit.`,
      volby: [
        { hodnota: 'odpocet', text: 'Uplatnit odpočet úroků z daní', vybrano: vstupNajmu.deductInterest },
        { hodnota: 'investicni', text: 'Investiční byt (k pronájmu nebo třetí a další)', vybrano: vstupNajmu.investment },
      ],
      napovedaVoleb: `Odpočet úroků je nejvýš ${kc(val(pravidla.interestDeduction.limit))} ročně a jen u vlastního bydlení. U investičního bytu doporučuje ČNB nejvýš LTV ${v.cele(val(vek.investment))}.`,
    },
  },
};

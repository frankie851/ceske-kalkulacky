// Exekuce, nebo oddlužení? – texty výsledku. Čistý modul bez DOM a bez sítě.
// Používá ho ukázka při sestavení webu (exekuce-nebo-oddluzeni.11tydata.js) i prohlížeč (ui.js),
// takže stránka bez JavaScriptu ukáže stejné texty jako živý výpočet.
// Žádné částky ani sazby tu nejsou natvrdo: všechno je v rules.json. Texty vykají.
import { nejnovejsiPlatnyRok, srazka, dobaSplaceniExekuce, oddluzeni } from './dluhy.js';
import { kc } from '../../js/format.js';

/** 1 měsíc, 2–4 měsíce, 5 a víc měsíců. */
export function mesicuSlovy(n) {
  const ms = n === 1 ? 'měsíc' : n >= 2 && n <= 4 ? 'měsíce' : 'měsíců';
  return `${n} ${ms}`;
}

/** Délka v letech a měsících: 35 → „2 roky a 11 měsíců“. */
export function delkaSlovy(mesicu) {
  const roky = Math.floor(mesicu / 12);
  const m = mesicu % 12;
  const r = roky === 1 ? 'rok' : roky >= 2 && roky <= 4 ? 'roky' : 'let';
  if (roky === 0) return mesicuSlovy(m);
  if (m === 0) return `${roky} ${r}`;
  return `${roky} ${r} a ${mesicuSlovy(m)}`;
}

/** Rok pravidel: nejnovější úplný rok, který nepřesahuje dnešní rok. */
export function rokPravidel(rules, dnesniRok) {
  const rok = nejnovejsiPlatnyRok(rules, dnesniRok);
  return {
    rok,
    poznamka: rok < dnesniRok
      ? `Pravidla pro rok ${dnesniRok} zatím nejsou úplná. Počítáme podle roku ${rok}.`
      : `Počítáme podle pravidel pro rok ${rok}.`,
  };
}

/**
 * Všechny texty a částky pro obě karty výsledku.
 * @param {object} p pravidla roku (pravidlaProRok)
 * @param {object} v vstup: cistaMzda, osoby, prednostni, pocetExekuci, duchodce, dluh, sazba, drivejsiOdpusteni
 */
export function vysledek(p, v) {
  const s = srazka(p, v);
  const ex = dobaSplaceniExekuce({ dluh: v.dluh, mesicne: s.vericiDostanou, rocniUrokProcent: v.sazba });
  const od = oddluzeni(p, v);

  // Exekuce: doba splácení a upozornění, že dluh může růst
  let doba;
  let upozorneni = 'Dluh může růst rychleji, než ho splácíte. Přibývají úroky a náklady exekuce. Ty tady nepočítáme.';
  if (s.srazka === 0) {
    doba = 'Vaše výplata je nižší než částka, kterou vám musí nechat. Z výplaty se tedy nestrhává nic. Dluh ale nezmizí.';
  } else if (ex.nesplatitelne && ex.duvod === 'urok-vyssi-nez-splatka') {
    doba = 'Při této srážce dluh nesplatíte.';
    upozorneni = `Úrok je asi ${kc(ex.urokMesicne)} měsíčně. To je víc, než věřitelé dostanou. Dluh poroste rychleji, než ho splácíte. Za rok vzroste asi o ${kc(ex.rustZaRok)}. Poraďte se v poradně, třeba o oddlužení.`;
  } else if (ex.nesplatitelne) {
    doba = 'Splácení by trvalo déle než 50 let.';
  } else {
    doba = `Odhad doby splácení: ${delkaSlovy(ex.mesicu)}.`;
    if (v.sazba > 0) {
      upozorneni = `Na úrocích zaplatíte asi ${kc(ex.uroky)}. Dluh může růst rychleji, než se splácí. Stačí, aby přibyla další exekuce nebo klesla mzda.`;
    }
  }

  const rozpis = [
    `Musí vám zůstat aspoň ${kc(s.nezabavitelna)}. Je to takzvaná nezabavitelná částka.`,
    `Zbývá ${kc(s.zbytek)}.`,
    `Část do ${kc(s.hranice)} se zaokrouhlí dolů na ${kc(s.doHranice)} a rozdělí na třetiny po ${kc(s.tretina)}.`,
    s.duvodDvouTretin === 'prednostni'
      ? 'U přednostních dluhů se strhávají dvě třetiny.'
      : s.duvodDvouTretin === 'ctyri-exekuce'
        ? 'Máte aspoň čtyři exekuce. Proto se strhávají dvě třetiny.'
        : 'U běžných dluhů se strhává jedna třetina.',
    s.nadHranici > 0 ? `Částka nad ${kc(s.hranice)} se strhne celá. To je ${kc(s.nadHranici)}.` : null,
    s.nahradaZamestnavateli > 0 ? `Ze srážky si zaměstnavatel nechá ${kc(s.nahradaZamestnavateli)}. Zbytek dostanou věřitelé.` : null,
  ].filter(Boolean);

  // Oddlužení
  const delka = od.mesicu >= 12 ? `${delkaSlovy(od.mesicu)} (${mesicuSlovy(od.mesicu)})` : delkaSlovy(od.mesicu);
  const zaplaceno = od.odpusteno > 0
    ? `Věřitelům za tu dobu zaplatíte asi ${kc(od.zaplacenoVericum)}. To je ${Math.round(od.miraUspokojeni * 100)} % dluhů.`
    : `Dluhy byste splatili celé dřív než za ${delkaSlovy(od.delkaMesicu)}.`;
  const zbytek = od.odpusteno > 0
    ? `Zbytek asi ${kc(od.odpusteno)} vám soud odpustí. Podmínka je, že budete poctivě plnit povinnosti.`
    : 'Nic by se neodpouštělo.';

  return {
    ex: {
      zustane: kc(s.zustane),
      srazka: kc(s.srazka),
      vericum: kc(s.vericiDostanou),
      nezabavitelna: kc(s.nezabavitelna),
      nahrada: s.nahradaZamestnavateli > 0
        ? `Zaměstnavatel si ze srážky nechá ${kc(s.nahradaZamestnavateli)} za svou práci. Tak to určuje zákon.`
        : '',
      doba,
      upozorneni,
    },
    od: {
      nelze: od.lzePovolit ? '' : `Pokud vám soud odpustil dluhy v posledních ${p.zakazOpakovaniLet} letech, nové oddlužení obvykle nepovolí. Výjimky jsou vzácné. Probrat to můžete v poradně.`,
      splatka: kc(od.splatka),
      zustane: kc(od.zustane),
      delka,
      spravce: kc(od.spravce),
      vericumMesicne: kc(od.vericumMesicne),
      zaplacenoCelkem: kc(od.zaplacenoVericum),
      minimum: kc(od.minimum),
      spravceText: `Insolvenční správce na oddlužení dohlíží. Měsíčně za to dostane ${kc(od.spravce)}. Věřitelům půjde ${kc(od.vericumMesicne)} měsíčně.`,
      srovnani: od.splatka > s.srazka ? 'V oddlužení se strhává víc než v exekuci. Trvá ale jen omezenou dobu.' : '',
      zaplaceno,
      zbytek,
      minimumText: od.splnujeMinimum
        ? `Splátka musí být aspoň ${kc(od.minimum)} měsíčně. Tuto podmínku splníte.`
        : `Splátka musí být aspoň ${kc(od.minimum)} měsíčně. Jinak soud oddlužení nepovolí. V poradně zjistíte, jak to řešit. Pomoct může třeba příspěvek od blízkého člověka.`,
      splnujeMinimum: od.splnujeMinimum,
    },
    rozpis,
    cisla: { s, ex, od },
  };
}

/** Pravidlo o délce oddlužení (text pod kartou). */
export function delkaPravidlo(p) {
  return `Oddlužení trvá nejvýš ${delkaSlovy(p.delkaOddluzeniMesicu)}. Opakované oddlužení trvá ${delkaSlovy(p.delkaOpakovanehoOddluzeniMesicu)}.`;
}

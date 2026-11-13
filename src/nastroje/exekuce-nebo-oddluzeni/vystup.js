// Exekuce, nebo oddlužení? – texty výsledku. Čistý modul bez DOM a bez sítě.
// Používá ho ukázka při sestavení webu (exekuce-nebo-oddluzeni.11tydata.js) i prohlížeč (ui.js),
// takže stránka bez JavaScriptu ukáže stejné texty jako živý výpočet.
// Žádné částky ani sazby tu nejsou natvrdo: všechno je v rules.json. Texty vykají.
import { nejnovejsiPlatnyRok, srazka, dobaSplaceniExekuce, oddluzeni, nezabavitelnaCastka, zakladniSoucet } from './dluhy.js';
import { kc, procenta, datum } from '../../js/format.js';

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
 * @param {object} v vstup: cistaMzda, osoby, prednostni, pocetExekuci, duchodce, stareSrazky, dluh, sazba, drivejsiOdpusteni
 */
export function vysledek(p, v) {
  const s = srazka(p, v);
  const ex = dobaSplaceniExekuce({ dluh: v.dluh, mesicne: s.vericiDostanou, rocniUrokProcent: v.sazba });
  const od = oddluzeni(p, v);

  // Exekuce: doba splácení a upozornění, že dluh může růst
  let doba;
  let upozorneni = 'Dluh může růst rychleji, než ho splácíte. Přibývají úroky a náklady exekuce. Ty tady nepočítáme.';
  if (!(v.dluh > 0)) {
    doba = 'Nezadali jste žádný dluh. Doba splácení se proto nepočítá.';
  } else if (s.srazka === 0) {
    doba = 'Vaše výplata je nižší než částka, kterou vám musí nechat. Z výplaty se tedy nestrhává nic. Dluh ale nezmizí.';
  } else if (ex.nesplatitelne && ex.duvod === 'urok-vyssi-nez-splatka') {
    doba = 'Při této srážce dluh nesplatíte.';
    upozorneni = `Úrok je asi ${kc(ex.urokMesicne)} měsíčně. To je víc, než věřitelé dostanou. Dluh poroste rychleji, než ho splácíte. Za rok vzroste asi o ${kc(ex.rustZaRok)}. Poraďte se v poradně, třeba o oddlužení.`;
  } else if (ex.nesplatitelne && ex.duvod === 'zadna-srazka') {
    // Srážka je tak malá, že ji celou dostane zaměstnavatel jako náhradu (vyhl. 485/2000 § 4e)
    doba = 'Věřitelům z této srážky nic nezbude. Celou ji dostane zaměstnavatel jako náhradu za svou práci. Dluh se tak nesplácí.';
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
    v.stareSrazky && s.srazka > 0 ? 'Srážky byly nařízené před změnou zákona. Zaměstnavatel si nic nenechá. Věřitelé dostanou celou srážku.' : null,
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
        // DLU-09: náhrada nenáleží u exekucí, kde příkaz ke srážkám ze mzdy padl před účinností zákona č. 286/2021 Sb.
        ? `Zaměstnavatel si ze srážky nechá ${kc(s.nahradaZamestnavateli)} za svou práci. Tak to určuje zákon. `
          + `Neplatí to u starších exekucí, kde exekutor nebo soud nařídil srážky ze mzdy před ${datum(p.nahradaJenProPrikazyOd)}. `
          + 'Tam dostanou věřitelé celou srážku. Zaškrtněte to pak ve formuláři.'
        : v.stareSrazky && s.srazka > 0
          ? `Srážky ze mzdy vám nařídili před ${datum(p.nahradaJenProPrikazyOd)}. Zaměstnavatel si proto ze srážky nic nenechá. Věřitelé dostanou celou srážku.`
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

/**
 * Volba „Srážky ze mzdy byly nařízené před …“ (datum z rules.json). Zákon č. 286/2021 Sb.,
 * čl. II bod 3 a čl. IV body 1 a 12: u takových srážek náhrada plátci mzdy nenáleží.
 */
export function volbaStareSrazky(p) {
  const d = datum(p.nahradaJenProPrikazyOd);
  return {
    label: `Srážky ze mzdy byly nařízené před ${d}`,
    napoveda: 'Datum najdete na exekučním příkazu nebo usnesení soudu. Zaměstnavatel si pak ze srážky nic nenechá. Zaškrtněte, jen když jsou všechny vaše srážky starší.',
  };
}

/** Pravidlo o délce oddlužení (text pod kartou). */
export function delkaPravidlo(p) {
  return `Oddlužení trvá nejvýš ${delkaSlovy(p.delkaOddluzeniMesicu)}. Opakované oddlužení trvá ${delkaSlovy(p.delkaOpakovanehoOddluzeniMesicu)}.`;
}

/* ---------- úrok z prodlení (DLU-01) ---------- */

/** Sazba do textového pole: 11.75 → „11,75“, 15 → „15“. */
export function cisloSazby(n) {
  return String(n).replace('.', ',');
}

/** Nápověda u volby úroku. Sazby jsou ve volbě pololetí, tady žádné číslo není. */
export function urokNapoveda() {
  return 'Úrok z prodlení platíte, když nesplácíte včas. Zákonná sazba závisí na pololetí, ve kterém prodlení začalo. Pak se už nemění. Ve smlouvě můžete mít jinou.';
}

/**
 * Volby „Od kdy dluh nesplácíte?“ z rules.urokZProdleni: nejnovější pololetí první (vybrané),
 * na konci volba pro vlastní sazbu.
 */
export function moznostiUroku(urok) {
  const moznosti = [...urok.pololeti].reverse().map((x, i) => {
    const [rok, mesic] = x.od.split('-');
    const desetin = (String(x.procenta).split('.')[1] ?? '').length;
    return {
      hodnota: x.od,
      text: `${mesic === '01' ? 1 : 2}. pololetí ${rok}: ${procenta(x.procenta, desetin)}`,
      sazba: x.procenta,
      vybrano: i === 0,
    };
  });
  moznosti.push({ hodnota: 'jina', text: 'Jindy, nebo mám sazbu ze smlouvy', sazba: null, vybrano: false });
  return moznosti;
}

/* ---------- úřední kalkulačky (DLU-03) ---------- */

/**
 * Proč úřední kalkulačky mohou ukázat jiné číslo. Zjištění a předpisy jsou v rules.uredniKalkulacky.
 * @param {object} p pravidla roku
 * @param {object} k rules.uredniKalkulacky
 * @param {number} rok rok pravidel
 */
export function rozdilyKalkulacek(p, k, rok) {
  const hraniceSplatek = nezabavitelnaCastka(p, 0) + zakladniSoucet(p) * k.splatky.nasobekKalkulacky;
  return {
    srazky: `Pozor: kalkulačka nabízí i volbu „${k.srazky.variantaOdchylna}“. Ta počítá s vyšším životním minimem. Proto může ukázat nižší srážku. Nařízení vlády ale určuje počítat celý rok ${rok} s částkami k 1. lednu. Zvolte proto „${k.srazky.variantaPodleNarizeni}“. Pak vyjdou stejná čísla jako tady.`,
    splatky: `Pozor: jejich kalkulačka splátek strhává celý zbytek mzdy dřív, než určuje nařízení vlády. Při čisté mzdě nad ${kc(hraniceSplatek)} bez vyživovaných osob proto ukáže vyšší splátku. My počítáme podle nařízení.`,
  };
}

// Spot, nebo fix? – ukázkový výsledek spočítaný při buildu stejným modulem jako v prohlížeči.
// Bez JavaScriptu stránka ukáže výchozí předvolbu (rodinný dům, D02d, ČEZ Distribuce, 3 × 25 A):
// tři varianty, nejlevnější, měsíční a hodinový graf a tabulky. Deterministické: vše se odvozuje
// z data/*.json, tariffs.json, dynamic.json a rules.json, ne z dnešního data.
// Malá data (ceny – kompaktně, kurzy, tarify, pásma) se vloží do stránky; profily TDD (~1,9 MB) ne – prohlížeč
// si načte jen vybranou třídu z vlastního webu (nastroj.json → verejneSoubory).
import fs from 'node:fs';
import * as v from './vystup.js';
import { datum } from '../../js/format.js';

const cti = (soubor) => JSON.parse(fs.readFileSync(new URL(soubor, import.meta.url), 'utf8'));
const pravidla = cti('./rules.json');
const meta = cti('./data/meta.json');
const ceny = cti('./data/prices.json');
const kurzy = cti('./data/fx.json');
const tarify = cti('./tariffs.json');
const dynamicky = cti('./dynamic.json');

// rules.json nese období dat kvůli štítku a textům; musí sedět s data/meta.json
// (obojí přepisuje týdenní GitHub Action .github/workflows/aktualizace-spot.yml).
const ocekavano = { od: meta.from, do: meta.to, posledniDen: meta.lastPriceDay };
for (const [k, hodnota] of Object.entries(ocekavano)) {
  if (pravidla.data?.[k] !== hodnota) {
    throw new Error(`Spot, nebo fix?: rules.json data.${k} (${pravidla.data?.[k]}) nesedí s data/meta.json (${hodnota}).`);
  }
}

const D = v.pripravData({ ceny, kurzy, meta, tarify, dynamicky });
const vstup = v.vychoziVstup(pravidla, tarify, dynamicky);
const tdd = v.tridaTdd(tarify, vstup.sazba, vstup.region);
const vypocet = v.spocitej(D, vstup, cti(`./data/tdd/${tdd}.json`).values);
const ukazka = v.vystup(D, vypocet, { tdd });

const moznosti = (polozky, vybrana) => polozky.map(([hodnota, text]) => ({ hodnota, text, vybrano: hodnota === vybrana }));
const distributor = tarify.distributors[vstup.distributor];
const posledniDen = datum(meta.lastPriceDay);

export default {
  stitkyNavic: [`Ceny z burzy do ${posledniDen}`],
  spot: {
    ukazka,
    vstup,
    posledniDen,
    obdobi: `${datum(meta.from)} – ${datum(meta.to)}`,
    aktualizovano: datum(meta.generated),
    predvolby: pravidla.predvolby.map((p) => ({
      hodnota: p.id, text: p.nazev, vybrano: p.id === vstup.predvolba,
      poznamka: `${p.sazba} · ${v.doPole(p.mwh)} MWh`,
    })),
    napovedaPredvolby: pravidla.predvolby.find((p) => p.id === vstup.predvolba).napoveda,
    distributori: moznosti(Object.entries(tarify.distributors).map(([k, d]) => [k, d.name]), vstup.distributor),
    sazby: moznosti(Object.entries(tarify.sazbyInfo).map(([k, s]) => [k, s.label]), vstup.sazba),
    regiony: moznosti(distributor.tdd5Regions.map((r) => [r, tarify.tdd5RegionLabels[r]]), vstup.region),
    regionSkryty: tarify.sazbyInfo[vstup.sazba].tdd !== 'TDD5',
    jistice: moznosti(tarify.breakers.map((b) => [b.id, b.label]), vstup.jistic),
    produkty: moznosti(Object.entries(dynamicky.products).map(([k, p]) => [k, `${p.supplier} – ${p.product.replace(/\s*\(.*\)$/, '')}`]), dynamicky.default),
    produkt: dynamicky.products[dynamicky.default],
    pole: {
      mwh: v.doPole(vstup.mwh),
      fixCena: v.doPole(vstup.fix.cena),
      fixPlat: v.doPole(vstup.fix.stalyPlat),
      spotPrirazka: v.doPole(vstup.spot.prirazka),
      spotPlat: v.doPole(vstup.spot.stalyPlat),
      dynZaklad: v.doPole(vstup.dyn.zaklad),
      dynPlat: v.doPole(vstup.dyn.stalyPlat),
    },
    posun: pravidla.vychozi.posun,
    tarifyRok: tarify.year,
    // Data pro prohlížeč (vloží se jako <script type="application/json">)
    data: { ceny: v.zakodujCeny(ceny), kurzy, meta, tarify, dynamicky },
  },
};

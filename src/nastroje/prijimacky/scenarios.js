// Tři předpřipravené scénáře pro simulátor. Modelová data, žádné skutečné školy ani lidé.

export const SCENARIOS = [
  {
    id: 'body',
    title: 'Priorita nepřebíjí body',
    mode: 'score',
    lead: 'Cyril má gymnázium jako 1. prioritu, Adam až jako 2. Kdo dostane místo?',
    watch: 'Sledujte 2. kolo: Adam neuspěje na průmyslovce a přijde na gymnázium. Má víc bodů než Cyril, takže Cyrila z dočasného místa vytlačí – i když Cyril má gymnázium na 1. místě.',
    takeaway: 'Škola řadí uchazeče podle bodů a svých kritérií. To, kolikátou prioritou pro vás je, pořadí na škole nemění. Škola to smí použít nanejvýš jako pomocné kritérium při shodě bodů.',
    schools: [
      { id: 'G', name: 'Gymnázium', capacity: 2 },
      { id: 'P', name: 'Průmyslovka', capacity: 1 },
      { id: 'O', name: 'Obchodní akademie', capacity: 3 },
    ],
    applicants: [
      { id: 'a1', name: 'Adam', score: 92, priorities: ['P', 'G', ''] },
      { id: 'a2', name: 'Bára', score: 88, priorities: ['G', 'O', ''] },
      { id: 'a3', name: 'Cyril', score: 85, priorities: ['G', 'O', ''] },
      { id: 'a4', name: 'Dana', score: 80, priorities: ['G', 'O', ''] },
      { id: 'a5', name: 'Eva', score: 95, priorities: ['P', 'G', ''] },
      { id: 'a6', name: 'Filip', score: 70, priorities: ['O', '', ''] },
    ],
  },
  {
    id: 'jistota',
    title: 'Proč dát na 3. místo jistotu',
    mode: 'score',
    lead: 'Kuba (68 b.) i Lucie (67 b.) chtějí na gymnázium nebo průmyslovku. Lucie si navíc dala na 3. místo školu s volnými místy.',
    watch: 'Oba neuspějí na 1. ani 2. prioritě. Kuba nemá další školu, a tak v 1. kole nebude přijat nikam. Lucie má o bod méně, ale přijde na svou 3. prioritu.',
    takeaway: 'Jistota na posledním místě vám nevezme šanci u vyšších priorit – algoritmus ji použije, jen když vyšší priority nevyjdou. Zkuste Kubovi doplnit 3. prioritu a spustit simulaci znovu.',
    schools: [
      { id: 'G', name: 'Gymnázium', capacity: 2 },
      { id: 'P', name: 'Průmyslovka', capacity: 2 },
      { id: 'S', name: 'SOŠ služeb', capacity: 3 },
    ],
    applicants: [
      { id: 'b1', name: 'Ondra', score: 90, priorities: ['G', 'P', ''] },
      { id: 'b2', name: 'Petra', score: 86, priorities: ['G', 'P', ''] },
      { id: 'b3', name: 'Radek', score: 80, priorities: ['P', 'G', ''] },
      { id: 'b4', name: 'Simona', score: 75, priorities: ['P', 'S', ''] },
      { id: 'b5', name: 'Kuba', score: 68, priorities: ['G', 'P', ''] },
      { id: 'b6', name: 'Lucie', score: 67, priorities: ['G', 'P', 'S'] },
    ],
  },
  {
    id: 'pokusy',
    title: 'Lepší výsledek ze dvou pokusů',
    mode: 'attempts',
    lead: 'Každý píše češtinu (ČJL) i matematiku (M) dvakrát. Z každého předmětu se počítá lepší pokus – klidně každý z jiného dne.',
    watch: 'Tomáš první den nezvládl (22 + 15), druhý den napsal 38 + 30 = 68 b. Zuzka má 35 z ČJL z druhého dne a 28 z M z prvního dne = 63 b. Hana byla druhý den nemocná, počítá se jí první pokus (75 b.). Omluvení uchazeči by mohli jít na náhradní termín.',
    takeaway: 'Jeden horší den nerozhoduje. Do pořadí jde součet lepší češtiny a lepší matematiky.',
    schools: [
      { id: 'G', name: 'Gymnázium', capacity: 1 },
      { id: 'P', name: 'Průmyslovka', capacity: 2 },
      { id: 'O', name: 'Obchodní akademie', capacity: 2 },
    ],
    applicants: [
      { id: 'c1', name: 'Hana', attempts: { cj: [40, null], m: [35, null] }, priorities: ['G', 'P', ''] },
      { id: 'c2', name: 'Tomáš', attempts: { cj: [22, 38], m: [15, 30] }, priorities: ['G', 'P', 'O'] },
      { id: 'c3', name: 'Věra', attempts: { cj: [33, 34], m: [29, 31] }, priorities: ['P', 'G', 'O'] },
      { id: 'c4', name: 'Zuzka', attempts: { cj: [30, 35], m: [28, 20] }, priorities: ['P', 'O', ''] },
    ],
  },
];

/** Očekávaný výsledek scénářů – používá se v testech. */
export const EXPECTED = {
  body: { a1: 'G', a2: 'G', a3: 'O', a4: 'O', a5: 'P', a6: 'O' },
  jistota: { b1: 'G', b2: 'G', b3: 'P', b4: 'P', b5: null, b6: 'S' },
  pokusy: { c1: 'G', c2: 'P', c3: 'P', c4: 'O' },
};

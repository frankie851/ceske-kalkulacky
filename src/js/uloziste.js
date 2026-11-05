// Ukládání v prohlížeči JEN na výslovné kliknutí (rozhodnutí vlny 2).
// Data zůstávají v localStorage tohoto prohlížeče, nikam se neodesílají.
// Sekce Dluhy tento modul nikdy nepoužívá.
//
// Použití v nástroji:
//   import { pripojUlozeni } from '../../js/uloziste.js';
//   pripojUlozeni({ id: 'cestovni-prikaz', ziskej: () => stav, obnov: (data) => { … } });
// HTML vytvoří makro `ulozeni({ id, popis })` z komponenty/formular.njk.

const PREFIX = 'spocitano-';

export function ulozit(id, data) {
  try { localStorage.setItem(PREFIX + id, JSON.stringify({ verze: 1, ulozeno: new Date().toISOString(), data })); return true; }
  catch { return false; }
}

export function nacist(id) {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    if (!raw) return null;
    const z = JSON.parse(raw);
    return z && z.verze === 1 ? z : null;
  } catch { return null; }
}

export function smazat(id) {
  try { localStorage.removeItem(PREFIX + id); return true; } catch { return false; }
}

const casText = (iso) => {
  try { return new Date(iso).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

// Napojí tlačítka z makra `ulozeni` (kontejner [data-ulozeni="<id>"]).
// ziskej(): vrátí data k uložení; obnov(data): obnoví formulář. Při načtení stránky se uložená data
// NEobnovují automaticky – nabídne se tlačítko „Načíst uložené“.
export function pripojUlozeni({ id, ziskej, obnov }) {
  const box = document.querySelector(`[data-ulozeni="${id}"]`);
  if (!box) return;
  box.hidden = false;
  const stav = box.querySelector('[data-ulozeni-stav]');
  const tlUlozit = box.querySelector('[data-ulozeni-ulozit]');
  const tlNacist = box.querySelector('[data-ulozeni-nacist]');
  const tlSmazat = box.querySelector('[data-ulozeni-smazat]');
  const obnovStav = (zprava) => {
    const z = nacist(id);
    tlNacist.hidden = !z;
    tlSmazat.hidden = !z;
    stav.textContent = zprava || (z ? `Uloženo v tomto prohlížeči ${casText(z.ulozeno)}.` : 'Nic uloženého. Bez kliknutí na Uložit se nic neukládá.');
  };
  tlUlozit.addEventListener('click', () => obnovStav(ulozit(id, ziskej()) ? 'Uloženo jen v tomto prohlížeči.' : 'Uložení se nepovedlo – prohlížeč ukládání nepovoluje.'));
  tlNacist.addEventListener('click', () => { const z = nacist(id); if (z) { obnov(z.data); obnovStav('Uložená data jsou načtená.'); } });
  tlSmazat.addEventListener('click', () => { smazat(id); obnovStav('Uložená data jsou smazaná.'); });
  obnovStav();
}

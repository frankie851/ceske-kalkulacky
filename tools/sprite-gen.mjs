// Generátor src/img/sprite.svg z tvarů prototypu B (třídy → style s var(--il-…))
import fs from 'node:fs';
const ST = { 'st-ink': '--il-ink', 'st-terra': '--il-terra', 'st-sage': '--il-sage-d', 'st-cream': '--il-cream', 'st-gold': '--il-gold-d', 'st-apricot': '--il-apricot-d' };
function conv(s) {
  return s.replace(/class="([^"]+)"/g, (_, cls) => {
    const parts = cls.split(/\s+/);
    const styles = [];
    let extra = '';
    for (const c of parts) {
      if (ST[c]) { styles.push(`fill:none;stroke:var(${ST[c]})`); extra = ' stroke-linecap="round" stroke-linejoin="round"'; }
      else if (c === 'il-text') styles.push('fill:var(--il-ink);font-family:var(--font-display);font-weight:600');
      else if (c === 'il-text-paper') styles.push('fill:var(--il-paper);font-family:var(--font-display);font-weight:600');
      else if (c.startsWith('il-')) styles.push(`fill:var(--${c})`);
      else if (c === 'cur') styles.push('fill:currentColor');
      else if (c === 'cur-st') { styles.push('fill:none;stroke:currentColor'); extra = ' stroke-linecap="round" stroke-linejoin="round"'; }
      else if (c === 'poz-st') { styles.push('fill:none;stroke:var(--ikona-pozadi,#fff)'); extra = ' stroke-linecap="round" stroke-linejoin="round"'; }
      else if (c === 'kal') styles.push('fill:var(--kal-barva,var(--il-apricot))');
      else throw new Error('neznámá třída ' + c);
    }
    return `style="${styles.join(';')}"${extra}`;
  });
}
const S = {
  // ---- Ikony (20×20) ----
  'logo': ['0 0 48 48', '<circle cx="24" cy="24" r="22" class="il-terra"/><path d="M14 25l7 7 13-15" class="st-cream" stroke-width="5"/><circle cx="38" cy="10" r="5" class="il-gold"/>'],
  'ikona-overeno': ['0 0 20 20', '<circle cx="10" cy="10" r="10" class="cur"/><path d="M5.5 10.5l3 3 6-6.5" class="poz-st" stroke-width="2.2"/>'],
  'ikona-info': ['0 0 20 20', '<circle cx="10" cy="10" r="10" class="cur"/><path d="M10 9v5M10 6v.3" class="poz-st" stroke-width="2.4"/>'],
  'ikona-vystraha': ['0 0 20 20', '<circle cx="10" cy="10" r="10" class="cur"/><path d="M10 5v6M10 14.2v.3" class="poz-st" stroke-width="2.6"/>'],
  'ikona-sipka': ['0 0 20 20', '<path d="M4 10h11M11 5l5 5-5 5" class="cur-st" stroke-width="2.4"/>'],
  'ikona-sipka-zpet': ['0 0 20 20', '<path d="M16 10H5M9 5l-5 5 5 5" class="cur-st" stroke-width="2.4"/>'],
  'ikona-odkaz': ['0 0 20 20', '<path d="M8 12l4-4M7 9l-2 2a3 3 0 0 0 4 4l2-2M13 11l2-2a3 3 0 0 0-4-4L9 7" class="cur-st" stroke-width="2"/>'],
  'ikona-externi': ['0 0 20 20', '<path d="M11 3h6v6M17 3l-8 8M15 12v3.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5H8" class="cur-st" stroke-width="2"/>'],
  'ikona-hodiny': ['0 0 20 20', '<circle cx="10" cy="10" r="8" class="cur-st" stroke-width="2"/><path d="M10 6v4l3 2" class="cur-st" stroke-width="2"/>'],
  'ikona-kalendar': ['0 0 20 20', '<rect x="2" y="4" width="16" height="14" rx="4" class="kal"/><rect x="5" y="9" width="10" height="6" rx="2" class="il-cream"/><path d="M6 2v4M14 2v4" class="st-ink" stroke-width="2"/>'],
  'ikona-lupa': ['0 0 20 20', '<circle cx="8.5" cy="8.5" r="5.5" class="cur-st" stroke-width="2.4"/><path d="M13 13l4 4" class="cur-st" stroke-width="2.4"/>'],
  'ikona-tuzka': ['0 0 20 20', '<path d="M4 16l1-4 8-8 3 3-8 8-4 1zM11 6l3 3" class="cur-st" stroke-width="1.8"/>'],
  'ikona-zaskrtnuti': ['0 0 20 20', '<path d="M4.5 10.5l3.5 3.5 7-8" class="cur-st" stroke-width="2.6"/>'],
  'ikona-srdce': ['0 0 20 20', '<path d="M10 17c-5-3.5-7.5-6-7.5-9a3.5 3.5 0 0 1 7.5-1 3.5 3.5 0 0 1 7.5 1c0 3-2.5 5.5-7.5 9z" class="cur-st" stroke-width="2"/>'],
  'ikona-kalkulacka': ['0 0 20 20', '<rect x="4" y="2" width="12" height="16" rx="3" class="cur-st" stroke-width="2"/><path d="M7 6h6M7.5 10.5h.01M10 10.5h.01M12.5 10.5h.01M7.5 14h.01M10 14h.01M12.5 14h.01" class="cur-st" stroke-width="2"/>'],
  'ikona-kalendar-31': ['0 0 64 64', '<rect x="6" y="10" width="52" height="48" rx="12" class="il-paper"/><path d="M6 22a12 12 0 0 1 12-12h28a12 12 0 0 1 12 12v4H6z" class="il-terra"/><path d="M20 5v10M44 5v10" class="st-ink" stroke-width="4"/><text x="32" y="50" text-anchor="middle" font-size="20" class="il-text">31</text>'],

  // ---- Situace (64×64) ----
  'situace-zamestnanec': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><path d="M25 22v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" class="st-ink" stroke-width="3"/><rect x="13" y="22" width="38" height="27" rx="7" class="il-terra"/><rect x="13" y="31" width="38" height="5" class="il-apricot-d"/><rect x="28" y="29" width="8" height="9" rx="2.5" class="il-gold"/>'],
  'situace-osvc': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><rect x="16" y="27" width="32" height="22" rx="3" class="il-paper"/><path d="M12 19h40l-2 10H14z" class="il-terra"/><path d="M22 19l-1 10M32 19v10M42 19l1 10" class="st-cream" stroke-width="3"/><rect x="28" y="35" width="10" height="14" rx="2" class="il-sage-d"/><rect x="19" y="33" width="6" height="6" rx="1.5" class="il-gold"/>'],
  'situace-investice': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><rect x="13" y="41" width="24" height="7" rx="3.5" class="il-gold-d"/><rect x="15" y="34" width="24" height="7" rx="3.5" class="il-gold"/><rect x="13" y="27" width="24" height="7" rx="3.5" class="il-gold-d"/><path d="M46 49V28" class="st-sage" stroke-width="3.5"/><path d="M46 34c0-7 5-12 12-12 0 7-5 12-12 12z" class="il-sage"/><path d="M46 30c0-6-4-11-10-11 0 6 4 11 10 11z" class="il-sage-d"/>'],
  'situace-rodina': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><path d="M15 31L32 17l17 14v16a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3z" class="il-paper"/><path d="M11 32L32 14l21 18" class="st-terra" stroke-width="5"/><path d="M32 45c-7-5-10-8-10-12a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 7-10 12z" class="il-terra"/>'],
  'situace-dluhy': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-paper"/><path d="M13 21a6 6 0 0 1 6-6h26a6 6 0 0 1 6 6v15a6 6 0 0 1-6 6H31l-9 7v-7h-3a6 6 0 0 1-6-6z" class="il-sage"/><path d="M32 37c-6-4-9-7-9-10a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3-3 6-9 10z" class="il-paper"/>'],

  // ---- Kategorie (64×64) ----
  'kategorie-penize': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><rect x="20" y="40" width="7" height="11" rx="3.5" class="il-apricot-d"/><rect x="38" y="40" width="7" height="11" rx="3.5" class="il-apricot-d"/><ellipse cx="32" cy="36" rx="19" ry="14" class="il-apricot"/><ellipse cx="51" cy="37" rx="4.5" ry="5.5" class="il-blush"/><circle cx="43" cy="31" r="2" class="il-ink"/><rect x="26" y="23" width="10" height="3" rx="1.5" class="il-apricot-d"/><circle cx="31" cy="14" r="7" class="il-gold"/>'],
  'kategorie-dane': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><path d="M19 12h26v40l-3.25-2.5-3.25 2.5-3.25-2.5-3.25 2.5-3.25-2.5-3.25 2.5-3.25-2.5-3.25 2.5z" class="il-paper"/><path d="M25 21h14M25 28h14" class="st-ink" stroke-width="2.6"/><circle cx="27" cy="38" r="2.6" class="il-terra"/><circle cx="37" cy="44" r="2.6" class="il-terra"/><path d="M38 36l-12 10" class="st-terra" stroke-width="2.6"/>'],
  'kategorie-bydleni': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><path d="M15 31L32 17l17 14v16a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3z" class="il-paper"/><path d="M11 32L32 14l21 18" class="st-terra" stroke-width="5"/><path d="M34 27l-7 10h6l-3 9 9-12h-6l3-7z" class="il-gold-d"/>'],
  'kategorie-prace': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><rect x="14" y="17" width="36" height="33" rx="8" class="il-paper"/><path d="M14 25a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v2H14z" class="il-sage-d"/><path d="M23 13v8M41 13v8" class="st-ink" stroke-width="3"/><path d="M32 45c-6-4-9-7-9-10a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3-3 6-9 10z" class="il-terra"/>'],
  'kategorie-dluhy': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg-2"/><path d="M13 21a6 6 0 0 1 6-6h26a6 6 0 0 1 6 6v15a6 6 0 0 1-6 6H31l-9 7v-7h-3a6 6 0 0 1-6-6z" class="il-sage"/><path d="M32 37c-6-4-9-7-9-10a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3-3 6-9 10z" class="il-paper"/>'],
  'kategorie-2027': ['0 0 64 64', '<circle cx="32" cy="32" r="32" class="il-bg"/><rect x="14" y="17" width="36" height="33" rx="8" class="il-paper"/><path d="M14 25a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v2H14z" class="il-terra"/><path d="M23 13v8M41 13v8" class="st-ink" stroke-width="3"/><text x="32" y="45" text-anchor="middle" font-size="15" class="il-text">2027</text><path d="M52 10q1.5 5 6 6q-4.5 1.5-6 6q-1.5-4.5-6-6q4.5-1 6-6z" class="il-gold"/>'],

  // ---- Nástroje (96×96) ----
  'nastroj-plan48': ['0 0 96 96', '<rect width="96" height="96" rx="20" class="il-bg"/><rect x="28" y="62" width="11" height="16" rx="5" class="il-apricot-d"/><rect x="58" y="62" width="11" height="16" rx="5" class="il-apricot-d"/><ellipse cx="48" cy="54" rx="30" ry="23" class="il-apricot"/><path d="M60 36l6-10c1-2 4-1 4 1l-1 12z" class="il-apricot-d"/><rect x="38" y="33" width="16" height="4" rx="2" class="il-apricot-d"/><ellipse cx="78" cy="56" rx="7" ry="8" class="il-blush"/><circle cx="64" cy="48" r="2.6" class="il-ink"/><circle cx="46" cy="20" r="11" class="il-gold"/><text x="46" y="25" text-anchor="middle" font-size="12" class="il-text">48</text>'],
  'nastroj-mam-eet': ['0 0 96 96', '<rect width="96" height="96" rx="20" class="il-bg-2"/><path d="M30 14h36v44l-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3-4.5 3z" class="il-paper"/><path d="M37 25h22M37 33h22M37 41h14" class="st-ink" stroke-width="3"/><rect x="18" y="52" width="60" height="30" rx="9" class="il-terra"/><rect x="26" y="59" width="26" height="9" rx="3" class="il-cream"/><circle cx="62" cy="63" r="3" class="il-gold"/><circle cx="70" cy="63" r="3" class="il-gold"/><circle cx="62" cy="73" r="3" class="il-cream"/><circle cx="70" cy="73" r="3" class="il-cream"/>'],
  'nastroj-penzijko-kompas': ['0 0 96 96', '<rect width="96" height="96" rx="20" class="il-bg-2"/><circle cx="48" cy="48" r="30" class="il-paper"/><circle cx="48" cy="48" r="30" class="st-terra" stroke-width="5"/><path d="M48 24v6M48 66v6M24 48h6M66 48h6" class="st-ink" stroke-width="3"/><path d="M48 30l8 18H40z" class="il-terra"/><path d="M48 66l-8-18h16z" class="il-sage-d"/><circle cx="48" cy="48" r="4" class="il-ink"/>'],
  'nastroj-zdanim-to': ['0 0 96 96', '<rect width="96" height="96" rx="20" class="il-bg"/><rect x="18" y="56" width="14" height="22" rx="7" class="il-sage"/><rect x="38" y="44" width="14" height="34" rx="7" class="il-apricot"/><rect x="58" y="30" width="14" height="48" rx="7" class="il-terra"/><path d="M60 14h22a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-8l-6 5v-5h-8a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" class="il-paper"/><text x="71" y="31" text-anchor="middle" font-size="16" class="il-text">?</text>'],
  'nastroj-inflace': ['0 0 96 96', '<rect width="96" height="96" rx="20" class="il-bg-2"/><path d="M30 42a18 18 0 0 1 36 0" class="st-ink" stroke-width="4"/><path d="M16 42h64l-7 30a6 6 0 0 1-6 5H29a6 6 0 0 1-6-5z" class="il-terra"/><path d="M34 52v14M48 52v14M62 52v14" class="st-cream" stroke-width="4"/><circle cx="74" cy="22" r="12" class="il-gold"/><path d="M74 28v-12M69 21l5-5 5 5" class="st-ink" stroke-width="3"/>'],
  'nastroj-obecny': ['0 0 96 96', '<rect width="96" height="96" rx="20" class="il-bg"/><rect x="26" y="14" width="44" height="64" rx="12" class="il-terra"/><rect x="33" y="22" width="30" height="14" rx="5" class="il-cream"/><circle cx="38" cy="47" r="4" class="il-cream"/><circle cx="48" cy="47" r="4" class="il-cream"/><circle cx="58" cy="47" r="4" class="il-gold"/><circle cx="38" cy="59" r="4" class="il-cream"/><circle cx="48" cy="59" r="4" class="il-cream"/><circle cx="58" cy="59" r="4" class="il-sage"/><rect x="34" y="67" width="18" height="5" rx="2.5" class="il-cream"/><path d="M80 18q2 6 8 8q-6 2-8 8q-2-6-8-8q6-2 8-8z" class="il-gold"/>'],
};
let out = '<svg xmlns="http://www.w3.org/2000/svg">\n<!-- Spočítáno: SVG sprite. Generováno z tvarů prototypu B. Barvy jsou ve style přes vlastní vlastnosti il-* (tokeny),\n     protože CSS třídy dokumentu do use nepronikají, vlastní vlastnosti ano. Jednobarevné ikony berou currentColor,\n     znak v kolečku vlastnost ikona-pozadi, kalendář vlastnost kal-barva. Pozor: v XML komentáři nesmí být dvě pomlčky za sebou. -->\n';
for (const [id, [vb, body]] of Object.entries(S)) out += `<symbol id="${id}" viewBox="${vb}">${conv(body)}</symbol>\n`;
out += '</svg>\n';
fs.mkdirSync('/home/user/ceske-kalkulacky/src/img', { recursive: true });
fs.writeFileSync('/home/user/ceske-kalkulacky/src/img/sprite.svg', out);
console.log(Object.keys(S).length, 'symbolů,', out.length, 'B');

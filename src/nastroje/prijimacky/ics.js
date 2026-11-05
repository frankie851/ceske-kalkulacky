// Generátor iCalendar (RFC 5545) – celodenní události. Čisté funkce + stažení přes Blob.

export function escapeText(s = '') {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Rozdělí řádek na části max. 75 oktetů (UTF-8), pokračování začíná mezerou. */
export function foldLine(line) {
  const enc = new TextEncoder();
  const parts = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // pokračovací řádek má navíc úvodní mezeru
    if (bytes + b > limit) { parts.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += b;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

const ymd = iso => iso.replace(/-/g, '');
function nextDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}
const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** events: [{ id, title, start: 'YYYY-MM-DD', end?: 'YYYY-MM-DD' (včetně), description?, url? }] */
export function buildICS(events, { now = new Date(), calName = 'Přijímačky 2027' } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Prijimacky bez paniky//CS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
  ];
  for (const e of events) {
    const desc = [e.description, e.url ? `Zdroj: ${e.url}` : ''].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@prijimacky-bez-paniky`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${ymd(e.start)}`,
      `DTEND;VALUE=DATE:${ymd(nextDay(e.end || e.start))}`,
      `SUMMARY:${escapeText(e.title)}`,
    );
    if (desc) lines.push(`DESCRIPTION:${escapeText(desc)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Stažení v prohlížeči (nic se neodesílá – soubor vznikne lokálně). */
export function downloadICS(text, filename = 'prijimacky-2027.ics') {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

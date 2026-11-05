import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildICS, foldLine, escapeText } from '../ics.js';

const NOW = new Date(Date.UTC(2026, 10, 5, 12, 0, 0));
const events = [
  { id: 'jpz-1', title: 'JPZ – 1. řádný termín', start: '2027-04-12', description: 'Čeština, matematika; s sebou: pozvánka, OP', url: 'https://prijimacky.cermat.gov.cz/' },
  { id: 'kons', title: 'Přihlášky na konzervatoř', start: '2026-11-01', end: '2026-11-30' },
];

test('ics: struktura, CRLF a povinné vlastnosti', () => {
  const ics = buildICS(events, { now: NOW });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!/[^\r]\n/.test(ics), 'každý řádek končí CRLF');
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(ics, /UID:jpz-1@prijimacky-bez-paniky\r\n/);
  assert.match(ics, /DTSTAMP:20261105T120000Z\r\n/);
});

test('ics: celodenní události, DTEND je den po konci', () => {
  const ics = buildICS(events, { now: NOW });
  assert.match(ics, /DTSTART;VALUE=DATE:20270412\r\nDTEND;VALUE=DATE:20270413/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261101\r\nDTEND;VALUE=DATE:20261201/);
});

test('ics: escapování textu', () => {
  assert.equal(escapeText('a, b; c\\d\ne'), 'a\\, b\\; c\\\\d\\ne');
});

test('ics: řádky max 75 oktetů, nerozdělí UTF-8 znak', () => {
  const long = 'DESCRIPTION:' + 'Příliš žluťoučký kůň úpěl ďábelské ódy. '.repeat(5);
  const folded = foldLine(long);
  for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.equal(folded.split('\r\n ').join(''), long);
  const ics = buildICS([{ id: 'x', title: long, start: '2027-01-01' }], { now: NOW });
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, line);
});

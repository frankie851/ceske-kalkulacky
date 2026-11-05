// Jednoduchý statický server nad _site pro kontroly a e2e testy.
// Respektuje pathPrefix (např. /ceske-kalkulacky/), složky → index.html, jinak 404.html.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Složka sestaveného webu: výchozí _site, pro build se skrytými nástroji SITE_DIR=_site-vse.
export const SITE = path.resolve(KOREN, process.env.SITE_DIR || '_site');
const TYPY = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.ics': 'text/calendar; charset=utf-8', '.xml': 'application/xml',
};

export function spustitServer({ adresar = SITE, prefix = '/', port = 0 } = {}) {
  const pre = prefix.endsWith('/') ? prefix : prefix + '/';
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!url.startsWith(pre)) { res.writeHead(404).end('mimo prefix'); return; }
    let rel = url.slice(pre.length);
    let soubor = path.join(adresar, rel);
    if (!soubor.startsWith(adresar)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(soubor) && fs.statSync(soubor).isDirectory()) soubor = path.join(soubor, 'index.html');
    let kod = 200;
    if (!fs.existsSync(soubor)) { kod = 404; soubor = path.join(adresar, '404.html'); }
    if (!fs.existsSync(soubor)) { res.writeHead(404).end('404'); return; }
    res.writeHead(kod, { 'Content-Type': TYPY[path.extname(soubor)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(soubor).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => {
    const { port: p } = server.address();
    resolve({ server, zaklad: `http://127.0.0.1:${p}${pre}`, zavrit: () => new Promise((r) => server.close(r)) });
  }));
}

// Všechny HTML stránky v _site jako cesty relativní k prefixu (složka/ místo složka/index.html)
export function seznamStranek(adresar = SITE) {
  const vysledek = [];
  const projdi = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!['fonts', 'img', 'css', 'js'].includes(e.name)) projdi(p); }
      else if (e.name.endsWith('.html')) {
        const rel = path.relative(adresar, p).split(path.sep).join('/');
        vysledek.push(rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel);
      }
    }
  };
  projdi(adresar);
  return vysledek.sort();
}

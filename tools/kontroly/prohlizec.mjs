// Spuštění Chromu pro kontroly. Přednostně Chrome stažený Puppeteerem
// (storage.googleapis.com, ~/.cache/puppeteer); když chybí, předinstalovaný Chromium.
import fs from 'node:fs';

export async function spustitProhlizec() {
  // Proměnná prostředí v cloudu ukazuje na neexistující /usr/bin/google-chrome
  if (process.env.PUPPETEER_EXECUTABLE_PATH && !fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const { default: puppeteer } = await import('puppeteer');
  let executablePath;
  try {
    executablePath = puppeteer.executablePath();
    if (!fs.existsSync(executablePath)) executablePath = undefined;
  } catch { executablePath = undefined; }
  if (!executablePath) {
    const zaloha = '/opt/pw-browsers/chromium-1243/chrome-linux/chrome';
    if (fs.existsSync(zaloha)) executablePath = zaloha;
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none', '--disable-background-networking', '--disable-component-update', '--no-first-run'],
  });
}

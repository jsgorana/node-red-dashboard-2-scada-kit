// Capture README screenshots of the live Docker Dashboard pages.
// Runs INSIDE the node-red container (has puppeteer + chromium at /data).
// Bypasses the PWA service worker via CDP so freshly-installed bundles are shot.
const puppeteer = require('/data/node_modules/puppeteer');

const PAGES = [
  { url: 'http://localhost:1880/scada/demo',      sel: '.nrdb-scada-mimic svg',     out: '/data/shots/mimic.png' },
  { url: 'http://localhost:1880/scada/symbols',   sel: '.nrdb-scada-mimic svg',     out: '/data/shots/symbols.png' },
  { url: 'http://localhost:1880/scada/faceplate', sel: '.nrdb-ui-widget',           out: '/data/shots/faceplate.png' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  for (const { url, sel, out } of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    await page.setCacheEnabled(false);
    const client = await page.target().createCDPSession();
    await client.send('Network.setBypassServiceWorker', { bypass: true });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector(sel, { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000)); // let bindings tick / dialog settle
    // Shoot the dashboard content region (the page wrapper), not full chrome.
    const target = await page.$('.nrdb-ui-page') || await page.$('#app') || page;
    if (target.screenshot) await target.screenshot({ path: out });
    else await page.screenshot({ path: out });
    console.log('shot', out);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });

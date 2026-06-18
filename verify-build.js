// Headless verification: load the production build, capture all console
// messages and page errors, and report any "Cannot read properties of
// undefined" or similar crashes. Exits 0 if clean, 1 if errors found.
const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

const BUILD_DIR = path.resolve(__dirname, 'build');
const PORT = 4321;

function serveStatic() {
  const mime = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
  };
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(BUILD_DIR, urlPath);
      if (!filePath.startsWith(BUILD_DIR)) { res.statusCode = 403; res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.statusCode = 404; res.end('Not found: ' + urlPath); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

(async () => {
  const server = await serveStatic();
  let exitCode = 0;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const requestFailures = [];

    page.on('console', (msg) => {
      const t = msg.type();
      if (t === 'error' || t === 'warning') {
        consoleErrors.push({ type: t, text: msg.text() });
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push({ message: err.message, stack: err.stack });
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.startsWith('http://localhost') || url.startsWith('file://')) return;
      requestFailures.push({ url, reason: req.failure()?.errorText });
    });

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
    const hasContent = rootHTML.length > 100;
    const hasAuthScreen = rootHTML.includes('Sign in') || rootHTML.includes('Sign up') || rootHTML.includes('Dukan');
    const hasErrorUI = rootHTML.includes('Something went wrong');

    console.log('\n────── BROWSER VERIFICATION REPORT ──────');
    console.log(`URL:                  http://localhost:${PORT}/`);
    console.log(`Root has content:     ${hasContent ? 'PASS' : 'FAIL'} (${rootHTML.length} chars)`);
    console.log(`AuthScreen rendered:  ${hasAuthScreen ? 'PASS' : 'FAIL'}`);
    console.log(`Error UI shown:       ${hasErrorUI ? 'FAIL (bad)' : 'PASS (no)'}`);
    console.log(`\nConsole errors:       ${consoleErrors.filter(e => e.type === 'error').length}`);
    consoleErrors.forEach((e, i) => console.log(`  [${i+1}] ${e.type}: ${e.text}`));
    console.log(`\nConsole warnings:     ${consoleErrors.filter(e => e.type === 'warning').length}`);
    consoleErrors.filter(e => e.type === 'warning').forEach((e, i) => console.log(`  [${i+1}] ${e.text}`));
    console.log(`\nPage errors (uncaught): ${pageErrors.length}`);
    pageErrors.forEach((e, i) => {
      console.log(`  [${i+1}] ${e.message}`);
      if (e.stack) console.log(`      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`);
    });
    console.log(`\nFailed requests:      ${requestFailures.length}`);
    requestFailures.forEach((r, i) => console.log(`  [${i+1}] ${r.url} -- ${r.reason}`));

    const fatal = pageErrors.length > 0 || consoleErrors.filter(e => e.type === 'error').length > 0 || !hasContent;
    console.log(`\nRESULT: ${fatal ? 'FAIL' : 'PASS'}`);
    if (fatal) exitCode = 1;
  } catch (e) {
    console.error('Verification script failed:', e);
    exitCode = 2;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  process.exit(exitCode);
})();

// Verify all three fixes end-to-end against the production build:
//   1. Viewport lock + 16px input font-size
//   2. Google sign-in uses redirect (not popup), getRedirectResult is wired
//   3. PWA installability: manifest, icons, SW, HTTPS, start_url, display
const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

const BUILD_DIR = path.resolve(__dirname, 'build');
const PORT = 4322;

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
        if (err) { res.statusCode = 404; res.end('Not found'); return; }
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
  const results = { issue1: {}, issue2: {}, issue3: {} };
  let browser;
  try {
    const indexHtml = fs.readFileSync(path.join(BUILD_DIR, 'index.html'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'manifest.json'), 'utf8'));

    const viewportMatch = indexHtml.match(/<meta\s+name="viewport"\s+content="([^"]+)"/);
    results.issue1.viewportContent = viewportMatch ? viewportMatch[1] : null;
    results.issue1.hasUserScalableNo = /user-scalable=no/.test(results.issue1.viewportContent || '');
    results.issue1.hasMaximumScale1 = /maximum-scale=1/.test(results.issue1.viewportContent || '');
    results.issue1.hasViewportFitCover = /viewport-fit=cover/.test(results.issue1.viewportContent || '');

    results.issue3.manifestLinked = /<link\s+rel="manifest"/.test(indexHtml);
    results.issue3.startUrl = manifest.start_url;
    results.issue3.display = manifest.display;
    results.issue3.themeColor = manifest.theme_color;
    results.issue3.icons = manifest.icons;
    results.issue3.has192 = manifest.icons.some(i => /192x192/.test(i.sizes) && i.type === 'image/png');
    results.issue3.has512 = manifest.icons.some(i => /512x512/.test(i.sizes) && i.type === 'image/png');
    results.issue3.hasMaskablePurpose = manifest.icons.some(i => /any maskable/.test(i.purpose || ''));

    const authContextSrc = fs.readFileSync(path.join(__dirname, 'src/context/AuthContext.js'), 'utf8');
    results.issue2.usesSignInWithRedirect = /signInWithRedirect\s*\(/.test(authContextSrc);
    results.issue2.usesSignInWithPopup = /signInWithPopup\s*\(/.test(authContextSrc);
    results.issue2.usesGetRedirectResult = /getRedirectResult\s*\(/.test(authContextSrc);
    results.issue2.googleProviderSetsPrompt = /setCustomParameters\(\s*\{\s*prompt:\s*['"]select_account['"]/.test(authContextSrc);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    const inputFontSizes = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs
        .filter(i => i.offsetParent !== null)
        .map(i => ({
          name: i.name || i.type || i.placeholder || '<unnamed>',
          fontSize: parseFloat(getComputedStyle(i).fontSize),
        }));
    });
    results.issue1.inputFontSizes = inputFontSizes;
    results.issue1.allInputsAtLeast16px = inputFontSizes.length > 0 && inputFontSizes.every(i => i.fontSize >= 16);

    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const reg = await navigator.serviceWorker.getRegistration();
      return {
        supported: true,
        hasRegistration: !!reg,
        scope: reg?.scope || null,
        active: !!reg?.active,
        state: reg?.active?.state || null,
      };
    });
    results.issue3.serviceWorker = swState;

    results.pageErrors = pageErrors;
    results.passed = pageErrors.length === 0
      && results.issue1.hasUserScalableNo
      && results.issue1.hasMaximumScale1
      && results.issue1.allInputsAtLeast16px
      && results.issue2.usesSignInWithRedirect
      && !results.issue2.usesSignInWithPopup
      && results.issue2.usesGetRedirectResult
      && results.issue3.manifestLinked
      && results.issue3.startUrl
      && results.issue3.has192
      && results.issue3.has512
      && results.issue3.hasMaskablePurpose
      && results.issue3.serviceWorker.hasRegistration;
  } catch (e) {
    console.error('Verification script failed:', e);
    process.exit(2);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n========== ISSUE 1: PINCH-ZOOM + INPUT FONT-SIZE ==========');
  console.log('Viewport meta:        ' + JSON.stringify(results.issue1.viewportContent));
  console.log('  user-scalable=no:   ' + (results.issue1.hasUserScalableNo ? 'PASS' : 'FAIL'));
  console.log('  maximum-scale=1:    ' + (results.issue1.hasMaximumScale1 ? 'PASS' : 'FAIL'));
  console.log('  viewport-fit=cover: ' + (results.issue1.hasViewportFitCover ? 'PASS' : 'FAIL'));
  console.log('\nInput font sizes (must be >= 16px):');
  if (results.issue1.inputFontSizes && results.issue1.inputFontSizes.length) {
    for (const i of results.issue1.inputFontSizes) {
      console.log('  ' + i.fontSize + 'px  ' + (i.fontSize >= 16 ? 'PASS' : 'FAIL') + '  ' + i.name);
    }
  } else {
    console.log('  (no visible inputs)');
  }
  console.log('\nOverall Issue 1:      ' + (results.issue1.hasUserScalableNo && results.issue1.hasMaximumScale1 && results.issue1.allInputsAtLeast16px ? 'PASS' : 'FAIL'));

  console.log('\n========== ISSUE 2: GOOGLE SIGN-IN (REDIRECT, NOT POPUP) ==========');
  console.log('signInWithRedirect:   ' + (results.issue2.usesSignInWithRedirect ? 'PASS (used)' : 'FAIL'));
  console.log('signInWithPopup:      ' + (results.issue2.usesSignInWithPopup ? 'FAIL (still used)' : 'PASS (removed)'));
  console.log('getRedirectResult:    ' + (results.issue2.usesGetRedirectResult ? 'PASS (called on mount)' : 'FAIL'));
  console.log('prompt=select_account:' + (results.issue2.googleProviderSetsPrompt ? 'PASS' : 'FAIL'));
  console.log('\nOverall Issue 2:      ' + (results.issue2.usesSignInWithRedirect && !results.issue2.usesSignInWithPopup && results.issue2.usesGetRedirectResult ? 'PASS' : 'FAIL'));

  console.log('\n========== ISSUE 3: PWA INSTALLABILITY ==========');
  console.log('Manifest linked:      ' + (results.issue3.manifestLinked ? 'PASS' : 'FAIL'));
  console.log('start_url:            ' + JSON.stringify(results.issue3.startUrl) + ' ' + (results.issue3.startUrl ? 'PASS' : 'FAIL'));
  console.log('display:              ' + JSON.stringify(results.issue3.display) + ' ' + (['standalone','fullscreen','minimal-ui'].includes(results.issue3.display) ? 'PASS' : 'FAIL'));
  console.log('theme_color:          ' + JSON.stringify(results.issue3.themeColor));
  console.log('192x192 PNG icon:     ' + (results.issue3.has192 ? 'PASS' : 'FAIL'));
  console.log('512x512 PNG icon:     ' + (results.issue3.has512 ? 'PASS' : 'FAIL'));
  console.log('"any maskable" icon:  ' + (results.issue3.hasMaskablePurpose ? 'PASS' : 'FAIL'));
  console.log('SW registered:        ' + (results.issue3.serviceWorker && results.issue3.serviceWorker.hasRegistration ? 'PASS' : 'FAIL'));
  console.log('  scope:              ' + (results.issue3.serviceWorker ? results.issue3.serviceWorker.scope : 'N/A'));
  console.log('  active state:       ' + (results.issue3.serviceWorker ? results.issue3.serviceWorker.state : 'N/A'));
  console.log('\nOverall Issue 3:      ' + (results.issue3.serviceWorker && results.issue3.serviceWorker.hasRegistration && results.issue3.hasMaskablePurpose ? 'PASS' : 'FAIL'));

  console.log('\n========== OTHER ==========');
  console.log('Page errors (uncaught): ' + results.pageErrors.length + ' ' + (results.pageErrors.length === 0 ? 'PASS' : 'FAIL'));
  results.pageErrors.forEach((e, i) => console.log('  [' + (i+1) + '] ' + e));
  console.log('\nALL THREE ISSUES:     ' + (results.passed && results.pageErrors.length === 0 ? 'PASS' : 'FAIL'));

  process.exit(results.passed && results.pageErrors.length === 0 ? 0 : 1);
})();

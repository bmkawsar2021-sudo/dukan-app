// Same as verify-build.js but hits the live Vercel URL.
const puppeteer = require('puppeteer');
const URL_TO_TEST = 'https://dukan-app-chi.vercel.app/';

(async () => {
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
      if (t === 'error' || t === 'warning') consoleErrors.push({ type: t, text: msg.text() });
    });
    page.on('pageerror', (err) => pageErrors.push({ message: err.message, stack: err.stack }));
    page.on('requestfailed', (req) => {
      const url = req.url();
      // Filter firebase / google apis that may 4xx without auth context.
      if (url.includes('firestore.googleapis.com') || url.includes('identitytoolkit.googleapis.com')) return;
      requestFailures.push({ url, reason: req.failure()?.errorText });
    });

    await page.goto(URL_TO_TEST, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));

    const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
    const hasContent = rootHTML.length > 100;
    const hasAuthScreen = rootHTML.includes('Sign in') || rootHTML.includes('Sign up') || rootHTML.includes('Dukan');
    const hasErrorUI = rootHTML.includes('Something went wrong');

    console.log('\n────── LIVE VERIFICATION REPORT ──────');
    console.log(`URL:                  ${URL_TO_TEST}`);
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
  }
  process.exit(exitCode);
})();

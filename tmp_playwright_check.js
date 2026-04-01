const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', err => console.log('PAGEERROR', err.message));
  page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('REQFAILED', req.url(), req.failure() && req.failure().errorText));
  page.on('response', res => { if (res.status() >= 400) console.log('RESP', res.status(), res.url()); });
  await page.goto('https://formacar.onrender.com', { waitUntil: 'networkidle' });
  console.log('TITLE', await page.title());
  console.log('BODYLEN', await page.evaluate(() => document.body.innerHTML.length));
  console.log('BODYHTML', await page.evaluate(() => document.body.innerHTML.slice(0,200)));
  await browser.close();
})().catch(err => { console.error('ERR', err); process.exit(1); });

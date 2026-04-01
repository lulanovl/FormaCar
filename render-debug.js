const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', (message) => {
    console.log('CONSOLE', message.type(), message.text());
  });

  page.on('pageerror', (error) => {
    console.log('PAGEERROR', error.message);
  });

  page.on('requestfailed', (request) => {
    console.log('REQUESTFAILED', request.url(), request.failure()?.errorText);
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log('RESPONSE', response.status(), response.url());
    }
  });

  const url = 'https://formacar.onrender.com';
  console.log('NAVIGATING', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  console.log('TITLE', await page.title());
  await page.waitForTimeout(5000);
  await browser.close();
})();

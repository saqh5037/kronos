const { chromium } = require('playwright');
const path = require('path');

const DPI = 300;
const W = Math.round(8.5 * DPI);   // 2550
const H = Math.round(13 * DPI);    // 3900

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const filePath = path.resolve(__dirname, 'KRONOS-POSTER-IPHONE.html');
  await page.goto('file://' + filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.setViewportSize({ width: W, height: H });
  await page.waitForTimeout(500);

  // PNG @ 300 DPI
  await page.screenshot({
    path: path.resolve(__dirname, 'KRONOS-POSTER-IPHONE-300dpi.png'),
    type: 'png',
    fullPage: false,
    scale: 'device',
  });
  console.log('PNG: 2550x3900 px');

  // PDF — EXACTLY one page, 8.5" x 13", zero margins
  await page.pdf({
    path: path.resolve(__dirname, 'KRONOS-POSTER-IPHONE.pdf'),
    width: '8.5in',
    height: '13in',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
    pageRanges: '1',
  });
  console.log('PDF: 8.5" x 13" — 1 page');

  await browser.close();
})();

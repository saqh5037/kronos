const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DPI = 300;
const designs = [
  { html: 'KRONOS-MINI-02-NEON.html', out: 'KRONOS-MINI-02-NEON' },
  { html: 'KRONOS-MINI-03-COMUNIDAD.html', out: 'KRONOS-MINI-03-COMUNIDAD' },
  { html: 'KRONOS-MINI-04-BOX.html', out: 'KRONOS-MINI-04-BOX' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const d of designs) {
    const filePath = path.resolve(__dirname, d.html);
    if (!fs.existsSync(filePath)) {
      console.error('Missing:', d.html);
      continue;
    }
    await page.goto('file://' + filePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Dimensions at 300 DPI: 4.25in x 5.5in
    const w = Math.round(4.25 * DPI);
    const h = Math.round(5.5 * DPI);
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);

    const pdfPath = path.resolve(__dirname, d.out + '.pdf');
    const pngPath = path.resolve(__dirname, d.out + '-300dpi.png');

    await page.pdf({
      path: pdfPath,
      width: '4.25in',
      height: '5.5in',
      printBackground: true,
      preferCSSPageSize: true,
    });

    await page.screenshot({
      path: pngPath,
      type: 'png',
      fullPage: false,
      scale: 'device',
    });

    console.log('Rendered:', d.out);
  }

  await browser.close();
  console.log('Done.');
})();

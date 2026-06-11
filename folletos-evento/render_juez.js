const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const base = '/Users/samuelquiroz/Documents/proyectos/kronos/folletos-evento';
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1500 },
    deviceScaleFactor: 1,
  });

  const filePath = path.join(base, 'DOMINUS-FICHA-JUEZ.html');
  await page.goto('file://' + filePath, { waitUntil: 'networkidle' });

  const pngPath = path.join(base, 'DOMINUS-FICHA-JUEZ-300dpi.png');
  await page.screenshot({
    path: pngPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 1500 },
  });
  console.log('✅ PNG:', pngPath);

  const pdfPath = path.join(base, 'DOMINUS-FICHA-JUEZ.pdf');
  await page.pdf({
    path: pdfPath,
    width: '4in',
    height: '5in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log('✅ PDF:', pdfPath);

  await browser.close();
})();

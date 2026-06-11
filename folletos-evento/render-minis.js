const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const designs = [
  { name: 'mini-02-neon', label: 'MINI-02-NEON' },
  { name: 'mini-03-comunidad', label: 'MINI-03-COMUNIDAD' },
  { name: 'mini-04-box', label: 'MINI-04-BOX' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const d of designs) {
    const htmlPath = path.resolve(__dirname, d.name + '.html');
    const fileUrl = 'file://' + htmlPath;

    console.log(`\n🎨 Renderizando ${d.label}...`);
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // PDF individual — exacto 4.25 x 5.5
    const pdfPath = path.resolve(__dirname, `KRONOS-${d.label}.pdf`);
    await page.pdf({
      path: pdfPath,
      width: '4.25in',
      height: '5.5in',
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(`   ✅ PDF: ${pdfPath}`);

    // PNG a 300 DPI (1275 x 1650 px)
    const pngPath = path.resolve(__dirname, `KRONOS-${d.label}-300dpi.png`);
    await page.setViewportSize({ width: 1275, height: 1650 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: pngPath, type: 'png' });
    console.log(`   ✅ PNG 300 DPI: ${pngPath}`);
  }

  await browser.close();
  console.log('\n🚀 ¡Minis listos!');
})();

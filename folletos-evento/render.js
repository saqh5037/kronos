const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const designs = [
  { name: 'folleto-01-fuego', label: '01-FUEGO' },
  { name: 'folleto-02-neon', label: '02-NEON' },
  { name: 'folleto-03-comunidad', label: '03-COMUNIDAD' },
  { name: 'folleto-04-box', label: '04-BOX' },
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

    // PDF vectorial (ideal para imprenta profesional)
    const pdfPath = path.resolve(__dirname, `KRONOS-Folleto-${d.label}.pdf`);
    await page.pdf({
      path: pdfPath,
      width: '5.75in',
      height: '8.75in',
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(`   ✅ PDF: ${pdfPath}`);

    // PNG a 300 DPI (1725 x 2625 px)
    const pngPath = path.resolve(__dirname, `KRONOS-Folleto-${d.label}-300dpi.png`);
    await page.setViewportSize({ width: 1725, height: 2625 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: pngPath, type: 'png' });
    console.log(`   ✅ PNG 300 DPI: ${pngPath}`);
  }

  await browser.close();
  console.log('\n🚀 ¡Todos los folletos listos!');
})();

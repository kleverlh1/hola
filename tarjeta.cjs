// Genera el QR y las tarjetas para imprimir (carpeta tarjeta/):
//   qr.svg / qr.png   el código solo (para stickers, el fondo del celular, etc.)
//   tarjetas.pdf      hoja A4 con 10 tarjetas de 85 × 55 mm para recortar
// Uso:  npm run tarjeta   (usa public/pipo.webp; necesita Playwright con Chromium)
const QRCode = require('qrcode');
const { chromium } = require('playwright');
const fs = require('node:fs');

const URL_PAGINA = 'https://kleverlh1.github.io/hola/';
const TINTA = '#1d2b3f', FONDO = '#fdf6ec';

(async () => {
  fs.mkdirSync('tarjeta', { recursive: true });
  const opciones = { errorCorrectionLevel: 'Q', margin: 2, color: { dark: TINTA, light: '#ffffff' } };
  const svg = await QRCode.toString(URL_PAGINA, { ...opciones, type: 'svg' });
  fs.writeFileSync('tarjeta/qr.svg', svg);
  await QRCode.toFile('tarjeta/qr.png', URL_PAGINA, { ...opciones, width: 1200 });

  const pipo = 'data:image/webp;base64,' + fs.readFileSync('public/pipo.webp').toString('base64');
  const qr = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const tarjeta = `
    <div class="t">
      <img class="pipo" src="${pipo}" alt="">
      <div class="lado">
        <img class="qr" src="${qr}" alt="">
        <p>¡Escanéame! 🙂</p>
      </div>
    </div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", system-ui, sans-serif; color: ${TINTA}; }
    .hoja { width: 210mm; height: 297mm; padding: 11mm 18mm; display: grid;
            grid-template-columns: 85mm 85mm; grid-auto-rows: 55mm; gap: 0; justify-content: center; align-content: center; }
    .t { position: relative; display: flex; align-items: center; overflow: hidden; outline: .2mm dashed #c9c2b6;
         background: radial-gradient(ellipse 70% 90% at 28% 50%, #fff 0%, ${FONDO} 75%); padding: 3mm 4mm 3mm 1mm; }
    .pipo { height: 52mm; margin: -2mm -3mm -2mm -2mm; }
    .lado { margin-left: auto; display: flex; flex-direction: column; align-items: center; gap: 1.5mm; }
    .qr { width: 33mm; height: 33mm; border-radius: 2mm; background: #fff; }
    p { margin: 0; font-size: 10.5pt; font-weight: 800; }
  </style></head><body><div class="hoja">${tarjeta.repeat(10)}</div></body></html>`;

  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(html);
  await p.pdf({ path: 'tarjeta/tarjetas.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  // Vista previa de una tarjeta
  await p.setViewportSize({ width: 900, height: 1200 });
  await p.locator('.t').first().screenshot({ path: 'tarjeta/vista-previa.png', scale: 'device' });
  await b.close();
  for (const f of fs.readdirSync('tarjeta')) console.log(f.padEnd(20), (fs.statSync('tarjeta/' + f).size / 1024).toFixed(1), 'KB');
})();

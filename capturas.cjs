// Genera las imágenes de Pipo a partir del modelo 3D (se guardan en public/ y se suben al repositorio):
//   pipo.webp      imagen que se ve al instante mientras carga el 3D
//   og.png         vista previa al compartir el enlace (WhatsApp, Facebook…)
//   icono-*.png    íconos de la pestaña y de la pantalla de inicio
// Uso:  npm run capturas   (necesita Playwright con Chromium)
const { chromium } = require('playwright');
const esbuild = require('esbuild');
const fs = require('node:fs');

const ENCUADRE = { objetivo: [0, 0.72, 0], alto: 1.45, ancho: 0.92 }; // el mismo de src/app.js
const BUSTO = { objetivo: [0.02, 1.08, 0], alto: 0.66, ancho: 0.66 };
const FONDO = '#fdf6ec';

(async () => {
  const lib = esbuild.buildSync({ entryPoints: ['src/pipo/index.js'], bundle: true, format: 'iife', globalName: 'Pipo3D', write: false }).outputFiles[0].text;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });

  async function foto(ancho, alto, encuadre, ofreciendo, fondo) {
    const p = await b.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
    p.on('pageerror', (e) => console.error('Error:', e.message));
    await p.setContent(`<body style="margin:0;background:${fondo || 'transparent'}"><canvas id="c" style="width:${ancho}px;height:${alto}px;display:block"></canvas></body>`);
    await p.addScriptTag({ content: lib });
    const url = await p.evaluate(({ encuadre, ofreciendo, fondo }) => {
      const pipo = Pipo3D.crear({ canvas: document.getElementById('c'), encuadre, animar: false, secuencia: ofreciendo, sombra: 2048, capturas: true });
      if (fondo) pipo.renderer.setClearColor(fondo, 1);
      // Ofreciendo la lata: recorre el gesto firma hasta la mitad del ofrecimiento
      return ofreciendo ? pipo.posar({ continuar: true, segundos: 10.6, tipo: 'image/png' })
        : pipo.posar({ reaccion: 'feliz', segundos: 1.2, tipo: 'image/png' });
    }, { encuadre, ofreciendo, fondo });
    await p.close();
    return Buffer.from(url.split(',')[1], 'base64');
  }

  // Imagen principal (con fondo transparente) → webp con el mismo navegador
  const principal = await foto(720, 900, ENCUADRE, true);
  fs.writeFileSync('public/pipo.png.tmp', principal);
  const conv = await b.newPage({ viewport: { width: 720, height: 900 } });
  const webp = await conv.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/webp', 0.88);
  }, 'data:image/png;base64,' + principal.toString('base64'));
  fs.writeFileSync('public/pipo.webp', Buffer.from(webp.split(',')[1], 'base64'));
  fs.rmSync('public/pipo.png.tmp');

  // Íconos: el busto feliz sobre fondo crema
  for (const t of [64, 180, 192, 512]) fs.writeFileSync(`public/icono-${t}.png`, await foto(t, t, BUSTO, false, FONDO));

  // Vista previa al compartir: Pipo + la pregunta
  const og = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(`<body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;justify-content:center;gap:24px;
    font-family:'Segoe UI',system-ui,sans-serif;background:radial-gradient(ellipse 70% 80% at 35% 50%,#fff 0%,${FONDO} 70%)">
    <img src="data:image/png;base64,${principal.toString('base64')}" style="height:600px">
    <div style="font-size:64px;font-weight:800;color:#1d2b3f;max-width:560px;line-height:1.15">¿Te gustaría ser mi amigo?</div></body>`);
  fs.writeFileSync('public/og.png', await og.screenshot());

  await b.close();
  for (const f of fs.readdirSync('public')) console.log(f.padEnd(24), (fs.statSync('public/' + f).size / 1024).toFixed(1), 'KB');
})();

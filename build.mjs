// Genera la página en dist/ (lo que publica GitHub Pages):
//   index.html, app.js (Pipo 3D + frases) y lo que haya en public/ (imágenes, íconos, manifiesto).
import { build } from 'esbuild';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { leerLista } from './src/frases.js';

// ── Datos de la página (cambia aquí tu número o el mensaje que llega por WhatsApp)
const URL_PAGINA = 'https://kleverlh1.github.io/hola/';
const WHATSAPP = '51924174301';
const MENSAJE = '¡Hola! 😊';

// Frases: frases/<categoría>.txt, una por línea
const FRASES = {};
for (const f of fs.readdirSync('frases').filter((f) => f.endsWith('.txt')).sort()) {
  FRASES[f.replace(/\.txt$/, '')] = leerLista(fs.readFileSync(`frases/${f}`, 'utf8'));
}
const total = Object.values(FRASES).reduce((a, l) => a + l.length, 0);

const app = await build({
  entryPoints: ['src/app.js'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false,
  define: { FRASES: JSON.stringify(FRASES) },
});
const js = app.outputFiles[0].text;
const version = crypto.createHash('sha256').update(js).digest('hex').slice(0, 10);

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
fs.cpSync('public', 'dist', { recursive: true });
fs.writeFileSync('dist/app.js', js);
const html = fs.readFileSync('src/index.html', 'utf8')
  .replaceAll('__URL__', URL_PAGINA)
  .replaceAll('__WHATSAPP__', WHATSAPP)
  .replaceAll('__MENSAJE__', encodeURIComponent(MENSAJE))
  .replaceAll('__VERSION__', version);
fs.writeFileSync('dist/index.html', html);
console.log(`dist/ listo · app.js ${(js.length / 1024).toFixed(0)} KB · ${total} frases en ${Object.keys(FRASES).length} grupos`);

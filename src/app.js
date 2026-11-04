// La página: Pipo saluda, ofrece su lata y dice frases bonitas (distintas en cada visita).
import { crear } from './pipo/index.js';
import { crearFrases } from './frases.js';

/* global FRASES */
const frases = crearFrases(FRASES);
const escena = document.getElementById('escena');
const canvas = document.getElementById('pipo');
const burbuja = document.getElementById('burbuja');
const gestos = ['feliz', 'hablar', 'saludar'];

function sin3D() {
  // Sin WebGL: queda la imagen y el globo muestra una frase nueva cada vez que se toca
  escena.classList.add('sin-3d');
  const mostrar = (t) => { burbuja.textContent = t; burbuja.classList.add('ver'); };
  mostrar(frases.saludo());
  escena.addEventListener('click', () => mostrar(frases.cualquiera()));
}

try {
  const pipo = crear({
    canvas, burbuja,
    encuadre: { objetivo: [0, 0.72, 0], alto: 1.45, ancho: 0.92 },
    sombra: 1024,
    fraseCelular: (vuelta) => frases.lata(vuelta),
    alTocar: () => pipo.decir(frases.cualquiera(), gestos[Math.floor(Math.random() * gestos.length)]),
  });
  requestAnimationFrame(() => requestAnimationFrame(() => escena.classList.add('listo')));
  setTimeout(() => pipo.decir(frases.saludo(), 'saludar'), 700);
  window.pipo = pipo; // para probar desde la consola
  document.addEventListener('visibilitychange', () => (document.hidden ? pipo.pausar() : pipo.reanudar()));
} catch (e) {
  console.warn('Sin 3D:', e);
  sin3D();
}

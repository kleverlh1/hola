// Pruebas de la elección de frases:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { crearFrases, leerLista, franja, categoriaDelDia, PRIMERA_LATA } from '../src/frases.js';

const almacen = () => { const m = new Map(); return { leer: (k) => m.get(k) ?? null, guardar: (k, v) => m.set(k, v), m }; };
const F = { animo: ['a1', 'a2'], carino: ['c1'], humor: ['h1'], regreso: ['r1', 'r2'], cocacolita: ['k1'], manana: ['m1'], tarde: ['t1'], noche: ['n1'], lunes: ['l1'], viernes: ['v1'], finde: ['f1'] };
const miercolesTarde = () => new Date(2026, 10, 4, 15, 0);

test('la primera visita saluda con «¡Hola!» y ofrece la cocacolita', () => {
  const f = crearFrases(F, { almacen: almacen(), ahora: miercolesTarde });
  assert.equal(f.primeraVisita, true);
  assert.equal(f.saludo(), '¡Hola! 👋');
  assert.equal(f.lata(0), PRIMERA_LATA);
});

test('al volver cuenta la visita y saluda con una frase de regreso', () => {
  const a = almacen();
  crearFrases(F, { almacen: a });
  const f = crearFrases(F, { almacen: a, ahora: miercolesTarde });
  assert.equal(f.visitas, 2);
  assert.ok(F.regreso.includes(f.saludo()));
});

test('no repite hasta agotar las frases, también entre visitas', () => {
  const a = almacen();
  const azar = () => 0.9; // siempre frases generales
  const dichas = [];
  for (let i = 0; i < 4; i++) dichas.push(crearFrases(F, { almacen: a, azar, ahora: miercolesTarde }).cualquiera());
  assert.deepEqual([...dichas].sort(), ['a1', 'a2', 'c1', 'h1']);
  // Agotadas: empieza de nuevo sin fallar
  assert.ok(['a1', 'a2', 'c1', 'h1'].includes(crearFrases(F, { almacen: a, azar, ahora: miercolesTarde }).cualquiera()));
});

test('a veces elige frases de la hora y del día', () => {
  const lunesManana = () => new Date(2026, 10, 2, 8, 0);
  assert.equal(crearFrases(F, { almacen: almacen(), azar: () => 0.1, ahora: lunesManana }).cualquiera(), 'm1');
  assert.equal(crearFrases(F, { almacen: almacen(), azar: () => 0.2, ahora: lunesManana }).cualquiera(), 'l1');
  assert.equal(franja(new Date(2026, 0, 1, 4)), 'noche');
  assert.equal(franja(new Date(2026, 0, 1, 12)), 'tarde');
  assert.equal(categoriaDelDia(new Date(2026, 10, 8)), 'finde');
  assert.equal(categoriaDelDia(miercolesTarde()), null);
});

test('funciona aunque lo guardado esté dañado', () => {
  const basura = { leer: () => '{no es json', guardar() {} };
  assert.ok(crearFrases(F, { almacen: basura }).cualquiera());
});

test('los archivos de frases: sin repetidas, cortas y sin palabras que cambian con el género', () => {
  const vistas = new Set();
  for (const archivo of fs.readdirSync('frases').filter((x) => x.endsWith('.txt'))) {
    for (const f of leerLista(fs.readFileSync(`frases/${archivo}`, 'utf8'))) {
      assert.ok(!vistas.has(f), `repetida: ${f}`);
      vistas.add(f);
      assert.ok(f.length <= 75, `muy larga (${archivo}): ${f}`);
      assert.ok(!/\b(cansad|preocupad|bienvenid|guap|solit)[oa]\b/i.test(f), `revisar género (${archivo}): ${f}`);
    }
  }
  assert.ok(vistas.size >= 250, `hay ${vistas.size} frases`);
});

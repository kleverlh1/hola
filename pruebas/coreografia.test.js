// Pruebas de los datos de los gestos (coreografia.js):  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REST, SEQ, SEQ_TOTAL, REACTIONS } from '../src/pipo/coreografia.js';

const OBJETIVOS = ['rest', 'phone'];

test('cada paso tiene duración, poses conocidas y un objetivo de manos válido', () => {
  for (const [i, s] of SEQ.entries()) {
    assert.ok(s.d > 0, `paso ${i}: duración`);
    for (const k of Object.keys(s.p)) assert.ok(k in REST, `paso ${i}: «${k}» no existe en REST`);
    if (s.rt) assert.ok(OBJETIVOS.includes(s.rt), `paso ${i}: rt «${s.rt}»`);
    if (s.grip) assert.ok(s.rt === 'phone', `paso ${i}: sostiene la lata sin la mano en la lata`);
  }
  for (const [n, r] of Object.entries(REACTIONS)) for (const k of Object.keys(r.p)) assert.ok(k in REST, `${n}: «${k}»`);
});

test('el bucle dura lo justo para ver todo el gesto', () => {
  assert.ok(SEQ_TOTAL > 10 && SEQ_TOTAL < 25, `dura ${SEQ_TOTAL} s`);
});

test('la primera parte es ofrecer la cocacolita (lo primero que ve quien escanea)', () => {
  const i = SEQ.findIndex((s) => s.at === 'phone');
  assert.ok(i >= 0 && SEQ.slice(0, i + 1).reduce((a, s) => a + s.d, 0) < 15);
  assert.match(SEQ[i].bubble, /cocacolita/);
});

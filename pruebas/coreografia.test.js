// Pruebas de los datos de los gestos (coreografia.js y paseo.js):  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REST, SEQ, SEQ_TOTAL, REACTIONS } from '../src/pipo/coreografia.js';

const OBJETIVOS = ['rest', 'phone', 'rodillas'];

test('cada paso tiene duración, poses conocidas y un objetivo de manos válido', () => {
  for (const [i, s] of SEQ.entries()) {
    assert.ok(s.d > 0, `paso ${i}: duración`);
    for (const k of Object.keys(s.p)) assert.ok(k in REST, `paso ${i}: «${k}» no existe en REST`);
    if (s.rt) assert.ok(OBJETIVOS.includes(s.rt), `paso ${i}: rt «${s.rt}»`);
    if (s.grip) assert.ok(s.rt === 'phone', `paso ${i}: sostiene la lata sin la mano en la lata`);
  }
  for (const [n, r] of Object.entries(REACTIONS)) for (const k of Object.keys(r.p)) assert.ok(k in REST, `${n}: «${k}»`);
});

test('el bucle termina sentado en su sitio, como empieza', () => {
  const ultimo = { ...REST, ...SEQ.at(-1).p };
  for (const k of ['stand', 'walk', 'rootX', 'rootY', 'rootZ', 'rootYaw', 'crouch', 'sip']) assert.equal(ultimo[k], 0, k);
  assert.ok(SEQ_TOTAL > 30 && SEQ_TOTAL < 60, `dura ${SEQ_TOTAL} s`);
});

test('la primera parte es ofrecer la cocacolita (lo primero que ve quien escanea)', () => {
  const i = SEQ.findIndex((s) => s.at === 'phone');
  assert.ok(i >= 0 && SEQ.slice(0, i + 1).reduce((a, s) => a + s.d, 0) < 15);
  assert.match(SEQ[i].bubble, /cocacolita/);
});

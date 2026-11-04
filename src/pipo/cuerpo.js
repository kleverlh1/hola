// Movimiento del cuerpo en cada cuadro: piernas, respiración, cabeza, brazos, cara y lata.
// rt (objetivo de las manos): 'rest' (apoyadas en el puf), 'phone' (la lata) o 'rodillas' (cansado).
// Recibe los valores ya suavizados (P) que calcula index.js a partir de la coreografía.
import * as THREE from 'three';
import { SEAT_Y } from './modelo.js';
import { PALM, PHONE_UNDER_HAND, HAND_REST, onBooks, stepTarget, poseArm } from './brazos.js';
import { moverPiernas } from './piernas.js';

const clamp = THREE.MathUtils.clamp;

export function crearCuerpo(B) {
  const { body, neck, head, armR, armL, legR, legL, phone, robot } = B;
  const _rod = { R: new THREE.Vector3(), L: new THREE.Vector3() }, _cad = new THREE.Vector3();
  const HAND_PHONE = B.PHONE_REST_POS.clone().add(new THREE.Vector3(0, PHONE_UNDER_HAND, 0));
  const ikPos = { R: HAND_REST.R.clone(), L: HAND_REST.L.clone() };
  const _qId = new THREE.Quaternion(), _hFK = new THREE.Quaternion(), _fkE = new THREE.Euler();
  const _palm = new THREE.Vector3(), _off = new THREE.Vector3(), _q = new THREE.Quaternion(), _flat = new THREE.Vector3();

  /**
   * @param {(k: string) => number} P  valor actual de cada articulación / gesto
   * @param {object} S                 resortes (para el agarre de la lata)
   * @param {object} state             estado de la animación (tiempo, parpadeo, forzar…)
   * @param {object} c                 { dt, T, rt: 'rest' | 'phone' | 'rodillas', talk: 0 | 1 }
   */
  return function mover(P, S, state, { dt, T, rt, talk }) {
    // Piernas y posición (sentado, de pie, caminando)
    const { walk, amp } = moverPiernas(B, P, state, dt, T);

    // Cuerpo, respiración (agitada si está cansado) y balanceo
    const pant = clamp(P('pant'), 0, 1);
    const breath = Math.sin(T * (2.1 + 7 * pant));
    body.rotation.x = P('leanX') + (0.012 + 0.03 * pant) * breath;
    body.rotation.z = P('leanZ') + 0.012 * amp * Math.sin(state.swingPhase) + 0.03 * walk * Math.sin(state.walkPhase);
    body.position.y = 0.08 + (0.004 + 0.01 * pant) * breath;

    // Cabeza (repartida entre cuello y cabeza)
    neck.rotation.set(P('headPitch') * 0.3, P('headYaw') * 0.25, P('headRoll') * 0.3);
    head.rotation.set(P('headPitch') * 0.7 - 0.01 * breath, P('headYaw') * 0.75, P('headRoll') * 0.7);

    // Brazos
    robot.updateMatrixWorld(true);
    if (rt === 'rodillas') {
      // Manos sobre los muslos, cerca de las rodillas (como un atleta que recupera el aire)
      for (const [k, leg] of [['R', legR], ['L', legL]]) {
        leg.knee.getWorldPosition(_rod[k]);
        leg.hip.getWorldPosition(_cad);
        _rod[k].lerp(_cad, 0.3).add(_off.set(0, 0.1, 0.05));
      }
    }
    stepTarget(ikPos.R, rt === 'phone' ? HAND_PHONE : rt === 'rodillas' ? _rod.R : HAND_REST.R, dt);
    stepTarget(ikPos.L, rt === 'rodillas' ? _rod.L : HAND_REST.L, dt);
    // Al caminar, los brazos se balancean al revés que las piernas
    const brazada = 0.45 * walk * Math.sin(state.walkPhase);
    const wave = Math.max(0, P('wave'));
    const gripNow = clamp(S.grip.x, 0, 1);
    poseArm(body, armR, P('rShX') - brazada, P('rShZ'), P('rEl'), 0, P('ikR'), ikPos.R, _qId, SEAT_Y + PALM + 0.026 * gripNow);
    _hFK.setFromEuler(_fkE.set(0, wave * 0.6, wave * 0.25 * Math.sin(T * 11 - 0.6)));
    poseArm(body, armL, P('lShX') + brazada, P('lShZ'), P('lEl'), wave * 0.45 * Math.sin(T * 11), P('ikL'), ikPos.L, _hFK, SEAT_Y + PALM);

    // Parpadeo
    let open = 1;
    if (T > state.blinkNext && state.blinkT < 0) state.blinkT = 0;
    if (state.blinkT >= 0) {
      state.blinkT += dt;
      const p = state.blinkT / 0.17;
      open = p < 1 ? 1 - Math.sin(Math.PI * p) : 1;
      if (p >= 1) {
        state.blinkT = -1;
        const again = !state.doubleBlink && Math.random() < 0.22;
        state.doubleBlink = again;
        state.blinkNext = T + (again ? 0.12 : 2 + Math.random() * 3.5);
      }
    }
    let talkAmt = talk ? Math.abs(Math.sin(T * 13) * 0.65 + Math.sin(T * 21.7) * 0.35) : 0;
    if (pant > 0.05) talkAmt = Math.max(talkAmt, pant * (0.35 + 0.25 * breath)); // jadea con la boca abierta
    if (state.forzar.open != null) open = state.forzar.open;
    if (state.forzar.talk != null) talkAmt = state.forzar.talk;
    B.cara.dibujar({
      gx: P('gazeX'), gy: P('gazeY'), open, happy: clamp(P('happy'), 0, 1),
      brow: P('brow'), tilt: P('tilt'), smile: P('smile'), blush: clamp(P('blush'), 0, 1),
      talk: talkAmt, pupil: P('pupil'),
    }, B.theme);

    // Lata: del puf a la mano
    const g = clamp(P('grip'), 0, 1);
    const raise = clamp((-P('rShX') - 0.3) / 0.9, 0, 1) * (1 - clamp(P('ikR'), 0, 1));
    armR.hand.getWorldPosition(_flat).y -= PHONE_UNDER_HAND;
    const sip = clamp(P('sip'), 0, 1); // al tomar, la lata va delante de la boca e inclinada
    armR.hand.localToWorld(_palm.set(0, -0.07, 0.01)).add(_off.set(0.02 + 0.08 * sip, 0.05 + 0.05 * sip, 0.075 + 0.16 * sip));
    phone.position.copy(B.PHONE_REST_POS).lerp(_flat.lerp(_palm, raise), g);
    if (onBooks(phone.position)) phone.position.y = Math.max(phone.position.y, B.PHONE_REST_POS.y);
    _q.copy(B.PHONE_REST_Q).slerp(B.PHONE_UP_Q, g * raise);
    if (sip > 0.001) _q.slerp(B.PHONE_SIP_Q, sip);
    phone.quaternion.copy(_q);
  };
}

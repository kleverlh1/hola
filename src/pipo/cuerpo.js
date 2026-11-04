// Movimiento del cuerpo en cada cuadro: piernas, respiración, cabeza, brazos, cara y lata.
// Recibe los valores ya suavizados (P) que calcula index.js a partir de la coreografía.
import * as THREE from 'three';
import { SEAT_Y } from './modelo.js';
import { PALM, PHONE_UNDER_HAND, HAND_REST, onBooks, stepTarget, poseArm } from './brazos.js';

const clamp = THREE.MathUtils.clamp;

export function crearCuerpo(B) {
  const { body, neck, head, armR, armL, legR, legL, phone, robot } = B;
  const HAND_PHONE = B.PHONE_REST_POS.clone().add(new THREE.Vector3(0, PHONE_UNDER_HAND, 0));
  const ikPos = { R: HAND_REST.R.clone(), L: HAND_REST.L.clone() };
  const _qId = new THREE.Quaternion(), _hFK = new THREE.Quaternion(), _fkE = new THREE.Euler();
  const _palm = new THREE.Vector3(), _off = new THREE.Vector3(), _q = new THREE.Quaternion(), _flat = new THREE.Vector3();

  /**
   * @param {(k: string) => number} P  valor actual de cada articulación / gesto
   * @param {object} S                 resortes (para el agarre del lata)
   * @param {object} state             estado de la animación (tiempo, parpadeo, forzar…)
   * @param {object} c                 { dt, T, rt: 'rest' | 'phone', talk: 0 | 1 }
   */
  return function mover(P, S, state, { dt, T, rt, talk }) {
    // Pies: balanceo alternado, como un niño sentado
    const amp = Math.max(0, P('swing')) * (0.78 + 0.22 * Math.sin(T * 0.43));
    state.swingPhase += dt * (6.4 + 0.6 * Math.sin(T * 0.29));
    for (const [leg, off] of [[legL, 0], [legR, Math.PI]]) {
      const k = 0.5 + 0.5 * Math.sin(state.swingPhase + off);
      leg.hip.rotation.set(-Math.PI / 2 - 0.05 * amp * k, 0, 0);
      leg.knee.rotation.x = Math.PI / 2 - 0.12 - amp * 0.42 * k;
      leg.foot.rotation.x = -0.05 + 0.22 * amp * Math.sin(state.swingPhase + off - 0.9);
    }
    legL.hip.rotation.z = 0.04; legR.hip.rotation.z = -0.04;

    // Cuerpo, respiración y balanceo
    const breath = Math.sin(T * 2.1);
    body.rotation.x = P('leanX') + 0.012 * breath;
    body.rotation.z = P('leanZ') + 0.012 * amp * Math.sin(state.swingPhase);
    body.position.y = 0.08 + 0.004 * breath;

    // Cabeza (repartida entre cuello y cabeza)
    neck.rotation.set(P('headPitch') * 0.3, P('headYaw') * 0.25, P('headRoll') * 0.3);
    head.rotation.set(P('headPitch') * 0.7 - 0.01 * breath, P('headYaw') * 0.75, P('headRoll') * 0.7);

    // Brazos
    robot.updateMatrixWorld(true);
    stepTarget(ikPos.R, rt === 'phone' ? HAND_PHONE : HAND_REST.R, dt);
    stepTarget(ikPos.L, HAND_REST.L, dt);
    const wave = Math.max(0, P('wave'));
    const gripNow = clamp(S.grip.x, 0, 1);
    poseArm(body, armR, P('rShX'), P('rShZ'), P('rEl'), 0, P('ikR'), ikPos.R, _qId, SEAT_Y + PALM + 0.026 * gripNow);
    _hFK.setFromEuler(_fkE.set(0, wave * 0.6, wave * 0.25 * Math.sin(T * 11 - 0.6)));
    poseArm(body, armL, P('lShX'), P('lShZ'), P('lEl'), wave * 0.45 * Math.sin(T * 11), P('ikL'), ikPos.L, _hFK, SEAT_Y + PALM);

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
    armR.hand.localToWorld(_palm.set(0, -0.07, 0.01)).add(_off.set(0.02, 0.05, 0.075));
    phone.position.copy(B.PHONE_REST_POS).lerp(_flat.lerp(_palm, raise), g);
    if (onBooks(phone.position)) phone.position.y = Math.max(phone.position.y, B.PHONE_REST_POS.y);
    _q.copy(B.PHONE_REST_Q).slerp(B.PHONE_UP_Q, g * raise);
    phone.quaternion.copy(_q);
  };
}

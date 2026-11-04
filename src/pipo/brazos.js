// Cinemática inversa de los brazos: la palma se apoya al ras del puf y nunca se hunde.
import * as THREE from 'three';
import { SEAT_Y, LATA } from './modelo.js';

export const L1 = 0.26, L2 = 0.215;           // hombro→codo, codo→muñeca
export const PALM = 0.158;                    // muñeca → base de la palma
export const PHONE_UNDER_HAND = PALM + LATA.alto / 2 - 0.035; // centro de la lata bajo la muñeca cuando la mano la toma desde arriba
export const HAND_REST = {
  R: new THREE.Vector3(-0.5, SEAT_Y + PALM, 0.1),
  L: new THREE.Vector3(0.5, SEAT_Y + PALM, 0.1),
};

const lerp = THREE.MathUtils.lerp;
const _t = new THREE.Vector3(), _t2 = new THREE.Vector3();
const _ikE = new THREE.Euler(0, 0, 0, 'ZXY'), _fkE = new THREE.Euler();
const _fkQ = new THREE.Quaternion(), _ikQ = new THREE.Quaternion(), _hq = new THREE.Quaternion();

// ¿El punto está sobre la superficie del puf?
export const onBooks = (p) => Math.abs(p.x) < 0.7 && p.z > -0.54 && p.z < 0.24;

// Acerca la mano a su objetivo con un pequeño arco (nunca baja del objetivo)
export function stepTarget(cur, goal, dt) {
  const k = 1 - Math.exp(-dt * 7);
  const lift = Math.min(Math.hypot(goal.x - cur.x, goal.z - cur.z) * 0.6, 0.14);
  cur.x += (goal.x - cur.x) * k;
  cur.z += (goal.z - cur.z) * k;
  cur.y += (goal.y + lift - cur.y) * k;
}

// Dos huesos analíticos: abducción (Z) y luego flexión (X) del hombro, flexión del codo
function solveArm(body, arm, target, qOut) {
  _t.copy(target);
  body.worldToLocal(_t).sub(arm.sh.position);
  const phi = Math.atan2(_t.x, -_t.y);
  const qy = -_t.x * Math.sin(phi) + _t.y * Math.cos(phi), qz = _t.z;
  const d = THREE.MathUtils.clamp(Math.hypot(qy, qz), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  const e = -Math.acos(THREE.MathUtils.clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1));
  const th = Math.atan2(-qz, -qy) - Math.atan2(L2 * Math.sin(e), L1 + L2 * Math.cos(e));
  qOut.setFromEuler(_ikE.set(th, 0, phi, 'ZXY'));
  return e;
}

// Mezcla la pose libre (FK) con la pose apoyada (IK) según el peso w.
// Si la mezcla dejara la muñeca bajo floorY (sobre el puf), se re-resuelve para quedar al ras.
export function poseArm(body, arm, shX, shZ, el, elZ, w, target, handFK, floorY) {
  w = THREE.MathUtils.clamp(w, 0, 1);
  _fkQ.setFromEuler(_fkE.set(shX, 0, shZ));
  const ikEl = solveArm(body, arm, target, _ikQ);
  arm.sh.quaternion.slerpQuaternions(_fkQ, _ikQ, w);
  arm.el.rotation.set(lerp(el, ikEl, w), 0, elZ);
  arm.hand.updateWorldMatrix(true, false);
  arm.hand.getWorldPosition(_t2);
  if (_t2.y < floorY && onBooks(_t2)) {
    _t2.y = floorY;
    arm.el.rotation.x = solveArm(body, arm, _t2, _ikQ);
    arm.sh.quaternion.copy(_ikQ);
    w = 1;
  }
  arm.el.updateWorldMatrix(true, false);
  arm.el.getWorldQuaternion(_hq).invert(); // mano vertical, palma hacia el puf
  arm.hand.quaternion.copy(handFK).slerp(_hq, w);
}

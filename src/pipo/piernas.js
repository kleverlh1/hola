// Piernas y posición de Pipo: sentado en el puf (balancea los pies) o de pie (camina, se agacha).
// Mezcla las dos posturas con «stand» (0 = sentado, 1 = de pie). De pie, calcula la altura del
// cuerpo para que el pie más bajo quede siempre apoyado en el suelo.
import * as THREE from 'three';
import { FLOOR_Y, SEAT_Y } from './modelo.js';

const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const MUSLO = 0.28, CANILLA = 0.235, PIE = 0.17; // cadera→rodilla, rodilla→tobillo, tobillo→suela
const CADERA_Y = 0.1;                             // altura de la cadera sobre el origen del robot
const PASOS_POR_SEGUNDO = 2.8;

/** Cuánto baja la pierna desde la cadera hasta la suela (con el pie plano). */
const largo = (cadera, rodilla) => MUSLO * Math.cos(cadera) + CANILLA * Math.cos(cadera + rodilla) + PIE;

/**
 * @param {object} B      partes del modelo
 * @param {(k: string) => number} P  valores suavizados
 * @param {object} state  estado de la animación
 * @returns {{ walk: number, stand: number }}
 */
export function moverPiernas(B, P, state, dt, T) {
  const { robot, legR, legL } = B;
  const stand = clamp(P('stand'), 0, 1), walk = clamp(P('walk'), 0, 1), crouch = Math.max(0, P('crouch'));

  // Sentado: balanceo alternado de los pies, como un niño
  const amp = Math.max(0, P('swing')) * (0.78 + 0.22 * Math.sin(T * 0.43)) * (1 - stand);
  state.swingPhase += dt * (6.4 + 0.6 * Math.sin(T * 0.29));
  // De pie: el paso avanza solo mientras camina
  if (walk > 0.02) state.walkPhase += dt * Math.PI * PASOS_POR_SEGUNDO * (0.6 + 0.4 * walk);

  let bajada = 0;
  for (const [leg, off] of [[legL, 0], [legR, Math.PI]]) {
    const k = 0.5 + 0.5 * Math.sin(state.swingPhase + off);
    const sHip = -Math.PI / 2 - 0.05 * amp * k;
    const sKnee = Math.PI / 2 - 0.12 - amp * 0.42 * k;
    const sFoot = -0.05 + 0.22 * amp * Math.sin(state.swingPhase + off - 0.9);

    const fase = state.walkPhase + off;
    const pHip = -0.38 * walk * Math.sin(fase) - crouch * 0.75;
    const pKnee = 0.75 * walk * Math.max(0, Math.cos(fase)) + crouch * 1.3;
    const pFoot = -(pHip + pKnee); // pie plano en el suelo

    leg.hip.rotation.set(lerp(sHip, pHip, stand), 0, 0);
    leg.knee.rotation.x = lerp(sKnee, pKnee, stand);
    leg.foot.rotation.x = lerp(sFoot, pFoot, stand);
    bajada = Math.max(bajada, largo(pHip, pKnee));
  }
  legL.hip.rotation.z = 0.04; legR.hip.rotation.z = -0.04;

  // Dónde está el robot: sentado sobre el puf o parado con el pie más bajo en el suelo
  const sentadoY = SEAT_Y, paradoY = FLOOR_Y + bajada - CADERA_Y;
  robot.position.set(P('rootX'), lerp(sentadoY, paradoY, stand) + P('rootY'), P('rootZ'));
  robot.rotation.y = P('rootYaw');
  return { walk, stand, amp };
}

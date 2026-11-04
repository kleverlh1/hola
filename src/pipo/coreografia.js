// Poses y gestos de Pipo. Solo datos: aquí se ajusta la actuación sin tocar el motor.
//
// Cada paso tiene una duración (d, en segundos) y una pose objetivo (p).
// Los valores se alcanzan con resortes, así que los movimientos aceleran y frenan solos.

// Pose de reposo
export const REST = {
  headYaw: 0, headPitch: 0, headRoll: 0, gazeX: 0, gazeY: 0, leanX: 0, leanZ: 0,
  rShX: -0.35, rShZ: -0.1, rEl: -0.9, lShX: -0.35, lShZ: 0.1, lEl: -0.9, ikR: 1, ikL: 1,
  swing: 1, happy: 0, brow: 0, tilt: 0, smile: 0.5, blush: 0.35, wave: 0, pupil: 1,
};

// Inclinarse para tomar la lata del puf
const REACH = { headYaw: -0.45, headPitch: 0.36, headRoll: 0.05, gazeX: -0.8, gazeY: 0.75, leanZ: 0.12, swing: 0.15 };

// Gesto firma (unos 17 s, en bucle): mira alrededor, toma la lata y te la ofrece.
// cam: mira a la cámara · lock: no sigue el cursor · rt: objetivo de la mano derecha
// grip: sostiene la lata · bubble: texto de la burbuja · talk: segundos moviendo la boca
export const SEQ = [
  { d: 2.4, p: { headYaw: -0.38, headPitch: 0.3, headRoll: 0.07, gazeX: -0.75, gazeY: 0.7, smile: 0.4 } },
  { d: 2.2, p: { headYaw: 0.36, headPitch: -0.12, headRoll: -0.08, gazeX: 0.75, gazeY: -0.3, smile: 0.4, brow: 0.5 } },
  { d: 1.6, cam: true, p: { brow: 0.35, smile: 1, blush: 0.6, swing: 0.35 } },
  { d: 1.3, lock: true, rt: 'phone', p: REACH },
  { d: 0.5, lock: true, rt: 'phone', grip: 1, p: REACH },
  { d: 1.1, lock: true, rt: 'phone', grip: 1, p: { headYaw: -0.12, headPitch: 0.06, gazeX: -0.35, gazeY: 0.2, rShX: -1.2, rShZ: 0.12, rEl: -1.05, ikR: 0, swing: 0.2 } },
  { d: 4.4, cam: true, rt: 'phone', grip: 1, bubble: '¿Quieres una cocacolita? 🥤', talk: 1.3, at: 'phone', p: { rShX: -1.18, rShZ: 0.38, rEl: -0.3, ikR: 0, leanX: 0.12, happy: 0.85, blush: 0.75, swing: 0.55 } },
  { d: 1.3, lock: true, rt: 'phone', grip: 1, p: REACH },
  { d: 0.45, lock: true, rt: 'phone', p: REACH },
  { d: 1.8, cam: true, p: { smile: 0.7 } },
];
export const SEQ_TOTAL = SEQ.reduce((a, s) => a + s.d, 0);

// Reacciones puntuales (al tocarlo o desde la página)
export const REACTIONS = {
  saludar: { d: 2.6, bubble: '¡Hola! 👋', talk: 0.8, p: { lShX: -0.2, lShZ: 2.55, lEl: -0.55, ikL: 0, wave: 1, happy: 1, blush: 0.8, smile: 1, headRoll: -0.08 } },
  hablar: { d: 3.6, bubble: '😊', talk: 3.2, p: { smile: 0.7, brow: 0.3, lShX: -0.55, lShZ: 0.35, lEl: -0.9, ikL: 0 } },
  pensar: { d: 3.0, bubble: 'Mmm… 🤔', look: true, p: { headYaw: 0.28, headPitch: -0.22, headRoll: 0.16, gazeX: 0.7, gazeY: -0.85, brow: 1, tilt: 0.9, smile: 0.05, swing: 0.25 } },
  feliz: { d: 2.4, bubble: '¡Qué gusto verte! 😊', talk: 0.8, p: { happy: 1, blush: 1, smile: 1, swing: 1.6, brow: 0.5, leanX: -0.04 } },
};

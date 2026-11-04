// Paseo de Pipo (solo datos): baja del puf, camina, se cansa, vuelve, se sienta y se toma su gaseosa.
// Mismo formato que coreografia.js. Claves nuevas de esta parte:
//   stand  0 sentado · 1 de pie            walk   0 quieto · 1 caminando
//   rootX / rootZ  dónde está (x: derecha de la pantalla, z: hacia ti)   rootYaw  hacia dónde mira el cuerpo
//   rootY  saltito extra hacia arriba      crouch  se agacha (rodillas dobladas)
//   pant   jadea (respira rápido)          sip    inclina la lata hacia la boca
//   rt: 'rodillas'  apoya las manos en las rodillas
const DE_PIE = { stand: 1, swing: 0, ikR: 0, ikL: 0, rShX: -0.1, rShZ: -0.18, rEl: -0.35, lShX: -0.1, lShZ: 0.18, lEl: -0.35 };
const ENFRENTE = 0.47;                 // distancia delante del puf donde queda parado
const DESTINO = { rootX: 0.3, rootZ: 0.5 };
const VOLVER = { rootX: 0, rootZ: ENFRENTE };
const TOMAR = { rShX: -1.95, rShZ: 0.45, rEl: -0.75, ikR: 0 };
const ALCANZAR = { headYaw: -0.45, headPitch: 0.36, headRoll: 0.05, gazeX: -0.8, gazeY: 0.75, leanZ: 0.12, swing: 0.15 };

export const PASEO = [
  // Bajar del puf
  { d: 1.0, lock: true, bubble: '¡A estirar las piernas! 🦵', talk: 0.9, p: { rootZ: 0.32, swing: 0, headPitch: 0.25, gazeY: 0.6, smile: 0.8, ikR: 0, ikL: 0, rShZ: -0.5, lShZ: 0.5, rEl: -0.4, lEl: -0.4 } },
  { d: 0.75, lock: true, p: { ...DE_PIE, rootZ: ENFRENTE, rootY: 0.05, rShZ: -0.7, lShZ: 0.7, happy: 1, smile: 1 } },
  { d: 0.45, lock: true, p: { ...DE_PIE, rootZ: ENFRENTE, crouch: 0.35, smile: 1 } },
  // Girar y caminar hacia la derecha
  { d: 0.5, lock: true, p: { ...DE_PIE, rootZ: ENFRENTE, rootYaw: 1.0, headYaw: -0.35, gazeX: -0.6, smile: 0.9 } },
  { d: 2.4, lock: true, p: { ...DE_PIE, ...DESTINO, walk: 1, rootYaw: 1.0, headYaw: -0.3, gazeX: -0.5, smile: 0.9, blush: 0.5 } },
  // Se cansa: manos en las rodillas, jadea
  { d: 0.6, lock: true, p: { ...DE_PIE, ...DESTINO, rootYaw: -0.6, headYaw: 0.4, gazeX: 0.5, pant: 0.6, smile: 0.2, brow: 0.5 } },
  { d: 3.4, lock: true, rt: 'rodillas', bubble: '¡Uf! Me cansé 😮‍💨', talk: 0.6, p: { ...DE_PIE, ...DESTINO, rootYaw: -0.6, ikR: 1, ikL: 1, leanX: 0.75, crouch: 0.55, headPitch: -0.55, headYaw: 0.45, gazeX: 0.5, gazeY: -0.4, pant: 1, brow: 0.8, tilt: 0.6, smile: 0, blush: 0.9 } },
  // Vuelve al puf
  { d: 0.6, lock: true, p: { ...DE_PIE, ...DESTINO, rootYaw: -1.25, pant: 0.4, headYaw: 0.4, gazeX: 0.6, smile: 0.5 } },
  { d: 2.2, lock: true, p: { ...DE_PIE, ...VOLVER, walk: 0.85, rootYaw: -1.25, headYaw: 0.35, gazeX: 0.5, pant: 0.25, smile: 0.6 } },
  { d: 0.5, lock: true, p: { ...DE_PIE, ...VOLVER, rootYaw: 0, smile: 0.7 } },
  // Saltito para subir y sentarse
  { d: 0.4, lock: true, p: { ...DE_PIE, ...VOLVER, crouch: 0.6, rShX: 0.4, lShX: 0.4, smile: 0.8 } },
  { d: 0.5, lock: true, p: { ...DE_PIE, stand: 0, rootX: 0, rootZ: 0.2, rootY: 0.32, rShZ: -0.8, lShZ: 0.8, happy: 1 } },
  { d: 0.9, lock: true, p: { rootZ: 0, swing: 0.6, happy: 0.6, smile: 1, blush: 0.6 } },
  // Se toma su gaseosa
  { d: 1.2, cam: true, p: { smile: 0.8, swing: 0.8 } },
  { d: 1.3, lock: true, rt: 'phone', p: ALCANZAR },
  { d: 0.5, lock: true, rt: 'phone', grip: 1, p: ALCANZAR },
  { d: 1.0, lock: true, rt: 'phone', grip: 1, p: { ...TOMAR, headYaw: -0.2, headPitch: -0.1, gazeX: -0.6, swing: 0.3 } },
  { d: 2.0, lock: true, rt: 'phone', grip: 1, p: { ...TOMAR, sip: 1, headYaw: -0.3, headPitch: -0.25, happy: 1, blush: 0.8, swing: 0.2 } },
  { d: 2.0, cam: true, rt: 'phone', grip: 1, bubble: '¡Ahh, qué rica! 😋', talk: 0.9, p: { rShX: -1.15, rShZ: 0.3, rEl: -0.35, ikR: 0, happy: 1, blush: 0.9, smile: 1, swing: 1.2 } },
  { d: 1.3, lock: true, rt: 'phone', grip: 1, p: ALCANZAR },
  { d: 0.45, lock: true, rt: 'phone', p: ALCANZAR },
  { d: 1.4, cam: true, p: { smile: 0.7 } },
];

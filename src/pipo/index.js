// Pipo 3D: crea al personaje dentro de cualquier <canvas> (motor heredado de Basi).
//
//   import { crear } from './basi3d/index.js';
//   const pipo = crear({ canvas, burbuja });
//   pipo.decir('¡Hola!', 'saludar');
import * as THREE from 'three';
import { crearModelo } from './modelo.js';
import { crearEscena } from './escena.js';
import { crearCamara, ENCUADRES } from './camara.js';
import { crearCuerpo } from './cuerpo.js';
import { elegirSinRepetir, reaccionConTexto } from './frases.js';
import { REST, SEQ, SEQ_TOTAL, REACTIONS } from './coreografia.js';

export { REACTIONS, ENCUADRES };


class Spring {
  constructor(x, k = 55, z = 0.8) { this.x = x; this.v = 0; this.t = x; this.k = k; this.c = 2 * z * Math.sqrt(k); }
  step(dt) { this.v += (this.k * (this.t - this.x) - this.c * this.v) * dt; this.x += this.v * dt; }
}
const clamp = THREE.MathUtils.clamp;

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {HTMLElement} [o.burbuja]   globo de diálogo (mismo contenedor que el canvas)
 * @param {boolean} [o.orbitar]       permite girar la cámara con el mouse
 * @param {boolean} [o.seguirVentana] sigue el cursor en toda la ventana, no solo sobre el canvas
 * @param {boolean} [o.secuencia]     inicia el gesto firma en bucle (por defecto, sí)
 * @param {string|object} [o.encuadre] 'completo', 'escena', 'busto' o un objeto propio
 * @param {number} [o.sombra]         resolución del mapa de sombras
 * @param {boolean} [o.animar]        inicia el bucle de animación (por defecto, sí)
 * @param {string[]} [o.burbujaReacciones] reacciones que muestran su globo (por defecto, todas)
 * @param {string[]} [o.frasesCelular] frases al ofrecer la lata; una al azar en cada vuelta
 * @param {function} [o.fraseCelular]  (vuelta) => texto al ofrecer la lata en esa vuelta
 * @param {function} [o.alTocar]      se llama al hacer clic sobre el robot
 */
export function crear(o) {
  const canvas = o.canvas;
  const { renderer, scene } = crearEscena(canvas, o);

  const { camera, controls, fitCamera, resize, setEncuadre } = crearCamara(canvas, renderer, o.encuadre, o.orbitar);

  // Modelo
  const B = crearModelo(scene, renderer.capabilities.getMaxAnisotropy());
  const { head, phone, robotMeshes } = B;
  const listo = B.cargarLogo(o.logo);

  // Resortes
  const S = {};
  for (const k in REST) S[k] = new Spring(REST[k]);
  for (const k of ['gazeX', 'gazeY']) S[k] = new Spring(0, 170, 0.9);
  S.happy = new Spring(0, 40, 0.9);
  S.grip = new Spring(0, 150, 1);
  S.wave.k = 30;
  S.ikR.k = S.ikL.k = 30;

  const moverCuerpo = crearCuerpo(B);

  const state = {
    seqOn: o.secuencia !== false, seqT: 0, follow: true,
    reaction: null, reactionT: 0,
    pointer: new THREE.Vector2(), pointerT: -10,
    blinkNext: 1.5, blinkT: -1, doubleBlink: false,
    idleNext: 2, idleGaze: [0, 0],
    swingPhase: 0, time: 0,
    forzar: {},  // { open, talk }: fija párpado o boca (para capturas)
    frase: { vuelta: -1, texto: null },  // frase de la lata en la vuelta actual
    dicho: null,  // reacción armada por decir()
  };

  // Dirección (yaw/pitch) desde la cabeza hacia un punto del mundo
  const _hp = new THREE.Vector3(), _d = new THREE.Vector3();
  function lookAngles(target) {
    head.getWorldPosition(_hp);
    _d.subVectors(target, _hp);
    const yaw = clamp(Math.atan2(_d.x, _d.z), -0.75, 0.75);
    const pitch = clamp(-Math.atan2(_d.y, Math.hypot(_d.x, _d.z)), -0.5, 0.5);
    return { yaw, pitch };
  }
  const raycaster = new THREE.Raycaster();
  const _plane = new THREE.Plane(), _pp = new THREE.Vector3();
  function pointerTarget() {
    raycaster.setFromCamera(state.pointer, camera);
    head.getWorldPosition(_hp);
    _plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(_d).negate(), _hp.clone().addScaledVector(_d, 1.2));
    return raycaster.ray.intersectPlane(_plane, _pp) ? _pp : camera.position;
  }
  // Texto del globo de un paso: con frasesCelular, una distinta en cada vuelta de la secuencia
  // (o con fraseCelular(vuelta), una función que devuelve el texto de cada vuelta)
  function fraseDelPaso(s) {
    if (s.at !== 'phone' || (!o.frasesCelular?.length && !o.fraseCelular)) return s.bubble;
    const vuelta = Math.floor(state.seqT / SEQ_TOTAL);
    if (state.frase.vuelta !== vuelta) {
      const texto = o.fraseCelular ? o.fraseCelular(vuelta) : elegirSinRepetir(o.frasesCelular, state.frase.texto);
      state.frase = { vuelta, texto: texto || s.bubble };
    }
    return state.frase.texto;
  }
  function currentStep() {
    let t = state.seqT % SEQ_TOTAL;
    for (const s of SEQ) { if (t < s.d) return { s, t }; t -= s.d; }
    return { s: SEQ[0], t: 0 };
  }

  const bubbleEl = o.burbuja || null;
  let bubbleText = '';
  function showBubble(text) {
    if (!bubbleEl) return;
    if (text && text !== bubbleText) bubbleEl.textContent = text;
    bubbleText = text || bubbleText;
    bubbleEl.classList.toggle('ver', !!text);
  }

  const _off = new THREE.Vector3(), _anchor = new THREE.Vector3();

  function update(dt) {
    state.time += dt;
    const T = state.time;
    const tgt = { ...REST };
    let grip = 0, bubble = null, talk = 0, wantCam = false, lock = false, at = 'head', rt = 'rest';

    // 1) Coreografía principal
    if (state.seqOn) {
      state.seqT += dt;
      const { s, t } = currentStep();
      Object.assign(tgt, s.p);
      grip = s.grip || 0;
      rt = s.rt || 'rest';
      lock = !!s.lock;
      wantCam = !!s.cam;
      if (s.bubble && t > 0.25) { bubble = fraseDelPaso(s); at = s.at || 'head'; }
      if (s.talk && t > 0.25 && t < 0.25 + s.talk) talk = 1;
    } else {
      if (T > state.idleNext) {
        state.idleNext = T + 2.5 + Math.random() * 3.5;
        state.idleGaze = Math.random() < 0.45 ? [0, 0] : [(Math.random() * 2 - 1) * 0.6, (Math.random() * 2 - 1) * 0.5];
      }
      wantCam = true;
      tgt.gazeX = state.idleGaze[0]; tgt.gazeY = state.idleGaze[1];
    }

    // 2) Reacciones
    if (state.reaction) {
      const r = state.reaction === 'decir' ? state.dicho : REACTIONS[state.reaction];
      state.reactionT += dt;
      if (state.reactionT > r.d) state.reaction = null;
      else {
        for (const k in r.p) if (!(lock && /^r|^lean|^head|^gaze/.test(k))) tgt[k] = r.p[k];
        if (!r.look && !lock) wantCam = true;
        if (r.look) wantCam = false;
        bubble = r.siempreBurbuja || !o.burbujaReacciones || o.burbujaReacciones.includes(state.reaction) ? r.bubble : bubble; at = 'head';
        if (r.talk && state.reactionT < r.talk) talk = 1;
      }
    }

    // 3) Mirada: cámara o cursor
    const pointerActive = state.follow && T - state.pointerT < 2.6;
    if (!lock && (pointerActive || wantCam)) {
      const { yaw, pitch } = lookAngles(pointerActive ? pointerTarget() : camera.position);
      const keepGaze = !pointerActive && (tgt.gazeX || tgt.gazeY);
      tgt.headYaw = yaw * 0.85; tgt.headPitch = pitch * 0.8;
      if (!keepGaze) { tgt.gazeX = clamp(yaw * 1.4, -1, 1); tgt.gazeY = clamp(pitch * 1.8, -1, 1); }
      if (state.reaction === 'pensar') { tgt.headRoll = REACTIONS.pensar.p.headRoll; }
    }

    for (const k in tgt) if (S[k]) S[k].t = tgt[k];
    S.grip.t = grip;
    const sub = 3, h = dt / sub;
    for (let i = 0; i < sub; i++) for (const k in S) S[k].step(h);
    const P = (k) => S[k].x;

    moverCuerpo(P, S, state, { dt, T, rt, talk });

    // Burbuja de diálogo (posición relativa al canvas)
    showBubble(bubble);
    if (bubble && bubbleEl) {
      // En pantallas angostas el globo de la lata taparía la cara: va arriba, como los demás
      const side = at === 'phone' && canvas.clientWidth >= 560 ? -1 : 1;
      if (side < 0) _anchor.copy(phone.position).add(_off.set(-0.1, 0.16, 0));
      else head.localToWorld(_anchor.set(0.36, 0.56, 0));
      _anchor.project(camera);
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const x = (_anchor.x * 0.5 + 0.5) * W + canvas.offsetLeft, y = (-_anchor.y * 0.5 + 0.5) * H + canvas.offsetTop;
      const bw = bubbleEl.offsetWidth;
      bubbleEl.classList.toggle('izq', side < 0);
      const left = Math.min(Math.max(8, side > 0 ? x - 24 : x - bw + 24), W - bw - 8);
      bubbleEl.style.transform = `translate(${left}px, ${Math.max(4, y - bubbleEl.offsetHeight - 12)}px)`;
    }
  }

  // ── Interacción
  function setPointerFromClient(cx, cy) {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    state.pointer.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    state.pointerT = state.time;
  }
  const onMove = (e) => {
    setPointerFromClient(e.clientX, e.clientY);
    raycaster.setFromCamera(state.pointer, camera);
    if (e.target === canvas) canvas.style.cursor = raycaster.intersectObjects(robotMeshes, false).length ? 'pointer' : (controls ? 'grab' : 'default');
  };
  const moveTarget = o.seguirVentana ? window : canvas;
  moveTarget.addEventListener('pointermove', onMove, { passive: true });
  let downAt = null;
  const onDown = (e) => { downAt = [e.clientX, e.clientY]; };
  const onUp = (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    setPointerFromClient(e.clientX, e.clientY);
    raycaster.setFromCamera(state.pointer, camera);
    if (raycaster.intersectObjects(robotMeshes, false).length) {
      react(Math.random() < 0.5 ? 'saludar' : 'feliz');
      if (o.alTocar) o.alTocar();
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  function react(name) { if (REACTIONS[name]) { state.reaction = name; state.reactionT = 0; } }
  /** Dice un texto en el globo con el gesto indicado ('hablar', 'saludar', 'feliz', 'pensar'). */
  function decir(texto, gesto = 'hablar', segundos) {
    if (!texto) return;
    state.dicho = reaccionConTexto(texto, gesto, segundos);
    state.reaction = 'decir'; state.reactionT = 0;
  }

  // ── Tamaño y cámara
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  fitCamera(true);

  // ── Bucle
  const clock = new THREE.Clock();
  let corriendo = false;
  function frame() {
    resize();
    const dt = Math.min(clock.getDelta(), 1 / 20);
    update(dt);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  function reanudar() { if (corriendo) return; corriendo = true; clock.getDelta(); renderer.setAnimationLoop(frame); }
  function pausar() { corriendo = false; renderer.setAnimationLoop(null); }
  if (o.animar !== false) reanudar();

  /**
   * Deja a Pipo en una pose fija y devuelve una imagen (para íconos).
   * @param {object} p { reaccion, segundos, mirar: [x, y] en coordenadas -1..1, abrir, hablar,
   *                    continuar (sigue desde la pose anterior), tipo, calidad }
   */
  function posar(p = {}) {
    pausar();
    if (!p.continuar) {
      state.seqOn = false;
      state.blinkNext = Infinity; state.blinkT = -1;
      state.idleNext = Infinity; state.idleGaze = [0, 0];
      state.reaction = null;
      if (p.reaccion) react(p.reaccion);
    }
    state.forzar = { open: p.abrir ?? 1, talk: p.hablar ?? 0 };
    const pasos = Math.round((p.segundos ?? 2) * 60);
    for (let i = 0; i < pasos; i++) {
      if (p.mirar) { state.pointer.set(p.mirar[0], p.mirar[1]); state.pointerT = state.time; }
      update(1 / 60);
    }
    renderer.render(scene, camera);
    return canvas.toDataURL(p.tipo || 'image/png', p.calidad ?? 0.92);
  }

  function destruir() {
    pausar();
    ro.disconnect();
    moveTarget.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    if (controls) controls.dispose();
    renderer.dispose();
  }

  return {
    listo, state, S, react, decir, posar, pausar, reanudar, destruir,
    setTheme: B.setTheme,
    setSecuencia(on) { state.seqOn = on; if (on) state.seqT = 0; },
    setSeguir(on) { state.follow = on; },
    setEncuadre,
    centrar() { fitCamera(true); },
    camera, controls, renderer, partes: B,
  };
}

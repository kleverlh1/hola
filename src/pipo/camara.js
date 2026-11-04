// Cámara de Pipo: encuadres, ajuste al tamaño del canvas y giro opcional con el mouse.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Encuadres de cámara: punto que mira (objetivo) y medio alto / medio ancho visibles
export const ENCUADRES = {
  completo: { objetivo: [0, 0.4, 0], alto: 1.55, ancho: 1.2 },
  escena: { objetivo: [-0.12, 0.6, 0], alto: 1.12, ancho: 1.25 },
  busto: { objetivo: [0.06, 1.12, 0], alto: 0.74, ancho: 0.9 },
};
const CAM_DIR = new THREE.Vector3(0, 0.07, 1).normalize();

/**
 * @param {HTMLCanvasElement} canvas
 * @param {THREE.WebGLRenderer} renderer
 * @param {string|object} [encuadreInicial] 'completo', 'escena', 'busto' o un objeto propio
 * @param {boolean} [orbitar] permite girar la cámara con el mouse
 */
export function crearCamara(canvas, renderer, encuadreInicial, orbitar) {
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  let encuadre = typeof encuadreInicial === 'object' ? encuadreInicial : ENCUADRES[encuadreInicial || 'completo'];

  let controls = null;
  if (orbitar) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2.6;
    controls.maxDistance = 10;
    controls.minPolarAngle = 0.75;
    controls.maxPolarAngle = 1.78;
  }

  const _target = new THREE.Vector3();
  function fitCamera(reset) {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    const aspect = W / H;
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max(encuadre.alto / Math.tan(half), encuadre.ancho / Math.tan(half) / aspect);
    _target.set(...encuadre.objetivo);
    if (reset || !controls) {
      camera.position.copy(_target).addScaledVector(CAM_DIR, dist);
      if (controls) controls.target.copy(_target);
      camera.lookAt(_target);
    } else {
      const dir = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(dir, dist);
    }
  }
  let lastW = 0, lastH = 0;
  function resize() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H || (W === lastW && H === lastH)) return;
    lastW = W; lastH = H;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    fitCamera(!controls);
  }

  function setEncuadre(e) { encuadre = typeof e === 'object' ? e : ENCUADRES[e]; fitCamera(true); }

  return { camera, controls, fitCamera, resize, setEncuadre };
}

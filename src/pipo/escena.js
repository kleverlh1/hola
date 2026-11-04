// Escena de Pipo: render, ambiente y luces. Separado para que index.js solo coordine.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Crea el renderizador (fondo transparente) y la escena iluminada. */
export function crearEscena(canvas, o) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!o.capturas });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  // Luces
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(2.2, 4.2, 3.6);
  key.castShadow = true;
  const sm = o.sombra || 2048;
  key.shadow.mapSize.set(sm, sm);
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.4, bottom: -1.2, near: 0.5, far: 12 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf2e6d6, 0.75));
  const rim = new THREE.DirectionalLight(0xbfdcff, 1.6);
  rim.position.set(-3, 2.6, -3.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff1e6, 0.5);
  fill.position.set(-3, 1, 3);
  scene.add(fill);

  return { renderer, scene };
}

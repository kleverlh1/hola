// Construye a Pipo, su puf y su lata de gaseosa dentro de una escena.
import * as THREE from 'three';
import { mesh, cap, sph, tor, rbox, HEAD, superEllipsoid, visorGeometry, bezelGeometry, puck } from './geometria.js';
import { crearCara } from './cara.js';

export const FLOOR_Y = -0.48;
export const SEAT_Y = FLOOR_Y + 0.48; // = 0, la parte de arriba del puf
export const LATA = { r: 0.072, alto: 0.25 };
// Azul cielo: el color preferido en casi todos los países; transmite confianza y calma.
export const COLOR = 0x3d8fe0;

const hsl = (h, s, l) => `hsl(${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;

export function crearModelo(scene, maxAniso) {
  // ── Materiales
  const M = {
    shell: new THREE.MeshPhysicalMaterial({
      color: 0xf5efe6, roughness: 0.36, clearcoat: 0.85, clearcoatRoughness: 0.22,
      sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff),
    }),
    purple: new THREE.MeshPhysicalMaterial({ color: 0x6a2c9e, roughness: 0.34, clearcoat: 0.75, clearcoatRoughness: 0.18 }),
    lilac: new THREE.MeshPhysicalMaterial({ color: 0xb27ee6, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.12 }),
    joint: new THREE.MeshPhysicalMaterial({ color: 0x9c98a6, roughness: 0.42, metalness: 0.25, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    lata: new THREE.MeshPhysicalMaterial({ roughness: 0.28, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.25, metalness: 0.9 }),
    puf: new THREE.MeshPhysicalMaterial({ color: 0xf7d36f, roughness: 0.9, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xfff1c9) }),
    costura: new THREE.MeshPhysicalMaterial({ color: 0xe0a93e, roughness: 0.7, sheen: 0.6, sheenColor: new THREE.Color(0xffe6a8) }),
  };
  const cara = crearCara(maxAniso);
  const theme = {};

  // ── Puf (asiento): un cojín grande y mullido, con botones de tapicería
  const puf = new THREE.Group();
  scene.add(puf);
  {
    const alto = SEAT_Y - FLOOR_Y;
    mesh(rbox(1.42, alto, 0.8, 0.15, 8), M.puf, puf, [0, FLOOR_Y + alto / 2, -0.15]);
    for (const [x, z] of [[-0.34, -0.36], [0.34, -0.36], [-0.55, 0.08], [0.55, 0.08]]) {
      mesh(sph(0.03), M.costura, puf, [x, SEAT_Y - 0.008, z], null, [1, 0.45, 1]);
    }
  }

  // ── Suelo: sombra real + mancha suave
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  scene.add(floor);
  {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(30,50,90,0.3)'); g.addColorStop(1, 'rgba(30,50,90,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(0, FLOOR_Y + 0.002, -0.12);
    scene.add(blob);
  }

  // ── Robot
  const robot = new THREE.Group();
  robot.position.y = SEAT_Y;
  scene.add(robot);

  const body = new THREE.Group();
  body.position.set(0, 0.08, 0);
  robot.add(body);
  mesh(rbox(0.66, 0.56, 0.44, 0.15, 6), M.purple, body, [0, 0.27, 0]);
  mesh(rbox(0.34, 0.28, 0.06, 0.028, 4), M.shell, body, [0, 0.3, -0.212]);
  mesh(sph(0.032), M.lilac, body, [0, 0.3, -0.245], null, [1, 1, 0.5]);
  mesh(tor(0.14, 0.045), M.purple, body, [0, 0.56, 0], [Math.PI / 2, 0, 0]);

  // Botoncito en el pecho
  mesh(puck(0.07, 0.03, 0.012), M.shell, body, [0, 0.3, 0.215], [Math.PI / 2, 0, 0]);
  mesh(sph(0.045), M.lilac, body, [0, 0.3, 0.232], null, [1, 1, 0.45]);

  const neck = new THREE.Group();
  neck.position.set(0, 0.56, 0);
  body.add(neck);
  mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.14, 32), M.joint, neck, [0, 0.05, 0]);

  const head = new THREE.Group();
  head.position.set(0, 0.52, 0);
  head.rotation.order = 'YXZ';
  neck.add(head);
  mesh(superEllipsoid(HEAD), M.shell, head);
  mesh(visorGeometry(), cara.material, head);
  mesh(bezelGeometry(), M.shell, head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * (HEAD.a - 0.025), -0.03, 0);
    ear.rotation.z = -s * Math.PI / 2;
    head.add(ear);
    mesh(puck(0.175, 0.05, 0.03), M.shell, ear, [0, 0.03, 0]);
    mesh(tor(0.132, 0.034), M.purple, ear, [0, 0.085, 0], [Math.PI / 2, 0, 0]);
    mesh(sph(1), M.lilac, ear, [0, 0.082, 0], null, [0.105, 0.04, 0.105]);
  }

  function makeArm(s) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.395, 0.45, 0);
    body.add(sh);
    mesh(sph(0.105), M.shell, sh);
    mesh(cap(0.078, 0.12), M.shell, sh, [0, -0.13, 0]);
    const el = new THREE.Group();
    el.position.y = -0.26;
    sh.add(el);
    mesh(sph(0.066), M.joint, el);
    mesh(cap(0.074, 0.1), M.shell, el, [0, -0.11, 0]);
    mesh(tor(0.074, 0.026), M.purple, el, [0, -0.19, 0], [Math.PI / 2, 0, 0]);
    const hand = new THREE.Group();
    hand.position.y = -0.215;
    el.add(hand);
    mesh(sph(1), M.shell, hand, [0, -0.07, 0.005], null, [0.074, 0.088, 0.064]);
    mesh(cap(0.029, 0.04), M.shell, hand, [0, -0.045, 0.062], [0.75, 0, 0]);
    return { sh, el, hand };
  }
  const armR = makeArm(-1), armL = makeArm(1);

  function makeLeg(s) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.165, 0.1, 0.03);
    robot.add(hip);
    mesh(sph(0.1), M.joint, hip);
    mesh(cap(0.098, 0.12), M.shell, hip, [0, -0.13, 0]);
    const knee = new THREE.Group();
    knee.position.y = -0.28;
    hip.add(knee);
    mesh(sph(0.085), M.joint, knee);
    mesh(cap(0.092, 0.1), M.shell, knee, [0, -0.11, 0]);
    mesh(tor(0.097, 0.031), M.purple, knee, [0, -0.205, 0], [Math.PI / 2, 0, 0]);
    const foot = new THREE.Group();
    foot.position.y = -0.235;
    knee.add(foot);
    mesh(rbox(0.235, 0.15, 0.33, 0.07, 6), M.shell, foot, [0, -0.07, 0.045]);
    mesh(rbox(0.25, 0.055, 0.345, 0.026, 4), M.purple, foot, [0, -0.142, 0.045]);
    return { hip, knee, foot };
  }
  const legR = makeLeg(-1), legL = makeLeg(1);

  const robotMeshes = [];
  robot.traverse((o) => o.isMesh && robotMeshes.push(o));

  // ── Lata de gaseosa (roja, sin marcas). Se llama «phone» en el motor porque ocupa su lugar.
  const phone = new THREE.Group();
  scene.add(phone);
  {
    const LW = 512, LH = 256;
    const c = document.createElement('canvas'); c.width = LW; c.height = LH;
    const x = c.getContext('2d');
    x.fillStyle = '#d7192a'; x.fillRect(0, 0, LW, LH);
    // Franja blanca ondulada y burbujitas
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(0, 150);
    for (let i = 0; i <= LW; i += 8) x.lineTo(i, 150 + 18 * Math.sin((i / LW) * Math.PI * 4));
    for (let i = LW; i >= 0; i -= 8) x.lineTo(i, 172 + 14 * Math.sin((i / LW) * Math.PI * 4 + 0.6));
    x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [bx, by, br] of [[214, 78, 13], [246, 52, 8], [270, 86, 10], [298, 60, 6], [232, 104, 6]]) { x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill(); }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    M.lata.map = tex;
    const cuerpoLata = new THREE.CylinderGeometry(LATA.r, LATA.r, LATA.alto - 0.03, 40, 1, true);
    cuerpoLata.rotateY(Math.PI); // el centro de la etiqueta mira al frente
    mesh(cuerpoLata, M.lata, phone);
    for (const s of [1, -1]) {
      mesh(new THREE.CylinderGeometry(s > 0 ? LATA.r * 0.84 : LATA.r, s > 0 ? LATA.r : LATA.r * 0.84, 0.015, 40), M.metal, phone, [0, s * (LATA.alto / 2 - 0.0075), 0]);
    }
    mesh(tor(LATA.r * 0.82, 0.006), M.metal, phone, [0, LATA.alto / 2, 0], [Math.PI / 2, 0, 0]);
  }

  // ── Tema de color: cambia el cuerpo y la cara
  function setTheme(hex) {
    const col = new THREE.Color(hex);
    const h = {};
    col.getHSL(h);
    M.purple.color.copy(col);
    M.lilac.color.setHSL(h.h, Math.min(1, h.s * 0.85), Math.min(0.78, h.l + 0.3));
    theme.base = '#' + col.getHexString();
    theme.faceDark = hsl(h.h, h.s * 0.85, h.l * 0.4);
    theme.faceLight = hsl(h.h, h.s * 0.8, h.l * 0.8);
    theme.irisDark = hsl(h.h, h.s, h.l * 0.3);
    theme.irisLight = hsl(h.h, h.s * 0.9, Math.min(0.76, h.l + 0.27));
  }
  setTheme(COLOR);

  // La lata descansa de pie sobre el puf, junto a la mano derecha
  const PHONE_REST_POS = new THREE.Vector3(-0.5, SEAT_Y + LATA.alto / 2, -0.2);
  const PHONE_REST_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.3, 0));
  const PHONE_UP_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0.15, 0.1));
  // Al tomar: la lata se inclina hacia la boca (el robot la sostiene con la mano derecha, a su lado)
  const PHONE_SIP_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0, -1.25));
  phone.position.copy(PHONE_REST_POS);
  phone.quaternion.copy(PHONE_REST_Q);

  return {
    M, theme, cara, robot, body, neck, head, armR, armL, legR, legL, phone, robotMeshes,
    PHONE_REST_POS, PHONE_REST_Q, PHONE_UP_Q, PHONE_SIP_Q, setTheme,
    cargarLogo: () => Promise.resolve(),
  };
}

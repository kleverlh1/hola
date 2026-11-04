// Formas base del robot: casco, visor, borde del visor, auriculares y utilidades.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mesh(geo, mat, parent, pos, rot, scl) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scl) Array.isArray(scl) ? m.scale.set(...scl) : m.scale.setScalar(scl);
  parent.add(m);
  return m;
}
export const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 10, 28);
export const sph = (r) => new THREE.SphereGeometry(r, 40, 28);
export const tor = (R, r) => new THREE.TorusGeometry(R, r, 18, 48);
export const rbox = (w, h, d, r, s = 5) => new RoundedBoxGeometry(w, h, d, s, r);

// Superelipsoide |x/a|^p + |y/b|^p + |z/c|^p = 1 → casco «cuadrado-redondo» de juguete
export const HEAD = { a: 0.6, b: 0.5, c: 0.5, p: 2.6 };
export function superEllipsoid({ a, b, c, p }, ws = 128, hs = 96) {
  const g = new THREE.SphereGeometry(1, ws, hs);
  const pos = g.attributes.position, nor = g.attributes.normal;
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const pw = (x, d) => Math.pow(Math.abs(x / d), p);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const t = Math.pow(pw(v.x, a) + pw(v.y, b) + pw(v.z, c), -1 / p);
    const x = v.x * t, y = v.y * t, z = v.z * t;
    pos.setXYZ(i, x, y, z);
    n.set(
      Math.sign(x) * Math.pow(Math.abs(x / a), p - 1) / a,
      Math.sign(y) * Math.pow(Math.abs(y / b), p - 1) / b,
      Math.sign(z) * Math.pow(Math.abs(z / c), p - 1) / c,
    ).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}
function headZ(x, y) {
  const { a, b, c, p } = HEAD;
  const s = 1 - Math.pow(Math.abs(x / a), p) - Math.pow(Math.abs(y / b), p);
  return c * Math.pow(Math.max(s, 0), 1 / p);
}

// Visor: rejilla con contorno de «squircle» pegada a la curvatura del casco
const VISOR = { w: 0.9, h: 0.68, y: -0.035, k: 0.5 };
function visorPoint(s, t, off) {
  const lerp = (a, b, f) => a + (b - a) * f;
  const x0 = s * lerp(1, Math.sqrt(1 - (t * t) / 2), VISOR.k);
  const y0 = t * lerp(1, Math.sqrt(1 - (s * s) / 2), VISOR.k);
  const x = (x0 * VISOR.w) / 2, y = (y0 * VISOR.h) / 2 + VISOR.y;
  return { x, y, z: headZ(x, y) + off, u: (x0 + 1) / 2, v: (y0 + 1) / 2 };
}
export function visorGeometry(seg = 64) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= seg; j++) for (let i = 0; i <= seg; i++) {
    const p = visorPoint((i / seg) * 2 - 1, (j / seg) * 2 - 1, 0.006);
    pos.push(p.x, p.y, p.z); uv.push(p.u, p.v);
  }
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
    const a = j * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function bezelGeometry(seg = 48) {
  const pts = [];
  const add = (s, t) => { const p = visorPoint(s, t, 0.004); pts.push(new THREE.Vector3(p.x, p.y, p.z)); };
  for (let i = 0; i < seg; i++) add(-1 + (2 * i) / seg, -1);
  for (let j = 0; j < seg; j++) add(1, -1 + (2 * j) / seg);
  for (let i = 0; i < seg; i++) add(1 - (2 * i) / seg, 1);
  for (let j = 0; j < seg; j++) add(-1, 1 - (2 * j) / seg);
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 320, 0.026, 14, true);
}
// Disco redondeado (auriculares) a partir de un perfil girado
export function puck(R, h, bev) {
  const pts = [new THREE.Vector2(0, -h)];
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(R - bev + Math.cos(a) * bev, -h + bev + Math.sin(a) * bev)); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(R - bev + Math.cos(a) * bev, h - bev + Math.sin(a) * bev)); }
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 56);
}

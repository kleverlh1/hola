// La cara de Pipo: una pantalla dibujada en un canvas que se usa como textura del visor.
import * as THREE from 'three';

const FW = 1024, FH = 768;
const LIGHT = '#f6fbff';

/**
 * Crea la pantalla de la cara.
 * dibujar(F, theme) recibe el estado de la expresión:
 *   gx, gy (mirada), open (párpado), happy, brow, tilt, smile, blush, talk, pupil
 */
export function crearCara(maxAniso = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = FW; canvas.height = FH;
  const fx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  const material = new THREE.MeshPhysicalMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.42,
    roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04,
  });

  const ell = (cx, cy, rx, ry) => { fx.beginPath(); fx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2); };

  function drawEye(cx, cy, rx, ry, F, theme) {
    const a = 1 - F.happy;
    if (a > 0.01) {
      fx.save();
      fx.globalAlpha = a;
      fx.translate(cx, cy);
      fx.scale(1, Math.max(0.07, F.open));
      ell(0, 0, rx, ry); fx.fillStyle = LIGHT; fx.fill();
      fx.save();
      ell(0, 0, rx * 0.965, ry * 0.965); fx.clip();
      const ix = F.gx * rx * 0.3, iy = F.gy * ry * 0.27, irx = rx * 0.78, iry = ry * 0.8;
      const g = fx.createLinearGradient(0, iy - iry, 0, iy + iry);
      g.addColorStop(0, theme.irisDark); g.addColorStop(0.5, theme.irisDark); g.addColorStop(1, theme.irisLight);
      ell(ix, iy, irx, iry); fx.fillStyle = g; fx.fill();
      ell(ix, iy + ry * 0.04, rx * 0.42 * F.pupil, ry * 0.45 * F.pupil); fx.fillStyle = 'rgba(4,12,28,0.92)'; fx.fill();
      fx.lineWidth = 7; fx.strokeStyle = 'rgba(255,255,255,0.14)'; ell(ix, iy, irx - 4, iry - 4); fx.stroke();
      fx.fillStyle = '#fff';
      ell(ix - rx * 0.27, iy - ry * 0.3, rx * 0.24, ry * 0.22); fx.fill();
      ell(ix + rx * 0.3, iy + ry * 0.33, rx * 0.09, ry * 0.085); fx.fill();
      fx.restore();
      fx.restore();
    }
    if (F.happy > 0.01) {
      fx.save();
      fx.globalAlpha = F.happy;
      fx.lineCap = 'round'; fx.lineWidth = 36; fx.strokeStyle = LIGHT;
      fx.beginPath();
      fx.moveTo(cx - rx * 0.72, cy + ry * 0.22);
      fx.quadraticCurveTo(cx, cy - ry * 0.8, cx + rx * 0.72, cy + ry * 0.22);
      fx.stroke();
      fx.restore();
    }
  }

  function dibujar(F, theme) {
    const bg = fx.createRadialGradient(FW / 2, FH * 0.36, 40, FW / 2, FH * 0.5, FW * 0.64);
    bg.addColorStop(0, theme.faceLight); bg.addColorStop(1, theme.faceDark);
    fx.fillStyle = bg; fx.fillRect(0, 0, FW, FH);

    if (F.blush > 0.01) for (const s of [-1, 1]) {
      const bx = FW / 2 + s * 350, by = 500;
      const g = fx.createRadialGradient(bx, by, 0, bx, by, 95);
      g.addColorStop(0, `rgba(255,128,180,${0.5 * F.blush})`); g.addColorStop(1, 'rgba(255,128,180,0)');
      fx.fillStyle = g; fx.fillRect(bx - 95, by - 95, 190, 190);
    }

    const cy = 340, ex = 218, rx = 134, ry = 150;
    for (const s of [-1, 1]) drawEye(FW / 2 + s * ex, cy, rx, ry, F, theme);

    // Cejas
    fx.lineCap = 'round'; fx.strokeStyle = LIGHT; fx.lineWidth = 22;
    for (const s of [-1, 1]) {
      fx.save();
      fx.translate(FW / 2 + s * ex, cy - ry - 46 - F.brow * 30 + F.happy * 18);
      fx.rotate(s * F.tilt * 0.38);
      fx.beginPath(); fx.moveTo(-68, 12); fx.quadraticCurveTo(0, -24, 68, 12); fx.stroke();
      fx.restore();
    }

    // Boca
    const mx = FW / 2, my = 565;
    const open = Math.max(F.talk, F.happy * 0.42);
    if (open > 0.04) {
      const w = 92 + F.smile * 18, h = 22 + open * 92;
      fx.beginPath();
      fx.moveTo(mx - w, my - 6);
      fx.quadraticCurveTo(mx, my + 12, mx + w, my - 6);
      fx.quadraticCurveTo(mx + w * 0.82, my + h, mx, my + h);
      fx.quadraticCurveTo(mx - w * 0.82, my + h, mx - w, my - 6);
      fx.closePath();
      fx.fillStyle = '#0b1f3a'; fx.fill();
      fx.save(); fx.clip();
      ell(mx, my + h + 4, w * 0.58, h * 0.5); fx.fillStyle = '#ff7eae'; fx.fill();
      fx.restore();
      fx.lineWidth = 10; fx.lineJoin = 'round'; fx.strokeStyle = LIGHT; fx.stroke();
    } else {
      const w = 72 + F.smile * 30, c = 16 + F.smile * 34;
      fx.lineWidth = 21; fx.strokeStyle = LIGHT;
      fx.beginPath(); fx.moveTo(mx - w, my); fx.quadraticCurveTo(mx, my + c * 2, mx + w, my); fx.stroke();
    }
    tex.needsUpdate = true;
  }

  return { canvas, tex, material, dibujar };
}

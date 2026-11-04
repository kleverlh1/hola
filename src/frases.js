// Elige qué dice Pipo: según la hora, el día y lo que ya dijo (no repite hasta agotar las frases).
// Lo que ya dijo se guarda en el celular de cada persona (localStorage); nada sale a internet.

const CLAVE_DICHAS = 'pipo.dichas';
const CLAVE_VISITAS = 'pipo.visitas';
export const PRIMERA_LATA = '¿Quieres una cocacolita? 🥤';
const GENERALES = ['animo', 'carino', 'humor'];

/** localStorage que no falla (modo privado, sitio bloqueado…): si no hay, recuerda solo en memoria. */
export function almacenSeguro() {
  const memoria = new Map();
  return {
    leer(k) { try { return localStorage.getItem(k); } catch { return memoria.get(k) ?? null; } },
    guardar(k, v) { try { localStorage.setItem(k, v); } catch { memoria.set(k, v); } },
  };
}

/** Qué franja del día es: mañana (5–12), tarde (12–19) o noche (19–5). */
export function franja(fecha) {
  const h = fecha.getHours();
  return h >= 5 && h < 12 ? 'manana' : h >= 12 && h < 19 ? 'tarde' : 'noche';
}

/** Categoría especial del día, si la hay: lunes, viernes o fin de semana. */
export function categoriaDelDia(fecha) {
  const d = fecha.getDay();
  return d === 1 ? 'lunes' : d === 5 ? 'viernes' : d === 0 || d === 6 ? 'finde' : null;
}

/**
 * @param {Record<string, string[]>} F  frases por categoría
 * @param {object} [o]
 * @param {() => Date} [o.ahora]
 * @param {() => number} [o.azar]
 * @param {{ leer(k: string): string | null, guardar(k: string, v: string): void }} [o.almacen]
 */
export function crearFrases(F, { ahora = () => new Date(), azar = Math.random, almacen = almacenSeguro() } = {}) {
  let dichas;
  try { dichas = new Set(JSON.parse(almacen.leer(CLAVE_DICHAS) || '[]')); } catch { dichas = new Set(); }

  const visitas = (Number(almacen.leer(CLAVE_VISITAS)) || 0) + 1;
  almacen.guardar(CLAVE_VISITAS, String(visitas));

  /** Una frase al azar de esas categorías que no haya dicho todavía (si ya dijo todas, empieza de nuevo). */
  function de(categorias) {
    const todas = categorias.flatMap((c) => F[c] ?? []);
    if (!todas.length) return null;
    let quedan = todas.filter((f) => !dichas.has(f));
    if (!quedan.length) { for (const f of todas) dichas.delete(f); quedan = todas; }
    const f = quedan[Math.floor(azar() * quedan.length)];
    dichas.add(f);
    almacen.guardar(CLAVE_DICHAS, JSON.stringify([...dichas]));
    return f;
  }

  /** Una frase cualquiera: casi siempre ánimo, cariño o humor; a veces de la hora o del día. */
  function cualquiera() {
    const fecha = ahora(), r = azar(), dia = categoriaDelDia(fecha);
    if (r < 0.15) return de([franja(fecha)]) ?? de(GENERALES);
    if (r < 0.23 && dia) return de([dia]) ?? de(GENERALES);
    return de(GENERALES);
  }

  return {
    visitas,
    primeraVisita: visitas === 1,
    cualquiera,
    /** Saludo al abrir la página. */
    saludo: () => (visitas === 1 ? '¡Hola! 👋' : de(['regreso']) ?? '¡Hola otra vez! 👋'),
    /** Lo que dice al ofrecer la lata en cada vuelta. La primera vez de todas, la pregunta clásica. */
    lata(vuelta) {
      if (visitas === 1 && vuelta === 0) return PRIMERA_LATA;
      return azar() < 0.3 ? de(['cocacolita']) ?? PRIMERA_LATA : cualquiera();
    },
  };
}

/** Convierte el texto de un archivo de frases en una lista (sin vacías ni comentarios #). */
export function leerLista(texto) {
  return texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

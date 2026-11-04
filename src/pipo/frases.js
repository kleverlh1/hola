// Frases de Pipo: elegir una al azar sin repetir la anterior y armar una reacción
// que diga un texto con el gesto de otra (saludar, hablar, feliz, pensar).
import { REACTIONS } from './coreografia.js';

/** Una frase al azar de la lista, distinta de la anterior (si hay más de una). */
export function elegirSinRepetir(lista, anterior) {
  if (!lista?.length) return null;
  if (lista.length === 1) return lista[0];
  let f;
  do { f = lista[Math.floor(Math.random() * lista.length)]; } while (f === anterior);
  return f;
}

/**
 * Reacción que dice `texto` con el gesto de `gesto`. Si no se indica, la duración
 * depende del largo del texto (para que se alcance a leer).
 */
export function reaccionConTexto(texto, gesto = 'hablar', segundos) {
  const base = REACTIONS[gesto] ?? REACTIONS.hablar;
  const d = segundos ?? Math.min(6, Math.max(base.d, 1.6 + texto.length * 0.055));
  const talk = base.talk ? Math.min(d - 0.8, 0.8 + texto.length * 0.04) : 0;
  return { ...base, d, talk, bubble: texto, siempreBurbuja: true };
}

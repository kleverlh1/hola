# ¡Hola! — Pipo

Una página para hacer amigos. Muestras el QR, la persona lo escanea y aparece **Pipo**, un robotito 3D que la saluda y le ofrece una cocacolita. Abajo dice **«¿Te gustaría ser mi amigo?»** con un botón de WhatsApp.

Si no escribe, no pasa nada: cada vez que vuelva a abrir la página, Pipo le dirá algo bonito (ánimo, cariño, humor, según la hora y el día), sin repetir hasta agotar las frases.

**Página:** https://kleverlh1.github.io/hola/

## Qué hace
| | |
|---|---|
| **Primera visita** | Pipo dice «¡Hola! 👋», mira alrededor, toma su lata del puf y pregunta «¿Quieres una cocacolita? 🥤». |
| **Visitas siguientes** | Saluda con una frase de regreso («¡Volviste! Qué alegría 😊») y, en cada vuelta, dice una frase distinta al ofrecer la lata. |
| **Al tocarlo** | Dice otra frase con un gesto (feliz, saludar, hablar). |
| **WhatsApp** | El botón verde abre el chat con «Hola, acepto una cocacolita 🥤» ya escrito. |
| **Sin 3D** | Si el celular no puede mostrar 3D, queda la imagen de Pipo y las frases igual salen al tocarla. |
| **Privacidad** | No hay servidor ni base de datos: lo que Pipo ya dijo se guarda solo en el celular de cada persona. |
| **Instalable** | Quien quiera puede agregarlo a su pantalla de inicio. |
| **Fondo** | Siempre claro y suave, aunque el celular esté en modo oscuro. |

## Cambiar cosas
| Quiero cambiar… | Dónde |
|---|---|
| Las frases | `frases/*.txt`, una por línea (ver `frases/LEEME.md`). |
| El número o el mensaje de WhatsApp | `build.mjs`, arriba. |
| El texto «¿Te gustaría ser mi amigo?» | `src/index.html` (y la vista previa en `capturas.cjs`). |
| El color de Pipo | `COLOR` en `src/pipo/modelo.js` (luego `npm run capturas`). |
| Los gestos | `src/pipo/coreografia.js` (solo datos: poses y duraciones). |
| El fondo | `--fondo` en `src/index.html`. |

Al hacer push a `main`, GitHub prueba y publica solo (1–2 minutos).

## El QR y las tarjetas
Carpeta [`tarjeta/`](tarjeta/):
- `tarjetas.pdf`: hoja A4 con 10 tarjetas de 85 × 55 mm (tamaño de tarjeta de presentación) para imprimir y recortar.
- `qr.png` / `qr.svg`: el código solo, para stickers o el fondo del celular.

El QR lleva a una dirección fija: puedes cambiar la página o las frases **sin volver a imprimir**.

## Comandos
```
npm install
npm test            # pruebas de las frases y de los gestos
npm run build       # genera dist/ (lo que se publica)
npm run capturas    # vuelve a generar las imágenes de Pipo (public/) desde el 3D
npm run tarjeta     # vuelve a generar el QR y las tarjetas (tarjeta/)
```

## Cómo está hecho
- **Pipo** usa el mismo motor 3D que Basi (asistente-unjbg), con otra identidad: azul cielo (el color preferido en casi todos los países; transmite confianza y calma), sentado en un puf amarillo, con una lata roja sin marcas y un botoncito en el pecho.
- Three.js, todo generado con código (sin modelos pesados). La cara es una pantalla dibujada en tiempo real.
- Mientras carga el 3D se ve una imagen de Pipo, así la página aparece al instante.

| Archivo | Qué contiene |
|---|---|
| `src/index.html` | La página y sus estilos (modo claro y oscuro). |
| `src/app.js` | Arma la página: Pipo, saludo, frases al tocarlo. |
| `src/frases.js` | Qué frase decir según la hora, el día y lo que ya dijo. |
| `src/pipo/modelo.js` | Cómo es Pipo: cuerpo, puf, lata y color. |
| `src/pipo/coreografia.js` | Gestos (solo datos): reposo, ofrecer la lata, reacciones al tocarlo. |
| `src/pipo/cuerpo.js` | Cada cuadro: piecitos, respiración, cabeza, brazos, cara y lata. |
| `src/pipo/brazos.js` | Las manos llegan a su objetivo (el puf o la lata). |
| `src/pipo/cara.js`, `camara.js`, `escena.js`, `geometria.js` | Pantalla de la cara, cámara, luces y formas base. |
| `src/pipo/index.js` | Junta todo: resortes, secuencia, mirada, toques y globo de diálogo. |
| `build.mjs` | Junta todo en `dist/`. |
| `capturas.cjs`, `tarjeta.cjs` | Imágenes de Pipo, QR y tarjetas. |
| `.github/workflows/publicar.yml` | Prueba y publica en GitHub Pages. |

# Millonario Web

Juego tipo «¿Quién quiere ser millonario?» hecho como sitio web estático. El repositorio separa el
**motor** del juego (`src/motor/`) del **temario** (`temarios/<id>/`): para sacar un Millonario de
otro tema se copia la plantilla y se cambia el contenido, sin tocar la lógica ni la interfaz.

Incluye el temario **alemán** (`temarios/aleman/`, antes _Deutsch Millionär_ en Python) y un temario
de ejemplo, **plantilla** (`temarios/plantilla/`, «Cultura general»).

## Requisitos

- Node.js LTS (se probó con 24)
- npm

## Comandos

| Comando                          | Qué hace                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `npm install`                    | Instala las dependencias                                                     |
| `npm run dev`                    | Servidor de desarrollo con el temario de `.env` (`TEMARIO=`)                 |
| `TEMARIO=plantilla npm run dev`  | Prueba el motor con otro temario                                             |
| `npm run validar`                | Revisa el contenido del temario (errores con ruta exacta)                    |
| `npm test`                       | Pruebas de lógica (Vitest)                                                   |
| `npm run test:e2e`               | Pantallas y maquetación (Playwright)                                         |
| `npm run test:pwa`               | Compila y prueba la instalación y el modo sin conexión                       |
| `npm run lint` / `npm run check` | ESLint y tipos de Svelte/TypeScript                                          |
| `npm run build`                  | Compila a `dist/`                                                            |
| `npm run nuevo-temario -- <id>`  | Crea un temario nuevo a partir de la plantilla                               |
| `npm run generar-schemas`        | Regenera `esquemas/*.schema.json` (autocompletar en VS Code)                 |
| `npm run generar-iconos`         | Regenera los íconos PNG de la PWA desde `public/recursos/iconos/favicon.svg` |
| `npm run medir-sonidos`          | Mide duración y silencio final de cada MP3 de `public/recursos/sonidos/`     |
| `npm run migrar`                 | Convierte `legacy-datos/` (Python) al formato nuevo (se usó una vez)         |

La primera vez que corras las pruebas de pantallas: `npx playwright install chromium`.

## Cómo sacar otro Millonario de este repositorio

1. En GitHub: **Use this template** → crea un repositorio nuevo (por ejemplo `millonario-historia`).
2. `npm install`
3. `npm run nuevo-temario -- historia` → copia `temarios/plantilla` a `temarios/historia` y pone
   `TEMARIO=historia` en `.env`.
4. Edita `temarios/historia/temario.config.ts`: título, reglas de inicio, premios y moneda, textos de
   acierto y fallo, frases de la marquesina y emblema (o déjalo sin emblema).
5. Por cada tema, una carpeta en `temarios/historia/contenido/temas/` con `tema.json` y
   `preguntas.json`. Las fichas opcionales van en `contenido/fichas/`.
6. `npm run validar` hasta que no haya errores → `npm run dev` para jugar.
7. En el repositorio de GitHub define la variable `TEMARIO` (Settings → Secrets and variables →
   Actions → Variables) con el id de tu temario y haz push a `main`: queda publicado en
   `usuario.github.io/millonario-historia`.

Opcional: borra `temarios/aleman` del repositorio nuevo. El motor no lo necesita.

### Qué cambia cada temario (`temario.config.ts`)

- `juego.premios` define cuántas preguntas tiene la partida (una por premio). `nivelPorPregunta` debe
  tener el mismo largo; `segundosPorNivel` y `rangosPublico` necesitan una entrada por nivel.
- `moneda`, `textos` (solo lo que cambia frente a `src/motor/textos.ts`, incluido `textos.pausa`), `marquesina`, `confeti`.
- `duracionesMs.suspensoSonando` y `suspensoSilencio` **se miden del `suspenso.mp3` real** con `npm run medir-sonidos`; `npm run validar` falla si no coinciden (±30 ms). `sonidos` permite cambiar cualquier sonido.
- `filtrosTemas` (opcional): dimensiones para filtrar temas, por ejemplo `{ id: 'nivel', etiqueta: 'Nivel', valores: ['A1', 'A2'] }`. Si existe, cada `tema.json` declara `"filtros": { "nivel": "A1" }`.
- `extensiones`: componentes de apoyo visual junto al enunciado, fichas propias, generadores de
  preguntas, validadores y el `iconoPausa`. Son opcionales; la plantilla no usa ninguna.
- `tema.css` (opcional): cambia los tokens de acento. No puede cambiar la maquetación.

## Cómo agregar contenido

- **Pregunta nueva:** agrégala a `contenido/temas/<tema>/preguntas.json` con el siguiente id libre del
  prefijo del tema. Corre `npm run validar`.
- **Tema nuevo:** crea `contenido/temas/<nuevo>/tema.json` (con `orden` y `prefijo` nuevos y, si el
  temario declara `filtrosTemas`, su `filtros`) y un `preguntas.json` con al menos 2 preguntas por
  nivel. No hay que registrar nada en código.
- **Ficha nueva:** un JSON en `contenido/fichas/` de tipo `tabla`, `escala` o `regla`.
- Alemán: sustantivos nuevos en `temas/der_die_das/sustantivos.json` y verbos en
  `temas/conjugacion/verbos.json` (con las 7 personas).

Todo se puede hacer desde la web de GitHub: el pull request corre la validación y avisa si algo está
mal antes de publicarse.

## Qué incluye el juego

- **Partida** con escalera de premios, premios asegurados, tiempo por pregunta y los comodines 50:50,
  Público y Cambiar (todo parametrizable por temario).
- **Sonidos sincronizados** con las animaciones: tic con cada segundo, tic de alerta, suspenso con la
  opción parpadeando mientras suena y fija en ámbar en el silencio final, y correcto/incorrecto al
  revelar. Funcionan sin conexión. Los archivos están en `public/recursos/sonidos/`.
- **Pausa** en cualquier momento (botón o tecla `P`): congela tiempo, animaciones y audio, y oculta
  la pregunta. En el temario alemán se llama «Ein Pausebrot».
- **Filtros de temas** por nivel (A1, A2…) en Inicio y Repaso: ocultan temas sin deseleccionarlos.
- **Repaso** de temas con su explicación y ficha, y **modo práctica** por tema: sin dinero, sin tiempo y
  sin comodines (se llega desde el repaso, con «Practicar este tema»).
- **Progreso local** (récord, temas que más se fallan) y **repaso espaciado** de lo fallado: cada
  pregunta fallada vuelve el mismo día y se espacia (1, 3, 7 y 14 días) a medida que se acierta. Se
  guarda en el navegador, no en un servidor, y se puede borrar desde el inicio.
- **Pronunciación** con la Web Speech API usando `idiomaContenido` del temario; el botón solo aparece
  si el navegador tiene una voz para ese idioma.
- **PWA**: se puede instalar y funciona sin conexión después de la primera visita.
- Tema oscuro y claro, teclado (A-D, Enter, P, Escape) y movimiento reducido.

## Arquitectura

```
src/motor/      reglas del juego, pantallas y componentes. No sabe qué es el alemán.
temarios/<id>/  configuración, contenido y extensiones de un temario.
```

El motor solo conoce el temario por el alias `@temario` (la carpeta elegida al compilar). Una regla de
ESLint prohíbe importar `temarios/` desde `src/motor/`.

- La partida es una máquina de estados con funciones puras (`src/motor/juego/maquina.ts`).
  `controlador.ts` es el único lugar con temporizadores.
- Las claves de `localStorage` llevan el prefijo `millonario:<id-temario>:` para que dos juegos en el
  mismo dominio no se pisen.

## Materiales y documentación

- `public/recursos/` guarda los materiales que se publican tal cual: `iconos/` (el `favicon.svg` es el
  origen de los PNG de la PWA), `imagenes/` y `sonidos/`.
- La documentación detallada vive en `docs/` (propuesta técnica y diseño de interfaz). **No se sube al
  repositorio**: el `.gitignore` deja el `README.md` como único `.md` publicado.

## Depuración y pruebas

- `?debug` en la URL muestra el registro de eventos de la partida.
- Con `vite --mode test` el juego expone la respuesta correcta en un atributo `data-correcta`, acepta
  `?semilla=N` para repetir la misma partida y va sin sonido. Así trabajan las pruebas de Playwright.
- Las capturas de referencia están en `tests/e2e/capturas/<plataforma>/`. Si un cambio visual es
  intencional: `npx playwright test capturas --update-snapshots=all`.
- `tests/e2e/humo.spec.ts` sirve para cualquier temario (los repositorios creados desde la plantilla
  lo corren tal cual); el resto de pruebas de pantallas usa el contenido del alemán y se omite con
  otro `TEMARIO`.

## Publicación

El flujo `.github/workflows/desplegar.yml` valida, prueba, compila con
`BASE_PATH=/<nombre-del-repositorio>/` y publica en GitHub Pages en cada push a `main`. Si el
validador o una prueba falla, no se publica.

Una sola vez, en GitHub: **Settings → Pages → Source: GitHub Actions** y, para que sirva de plantilla,
**Settings → General → Template repository**.

## Créditos de contenido

Los datos del temario alemán provienen de la versión de escritorio en Python
(`deutsch_millionar`), conservados en `legacy-datos/` solo como referencia.

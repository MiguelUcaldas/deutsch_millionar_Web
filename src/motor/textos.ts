/**
 * Textos de interfaz por defecto, en versión neutra. Cada temario sobrescribe solo los que cambian
 * desde `textos` en su `temario.config.ts`. Los textos con `{llaves}` se completan con `rellenar`.
 */
export interface Textos {
  acierto: { titulo: string; subtitulo: string };
  fallo: { titulo: string; subtitulo: string };
  victoria: string;
  derrotaTitulo: string;
  /** Motivo en la pantalla final cuando se acaba el tiempo. */
  tiempoAgotado: string;
  derrotaIncorrecta: string;
  respuestaCorrectaEra: string;
  llegasteHasta: string;
  premioObtenido: string;

  comenzar: string;
  repaso: string;
  volver: string;
  siguiente: string;
  cerrar: string;
  nuevaPartida: string;
  reintentar: string;
  todos: string;
  ninguno: string;

  comoSeJuega: string;
  preguntasDisponibles: string;
  preguntasCargadas: string;
  seleccionaMasTemas: string;
  temasTitulo: string;
  temasElegidos: string;
  codigoDelProyecto: string;
  teclado: string;
  tecladoResponden: string;
  tecladoSigue: string;
  cambiarAClaro: string;
  cambiarAOscuro: string;

  repasoTitulo: string;
  repasoSubtitulo: string;
  queEsTema: string;
  temaQueEs: string;
  temaComoReconocerlo: string;
  temaEjemplos: string;
  temaErroresComunes: string;
  temaFicha: string;

  errorDatosTitulo: string;
  errorDatosAyuda: string;

  preguntaDe: string;
  segundosUnidad: string;
  segundosRestantes: string;
  tiempoEnPausa: string;
  premioAsegurado: string;
  asegurado: string;
  proximoSeguro: string;
  escalera: string;
  escaleraTitulo: string;
  cerrarEscalera: string;
  tuRespuesta: string;
  correcta: string;
  opcionEliminada: string;
  comodinUsado: string;
  sinReemplazo: string;
  comodines: { cincuentaCincuenta: string; publico: string; cambiar: string };

  oracionCompleta: string;
  explicacion: string;
  estructura: string;
  fichaDeLaRegla: string;
  escuchar: string;
  seAcaboElTiempo: string;
  preguntaPremio: string;
  celdaOrigen: string;

  practica: string;
  practicarTema: string;
  practicaDe: string;
  terminar: string;
  practicaTerminada: string;
  practicaResumen: string;
  practicarOtraVez: string;
  volverAlInicio: string;
  repasoFallosTitulo: string;

  progresoTitulo: string;
  progresoVacio: string;
  progresoMejorPartida: string;
  progresoMejorPartidaValor: string;
  progresoMayorPremio: string;
  progresoPartidas: string;
  progresoVictorias: string;
  progresoTemasFallados: string;
  progresoTasaDeFallo: string;
  progresoRepasarFallos: string;
  progresoPendientes: string;
  progresoSinPendientes: string;
  progresoBorrar: string;
  progresoConfirmarBorrado: string;

  detenerAudio: string;
}

export const textosPorDefecto: Textos = {
  acierto: { titulo: '¡Correcto!', subtitulo: '' },
  fallo: { titulo: '¡Incorrecto!', subtitulo: '' },
  victoria: '¡Has ganado!',
  derrotaTitulo: 'Fin de la partida',
  tiempoAgotado: '¡Tiempo agotado!',
  derrotaIncorrecta: 'Respondiste de forma incorrecta.',
  respuestaCorrectaEra: 'La respuesta correcta era:',
  llegasteHasta: 'Llegaste hasta la pregunta',
  premioObtenido: 'Premio obtenido',

  comenzar: 'Comenzar',
  repaso: 'Repaso',
  volver: 'Volver',
  siguiente: 'Siguiente',
  cerrar: 'Cerrar',
  nuevaPartida: 'Nueva partida',
  reintentar: 'Reintentar',
  todos: 'Todos',
  ninguno: 'Ninguno',

  comoSeJuega: 'Cómo se juega',
  preguntasDisponibles: 'Preguntas disponibles',
  preguntasCargadas: '{n} preguntas cargadas',
  seleccionaMasTemas: 'Selecciona más temas: hay {n} preguntas y se necesitan al menos {minimo}.',
  temasTitulo: 'Temas de la partida',
  temasElegidos: '{n} de {total} elegidos',
  codigoDelProyecto: 'Código del proyecto en GitHub',
  teclado: 'Teclado:',
  tecladoResponden: 'responden,',
  tecladoSigue: 'sigue',
  cambiarAClaro: 'Cambiar a tema claro',
  cambiarAOscuro: 'Cambiar a tema oscuro',

  repasoTitulo: 'Repaso de temas',
  repasoSubtitulo: 'Elige un tema para ver su explicación, sin tiempo ni preguntas.',
  queEsTema: '¿Qué es «{tema}»?',
  temaQueEs: '¿Qué es?',
  temaComoReconocerlo: 'Cómo reconocerlo',
  temaEjemplos: 'Ejemplos',
  temaErroresComunes: 'Errores comunes',
  temaFicha: 'Ficha',

  errorDatosTitulo: 'Error al cargar los datos',
  errorDatosAyuda:
    'Revisa el archivo con un editor de texto: busca comas, comillas o llaves mal cerradas.',

  preguntaDe: 'Pregunta {n} de {total}',
  segundosUnidad: 's',
  segundosRestantes: 'Segundos restantes',
  tiempoEnPausa: 'Tiempo en pausa',
  premioAsegurado: 'Premio asegurado',
  asegurado: 'Asegurado',
  proximoSeguro: 'próximo seguro en la {n}',
  escalera: 'Escalera',
  escaleraTitulo: 'Escalera de premios',
  cerrarEscalera: 'Cerrar la escalera de premios',
  tuRespuesta: 'Tu respuesta',
  correcta: 'Correcta',
  opcionEliminada: 'Opción {letra} eliminada',
  comodinUsado: '{nombre} · usado',
  sinReemplazo: 'No hay otra pregunta disponible del mismo nivel.',
  comodines: { cincuentaCincuenta: '50:50', publico: 'Público', cambiar: 'Cambiar' },

  oracionCompleta: 'Oración completa',
  explicacion: 'Explicación',
  estructura: 'Estructura de la oración',
  fichaDeLaRegla: 'Ficha de la regla',
  escuchar: 'Escuchar la oración',
  seAcaboElTiempo: 'Se acabó el tiempo',
  preguntaPremio: 'Pregunta {n} · {premio}',
  celdaOrigen: 'celda de origen',

  practica: 'Práctica',
  practicarTema: 'Practicar este tema',
  practicaDe: 'Práctica · {titulo}',
  terminar: 'Terminar',
  practicaTerminada: 'Práctica terminada',
  practicaResumen: '{aciertos} de {respondidas} correctas',
  practicarOtraVez: 'Practicar de nuevo',
  volverAlInicio: 'Volver al inicio',
  repasoFallosTitulo: 'Repaso de lo fallado',

  progresoTitulo: 'Tu progreso',
  progresoVacio: 'Juega unas partidas y aquí verás tu progreso.',
  progresoMejorPartida: 'Mejor partida',
  progresoMejorPartidaValor: '{n} de {total} preguntas',
  progresoMayorPremio: 'Mayor premio',
  progresoPartidas: 'Partidas jugadas',
  progresoVictorias: 'Victorias',
  progresoTemasFallados: 'Temas que más se te complican',
  progresoTasaDeFallo: '{pct}% de fallos',
  progresoRepasarFallos: 'Repasar lo fallado',
  progresoPendientes: '{n} por repasar',
  progresoSinPendientes: 'Nada pendiente por ahora',
  progresoBorrar: 'Borrar progreso',
  progresoConfirmarBorrado: '¿Borrar todo tu progreso en este navegador?',

  detenerAudio: 'Detener el audio',
};

/** Reemplaza cada `{clave}` del texto por su valor. */
export function rellenar(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (_, clave: string) => String(valores[clave] ?? `{${clave}}`));
}

/** Mezcla los textos del temario sobre los por defecto (un nivel de profundidad). */
export function mezclarTextos(sobrescritos: Record<string, unknown> | undefined): Textos {
  const resultado: Record<string, unknown> = { ...textosPorDefecto };
  for (const [clave, valor] of Object.entries(sobrescritos ?? {})) {
    const base = resultado[clave];
    const esObjeto = (x: unknown): x is Record<string, unknown> =>
      typeof x === 'object' && x !== null;
    resultado[clave] = esObjeto(base) && esObjeto(valor) ? { ...base, ...valor } : valor;
  }
  return resultado as unknown as Textos;
}

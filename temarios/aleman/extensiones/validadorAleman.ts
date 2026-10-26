import type { Validador } from '@motor/contenido/validar';
import { leerSustantivos } from './sustantivos';
import { PERSONAS_ESPERADAS, buscarVerbo, verbos } from './verbos';

const PATRON_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface FichaConjugacionDePregunta {
  tipo: 'conjugacion';
  verbo: string;
  persona: string;
  tiempo: string;
}

/** Comprobaciones que solo tienen sentido en el temario de alemán. */
export const validadorAleman: Validador = ({ banco, fuentes }) => {
  const errores: string[] = [];

  for (const pregunta of banco.preguntas) {
    if (pregunta.apoyo?.tipo === 'reloj' && !PATRON_HORA.test(String(pregunta.apoyo.hora))) {
      errores.push(`${pregunta.id} → apoyo.hora: «${pregunta.apoyo.hora}» no tiene formato HH:MM`);
    }
    if (pregunta.tema !== 'conjugacion') continue;

    const ficha = pregunta.ficha;
    if (typeof ficha !== 'object' || ficha.tipo !== 'conjugacion') {
      errores.push(
        `${pregunta.id}: las preguntas de conjugación necesitan una ficha de tipo «conjugacion»`,
      );
      continue;
    }
    const { verbo, persona, tiempo } = ficha as unknown as FichaConjugacionDePregunta;
    const datosVerbo = buscarVerbo(verbo);
    if (!datosVerbo) {
      errores.push(`${pregunta.id}: el verbo «${verbo}» no existe en verbos.json`);
      continue;
    }
    const formas = datosVerbo.tiempos[tiempo];
    if (!formas) {
      errores.push(`${pregunta.id}: el tiempo «${tiempo}» no existe para el verbo «${verbo}»`);
      continue;
    }
    const forma = formas[persona];
    if (!forma) {
      errores.push(`${pregunta.id}: la persona «${persona}» no existe para «${verbo}/${tiempo}»`);
      continue;
    }
    if (pregunta.correcta.toLowerCase() !== forma.de.toLowerCase()) {
      errores.push(
        `${pregunta.id}: correcta «${pregunta.correcta}» no coincide con verbos.json («${forma.de}») para ${verbo}/${tiempo}/${persona}`,
      );
    }
  }

  for (const verbo of verbos.verbos) {
    for (const [tiempo, formas] of Object.entries(verbo.tiempos)) {
      const faltantes = PERSONAS_ESPERADAS.filter((persona) => !(persona in formas));
      if (faltantes.length > 0) {
        errores.push(
          `verbo «${verbo.infinitivo}» (${tiempo}): faltan las personas ${faltantes.join(', ')}`,
        );
      }
    }
  }

  const sustantivos = fuentes.temas['der_die_das']?.datos['sustantivos.json'];
  if (sustantivos === undefined) {
    errores.push('temas/der_die_das/sustantivos.json: no se encontró el archivo');
  } else {
    errores.push(...leerSustantivos(sustantivos).avisos.map((a) => `sustantivos.json: ${a}`));
  }

  return { errores };
};

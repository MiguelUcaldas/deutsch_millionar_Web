import type { ConfiguracionTemario } from '@motor/contenido/esquemas';
import Emblema from './Emblema.svelte';
import ApoyoReloj from './extensiones/ApoyoReloj.svelte';
import FichaConjugacion from './extensiones/FichaConjugacion.svelte';
import { generadorDerDieDas } from './extensiones/generadorDerDieDas';
import { validadorAleman } from './extensiones/validadorAleman';

export default {
  id: 'aleman',
  titulo: 'DEUTSCH MILLIONÄR',
  descripcion: 'Practica alemán A1-A2 jugando',
  idiomaContenido: 'de-DE',
  repositorio: 'https://github.com/MiguelUcaldas/deutsch_millionar',
  emblema: Emblema,

  reglasInicio: [
    'Responde 15 preguntas de alemán, cada vez más difíciles.',
    'Al llegar a la pregunta 5 y a la 10 tu premio queda asegurado.',
    'Usa los comodines 50:50, Público y Cambiar si te atascas.',
    'Si fallas o se acaba el tiempo, pierdes y te llevas el último premio asegurado.',
  ],

  juego: {
    premios: [
      100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
      1000000,
    ],
    preguntasSeguras: [5, 10],
    nivelPorPregunta: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5],
    segundosPorNivel: { 1: 30, 2: 30, 3: 35, 4: 40, 5: 45 },
    segundosAlerta: 5,
    minimoPreguntasPartida: 16,
    maximoBasePorTema: 2,
    comodines: { cincuentaCincuenta: true, publico: true, cambiar: true },
    rangosPublico: { 1: [70, 85], 2: [60, 75], 3: [45, 60], 4: [35, 50], 5: [25, 45] },
    duracionesMs: {
      suspenso: 1800,
      antesDeResultado: 900,
      barrasPublico: 2000,
      flechaTabla: 1200,
      aviso: 2500,
    },
  },

  moneda: { simbolo: '€', separadorMiles: '.', simboloAntes: true },

  confeti: ['#000000', '#DD0000', '#FFCE00'],
  marquesina: ['Super!', 'Weiter so!', 'Fast geschafft!', 'Du schaffst das!', 'Klasse!'],

  textos: {
    acierto: { titulo: 'Richtig!', subtitulo: '¡Correcto!' },
    fallo: { titulo: 'Falsch!', subtitulo: '¡Incorrecto!' },
    victoria: 'Herzlichen Glückwunsch! Du bist Millionär!',
    derrotaTitulo: 'Game Over',
    tiempoAgotado: 'Zeit ist um! / ¡Tiempo agotado!',
  },

  extensiones: {
    apoyos: { reloj: ApoyoReloj },
    fichas: { conjugacion: FichaConjugacion },
    generadores: [generadorDerDieDas],
    validadores: [validadorAleman],
  },
} satisfies ConfiguracionTemario;

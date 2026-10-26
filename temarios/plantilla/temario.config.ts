import type { ConfiguracionTemario } from '@motor/contenido/esquemas';

export default {
  id: 'plantilla',
  titulo: 'CULTURA GENERAL (EJEMPLO)',
  descripcion: 'Temario de ejemplo para probar el motor',

  reglasInicio: [
    'Responde 10 preguntas, cada vez más difíciles.',
    'Al llegar a la pregunta 4 y a la 8 tu premio queda asegurado.',
    'Usa los comodines 50:50, Público y Cambiar si te atascas.',
    'Si fallas o se acaba el tiempo, pierdes y te llevas el último premio asegurado.',
  ],

  juego: {
    premios: [50000, 100000, 200000, 400000, 800000, 1500000, 3000000, 6000000, 12000000, 25000000],
    preguntasSeguras: [4, 8],
    nivelPorPregunta: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    segundosPorNivel: { 1: 30, 2: 30, 3: 35, 4: 40, 5: 45 },
    segundosAlerta: 5,
    minimoPreguntasPartida: 10,
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

  moneda: { simbolo: '$', separadorMiles: '.', simboloAntes: true },

  marquesina: ['¡Muy bien!', '¡Sigue así!', '¡Casi lo logras!', '¡Tú puedes!'],
} satisfies ConfiguracionTemario;

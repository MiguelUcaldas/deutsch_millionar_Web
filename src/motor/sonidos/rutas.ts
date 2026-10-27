// Sin imports: también lo lee el validador (scripts/) fuera de Vite.

export const NOMBRES_SONIDO = ['tic', 'ticAlerta', 'suspenso', 'correcto', 'incorrecto'] as const;
export type NombreSonido = (typeof NOMBRES_SONIDO)[number];
export type RutasSonido = Record<NombreSonido, string>;

/** Rutas relativas a la raíz del sitio (`public/`); `BASE_URL` se antepone al reproducir. */
export const RUTAS_POR_DEFECTO: RutasSonido = {
  tic: 'recursos/sonidos/tic.mp3',
  ticAlerta: 'recursos/sonidos/tic_alerta.mp3',
  suspenso: 'recursos/sonidos/suspenso.mp3',
  correcto: 'recursos/sonidos/correcto.mp3',
  incorrecto: 'recursos/sonidos/incorrecto.mp3',
};

/** Las rutas por defecto con los reemplazos que haga el temario. */
export function rutasDeSonido(cambios?: Partial<RutasSonido>): RutasSonido {
  return { ...RUTAS_POR_DEFECTO, ...cambios };
}

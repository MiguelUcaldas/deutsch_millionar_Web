export interface OpcionesTemporizador {
  /** Se llama cuando cambia el segundo entero que se muestra. */
  alTic: (segundosRestantes: number) => void;
  alAgotarse: () => void;
  ahora?: () => number;
}

export interface Temporizador {
  iniciar(segundos: number): void;
  pausar(): void;
  reanudar(): void;
  detener(): void;
  segundosRestantes(): number;
}

/**
 * Cuenta atrás basada en marcas de tiempo (no resta 1 por intervalo, así no se desfasa).
 * El fin se programa con setTimeout para que ocurra aunque la pestaña esté en segundo plano.
 */
export function crearTemporizador({
  alTic,
  alAgotarse,
  ahora = () => performance.now(),
}: OpcionesTemporizador): Temporizador {
  let restanteMs = 0;
  let finEn = 0;
  let corriendo = false;
  let ultimoSegundoEmitido = -1;
  let avisoFin: ReturnType<typeof setTimeout> | undefined;
  let cuadro: ReturnType<typeof setTimeout> | number | undefined;

  const hayAnimacion = typeof requestAnimationFrame === 'function';
  const pedirCuadro = (fn: () => void) =>
    (cuadro = hayAnimacion ? requestAnimationFrame(fn) : setTimeout(fn, 50));
  const cancelarCuadro = () => {
    if (cuadro === undefined) return;
    if (hayAnimacion) cancelAnimationFrame(cuadro as number);
    else clearTimeout(cuadro as ReturnType<typeof setTimeout>);
    cuadro = undefined;
  };

  const emitir = () => {
    const segundos = Math.max(0, Math.ceil((finEn - ahora()) / 1000));
    if (segundos !== ultimoSegundoEmitido) {
      ultimoSegundoEmitido = segundos;
      alTic(segundos);
    }
  };

  const bucle = () => {
    if (!corriendo) return;
    emitir();
    pedirCuadro(bucle);
  };

  const arrancar = () => {
    corriendo = true;
    finEn = ahora() + restanteMs;
    clearTimeout(avisoFin);
    avisoFin = setTimeout(() => {
      if (!corriendo) return;
      corriendo = false;
      cancelarCuadro();
      restanteMs = 0;
      ultimoSegundoEmitido = 0;
      alTic(0);
      alAgotarse();
    }, restanteMs);
    emitir();
    cancelarCuadro();
    pedirCuadro(bucle);
  };

  const parar = () => {
    corriendo = false;
    clearTimeout(avisoFin);
    avisoFin = undefined;
    cancelarCuadro();
  };

  return {
    iniciar(segundos) {
      parar();
      restanteMs = segundos * 1000;
      ultimoSegundoEmitido = -1;
      arrancar();
    },
    pausar() {
      if (!corriendo) return;
      restanteMs = Math.max(0, finEn - ahora());
      parar();
    },
    reanudar() {
      if (corriendo || restanteMs <= 0) return;
      arrancar();
    },
    detener() {
      parar();
      restanteMs = 0;
    },
    segundosRestantes() {
      const ms = corriendo ? finEn - ahora() : restanteMs;
      return Math.max(0, Math.ceil(ms / 1000));
    },
  };
}

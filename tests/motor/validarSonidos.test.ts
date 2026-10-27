import { describe, expect, it } from 'vitest';
import { validarSonidos } from '../../scripts/validar-sonidos';
import { juegoPlantilla } from './ayudas';

const { suspensoSonando, suspensoSilencio } = juegoPlantilla.duracionesMs;

describe('validación de sonidos', () => {
  it('acepta los tiempos que coinciden con el archivo de suspenso', async () => {
    expect(await validarSonidos({ duracionesMs: { suspensoSonando, suspensoSilencio } })).toEqual(
      [],
    );
  });

  it('tolera hasta 30 ms de diferencia', async () => {
    const errores = await validarSonidos({
      duracionesMs: {
        suspensoSonando: suspensoSonando + 25,
        suspensoSilencio: suspensoSilencio - 25,
      },
    });
    expect(errores).toEqual([]);
  });

  it('avisa con el valor medido cuando no coinciden', async () => {
    const errores = await validarSonidos({
      duracionesMs: { suspensoSonando: suspensoSonando + 100, suspensoSilencio },
    });
    expect(errores).toHaveLength(1);
    expect(errores[0]).toMatch(/suspensoSonando es \d+ ms pero .*suspenso\.mp3 mide \d+ ms/);
  });

  it('avisa si falta un archivo', async () => {
    const errores = await validarSonidos({
      reemplazos: { tic: 'recursos/sonidos/no-existe.mp3' },
      duracionesMs: { suspensoSonando, suspensoSilencio },
    });
    expect(errores).toEqual(['sonidos.tic: no existe public/recursos/sonidos/no-existe.mp3']);
  });
});

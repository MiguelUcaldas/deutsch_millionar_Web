import { describe, expect, it } from 'vitest';
import temario from '@temario';

describe('arranque', () => {
  it('el alias @temario resuelve la configuración del temario elegido', () => {
    expect(temario.id).toBeTruthy();
    expect(temario.titulo).toBeTruthy();
  });
});

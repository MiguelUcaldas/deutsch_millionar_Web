/**
 * localStorage con prefijo `millonario:<id-temario>:`. Todos los repositorios de un mismo usuario
 * en GitHub Pages comparten origen, así que sin prefijo dos temarios se pisarían.
 * Si el navegador no deja leer o escribir, el juego funciona igual sin recordar nada.
 */
export function crearAlmacen(idTemario: string) {
  const clave = (nombre: string) => `millonario:${idTemario}:${nombre}`;

  return {
    leer<T>(nombre: string): T | null {
      try {
        const crudo = localStorage.getItem(clave(nombre));
        return crudo === null ? null : (JSON.parse(crudo) as T);
      } catch {
        return null;
      }
    },
    escribir(nombre: string, valor: unknown): void {
      try {
        localStorage.setItem(clave(nombre), JSON.stringify(valor));
      } catch {
        /* sin almacenamiento: no se recuerda nada */
      }
    },
  };
}

export type Almacen = ReturnType<typeof crearAlmacen>;

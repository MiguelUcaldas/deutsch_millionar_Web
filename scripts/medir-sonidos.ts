// Mide los sonidos de public/recursos/sonidos: duración, dónde termina el sonido y cuánto silencio
// queda al final. Se ejecuta con: npm run medir-sonidos
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { MPEGDecoder } from 'mpg123-decoder';

const carpeta = path.resolve(import.meta.dirname, '..', 'public', 'recursos', 'sonidos');

/** Por debajo de este nivel (dBFS) se considera silencio. */
const UMBRAL_SILENCIO_DB = -50;
const VENTANA_MS = 5;

export interface MedidaSonido {
  archivo: string;
  duracionMs: number;
  /** Instante en que termina el último sonido audible. */
  finSonidoMs: number;
  silencioFinalMs: number;
  /** Instante del pico de volumen. */
  picoMs: number;
  /** Último instante en que el volumen supera el 25 % / 10 % del pico (la «parte fuerte»). */
  fuerteHastaMs: number;
  casiSilencioMs: number;
}

export async function medirSonido(ruta: string): Promise<MedidaSonido> {
  const decodificador = new MPEGDecoder();
  await decodificador.ready;
  const { channelData, sampleRate } = decodificador.decode(new Uint8Array(readFileSync(ruta)));
  decodificador.free();

  const total = channelData[0]!.length;
  const ventana = Math.round((sampleRate * VENTANA_MS) / 1000);
  const rms: number[] = [];
  for (let inicio = 0; inicio < total; inicio += ventana) {
    let suma = 0;
    let muestras = 0;
    for (const canal of channelData) {
      for (let i = inicio; i < Math.min(inicio + ventana, total); i++) {
        suma += canal[i]! * canal[i]!;
        muestras++;
      }
    }
    rms.push(Math.sqrt(suma / Math.max(1, muestras)));
  }

  const umbral = 10 ** (UMBRAL_SILENCIO_DB / 20);
  const ms = (ventanaIndice: number) => ventanaIndice * VENTANA_MS;
  const ultimoSobre = (nivel: number) => {
    for (let i = rms.length - 1; i >= 0; i--) if (rms[i]! > nivel) return i + 1;
    return 0;
  };
  const maximo = Math.max(...rms);
  const duracionMs = (total / sampleRate) * 1000;
  const finSonidoMs = Math.min(duracionMs, ms(ultimoSobre(umbral)));

  return {
    archivo: path.basename(ruta),
    duracionMs,
    finSonidoMs,
    silencioFinalMs: duracionMs - finSonidoMs,
    picoMs: ms(rms.indexOf(maximo)),
    fuerteHastaMs: ms(ultimoSobre(maximo * 0.25)),
    casiSilencioMs: ms(ultimoSobre(maximo * 0.1)),
  };
}

if (import.meta.filename === process.argv[1]) {
  const archivos = readdirSync(carpeta).filter((a) => a.endsWith('.mp3'));
  console.log(
    'archivo'.padEnd(16) +
      ['duración', 'fin sonido', 'silencio final', 'pico', 'fuerte hasta', 'casi mudo'].join(' | '),
  );
  for (const archivo of archivos) {
    const m = await medirSonido(path.join(carpeta, archivo));
    const f = (v: number) => `${Math.round(v)} ms`.padStart(10);
    console.log(
      m.archivo.padEnd(16) +
        [
          m.duracionMs,
          m.finSonidoMs,
          m.silencioFinalMs,
          m.picoMs,
          m.fuerteHastaMs,
          m.casiSilencioMs,
        ]
          .map(f)
          .join(' | '),
    );
  }
}

// Convierte los esquemas Zod a JSON Schema para que VS Code autocomplete y marque errores
// al escribir contenido. Los archivos de contenido los referencian con "$schema".
// Se ejecuta con: npm run generar-schemas
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  esquemaFicha,
  esquemaPregunta,
  esquemaTema,
  esquemaTraducciones,
} from '../src/motor/contenido/esquemas.ts';

const carpeta = path.resolve(import.meta.dirname, '..', 'esquemas');
mkdirSync(carpeta, { recursive: true });

const esquemas = {
  tema: esquemaTema,
  preguntas: z.array(esquemaPregunta),
  ficha: esquemaFicha,
  traducciones: esquemaTraducciones,
};

for (const [nombre, esquema] of Object.entries(esquemas)) {
  const json = z.toJSONSchema(esquema, { target: 'draft-7', io: 'input' });
  writeFileSync(path.join(carpeta, `${nombre}.schema.json`), JSON.stringify(json, null, 2) + '\n');
  console.log(`esquemas/${nombre}.schema.json`);
}

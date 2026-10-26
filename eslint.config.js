import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'legacy-datos/',
      'esquemas/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // El motor no puede depender de ningún temario concreto: solo habla con @temario.
    files: ['src/motor/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/temarios/*', '**/temarios/**', 'temarios/*', 'temarios/**'],
              message: 'El motor solo puede importar el temario a través del alias @temario.',
            },
          ],
        },
      ],
    },
  },
);

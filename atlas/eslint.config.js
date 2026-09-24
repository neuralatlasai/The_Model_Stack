// @ts-check
/**
 * ESLint 10 flat config (Instruction/nodejs-javascript-engineering-standards-2026.md §11).
 *
 * - TypeScript: typescript-eslint strictTypeChecked + stylisticTypeChecked with the
 *   project service, so every rule sees real types.
 * - Astro: eslint-plugin-astro 1.7.0 flat/recommended (3.x requires Node ≥ 24.16;
 *   see docs/adr/0004). `astro check` remains the type gate for .astro files.
 * - Prettier owns formatting: eslint-config-prettier switches off stylistic conflicts.
 */
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '.atlas/**',
      '**/dist/**',
      '**/.astro/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      '**/*.tmp.*',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      // A switch with an explicit `default` is a deliberate catch-all, not a missed case.
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: true }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignorePrimitives: { string: false, number: false, boolean: false } }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    // Pure-TS packages, CLI, scripts, and tests run on Node.
    files: ['packages/**/*.ts', 'scripts/**/*.ts', 'tests/**/*.ts', '**/tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // The compiler CLI and maintenance scripts report on stdout by design.
    files: ['packages/compiler/src/cli.ts', 'scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // node:test suites: `test()`/`describe()` return promises the runner owns.
    // Assertions probe typed results defensively (`result?.x`) and async test bodies may not await.
    files: ['**/tests/**/*.ts', '**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    // Browser code: client controllers and islands.
    files: ['apps/web/src/client/**/*.ts', 'apps/web/src/islands/**/*.tsx'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    // astro.config.mjs runs under Node before Astro's own tooling loads.
    files: ['apps/web/astro.config.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  ...astro.configs['flat/recommended'],
  {
    // Astro frontmatter is TypeScript, but the astro preset lints it with core
    // rules: core no-unused-vars flags parameter names inside function *types*
    // (`(id: string) => string`). `astro check` still reports unused locals.
    files: ['**/*.astro'],
    rules: { 'no-unused-vars': 'off' },
  },
  prettier,
);

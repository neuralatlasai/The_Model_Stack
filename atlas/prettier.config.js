// @ts-check
/** Prettier owns mechanical formatting; ESLint owns correctness (standards §5). */
/** @type {import('prettier').Config} */
export default {
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  plugins: ['prettier-plugin-astro'],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};

/**
 * Build-time KaTeX for calculator equations. `CompiledFigure` carries the
 * calculator's TeX but not its rendering, so the figure host renders it once
 * at build time with the compiler's options (HTML + MathML, `trust: false`,
 * fresh macros). The output is trusted build output, the same class as the
 * compiler's equation HTML. A TeX error yields undefined and the view falls
 * back to the TeX source; the compiler has already validated the figure.
 */
import katex from 'katex';
import type { CompiledFigure } from '@atlas/core';

export function renderDisplayTex(tex: string): string | undefined {
  try {
    return katex.renderToString(tex, {
      displayMode: true,
      throwOnError: true,
      output: 'htmlAndMathml',
      strict: 'ignore',
      trust: false,
      macros: {},
    });
  } catch {
    // Recovery: the calculator shows its TeX source instead of rendered math.
    return undefined;
  }
}

/** Rendered TeX for a calculator figure; undefined for every other kind. */
export function calculatorTexHtml(figure: CompiledFigure): string | undefined {
  return figure.spec.kind === 'calculator' ? renderDisplayTex(figure.spec.spec.tex) : undefined;
}

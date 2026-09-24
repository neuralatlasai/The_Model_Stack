/**
 * Server-side KaTeX rendering for `CompileContext.renderMath`. Output is
 * HTML + MathML (accessible without client JS). `trust: false` blocks
 * `\href`, `\includegraphics` and friends; a fresh macro table per call keeps
 * `\gdef` in one equation from leaking into the next. Throws on TeX errors;
 * the Markdown compiler turns that into `equation-render-error`.
 */
import katex from 'katex';

export function renderMath(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, {
    displayMode,
    throwOnError: true,
    output: 'htmlAndMathml',
    strict: 'ignore',
    trust: false,
    macros: {},
  });
}

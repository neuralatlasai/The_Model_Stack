/**
 * The single seam between the Markdown compiler and @atlas/visual. Every
 * visual-grammar function the compiler uses is imported here and nowhere
 * else, so the dependency surface is explicit and swappable in tests.
 */
export { describeFigure, parseMermaid, parseSystemsTrace, parseTensorTrace, validateFigure } from '@atlas/visual';

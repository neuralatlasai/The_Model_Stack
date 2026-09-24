/**
 * Stable, branchable failure codes for inputs the compile cannot proceed
 * without (engineering standards §6: callers never parse message strings).
 * Content defects are diagnostics, not errors; these are configuration or I/O
 * failures and internal faults.
 */
export type InputErrorCode = 'reference-stack-unreadable' | 'docs-unreadable' | 'compile-failed';

export class AtlasInputError extends Error {
  readonly code: InputErrorCode;

  constructor(code: InputErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AtlasInputError';
    this.code = code;
  }
}

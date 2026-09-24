#!/usr/bin/env node
/**
 * atlas-compile — compiles docs/ into the Research Atlas bundle.
 *
 *   node packages/compiler/src/cli.ts --docs ../docs \
 *     --reference-stack ../Instruction/AI_REFERENCE_STACK.md --out .atlas \
 *     [--check] [--compiled-at <iso>] [--concurrency <1-8>] [--quiet] [--verbose]
 *
 * Exit codes:
 *   0    compiled and written (with --check: and no error diagnostics)
 *   1    --check and at least one error diagnostic (the bundle is still written)
 *   2    usage error (unknown flag, missing or invalid argument)
 *   3    fatal: unreadable/invalid manifest or reference stack, I/O failure, internal fault
 *   130  interrupted (SIGINT)
 *
 * Environment: none read. The clock is read once, here, when --compiled-at is absent.
 */
import { parseArgs } from 'node:util';
import { z } from 'zod';
import type { Diagnostic } from '@atlas/core';
import { compileAtlas, writeBundle, type CompiledAtlas, type WriteReport } from './index.ts';
import { groupByFile } from './emit/diagnostics.ts';

export const EXIT_CODES = { ok: 0, checkFailed: 1, usage: 2, fatal: 3, interrupted: 130 } as const;

const USAGE = `Usage: atlas-compile --docs <dir> --reference-stack <file> --out <dir> [options]

Options:
  --docs <dir>              docs/ directory containing atlas-manifest.json
  --reference-stack <file>  Instruction/AI_REFERENCE_STACK.md (read-only)
  --out <dir>               bundle output directory (written atomically)
  --check                   exit 1 when any error diagnostic exists
  --compiled-at <iso>       timestamp recorded in bundle.json (default: now)
  --concurrency <n>         parallel reads/compiles, 1–8 (default 4)
  --quiet                   print only error diagnostics
  --verbose                 also list info diagnostics
  -h, --help                show this help
`;

const ArgsSchema = z
  .object({
    docs: z.string().min(1, '--docs is required'),
    'reference-stack': z.string().min(1, '--reference-stack is required'),
    out: z.string().min(1, '--out is required'),
    check: z.boolean(),
    'compiled-at': z.iso.datetime({ offset: true }).optional(),
    concurrency: z
      .string()
      .regex(/^[1-8]$/u, '--concurrency must be an integer from 1 to 8')
      .transform((value) => Number.parseInt(value, 10))
      .optional(),
    quiet: z.boolean(),
    verbose: z.boolean(),
  })
  .strict();

type CliArgs = z.output<typeof ArgsSchema>;

class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

const OPTIONS = {
  docs: { type: 'string' },
  'reference-stack': { type: 'string' },
  out: { type: 'string' },
  check: { type: 'boolean', default: false },
  'compiled-at': { type: 'string' },
  concurrency: { type: 'string' },
  quiet: { type: 'boolean', default: false },
  verbose: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
} as const;

function parseCliArgs(argv: readonly string[]): CliArgs | 'help' {
  let parsedArgs: ReturnType<typeof parseArgs<{ args: string[]; strict: true; allowPositionals: false; options: typeof OPTIONS }>>;
  try {
    parsedArgs = parseArgs({ args: [...argv], strict: true, allowPositionals: false, options: OPTIONS });
  } catch (error: unknown) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
  const { values } = parsedArgs;
  if (values.help) return 'help';
  const parsed = ArgsSchema.safeParse({
    docs: values.docs ?? '',
    'reference-stack': values['reference-stack'] ?? '',
    out: values.out ?? '',
    check: values.check,
    'compiled-at': values['compiled-at'],
    concurrency: values.concurrency,
    quiet: values.quiet,
    verbose: values.verbose,
  });
  if (!parsed.success) throw new UsageError(parsed.error.issues.map((issue) => issue.message).join('; '));
  return parsed.data;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function formatDiagnostic(item: Diagnostic): string {
  const line = item.line === null ? '     ' : `L${String(item.line)}`.padEnd(5);
  return `    ${item.severity.padEnd(7)} ${line}  ${item.code.padEnd(28)} ${item.message}`;
}

function report(atlas: CompiledAtlas, written: WriteReport, args: CliArgs): string {
  const { counts, diagnostics } = atlas.manifest;
  const lines: string[] = [];
  const shown = atlas.diagnostics.filter(
    (item) => item.severity === 'error' || (!args.quiet && item.severity === 'warning') || (args.verbose && !args.quiet),
  );
  if (!args.quiet) {
    lines.push(
      `atlas-compile · edition ${atlas.manifest.edition} · compiled ${atlas.manifest.compiledAt}`,
      `  documents    ${String(counts.documents)}   planned nodes ${String(counts.planned)}`,
      `  figures      ${String(counts.figures)}   equations ${String(counts.equations)}   references ${String(counts.references)}   terms ${String(counts.terms)}`,
      `  search docs  ${String(counts.searchDocs)}`,
      `  diagnostics  ${String(diagnostics.error)} error · ${String(diagnostics.warning)} warning · ${String(diagnostics.info)} info`,
      `  bundle       ${written.outDir} (${String(written.files)} files, ${formatBytes(written.bytes)}, ${written.mode})`,
    );
  }
  if (shown.length > 0) {
    if (!args.quiet) lines.push('');
    for (const [file, items] of groupByFile(shown)) {
      lines.push(`  ${file}`);
      for (const item of items) lines.push(formatDiagnostic(item));
    }
  }
  if (!args.quiet && !args.verbose && diagnostics.info > 0) {
    lines.push('', `  ${String(diagnostics.info)} info diagnostics not listed (use --verbose, or read diagnostics.json)`);
  }
  return lines.length === 0 ? '' : `${lines.join('\n')}\n`;
}

/** Output sinks, injectable so tests can capture the report. */
export interface CliIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}

const PROCESS_IO: CliIo = {
  out: (text) => {
    process.stdout.write(text);
  },
  err: (text) => {
    process.stderr.write(text);
  },
};

/** Runs the CLI and resolves to the process exit code. Never rejects. */
export async function main(argv: readonly string[], io: CliIo = PROCESS_IO): Promise<number> {
  let args: CliArgs | 'help';
  try {
    args = parseCliArgs(argv);
  } catch (error: unknown) {
    io.err(`atlas-compile: ${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
    return EXIT_CODES.usage;
  }
  if (args === 'help') {
    io.out(USAGE);
    return EXIT_CODES.ok;
  }

  const controller = new AbortController();
  let interrupts = 0;
  const onSigint = (): void => {
    interrupts += 1;
    if (interrupts > 1) process.exit(EXIT_CODES.interrupted);
    io.err('\natlas-compile: interrupted, cleaning up (press Ctrl-C again to force)\n');
    controller.abort(new Error('interrupted by SIGINT'));
  };
  process.on('SIGINT', onSigint);

  try {
    const compiledAt = args['compiled-at'] ?? new Date().toISOString();
    const atlas = await compileAtlas({
      docsDir: args.docs,
      referenceStackPath: args['reference-stack'],
      compiledAt,
      signal: controller.signal,
      ...(args.concurrency === undefined ? {} : { concurrency: args.concurrency }),
    });
    const written = await writeBundle(atlas, args.out, { signal: controller.signal });
    io.out(report(atlas, written, args));
    if (args.check && atlas.manifest.diagnostics.error > 0) return EXIT_CODES.checkFailed;
    return EXIT_CODES.ok;
  } catch (error: unknown) {
    if (controller.signal.aborted) return EXIT_CODES.interrupted;
    const message = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error && error.cause instanceof Error ? `\n  cause: ${error.cause.message}` : '';
    io.err(`atlas-compile: ${message}${cause}\n`);
    return EXIT_CODES.fatal;
  } finally {
    process.off('SIGINT', onSigint);
  }
}

if (import.meta.main) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      process.stderr.write(`atlas-compile: unexpected failure: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
      process.exitCode = EXIT_CODES.fatal;
    },
  );
}

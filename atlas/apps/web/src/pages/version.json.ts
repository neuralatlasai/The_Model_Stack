import { execFileSync } from 'node:child_process';
import type { APIRoute } from 'astro';
import { version } from '../../package.json';

// The exact revision built by GitHub Pages, available for review/cache verification.
let commit = process.env['GITHUB_SHA'];
if (commit === undefined) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    commit = 'unknown';
  }
}
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ version, commit }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
  });

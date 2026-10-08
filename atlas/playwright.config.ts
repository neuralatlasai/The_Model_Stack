import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] === undefined ? 0 : 1,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev --workspace @atlas/web -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321/library/',
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 120_000,
  },
});

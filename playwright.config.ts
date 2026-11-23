import { defineConfig, devices } from '@playwright/test';

// Runs against the production build (`npm run test:e2e` builds first).
// 4173: dist served at /   ·   4174: same dist served under a nested path (base './' check)
export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', viewport: { width: 1440, height: 900 } },
  webServer: [
    { command: 'npx vite preview --port 4173 --strictPort --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
    { command: 'npx vite preview --port 4174 --strictPort --host 127.0.0.1 --base /nested/path/', url: 'http://127.0.0.1:4174/nested/path/', reuseExistingServer: !process.env.CI },
    // dev server: only used to check React StrictMode (dev-only double effects) doesn't duplicate animations
    { command: 'npx vite --port 5175 --strictPort --host 127.0.0.1', url: 'http://127.0.0.1:5175', reuseExistingServer: !process.env.CI },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // cross-browser: the @smoke subset only
    { name: 'firefox', grep: /@smoke/, use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', grep: /@smoke/, use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
});

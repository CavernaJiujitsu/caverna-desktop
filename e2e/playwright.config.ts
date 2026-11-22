import { defineConfig, devices } from '@playwright/test'

/**
 * Browser E2E against the real local stack: Vite on :5173 and the NestJS API
 * on :3000. The API must be running before the suite starts; the dev server is
 * started (or reused) by Playwright. Tests own their data through the API and
 * never clean the database.
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: './.artifacts/test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: './.artifacts/report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    // The config lives in e2e/; the app and its package.json live one level up.
    cwd: '..',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

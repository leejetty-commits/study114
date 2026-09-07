import { defineConfig, devices } from '@playwright/test';

const previewFromEnv = process.env.STUDY114_E2E_HOME_URL || process.env.STUDY114_PREVIEW_URL || '';
const previewBase =
  !previewFromEnv || previewFromEnv.includes(':8080')
    ? 'http://127.0.0.1:5174'
    : previewFromEnv;

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: previewBase,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});

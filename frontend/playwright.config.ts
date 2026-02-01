import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially for user flow tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60000,
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:80',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local server before tests (for CI)
  webServer: process.env.CI ? undefined : {
    command: 'cd .. && docker-compose up -d',
    url: 'http://localhost:80',
    reuseExistingServer: true,
    timeout: 120000,
  },
});

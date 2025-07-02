import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 60000, // Increased for sync tests
  retries: 1,
  workers: 1, // Important: keep at 1 for multi-browser tests
  
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chrome-extension',
      testMatch: 'chrome-extension/basic.spec.js',
      use: {
        headless: false,
      },
    },
    {
      name: 'chrome-sync',
      testMatch: 'chrome-extension/chrome-to-chrome-sync.spec.js',
      use: {
        headless: false,
        // Longer timeout for sync tests
        actionTimeout: 10000,
      },
    },
    {
      name: 'interop',
      testMatch: 'interop/**/*.spec.js',
      use: {
        headless: false,
      },
    },
  ],
  
  reporter: [
    ['html'],
    ['github'],
    ['list'],
  ],
})
import { test, expect, chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.join(__dirname, '../../chrome-extension')

test.describe('Chrome Extension Basic Tests', () => {
  let browser
  let context
  let page

  test.beforeAll(async () => {
    browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })
    context = browser
  })

  test.afterAll(async () => {
    await browser.close()
  })

  test('extension loads and popup works', async () => {
    // Get extension ID
    const extensions = await browser.serviceWorkers()
    expect(extensions.length).toBeGreaterThan(0)
    
    const extensionId = extensions[0].url().split('/')[2]
    
    // Open popup
    page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`)
    
    // Check popup content
    await expect(page.locator('h3')).toHaveText('Browser History Sync')
    await expect(page.locator('#status')).toHaveText('Active')
    
    // Test clear button
    await page.click('#clear-btn')
    await expect(page.locator('#history-count')).toHaveText('0')
  })

  test('history tracking works', async () => {
    // Navigate to a page
    const testPage = await context.newPage()
    await testPage.goto('https://example.com')
    await testPage.waitForTimeout(1000) // Wait for history to be recorded
    
    // Check if history was recorded
    const result = await testPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['historyItems'], (result) => {
          resolve(result.historyItems || [])
        })
      })
    })
    
    expect(result.length).toBeGreaterThan(0)
    expect(result[result.length - 1].url).toContain('example.com')
  })
})
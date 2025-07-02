import { test, expect, chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.join(__dirname, '../../chrome-extension')

test.describe('Chrome to Chrome Real P2P Sync', () => {
  let browser1, browser2
  let context1, context2
  let extensionId1, extensionId2

  test.beforeAll(async () => {
    // Launch two separate Chrome instances
    const launchOptions = {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    }

    // Browser 1
    browser1 = await chromium.launchPersistentContext(
      path.join(__dirname, '../test-data/profile1'),
      launchOptions
    )
    context1 = browser1

    // Browser 2
    browser2 = await chromium.launchPersistentContext(
      path.join(__dirname, '../test-data/profile2'),
      launchOptions
    )
    context2 = browser2

    // Get extension IDs
    const extensions1 = await browser1.serviceWorkers()
    const extensions2 = await browser2.serviceWorkers()
    extensionId1 = extensions1[0].url().split('/')[2]
    extensionId2 = extensions2[0].url().split('/')[2]
  })

  test.afterAll(async () => {
    await browser1?.close()
    await browser2?.close()
  })

  test('real P2P sync between two Chrome instances', async () => {
    // Generate shared sync key
    const syncKey = `test-sync-${Date.now()}`

    // Open popup in browser 1 and set sync key
    const popup1 = await context1.newPage()
    await popup1.goto(`chrome-extension://${extensionId1}/src/popup.html`)
    await popup1.waitForSelector('#sync-key')
    await popup1.fill('#sync-key', syncKey)
    await popup1.click('#update-key-btn')
    await popup1.waitForTimeout(2000)

    // Open popup in browser 2 and set same sync key
    const popup2 = await context2.newPage()
    await popup2.goto(`chrome-extension://${extensionId2}/src/popup.html`)
    await popup2.waitForSelector('#sync-key')
    await popup2.fill('#sync-key', syncKey)
    await popup2.click('#update-key-btn')
    await popup2.waitForTimeout(2000)

    // Wait for P2P connection
    await popup1.waitForSelector('.connected', { timeout: 10000 })
    await popup2.waitForSelector('.connected', { timeout: 10000 })

    // Browser 1: Navigate to real sites
    const tab1 = await context1.newPage()
    const browser1Urls = [
      'https://news.ycombinator.com',
      'https://github.com',
      'https://stackoverflow.com',
    ]

    for (const url of browser1Urls) {
      await tab1.goto(url, { waitUntil: 'domcontentloaded' })
      await tab1.waitForTimeout(1000)
    }

    // Browser 2: Navigate to different real sites
    const tab2 = await context2.newPage()
    const browser2Urls = ['https://reddit.com', 'https://twitter.com', 'https://linkedin.com']

    for (const url of browser2Urls) {
      await tab2.goto(url, { waitUntil: 'domcontentloaded' })
      await tab2.waitForTimeout(1000)
    }

    // Wait for P2P sync
    await popup1.waitForTimeout(10000)
    await popup2.waitForTimeout(10000)

    // Get history from both browsers
    const history1 = await popup1.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['historyItems'], (result) => {
          resolve(result.historyItems || [])
        })
      })
    })

    const history2 = await popup2.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['historyItems'], (result) => {
          resolve(result.historyItems || [])
        })
      })
    })

    // Verify sync worked
    const urls1 = history1.map((item) => item.url)
    const urls2 = history2.map((item) => item.url)

    // Each browser should have ALL URLs
    for (const url of [...browser1Urls, ...browser2Urls]) {
      expect(urls1).toContain(url)
      expect(urls2).toContain(url)
    }

    // Save sync results
    const syncData = {
      test: 'js-to-js',
      syncKey,
      browser1: {
        deviceId: 'chrome-1',
        browsed: browser1Urls,
        finalHistory: history1,
      },
      browser2: {
        deviceId: 'chrome-2',
        browsed: browser2Urls,
        finalHistory: history2,
      },
      syncSuccess: true,
      timestamp: Date.now(),
    }

    // Save for verification
    const syncDataPath = path.join(__dirname, '../sync-data')
    await fs.mkdir(syncDataPath, { recursive: true })
    await fs.writeFile(
      path.join(syncDataPath, 'chrome-to-chrome.json'),
      JSON.stringify(syncData, null, 2)
    )

    console.log('✓ P2P sync successful between two Chrome instances')
    console.log(`  - Browser 1 history: ${history1.length} items`)
    console.log(`  - Browser 2 history: ${history2.length} items`)
    console.log(`  - Sync key: ${syncKey}`)
  })
})

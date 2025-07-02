import { test, expect, chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.join(__dirname, '../../chrome-extension')

test.describe('Parallel Platform Sync', () => {
  let browser
  let context
  let extensionId

  test.beforeAll(async () => {
    browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })
    context = browser
    
    const extensions = await browser.serviceWorkers()
    extensionId = extensions[0].url().split('/')[2]
  })

  test.afterAll(async () => {
    await browser?.close()
  })

  test('participates in parallel sync with iOS', async () => {
    const syncKey = process.env.SYNC_KEY
    const platform = process.env.PLATFORM || 'chrome'
    
    console.log(`Starting ${platform} sync with key: ${syncKey}`)
    
    // Configure extension with sync key
    const popup = await context.newPage()
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`)
    
    // In real implementation, this would:
    // 1. Configure P2P with the sync key
    // 2. Connect to the relay/network
    // 3. Wait for peer connections
    
    // Navigate to test pages
    const tab = await context.newPage()
    const testUrls = [
      'https://chrome-test-1.example.com',
      'https://chrome-test-2.example.com',
      'https://chrome-test-3.example.com'
    ]
    
    for (const url of testUrls) {
      await tab.goto(url)
      await tab.waitForTimeout(500)
    }
    
    // Wait for potential sync from iOS
    console.log('Waiting for cross-platform sync...')
    await popup.waitForTimeout(5000)
    
    // Check synced history
    const history = await popup.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['historyItems'], (result) => {
          resolve(result.historyItems || [])
        })
      })
    })
    
    // Save sync data for verification
    const syncData = {
      platform,
      timestamp: Date.now(),
      syncKey,
      localHistory: testUrls,
      syncedHistory: history,
      peerConnections: [] // Would contain actual peer info
    }
    
    await fs.mkdir(path.join(__dirname, '../sync-data'), { recursive: true })
    await fs.writeFile(
      path.join(__dirname, `../sync-data/${platform}-sync.json`),
      JSON.stringify(syncData, null, 2)
    )
    
    console.log(`${platform} sync data saved. Total history items: ${history.length}`)
    
    // Verify we have our own history
    expect(history.length).toBeGreaterThanOrEqual(testUrls.length)
    
    // In real implementation, would also verify iOS history items appeared
  })
})
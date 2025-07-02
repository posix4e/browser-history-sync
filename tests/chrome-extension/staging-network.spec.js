import { test, expect, chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.join(__dirname, '../../chrome-extension')

test.describe('Staging Network - Chrome', () => {
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

  test('participates in staging network with all platforms', async () => {
    const stagingKey = process.env.STAGING_KEY
    const deviceId = process.env.DEVICE_ID
    const browseUrls = JSON.parse(process.env.BROWSE_URLS || '[]')
    
    if (!stagingKey || !deviceId) {
      throw new Error('STAGING_KEY and DEVICE_ID must be set')
    }
    
    console.log(`${deviceId} joining staging network with key: ${stagingKey}`)
    
    // Configure extension with staging key
    const popup = await context.newPage()
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`)
    
    // TODO: Configure P2P with staging key when implemented
    
    // Browse assigned URLs
    const tab = await context.newPage()
    const browsedHistory = []
    
    for (const url of browseUrls) {
      console.log(`${deviceId} browsing: ${url}`)
      await tab.goto(url, { waitUntil: 'domcontentloaded' })
      await tab.waitForTimeout(2000)
      
      browsedHistory.push({
        url,
        title: await tab.title(),
        timestamp: Date.now(),
        deviceId
      })
    }
    
    // Wait for sync with other platforms
    console.log(`${deviceId} waiting for cross-platform sync...`)
    await popup.waitForTimeout(30000) // 30 seconds for all platforms to sync
    
    // Get final synced history
    const finalHistory = await popup.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['historyItems'], (result) => {
          resolve(result.historyItems || [])
        })
      })
    })
    
    // Save staging data
    const stagingData = {
      deviceId,
      platform: 'chrome',
      stagingKey,
      browsedUrls: browseUrls,
      browsedHistory,
      finalHistory,
      totalItems: finalHistory.length,
      timestamp: Date.now()
    }
    
    await fs.mkdir(path.join(__dirname, '../staging-data'), { recursive: true })
    await fs.writeFile(
      path.join(__dirname, `../staging-data/${deviceId}.json`),
      JSON.stringify(stagingData, null, 2)
    )
    
    console.log(`${deviceId} saved staging data. Total history items: ${finalHistory.length}`)
    
    // Basic verification - we should have more than just our own history
    expect(finalHistory.length).toBeGreaterThan(browseUrls.length)
  })
})
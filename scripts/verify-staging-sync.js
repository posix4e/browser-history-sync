#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

async function verifyStagingSync(resultsDir) {
  console.log('Verifying staging network sync...')
  
  // Read all device data files
  const devices = []
  const dirs = await readdir(resultsDir)
  
  for (const dir of dirs) {
    if (dir.startsWith('staging-')) {
      const files = await readdir(join(resultsDir, dir))
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await readFile(join(resultsDir, dir, file), 'utf8')
          devices.push(JSON.parse(data))
        }
      }
    }
  }
  
  if (devices.length === 0) {
    throw new Error('No staging data found')
  }
  
  console.log(`Found ${devices.length} devices:`)
  devices.forEach(d => console.log(`  - ${d.deviceId} (${d.platform})`))
  
  // Collect all URLs that were browsed
  const allBrowsedUrls = new Set()
  devices.forEach(device => {
    device.browsedUrls.forEach(url => allBrowsedUrls.add(url))
  })
  
  console.log(`\nTotal unique URLs browsed: ${allBrowsedUrls.size}`)
  
  // Verify each device has all URLs
  let syncSuccess = true
  const report = {
    totalDevices: devices.length,
    totalUrls: allBrowsedUrls.size,
    devices: []
  }
  
  for (const device of devices) {
    const deviceUrls = new Set(device.finalHistory.map(h => h.url))
    const missingUrls = []
    
    for (const url of allBrowsedUrls) {
      if (!deviceUrls.has(url)) {
        missingUrls.push(url)
        syncSuccess = false
      }
    }
    
    const deviceReport = {
      deviceId: device.deviceId,
      platform: device.platform,
      browsedCount: device.browsedUrls.length,
      finalCount: device.finalHistory.length,
      missingUrls,
      syncComplete: missingUrls.length === 0
    }
    
    report.devices.push(deviceReport)
    
    if (missingUrls.length > 0) {
      console.error(`\n✗ ${device.deviceId} missing ${missingUrls.length} URLs:`)
      missingUrls.forEach(url => console.error(`  - ${url}`))
    } else {
      console.log(`\n✓ ${device.deviceId} has all ${allBrowsedUrls.size} URLs`)
    }
  }
  
  // Save report
  report.syncSuccess = syncSuccess
  report.timestamp = Date.now()
  
  await writeFile(
    'staging-sync-report.json',
    JSON.stringify(report, null, 2)
  )
  
  if (!syncSuccess) {
    throw new Error('Staging network sync failed - not all devices have all URLs')
  }
  
  console.log('\n✓ Staging network sync verified successfully!')
}

// Run verification
const resultsDir = process.argv[2] || 'staging-results'
verifyStagingSync(resultsDir).catch(err => {
  console.error('Verification failed:', err)
  process.exit(1)
})
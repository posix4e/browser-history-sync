#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

console.log('Testing Chrome-to-Chrome sync locally...')

// Create test profiles if they don't exist
const testDataDir = path.join(__dirname, '..', 'tests', 'test-data')
const profile1 = path.join(testDataDir, 'profile1')
const profile2 = path.join(testDataDir, 'profile2')

fs.mkdirSync(profile1, { recursive: true })
fs.mkdirSync(profile2, { recursive: true })

// Install dependencies
console.log('Installing dependencies...')
try {
  execSync('npm ci', { stdio: 'inherit' })
  execSync('npm ci', { cwd: path.join(__dirname, '..', 'tests'), stdio: 'inherit' })
} catch (error) {
  console.error('Failed to install dependencies:', error.message)
  process.exit(1)
}

// Install Chrome if needed
console.log('Installing Chromium...')
try {
  execSync('npx playwright install chromium', {
    cwd: path.join(__dirname, '..', 'tests'),
    stdio: 'inherit',
  })
} catch (error) {
  console.error('Failed to install Chromium:', error.message)
  process.exit(1)
}

// Run the sync test
console.log('Running Chrome-to-Chrome sync test...')
const testCommand =
  'npx playwright test chrome-extension/chrome-to-chrome-sync.spec.js --project=chrome-sync'

try {
  if (os.platform() === 'linux') {
    // Linux: use xvfb
    execSync(`xvfb-run -a ${testCommand}`, {
      cwd: path.join(__dirname, '..', 'tests'),
      stdio: 'inherit',
    })
  } else {
    // macOS/other: run directly
    execSync(testCommand, {
      cwd: path.join(__dirname, '..', 'tests'),
      stdio: 'inherit',
    })
  }
  console.log('Test complete! Check tests/playwright-report for results.')
} catch (error) {
  console.error('Test failed:', error.message)
  process.exit(1)
}

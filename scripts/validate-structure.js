#!/usr/bin/env node

import { existsSync } from 'fs'
import { resolve } from 'path'

console.log('Validating project structure...')

const requiredPaths = [
  'chrome-extension',
  'chrome-extension/manifest.json',
  'chrome-extension/package.json',
  'ios-app',
  'shared',
  'shared/package.json',
  'shared/src/index.js',
  'tests',
  'tests/package.json',
  '.github/workflows/main.yml'
]

let hasErrors = false

for (const path of requiredPaths) {
  const fullPath = resolve(process.cwd(), path)
  if (!existsSync(fullPath)) {
    console.error(`✗ Missing: ${path}`)
    hasErrors = true
  } else {
    console.log(`✓ Found: ${path}`)
  }
}

if (hasErrors) {
  console.error('\n✗ Structure validation failed')
  process.exit(1)
} else {
  console.log('\n✓ Structure validation passed')
}
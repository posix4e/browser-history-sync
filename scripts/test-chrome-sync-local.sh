#!/bin/bash

# Script to test Chrome-to-Chrome sync locally

echo "Testing Chrome-to-Chrome sync locally..."

# Create test profiles if they don't exist
mkdir -p tests/test-data/profile1
mkdir -p tests/test-data/profile2

# Install dependencies
echo "Installing dependencies..."
npm ci
cd tests && npm ci && cd ..

# Install Chrome if needed
cd tests && npx playwright install chromium && cd ..

# Run the sync test
echo "Running Chrome-to-Chrome sync test..."
cd tests

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux: use xvfb
    xvfb-run -a npx playwright test chrome-extension/chrome-to-chrome-sync.spec.js --project=chrome-sync
else
    # macOS/other: run directly
    npx playwright test chrome-extension/chrome-to-chrome-sync.spec.js --project=chrome-sync
fi

echo "Test complete! Check tests/playwright-report for results."
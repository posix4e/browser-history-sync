#!/bin/bash

echo "Setting up Browser History Sync project..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Set up Chrome extension
echo "Setting up Chrome extension..."
cd chrome-extension
npm install
cd ..

# Set up shared module
echo "Setting up shared module..."
cd shared
npm install
cd ..

# Set up tests
echo "Setting up tests..."
cd tests
npm install
cd ..

echo "Setup complete! Next steps:"
echo "1. For Chrome extension: cd chrome-extension && load unpacked in Chrome"
echo "2. For iOS app: cd ios-app && pod install && open in Xcode"
echo "3. Run tests: npm test"
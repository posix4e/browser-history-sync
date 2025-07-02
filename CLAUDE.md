# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Setup & Installation
- `npm install` - Install dependencies (creates package-lock.json)
- `npm run setup` - Full project setup (installs all dependencies for all workspaces)
- `npm run setup:chrome` - Setup Chrome extension only
- `npm run setup:shared` - Setup shared P2P module only
- `npm run setup:tests` - Setup tests and install Playwright

### Development & Building
- `npm run build:chrome` - Build Chrome extension
- `npm run package:chrome` - Create Chrome extension .zip file
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run validation and basic tests
- `npm run test:validate` - Validate project structure
- `npm run test:chrome` - Run basic Chrome extension tests
- `npm run test:chrome:sync` - Test Chrome-to-Chrome sync
- `npm run test:chrome:local` - Run Chrome tests with UI (headed mode)
- `npm run test:sync:local` - Run sync tests with UI
- `npm run test:ios` - Run iOS tests via Xcode

To run a single test file:
```bash
cd tests && npx playwright test path/to/test.spec.js
```

## Architecture

This is a monorepo for a P2P browser history sync system with:

1. **Chrome Extension** (`/chrome-extension/`): Manifest V3 extension that tracks browser history
   - Service worker: `src/background.js`
   - Popup UI: `src/popup.js`
   - P2P sync integration in background script

2. **iOS App** (`/ios-app/`): Safari extension for iOS (skeleton implementation)
   - Swift-based Safari Web Extension
   - Hypercore Swift bindings via CocoaPods

3. **Shared Module** (`/shared/`): Core P2P networking using Hypercore/Hyperswarm
   - Provides sync functionality for both platforms
   - Handles peer discovery and data replication

4. **Tests** (`/tests/`): Real P2P testing without mocks
   - Playwright for Chrome extension E2E tests
   - XCTest for iOS tests
   - Cross-platform sync validation

The project follows a "Real P2P Testing" philosophy:
- No mocks - real P2P connections
- No fallbacks - failures are real failures
- Real browser history data
- Real network conditions

## Key Files & Patterns

- **CI/CD Pipeline**: `.github/workflows/main.yml` - Comprehensive GitHub Actions workflow that validates, tests, and deploys
- **Test Configuration**: `tests/playwright.config.js` - Playwright setup for Chrome extension testing
- **Extension Manifest**: `chrome-extension/manifest.json` - Chrome extension configuration
- **Testing Strategy**: `TEST_STRATEGY.md` - Detailed testing philosophy and implementation details

When making changes:
- Follow existing code patterns in each workspace
- Ensure all tests pass before committing
- The CI pipeline runs extensive tests including cross-platform sync validation
- Deployment happens automatically on version tags (to Chrome Web Store and iOS TestFlight)
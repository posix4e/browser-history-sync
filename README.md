# Browser History Sync

Sync browser history between Safari iOS and Chrome desktop using P2P technology based on Hypercore/Hyperswarm.

## Project Structure

```
.
├── chrome-extension/     # Chrome extension
├── ios-app/             # iOS Safari extension (skeleton)
├── shared/              # Shared P2P networking code
├── tests/               # End-to-end tests
├── scripts/             # Helper scripts
└── .github/workflows/   # CI/CD pipeline (main.yml)
```

## Quick Start

```bash
# Clone and setup
git clone <repo>
cd browser-history-sync
npm run setup
```

## Local Development

```bash
# Run tests
npm test                    # Run validation and basic tests
npm run test:chrome:local   # Run Chrome tests with UI
npm run test:sync:local     # Test Chrome-to-Chrome sync

# Build and package
npm run build:chrome        # Build Chrome extension
npm run package:chrome      # Create .zip for Chrome Web Store
```

## CI/CD Pipeline

The project uses a single unified GitHub Actions workflow (`main.yml`) that:

### 1. Validates Structure
- Checks all required directories exist
- Runs linting and formatting

### 2. Runs Platform Tests
- **Chrome**: Playwright tests on Ubuntu
- **iOS**: XCTest on macOS simulators

### 3. Runs Parallel Sync Tests
- Chrome and iOS start simultaneously
- Both connect with the same sync key
- Verification job confirms successful sync

### 4. Deploys on Tags
- Chrome Web Store deployment on `v*` tags
- iOS TestFlight deployment on `v*` tags

## Key Features

- **Parallel Testing**: Chrome and iOS tests run simultaneously and attempt to sync
- **Real P2P Testing**: Tests use actual network conditions
- **Monorepo Structure**: npm workspaces for shared dependencies
- **Minimal Skeleton**: Just enough code to validate CI/CD

## Development Status

- ✅ Repository structure
- ✅ Chrome extension skeleton
- ✅ Shared P2P module
- ✅ Unified CI/CD pipeline
- ✅ Parallel sync testing
- 🚧 iOS app implementation
- 🚧 P2P integration
- 🚧 Full test coverage
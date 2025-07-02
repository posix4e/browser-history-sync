# iOS Browser History Sync

Safari extension for syncing browser history with Chrome desktop.

## Setup

1. Install dependencies:
```bash
pod install
```

2. Open in Xcode:
```bash
open BrowserHistorySync.xcworkspace
```

## Architecture

Based on hyperclip-ios, this app:
- Embeds Bare JavaScript runtime for P2P networking
- Uses Safari Web Extension API for history access
- Communicates between native and JS layers via RPC

## Testing

Tests run automatically in CI via GitHub Actions on macOS runners.
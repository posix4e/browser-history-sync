# Test Strategy - Real P2P Testing

## Core Principles

1. **No Mocks** - Every test uses real P2P connections
2. **No Fallbacks** - If P2P fails, the test fails
3. **No Demos** - All tests use real browser history data
4. **Real Network Conditions** - Tests run on different machines/processes

## Test Phases

### Phase 1: Platform-Local Testing
Run these in parallel, each testing real P2P sync within its platform:

#### JS-to-JS (Chrome-to-Chrome)
- Launch 2+ Chrome instances with the extension
- Each navigates to different sites, creating real history
- They discover each other via P2P and sync
- Verify each Chrome instance has the combined history

#### Swift-to-Swift (iOS-to-iOS) 
- Launch 2+ iOS simulators with the Safari extension
- Each browses different sites in Safari
- They discover each other via P2P and sync
- Verify each iOS device has the combined history

### Phase 2: Staging Network
All platforms join the same P2P network simultaneously:

```
Chrome 1 ←→ Chrome 2
    ↕          ↕
iOS Sim 1 ←→ iOS Sim 2
```

- All 4+ instances start with empty history
- Each browses unique URLs
- Wait for P2P discovery and sync
- Verify ALL instances have ALL history entries

## Implementation Details

### Real History Generation
```javascript
// Chrome instances browse real sites
const chromeUrls = [
  'https://news.ycombinator.com',
  'https://github.com',
  'https://stackoverflow.com'
]

// iOS instances browse different sites
const iosUrls = [
  'https://apple.com',
  'https://developer.apple.com',
  'https://swift.org'
]
```

### P2P Discovery
- Use a shared discovery key per test run
- No hardcoded peers or bootstrap servers
- Real DHT discovery through Hyperswarm

### Success Criteria
- Each device has its own history entries
- Each device has all other devices' history entries
- Sync happens within 30 seconds
- No data loss or duplication

## CI/CD Implementation

### GitHub Actions Jobs
1. **js-js-test** - Ubuntu runner with 2+ Chrome instances
2. **swift-swift-test** - macOS runner with 2+ iOS simulators
3. **staging-network-test** - Multiple runners join same network
4. **verify-staging** - Confirms all platforms synced all data

### Test Data Verification
```javascript
// Each platform saves its final state
{
  "deviceId": "chrome-1",
  "ownHistory": [...],
  "syncedHistory": [...],
  "peers": ["chrome-2", "ios-1", "ios-2"],
  "syncTime": "2024-01-01T12:00:00Z"
}
```

## No Fallbacks Policy

- If P2P connection fails → test fails
- If sync doesn't complete → test fails  
- If any history item is missing → test fails
- No retry logic that masks real issues
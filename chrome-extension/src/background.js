// Import P2P adapter (loaded via script tag in manifest)
let p2pAdapter = null

// Initialize P2P when extension starts
chrome.runtime.onInstalled.addListener(() => {
  console.log('Browser History Sync extension installed')
  initializeP2P()
})

chrome.runtime.onStartup.addListener(() => {
  console.log('Browser History Sync extension started')
  initializeP2P()
})

// Initialize P2P with stored sync key
async function initializeP2P() {
  const { syncKey } = await chrome.storage.sync.get('syncKey')

  if (syncKey) {
    try {
      if (!p2pAdapter) {
        p2pAdapter = new BrowserP2PAdapter()
      }

      await p2pAdapter.initialize(syncKey)
      console.log('P2P initialized with key:', syncKey)

      // Set up history update listener
      p2pAdapter.onHistoryUpdate = (entries) => {
        // Store merged history
        chrome.storage.local.set({
          historyItems: entries,
          lastSync: Date.now(),
        })

        // Update badge with peer count
        const peerCount = p2pAdapter.getPeers().length
        chrome.action.setBadgeText({
          text: peerCount > 0 ? peerCount.toString() : '',
        })
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })
      }

      // Request initial sync from peers
      p2pAdapter.requestSync()
    } catch (error) {
      console.error('Failed to initialize P2P:', error)
    }
  }
}

// Listen for sync key updates from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateSyncKey') {
    updateSyncKey(request.syncKey).then(sendResponse)
    return true // Will respond asynchronously
  }

  if (request.type === 'getSyncStatus') {
    sendResponse({
      connected: p2pAdapter && p2pAdapter.ws && p2pAdapter.ws.readyState === WebSocket.OPEN,
      syncKey: p2pAdapter ? p2pAdapter.getSyncKey() : null,
      peerCount: p2pAdapter ? p2pAdapter.getPeers().length : 0,
      historyCount: p2pAdapter ? p2pAdapter.getHistoryCount() : 0,
    })
    return true
  }

  if (request.type === 'clearHistory') {
    clearHistory().then(sendResponse)
    return true
  }
})

// Update sync key and reinitialize P2P
async function updateSyncKey(newSyncKey) {
  try {
    // Store new sync key
    await chrome.storage.sync.set({ syncKey: newSyncKey })

    // Destroy existing connection
    if (p2pAdapter) {
      p2pAdapter.destroy()
    }

    // Reinitialize with new key
    if (newSyncKey) {
      p2pAdapter = new BrowserP2PAdapter()
      await p2pAdapter.initialize(newSyncKey)

      // Set up history update listener
      p2pAdapter.onHistoryUpdate = (entries) => {
        chrome.storage.local.set({
          historyItems: entries,
          lastSync: Date.now(),
        })
      }

      // Load existing history and sync
      const { historyItems } = await chrome.storage.local.get('historyItems')
      if (historyItems) {
        historyItems.forEach((item) => p2pAdapter.addHistoryEntry(item))
      }

      return { success: true }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to update sync key:', error)
    return { success: false, error: error.message }
  }
}

// Clear all history
async function clearHistory() {
  try {
    await chrome.storage.local.remove(['historyItems', 'lastSync'])
    if (p2pAdapter) {
      p2pAdapter.historyEntries = []
    }
    return { success: true }
  } catch (error) {
    console.error('Failed to clear history:', error)
    return { success: false, error: error.message }
  }
}

// Listen for history changes
chrome.history.onVisited.addListener((historyItem) => {
  console.log('History item visited:', historyItem)

  const entry = {
    url: historyItem.url,
    title: historyItem.title,
    timestamp: historyItem.lastVisitTime,
  }

  // Store locally
  chrome.storage.local.get(['historyItems'], (result) => {
    const items = result.historyItems || []
    items.push({
      ...entry,
      deviceId: p2pAdapter ? p2pAdapter.getDeviceId() : 'unknown',
    })

    // Keep last 1000 items
    const recentItems = items.slice(-1000)
    chrome.storage.local.set({ historyItems: recentItems })
  })

  // Sync via P2P if connected
  if (p2pAdapter && p2pAdapter.ws && p2pAdapter.ws.readyState === WebSocket.OPEN) {
    p2pAdapter.addHistoryEntry(entry)
  }
})

// Generate sync key for new users
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Generate a default sync key for testing
    const defaultKey = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    chrome.storage.sync.set({ syncKey: defaultKey })
  }
})

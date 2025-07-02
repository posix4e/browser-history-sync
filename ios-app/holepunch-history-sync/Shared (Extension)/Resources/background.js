// Safari extension background script with P2P sync
import './p2p-adapter.js'

let p2pAdapter = null

// Initialize extension
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('Browser History Sync Safari extension installed')
  
  if (details.reason === 'install') {
    // Generate default sync key
    const defaultKey = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await browser.storage.sync.set({ syncKey: defaultKey })
  }
  
  initializeP2P()
})

// Initialize P2P connection
async function initializeP2P() {
  const { syncKey } = await browser.storage.sync.get('syncKey')
  
  if (syncKey) {
    try {
      if (!p2pAdapter) {
        p2pAdapter = new window.BrowserP2PAdapter()
      }
      
      await p2pAdapter.initialize(syncKey)
      console.log('P2P initialized with key:', syncKey)
      
      // Set up history update listener
      p2pAdapter.onHistoryUpdate = async (entries) => {
        await browser.storage.local.set({ 
          historyItems: entries,
          lastSync: Date.now()
        })
        
        // Update badge with peer count
        const peerCount = p2pAdapter.getPeers().length
        if (peerCount > 0) {
          await browser.action.setBadgeText({ text: peerCount.toString() })
          await browser.action.setBadgeBackgroundColor({ color: '#4CAF50' })
        } else {
          await browser.action.setBadgeText({ text: '' })
        }
      }
      
      // Request initial sync
      p2pAdapter.requestSync()
      
      // Send native message to app
      await browser.runtime.sendNativeMessage('com.example.BrowserHistorySync', {
        type: 'p2pStatus',
        connected: true,
        syncKey: syncKey
      })
    } catch (error) {
      console.error('Failed to initialize P2P:', error)
    }
  }
}

// Handle messages from popup and native app
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request)
  
  if (request.type === 'updateSyncKey') {
    updateSyncKey(request.syncKey).then(sendResponse)
    return true
  }
  
  if (request.type === 'getSyncStatus') {
    sendResponse({
      connected: p2pAdapter && p2pAdapter.ws && p2pAdapter.ws.readyState === WebSocket.OPEN,
      syncKey: p2pAdapter ? p2pAdapter.getSyncKey() : null,
      peerCount: p2pAdapter ? p2pAdapter.getPeers().length : 0,
      historyCount: p2pAdapter ? p2pAdapter.getHistoryCount() : 0
    })
    return true
  }
  
  if (request.type === 'clearHistory') {
    clearHistory().then(sendResponse)
    return true
  }
})

// Update sync key
async function updateSyncKey(newSyncKey) {
  try {
    await browser.storage.sync.set({ syncKey: newSyncKey })
    
    if (p2pAdapter) {
      p2pAdapter.destroy()
    }
    
    if (newSyncKey) {
      p2pAdapter = new window.BrowserP2PAdapter()
      await p2pAdapter.initialize(newSyncKey)
      
      p2pAdapter.onHistoryUpdate = async (entries) => {
        await browser.storage.local.set({ 
          historyItems: entries,
          lastSync: Date.now()
        })
      }
      
      // Load and sync existing history
      const { historyItems } = await browser.storage.local.get('historyItems')
      if (historyItems) {
        historyItems.forEach(item => p2pAdapter.addHistoryEntry(item))
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update sync key:', error)
    return { success: false, error: error.message }
  }
}

// Clear history
async function clearHistory() {
  try {
    await browser.storage.local.remove(['historyItems', 'lastSync'])
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
browser.history.onVisited.addListener((historyItem) => {
  console.log('History item visited:', historyItem)
  
  const entry = {
    url: historyItem.url,
    title: historyItem.title,
    timestamp: historyItem.lastVisitTime
  }
  
  // Store locally
  browser.storage.local.get(['historyItems']).then((result) => {
    const items = result.historyItems || []
    items.push({
      ...entry,
      deviceId: p2pAdapter ? p2pAdapter.getDeviceId() : 'safari-unknown'
    })
    
    // Keep last 1000 items
    const recentItems = items.slice(-1000)
    browser.storage.local.set({ historyItems: recentItems })
  })
  
  // Sync via P2P if connected
  if (p2pAdapter && p2pAdapter.ws && p2pAdapter.ws.readyState === WebSocket.OPEN) {
    p2pAdapter.addHistoryEntry(entry)
  }
})

// Handle native messages
browser.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('Received native message:', request)
  
  if (request.type === 'getSyncData') {
    browser.storage.local.get(['historyItems', 'lastSync']).then(data => {
      sendResponse({
        historyItems: data.historyItems || [],
        lastSync: data.lastSync,
        deviceId: p2pAdapter ? p2pAdapter.getDeviceId() : null
      })
    })
    return true
  }
})
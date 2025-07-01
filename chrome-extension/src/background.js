// Minimal background script for testing
chrome.history.onVisited.addListener((historyItem) => {
  console.log('History item visited:', historyItem)
  
  // Store in chrome.storage for now (will be replaced with P2P sync)
  chrome.storage.local.get(['historyItems'], (result) => {
    const items = result.historyItems || []
    items.push({
      url: historyItem.url,
      title: historyItem.title,
      timestamp: historyItem.lastVisitTime,
      deviceId: 'chrome-desktop'
    })
    
    // Keep last 100 items
    const recentItems = items.slice(-100)
    chrome.storage.local.set({ historyItems: recentItems })
  })
})
document.addEventListener('DOMContentLoaded', () => {
  // Update history count
  chrome.storage.local.get(['historyItems'], (result) => {
    const items = result.historyItems || []
    document.getElementById('history-count').textContent = items.length
  })
  
  // Clear button
  document.getElementById('clear-btn').addEventListener('click', () => {
    chrome.storage.local.set({ historyItems: [] }, () => {
      document.getElementById('history-count').textContent = '0'
    })
  })
})
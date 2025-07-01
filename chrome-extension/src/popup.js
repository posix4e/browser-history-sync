document.addEventListener('DOMContentLoaded', async () => {
  // Get initial status
  updateStatus()

  // Get and display current sync key
  const { syncKey } = await chrome.storage.sync.get('syncKey')
  if (syncKey) {
    document.getElementById('sync-key').value = syncKey
  }

  // Update sync key button
  document.getElementById('update-key-btn').addEventListener('click', async () => {
    const newKey = document.getElementById('sync-key').value.trim()
    if (!newKey) {
      alert('Please enter a sync key')
      return
    }

    // Disable button during update
    const btn = document.getElementById('update-key-btn')
    btn.disabled = true
    btn.textContent = 'Updating...'

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'updateSyncKey',
        syncKey: newKey,
      })

      if (response.success) {
        btn.textContent = 'Updated!'
        setTimeout(() => {
          btn.textContent = 'Update'
          btn.disabled = false
          updateStatus()
        }, 1500)
      } else {
        alert('Failed to update sync key: ' + (response.error || 'Unknown error'))
        btn.textContent = 'Update'
        btn.disabled = false
      }
    } catch (error) {
      alert('Failed to update sync key: ' + error.message)
      btn.textContent = 'Update'
      btn.disabled = false
    }
  })

  // Copy sync key button
  document.getElementById('copy-key-btn').addEventListener('click', async () => {
    const syncKey = document.getElementById('sync-key').value
    if (!syncKey) {
      alert('No sync key to copy')
      return
    }

    try {
      await navigator.clipboard.writeText(syncKey)
      const btn = document.getElementById('copy-key-btn')
      btn.textContent = 'Copied!'
      setTimeout(() => {
        btn.textContent = 'Copy Sync Key'
      }, 1500)
    } catch (error) {
      alert('Failed to copy: ' + error.message)
    }
  })

  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', () => {
    updateStatus()
  })

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all history?')) {
      return
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'clearHistory',
      })

      if (response.success) {
        document.getElementById('history-count').textContent = '0'
        updateStatus()
      } else {
        alert('Failed to clear history: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      alert('Failed to clear history: ' + error.message)
    }
  })

  // Auto-refresh status every 3 seconds
  setInterval(updateStatus, 3000)
})

async function updateStatus() {
  try {
    // Get sync status from background
    const status = await chrome.runtime.sendMessage({
      type: 'getSyncStatus',
    })

    // Update connection status
    const connStatus = document.getElementById('connection-status')
    if (status.connected) {
      connStatus.textContent = 'Connected'
      connStatus.className = 'status-value connected'
    } else {
      connStatus.textContent = 'Disconnected'
      connStatus.className = 'status-value disconnected'
    }

    // Update peer count
    document.getElementById('peer-count').textContent = status.peerCount || 0

    // Update history count from local storage
    const { historyItems } = await chrome.storage.local.get('historyItems')
    document.getElementById('history-count').textContent = (historyItems || []).length

    // Show peer list if there are peers
    const peerList = document.getElementById('peer-list')
    if (status.peerCount > 0) {
      peerList.style.display = 'block'
      peerList.textContent = `${status.peerCount} peer(s) connected`
    } else {
      peerList.style.display = 'none'
    }
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}

// Browser-compatible P2P adapter using WebSocket relay
class BrowserP2PAdapter {
  constructor() {
    this.syncKey = null
    this.ws = null
    this.peers = new Map()
    this.historyEntries = []
    this.onHistoryUpdate = null
    this.reconnectTimer = null
    this.reconnectDelay = 5000
  }

  async initialize(syncKey, relayUrl = 'wss://relay.holepunch.to') {
    this.syncKey = syncKey
    await this.connect(relayUrl)
  }

  async connect(relayUrl) {
    try {
      this.ws = new WebSocket(relayUrl)

      this.ws.onopen = () => {
        console.log('Connected to P2P relay')
        // Join sync room
        this.send({
          type: 'join',
          room: this.syncKey,
          deviceId: this.getDeviceId(),
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (err) {
          console.error('Failed to parse message:', err)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('Disconnected from P2P relay')
        this.scheduleReconnect()
      }
    } catch (error) {
      console.error('Failed to connect to relay:', error)
      this.scheduleReconnect()
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      console.log('Attempting to reconnect...')
      this.connect(this.ws.url)
    }, this.reconnectDelay)
  }

  handleMessage(message) {
    switch (message.type) {
      case 'peer-joined':
        this.handlePeerJoined(message)
        break
      case 'peer-left':
        this.handlePeerLeft(message)
        break
      case 'history-sync':
        this.handleHistorySync(message)
        break
      case 'sync-request':
        this.handleSyncRequest(message)
        break
    }
  }

  handlePeerJoined(message) {
    console.log('Peer joined:', message.peerId)
    this.peers.set(message.peerId, {
      deviceId: message.deviceId,
      joinedAt: Date.now(),
    })

    // Send our history to the new peer
    this.sendHistoryToPeer(message.peerId)
  }

  handlePeerLeft(message) {
    console.log('Peer left:', message.peerId)
    this.peers.delete(message.peerId)
  }

  handleHistorySync(message) {
    console.log('Received history sync from:', message.peerId)

    // Merge received history with local
    const newEntries = message.entries.filter(
      (entry) =>
        !this.historyEntries.some((e) => e.url === entry.url && e.timestamp === entry.timestamp)
    )

    if (newEntries.length > 0) {
      this.historyEntries.push(...newEntries)
      this.historyEntries.sort((a, b) => b.timestamp - a.timestamp)

      // Notify listeners
      if (this.onHistoryUpdate) {
        this.onHistoryUpdate(this.historyEntries)
      }
    }
  }

  handleSyncRequest(message) {
    // Send our history to requesting peer
    this.sendHistoryToPeer(message.peerId)
  }

  addHistoryEntry(entry) {
    // Add device ID to entry
    const fullEntry = {
      ...entry,
      deviceId: this.getDeviceId(),
      syncTimestamp: Date.now(),
    }

    this.historyEntries.push(fullEntry)

    // Broadcast to all peers
    this.broadcast({
      type: 'history-sync',
      entries: [fullEntry],
    })
  }

  sendHistoryToPeer(peerId) {
    this.send({
      type: 'history-sync',
      to: peerId,
      entries: this.historyEntries,
    })
  }

  requestSync() {
    this.broadcast({
      type: 'sync-request',
    })
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          ...message,
          from: this.getDeviceId(),
        })
      )
    }
  }

  broadcast(message) {
    this.send({
      ...message,
      broadcast: true,
    })
  }

  getDeviceId() {
    // Get or generate persistent device ID
    const storedId = localStorage.getItem('deviceId')
    if (storedId) return storedId

    const newId = `chrome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('deviceId', newId)
    return newId
  }

  getSyncKey() {
    return this.syncKey
  }

  getPeers() {
    return Array.from(this.peers.entries()).map(([id, info]) => ({
      id,
      ...info,
    }))
  }

  getHistoryCount() {
    return this.historyEntries.length
  }

  destroy() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.peers.clear()
    this.historyEntries = []
  }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserP2PAdapter
}

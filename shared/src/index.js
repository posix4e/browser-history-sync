import Hypercore from 'hypercore'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import { randomBytes } from 'crypto'

export class BrowserHistorySync {
  constructor(storage, options = {}) {
    this.storage = storage
    this.core = null
    this.swarm = null
    this.key = options.key || null
    this.onHistoryEntry = options.onHistoryEntry || (() => {})
  }

  async init() {
    this.core = new Hypercore(this.storage, this.key)
    await this.core.ready()
    
    this.key = this.core.key
    
    this.swarm = new Hyperswarm()
    
    this.swarm.on('connection', (conn) => {
      this.core.replicate(conn)
    })
    
    const discovery = this.swarm.join(this.core.discoveryKey)
    await discovery.flushed()
    
    this.core.on('append', () => {
      this.handleNewEntries()
    })
    
    await this.handleNewEntries()
  }

  async handleNewEntries() {
    const length = this.core.length
    if (length === 0) return
    
    const lastEntry = await this.core.get(length - 1)
    const data = JSON.parse(lastEntry.toString())
    this.onHistoryEntry(data)
  }

  async addHistoryEntry(entry) {
    const data = {
      ...entry,
      timestamp: Date.now(),
      deviceId: this.getDeviceId()
    }
    
    await this.core.append(Buffer.from(JSON.stringify(data)))
  }

  getDeviceId() {
    return process.env.DEVICE_ID || 'unknown'
  }

  getDiscoveryKey() {
    return b4a.toString(this.core.discoveryKey, 'hex')
  }

  async destroy() {
    await this.swarm?.destroy()
    await this.core?.close()
  }
}

export function generateKey() {
  return randomBytes(32)
}
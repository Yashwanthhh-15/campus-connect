// src/services/localApiService.ts
// All API calls when in LOCAL mode — talks to server.cjs instead of Firebase

export interface LocalPost {
  id: string; authorUid: string; authorName: string
  authorInitials: string; authorAvatarColor: string; authorRole: string
  caption: string; tags: string[]
  mediaEmoji: string; mediaCaption: string; mediaColor: string
  type: string; likes: string[]; commentCount: number
  createdAt: number
}

export interface LocalMessage {
  type: string; room: string; fromUid: string
  from: string; text: string; ts: number; self?: boolean
}

class LocalAPI {
  private baseURL = ''
  private ws: WebSocket | null = null
  private wsHandlers: Map<string, ((d: any) => void)[]> = new Map()
  private clientId = ''
  private reconnectTimer: any = null

  setBaseURL(url: string) {
    this.baseURL = url
  }

  // ── REST ──────────────────────────────────────────────────
  async getPosts(): Promise<LocalPost[]> {
    const res = await fetch(`${this.baseURL}/api/posts`)
    return res.json()
  }

  async createPost(data: Omit<LocalPost, 'id' | 'likes' | 'commentCount' | 'createdAt'>) {
    const res = await fetch(`${this.baseURL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  async likePost(postId: string, uid: string) {
    const res = await fetch(`${this.baseURL}/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
    return res.json()
  }

  async getTrends() {
    const res = await fetch(`${this.baseURL}/api/trends`)
    return res.json()
  }

  async getStudents() {
    const res = await fetch(`${this.baseURL}/api/students`)
    return res.json()
  }

  async getMessages(room: string) {
    const res = await fetch(`${this.baseURL}/api/messages/${room}`)
    return res.json()
  }

  async sendPulse(text: string, subtype = 'ANNOUNCE') {
    const res = await fetch(`${this.baseURL}/api/pulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, subtype }),
    })
    return res.json()
  }

  // ── WebSocket ─────────────────────────────────────────────
  connectWS(name: string, uid: string, room = 'global') {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const wsURL = this.baseURL.replace('http://', 'ws://').replace(':3000', ':3001')
    
    try {
      this.ws = new WebSocket(wsURL)

      this.ws.onopen = () => {
        console.log('[WS] Connected to campus mesh')
      }

      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'HANDSHAKE') {
            this.clientId = data.clientId
            this.sendWS({ type: 'REGISTER', name, uid, room })
          }
          const handlers = this.wsHandlers.get(data.type) || []
          handlers.forEach(h => h(data))
          const allHandlers = this.wsHandlers.get('*') || []
          allHandlers.forEach(h => h(data))
        } catch {}
      }

      this.ws.onclose = () => {
        console.log('[WS] Disconnected — retrying in 3s')
        this.reconnectTimer = setTimeout(() => this.connectWS(name, uid, room), 3000)
      }

      this.ws.onerror = () => {}

    } catch (e) {
      console.error('[WS] Could not connect', e)
    }
  }

  sendWS(payload: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  sendMessage(text: string) {
    this.sendWS({ type: 'ROOM_MSG', text })
  }

  sendDM(toUid: string, text: string) {
    this.sendWS({ type: 'DM', toUid, text })
  }

  on(type: string, handler: (d: any) => void) {
    if (!this.wsHandlers.has(type)) this.wsHandlers.set(type, [])
    this.wsHandlers.get(type)!.push(handler)
  }

  off(type: string, handler: (d: any) => void) {
    const list = this.wsHandlers.get(type) || []
    this.wsHandlers.set(type, list.filter(h => h !== handler))
  }

  disconnect() {
    clearTimeout(this.reconnectTimer)
    if (this.ws) { this.ws.onclose = null; this.ws.close() }
    this.ws = null
  }
}

export const localAPI = new LocalAPI()

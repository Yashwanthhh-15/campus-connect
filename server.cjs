/**
 * CampusConnect+ — Local Mesh Edge Node
 * Run: node server.cjs
 * Everyone on same WiFi opens: http://campusconnect.local:3000
 */

const express   = require('express')
const http      = require('http')
const WebSocket = require('ws')
const os        = require('os')
const path      = require('path')
const fs        = require('fs')

// ── Config ────────────────────────────────────────────────────
const HTTP_PORT = 3000
const WS_PORT   = 3001
const DIST_DIR  = path.join(__dirname, 'dist')

// ── Get local IP ──────────────────────────────────────────────
function getLocalIP() {
  const ifaces = os.networkInterfaces()
  const skip = ['virtualbox','vmware','vethernet','loopback','pseudo']
  for (const [name, iface] of Object.entries(ifaces)) {
    if (skip.some(k => name.toLowerCase().includes(k))) continue
    for (const entry of (iface || [])) {
      if (entry.family === 'IPv4' && !entry.internal) {
        if (entry.address.startsWith('192.168.56.')) continue
        return entry.address
      }
    }
  }
  return '127.0.0.1'
}

const LOCAL_IP = getLocalIP()

// ── mDNS — broadcast as campusconnect.local ───────────────────
try {
  const { Bonjour } = require('bonjour-service')
  const bonjour = new Bonjour()
  bonjour.publish({ name: 'CampusConnect', type: 'http', port: HTTP_PORT, host: 'campusconnect.local' })
  console.log('📡 mDNS: campusconnect.local is broadcasting')
  process.on('SIGINT', () => bonjour.destroy())
} catch (e) {
  console.log('⚠️  mDNS not available (run: npm install bonjour-service)')
}

// ── Express app ───────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)

app.use(express.json())

// CORS — allow requests from any origin on local network
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Serve the built React app
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
}

// Health check
app.get('/ping', (_, res) => {
  res.json({ status: 'LOCAL', serverIP: LOCAL_IP, port: HTTP_PORT, wsPort: WS_PORT, ts: Date.now() })
})

// ── In-memory stores ──────────────────────────────────────────
const clients  = new Map()
const messages = []
const posts    = []
const users    = new Map()
const trends   = [
  { tag: '#CampusLife', count: 0 },
  { tag: '#TechFest',   count: 0 },
  { tag: '#Hackathon',  count: 0 },
]

// ── REST: Auth ────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, branch, semester, uid, email, handle, avatarColor, initials } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })
  const colors = ['#f0e6ff','#e6f5ec','#e6eeff','#fff0e6','#ffe6ec','#e6fff5']
  const profile = {
    uid:            uid || ('local_' + Date.now()),
    name,
    email:          email || (name.toLowerCase().replace(/\s+/g,'.') + '@campus.local'),
    handle:         handle || ('@' + name.toLowerCase().replace(/\s+/g,'.')),
    branch:         branch || 'CSE',
    semester:       semester || 'Sem 1',
    university:     'My University',
    bio:            '',
    roles:          ['Student'],
    avatarColor:    avatarColor || colors[Math.floor(Math.random() * colors.length)],
    initials:       initials || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2),
    followersCount: 0,
    followingCount: 0,
    createdAt:      Date.now(),
  }
  users.set(profile.uid, profile)
  console.log(`[AUTH] Registered: ${profile.name}`)
  res.json({ ok: true, profile })
})

app.post('/api/auth/login', (req, res) => {
  const { uid, email } = req.body
  // Try find by uid first, then email
  let profile = uid ? users.get(uid) : null
  if (!profile && email) {
    profile = [...users.values()].find(u => u.email === email) || null
  }
  if (!profile) return res.status(404).json({ error: 'User not found. Create account first.' })
  res.json({ ok: true, profile })
})

app.get('/api/auth/user/:uid', (req, res) => {
  const profile = users.get(req.params.uid)
  if (!profile) return res.status(404).json({ error: 'Not found' })
  res.json(profile)
})

// ── REST: Posts ───────────────────────────────────────────────
app.get('/api/posts', (_, res) => {
  res.json([...posts].reverse().slice(0, 30))
})

app.post('/api/posts', (req, res) => {
  const post = {
    id:                Date.now().toString(),
    authorUid:         req.body.authorUid         || 'anon',
    authorName:        req.body.authorName         || 'Anonymous',
    authorInitials:    req.body.authorInitials      || 'AN',
    authorAvatarColor: req.body.authorAvatarColor   || '#e6f5ec',
    authorRole:        req.body.authorRole          || 'Student',
    caption:           req.body.caption             || '',
    tags:              req.body.tags                || [],
    mediaEmoji:        req.body.mediaEmoji          || '📸',
    mediaCaption:      req.body.mediaCaption        || '',
    mediaColor:        req.body.mediaColor          || '#f0e6ff',
    type:              'photo',
    likes:             [],
    commentCount:      0,
    createdAt:         Date.now(),
  }
  posts.push(post)
  broadcast({ type: 'NEW_POST', post })
  post.tags.forEach(tag => {
    const t = trends.find(t => t.tag === tag)
    if (t) t.count++
    else trends.push({ tag, count: 1 })
  })
  res.json({ ok: true, post })
})

app.post('/api/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === req.params.id)
  if (!post) return res.status(404).json({ error: 'not found' })
  const uid = req.body.uid
  if (post.likes.includes(uid)) post.likes = post.likes.filter(u => u !== uid)
  else post.likes.push(uid)
  broadcast({ type: 'POST_LIKED', postId: post.id, likes: post.likes })
  res.json({ ok: true, likes: post.likes })
})

// ── REST: Messages ────────────────────────────────────────────
app.get('/api/messages/:room', (req, res) => {
  res.json(messages.filter(m => m.room === req.params.room).slice(-100))
})

// ── REST: Trends ──────────────────────────────────────────────
app.get('/api/trends', (_, res) => {
  res.json([...trends].sort((a, b) => b.count - a.count).slice(0, 10))
})

// ── REST: Connected students ──────────────────────────────────
app.get('/api/students', (_, res) => {
  const list = []
  clients.forEach(({ name, uid }) => list.push({ name, uid }))
  res.json({ count: list.length, students: list })
})

// ── REST: Pulse ───────────────────────────────────────────────
app.post('/api/pulse', (req, res) => {
  const pulse = { type: 'PULSE', subtype: req.body.subtype || 'ANNOUNCE', from: req.body.from || 'Admin', text: req.body.text || '', ts: Date.now() }
  broadcast(pulse)
  res.json({ ok: true, delivered: clients.size })
})

// Catch-all → serve React app
app.get('/{*path}', (_, res) => {
  if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  } else {
    res.json({ status: 'LOCAL', message: 'Run npm run build first to serve the frontend.' })
  }
})

// ── WebSocket server ──────────────────────────────────────────
const wss = new WebSocket.Server({ port: WS_PORT })

function broadcast(payload, excludeId = null) {
  const data = JSON.stringify(payload)
  clients.forEach(({ ws }, id) => {
    if (id !== excludeId && ws.readyState === WebSocket.OPEN) ws.send(data)
  })
}

function broadcastRoom(room, payload, excludeId = null) {
  const data = JSON.stringify(payload)
  clients.forEach(({ ws, room: r }, id) => {
    if (r === room && id !== excludeId && ws.readyState === WebSocket.OPEN) ws.send(data)
  })
}

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).slice(2)
  clients.set(clientId, { ws, name: 'Unknown', uid: '', room: 'global' })
  ws.send(JSON.stringify({ type: 'HANDSHAKE', clientId, serverIP: LOCAL_IP }))

  ws.on('message', raw => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch { return }
    const client = clients.get(clientId)
    if (!client) return

    switch (msg.type) {
      case 'REGISTER':
        client.name = msg.name || 'Unknown'
        client.uid  = msg.uid  || ''
        client.room = msg.room || 'global'
        console.log(`[MESH] ${client.name} joined`)
        broadcast({ type: 'USER_JOINED', name: client.name, count: clients.size })
        break

      case 'ROOM_MSG': {
        const payload = { type: 'ROOM_MSG', room: client.room, fromId: clientId, fromUid: client.uid, from: client.name, text: msg.text, ts: Date.now() }
        messages.push({ ...payload, room: client.room })
        if (messages.length > 500) messages.shift()
        ws.send(JSON.stringify({ ...payload, self: true }))
        broadcastRoom(client.room, payload, clientId)
        break
      }

      case 'DM': {
        const target = [...clients.entries()].find(([, c]) => c.uid === msg.toUid)
        if (target) {
          const [, { ws: targetWs }] = target
          if (targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({ type: 'DM', fromUid: client.uid, from: client.name, text: msg.text, ts: Date.now() }))
          }
        }
        break
      }

      case 'PULSE':
        broadcast({ type: 'PULSE', subtype: msg.subtype || 'ANNOUNCE', from: client.name, text: msg.text, ts: Date.now() })
        break

      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }))
        break
    }
  })

  ws.on('close', () => {
    const client = clients.get(clientId)
    if (client) {
      console.log(`[MESH] ${client.name} left`)
      broadcast({ type: 'USER_LEFT', name: client.name, count: clients.size - 1 })
    }
    clients.delete(clientId)
  })

  ws.on('error', err => console.error('[WS Error]', err.message))
})

// ── Start ─────────────────────────────────────────────────────
server.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║      CampusConnect+ · Local Mesh Server      ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║  App   →  http://campusconnect.local:${HTTP_PORT}   ║`)
  console.log(`║  App   →  http://${LOCAL_IP}:${HTTP_PORT} (fallback) ║`)
  console.log(`║  API   →  http://${LOCAL_IP}:${HTTP_PORT}/ping       ║`)
  console.log(`║  WS    →  ws://${LOCAL_IP}:${WS_PORT}               ║`)
  console.log('║  Mode  →  LOCAL MESH (no internet needed)    ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('\n📱 Friends on same WiFi open:')
  console.log(`   http://campusconnect.local:${HTTP_PORT}`)
  console.log(`   http://${LOCAL_IP}:${HTTP_PORT} (if .local doesn't work)\n`)
})

process.on('SIGINT', () => {
  console.log('\n[SERVER] Shutting down...')
  wss.close()
  server.close(() => process.exit(0))
})

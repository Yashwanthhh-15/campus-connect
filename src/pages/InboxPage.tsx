// src/pages/InboxPage.tsx
import React, { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  subscribeThreads, subscribeMessages, sendMessage,
  markRead, Thread, Message, fmtTime,
} from '../services/messageService'

export default function InboxPage() {
  const { profile } = useAuthStore()
  const [threads, setThreads]           = useState<Thread[]>([])
  const [active,  setActive]            = useState<Thread | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [text,    setText]              = useState('')
  const [sending, setSending]           = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) return
    return subscribeThreads(profile.uid, setThreads)
  }, [profile?.uid])

  useEffect(() => {
    if (!active || !profile) return
    markRead(active.id, profile.uid)
    return subscribeMessages(active.id, msgs => {
      setMessages(msgs)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 80)
    })
  }, [active?.id])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !profile || !active) return
    const other = active.participants.find(p => p !== profile.uid) || ''
    setSending(true)
    try {
      await sendMessage(active.id, profile.uid, profile.name, text.trim(), other)
      setText('')
    } finally { setSending(false) }
  }

  if (!active) return (
    <div className="page-scroll page-enter">
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ fontFamily:'var(--head)', fontSize:26, fontWeight:800, letterSpacing:-.5 }}>Inbox ✉</div>
        <div style={{ fontSize:11, color:'var(--ink3)', fontWeight:500, marginTop:3 }}>
          {threads.length ? `${threads.length} conversations` : 'No messages yet'}
        </div>
      </div>
      <div style={{ margin:'12px 20px 0', background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--rsm)', padding:'10px 13px', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--lime)', flexShrink:0 }} />
        <span style={{ fontSize:11, color:'var(--ink2)', fontWeight:500 }}>Messages sync via <strong>Firebase Cloud</strong> — works anywhere</span>
      </div>
      <div style={{ padding:'4px 20px' }}>
        {threads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">✉️</div>
            <div className="empty-title">No conversations yet</div>
            <div className="empty-sub">Find teammates on Scroll and start chatting</div>
          </div>
        ) : threads.map(t => {
          if (!profile) return null
          const other    = t.participants.find(p => p !== profile.uid) || ''
          const name     = t.participantNames[other] || 'Unknown'
          const initials = t.participantInitials[other] || '?'
          const color    = t.participantAvatarColors[other] || 'var(--cream)'
          const unread   = t.unreadCount[profile.uid] || 0
          return (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:13, paddingTop:13, borderBottom:'1.5px solid var(--border)', cursor:'pointer' }} onClick={()=>setActive(t)}>
              <div style={{ width:44, height:44, borderRadius:14, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--head)', fontSize:13, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>{initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>{name}</span>
                  <span style={{ fontSize:10, color:'var(--ink4)', fontWeight:500 }}>{fmtTime(t.lastMessageAt)}</span>
                </div>
                <div style={{ fontSize:12, color:'var(--ink3)', fontWeight:500, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.lastMessage || 'No messages yet'}</div>
              </div>
              {unread > 0 && <div style={{ minWidth:20, height:20, borderRadius:10, background:'var(--coral)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', padding:'0 5px' }}>{unread}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )

  const other     = active.participants.find(p => p !== profile?.uid) || ''
  const otherName = active.participantNames[other] || 'Chat'
  const otherInit = active.participantInitials[other] || '?'
  const otherClr  = active.participantAvatarColors[other] || 'var(--cream)'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 20px', borderBottom:'1.5px solid var(--border)', display:'flex', alignItems:'center', gap:10, background:'var(--white)', flexShrink:0 }}>
        <button onClick={()=>{ setActive(null); setMessages([]) }} style={{ fontSize:20, background:'none', border:'none', cursor:'pointer', color:'var(--ink)', lineHeight:1, padding:0, marginRight:4 }}>←</button>
        <div style={{ width:36, height:36, borderRadius:12, background:otherClr, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--head)', fontSize:12, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>{otherInit}</div>
        <div>
          <div style={{ fontFamily:'var(--head)', fontSize:14, fontWeight:800 }}>{otherName}</div>
          <div style={{ fontSize:10, color:'#2d6000', fontWeight:600 }}>● Active</div>
        </div>
      </div>
      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map(msg => {
          const mine = msg.fromUid === profile?.uid
          return (
            <div key={msg.id} style={{ maxWidth:'75%', alignSelf: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ padding:'11px 14px', borderRadius:15, background: mine ? 'var(--ink)' : 'var(--white)', border: mine ? 'none' : '1.5px solid var(--border)', borderBottomRightRadius: mine ? 4 : 15, borderBottomLeftRadius: mine ? 15 : 4 }}>
                <span style={{ fontSize:13, fontWeight:500, color: mine ? '#fff' : 'var(--ink)', lineHeight:1.5 }}>{msg.text}</span>
              </div>
              <div style={{ fontSize:9, color:'var(--ink4)', marginTop:3, textAlign: mine ? 'right' : 'left', fontWeight:500 }}>{fmtTime(msg.createdAt)}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <form onSubmit={send} style={{ display:'flex', gap:8, padding:'12px 20px', borderTop:'1.5px solid var(--border)', background:'var(--white)', flexShrink:0 }}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Message..." disabled={sending}
          style={{ flex:1, background:'var(--cream)', border:'1.5px solid var(--border2)', borderRadius:'var(--rpill)', padding:'10px 16px', fontSize:13, fontWeight:500, color:'var(--ink)', outline:'none', fontFamily:'var(--font)' }} />
        <button type="submit" disabled={!text.trim()||sending} style={{ width:40, height:40, borderRadius:'50%', background:'var(--ink)', border:'none', color:'#fff', fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: !text.trim()||sending ? .4 : 1 }}>➤</button>
      </form>
    </div>
  )
}

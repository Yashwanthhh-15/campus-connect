// src/pages/ScrollPage.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useFeedStore } from '../store/feedStore'
import { subscribeToPosts, createPost, toggleLike, fmtTime, Post } from '../services/postService'
import { subscribeSquads, postSquad, SquadRequest, fmtTime as sqFmt } from '../services/squadService'

const MEDIA = [
  { emoji:'🏆', caption:'Event / Competition', color:'#f0e6ff' },
  { emoji:'💻', caption:'Dev / Tech',          color:'#e6f5ec' },
  { emoji:'🎵', caption:'Music / Performance', color:'#0a2010' },
  { emoji:'⚽', caption:'Sports',              color:'#001a30' },
  { emoji:'🎭', caption:'Arts / Drama',        color:'#1a1000' },
  { emoji:'📸', caption:'Campus Life',         color:'#fff0e6' },
  { emoji:'🎤', caption:'Talk / Pitch',        color:'#200018' },
  { emoji:'🔬', caption:'Research',            color:'#e6f0ff' },
]
const ALL_SKILLS = ['React','Node.js','Python','Figma','Flutter','ML/AI','Arduino','UI/UX','Marketing','Firebase','Java','C++']
const SIZES      = ['2–3','4–5','6+']
const REELS      = [
  {id:'1',label:'Hackathon',emoji:'🏆',bg:'#1a1a2e'},
  {id:'2',label:'Raga Jam', emoji:'🎵',bg:'#0a2010'},
  {id:'3',label:'Dance',    emoji:'💃',bg:'#200018'},
  {id:'4',label:'Football', emoji:'⚽',bg:'#001a30'},
]

export default function ScrollPage() {
  const { profile } = useAuthStore()
  const { seconds, running, locked, lockdown, start, pause, tick, tickLock, unlock } = useFeedStore()

  const [posts,  setPosts]   = useState<Post[]>([])
  const [squads, setSquads]  = useState<SquadRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Post modal
  const [showPost,  setShowPost]   = useState(false)
  const [caption,   setCaption]    = useState('')
  const [selMedia,  setSelMedia]   = useState(MEDIA[0])
  const [posting,   setPosting]    = useState(false)

  // Squad modal
  const [showSquad, setShowSquad]  = useState(false)
  const [sqTitle,   setSqTitle]    = useState('')
  const [sqEvent,   setSqEvent]    = useState('')
  const [sqRoles,   setSqRoles]    = useState('')
  const [sqDesc,    setSqDesc]     = useState('')
  const [sqSkills,  setSqSkills]   = useState<string[]>([])
  const [sqSize,    setSqSize]     = useState('2–3')
  const [sqPosting, setSqPosting]  = useState(false)

  const scrollRef  = useRef<HTMLDivElement>(null)
  const pauseTimer = useRef<ReturnType<typeof setTimeout>>()

  // Global timer tick
  useEffect(() => {
    const id = setInterval(() => { tick(); tickLock() }, 1000)
    return () => clearInterval(id)
  }, [])

  // Scroll detection
  const onScroll = useCallback(() => {
    if (locked) return
    start()
    clearTimeout(pauseTimer.current)
    pauseTimer.current = setTimeout(pause, 1800)
  }, [locked, start, pause])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onScroll])

  // Live data
  useEffect(() => {
    setLoading(true)
    const unsub = subscribeToPosts(p => { setPosts(p); setLoading(false) })
    return unsub
  }, [])
  useEffect(() => {
    const unsub = subscribeSquads(setSquads)
    return unsub
  }, [])

  const pct      = seconds / 900
  const barColor = pct < 0.2 ? 'var(--coral)' : pct < 0.45 ? 'var(--amber)' : 'var(--lime)'
  const timeClr  = pct < 0.2 ? 'var(--coral)' : pct < 0.45 ? '#7a4e00' : '#2d6000'
  const mins     = String(Math.floor(seconds/60)).padStart(2,'0')
  const secs     = String(seconds%60).padStart(2,'0')
  const lockMins = String(Math.floor(lockdown/60)).padStart(2,'0')
  const lockSecs = String(lockdown%60).padStart(2,'0')

  async function submitPost(e: React.FormEvent) {
    e.preventDefault()
    if (!caption.trim() || !profile) return
    setPosting(true)
    try {
      await createPost({
        authorUid: profile.uid, authorName: profile.name,
        authorInitials: profile.initials, authorAvatarColor: profile.avatarColor,
        authorRole: profile.roles[0] || 'Student',
        caption: caption.trim(),
        tags: caption.match(/#\w+/g) || [],
        mediaEmoji: selMedia.emoji, mediaCaption: selMedia.caption, mediaColor: selMedia.color,
        type: 'photo',
      })
      setCaption(''); setSelMedia(MEDIA[0]); setShowPost(false)
    } finally { setPosting(false) }
  }

  async function submitSquad(e: React.FormEvent) {
    e.preventDefault()
    if (!sqTitle.trim() || !sqEvent.trim() || !profile) return
    setSqPosting(true)
    try {
      await postSquad({
        ownerUid: profile.uid, ownerName: profile.name,
        ownerInitials: profile.initials, ownerAvatarColor: profile.avatarColor,
        ownerBranch: profile.branch,
        title: sqTitle.trim(), eventName: sqEvent.trim(),
        description: sqDesc.trim(), skills: sqSkills,
        teamSize: sqSize,
      })
      setSqTitle(''); setSqEvent(''); setSqRoles(''); setSqDesc(''); setSqSkills([]); setSqSize('2–3')
      setShowSquad(false)
    } finally { setSqPosting(false) }
  }

  return (
    <>
      <div ref={scrollRef} className="page-scroll page-enter">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'16px 20px 0' }}>
          <div>
            <div style={{ fontFamily:'var(--head)', fontSize:26, fontWeight:800, letterSpacing:-.5 }}>Scroll ✦</div>
            <div style={{ fontSize:11, color:'var(--ink3)', fontWeight:500, marginTop:3 }}>Your campus · live</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', fontFamily:'var(--head)', letterSpacing:.5, textTransform:'uppercase' }}>Focus Guard</div>
            <div style={{ fontSize:14, fontWeight:800, fontFamily:'var(--head)', color: timeClr }}>{mins}:{secs}</div>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ padding:'8px 20px 0' }}>
          <div style={{ height:6, background:'var(--border)', borderRadius:'var(--rpill)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct*100}%`, background: barColor, borderRadius:'var(--rpill)', transition:'width .9s linear, background .4s' }} />
          </div>
          <div style={{ fontSize:10, color:'var(--ink4)', fontWeight:500, marginTop:5 }}>
            {locked ? '🔒 Locked for this hour' : seconds===900 ? 'Starts counting when you scroll' : running ? '⏱ Running' : '⏸ Paused'}
          </div>
        </div>

        {locked ? (
          /* LOCK SCREEN */
          <div className="empty-state" style={{ paddingTop:60 }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, marginBottom:22 }}>🔒</div>
            <div style={{ fontFamily:'var(--head)', fontSize:22, fontWeight:800, marginBottom:8 }}>Time's up for now</div>
            <div style={{ fontSize:13, color:'var(--ink3)', fontWeight:500, lineHeight:1.6, marginBottom:22, maxWidth:270, textAlign:'center' }}>
              You've used your 15-minute scroll limit. Feed unlocks automatically.
            </div>
            <div style={{ fontFamily:'var(--head)', fontSize:40, fontWeight:800, marginBottom:24 }}>{lockMins}:{lockSecs}</div>
            <button className="btn-primary" style={{ maxWidth:280 }} onClick={unlock}>Skip (uses next hour's time)</button>
          </div>
        ) : (
          <>
            {/* Create post bar */}
            <div style={{ margin:'14px 20px 0', padding:'11px 13px', background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={()=>setShowPost(true)}>
              <div style={{ width:34, height:34, borderRadius:10, background: profile?.avatarColor||'var(--lime)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>{profile?.initials||'?'}</div>
              <div style={{ flex:1, fontSize:13, color:'var(--ink4)', fontWeight:500 }}>What's happening on campus?</div>
              <div style={{ background:'var(--ink)', borderRadius:'var(--rpill)', padding:'7px 14px', fontSize:11, fontWeight:800, color:'#fff' }}>Post</div>
            </div>

            {/* Squad requests */}
            {squads.length > 0 && (
              <div style={{ marginTop:18 }}>
                <div className="row-hdr">
                  <div className="row-title">Find your squad 🤝</div>
                  <div className="row-more" onClick={()=>setShowSquad(true)}>+ Post one</div>
                </div>
                <div className="hscroll">
                  {squads.map(sq => (
                    <div key={sq.id} style={{ width:255, flexShrink:0, background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', padding:14, position:'relative', overflow:'hidden', cursor:'pointer' }}>
                      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'var(--purple)' }} />
                      <div style={{ fontSize:8, fontWeight:800, color:'var(--purple)', letterSpacing:1, textTransform:'uppercase', marginBottom:4, fontFamily:'var(--head)' }}>🟣 {sq.ownerBranch} · Open</div>
                      <div style={{ fontFamily:'var(--head)', fontSize:13, fontWeight:800, marginBottom:3 }}>{sq.title}</div>
                      <div style={{ fontSize:10, color:'var(--ink3)', fontWeight:500, marginBottom:8 }}>{sq.ownerName} · {sqFmt(sq.createdAt)}</div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {sq.skills.slice(0,3).map(s => <span key={s} className="stag stag-lime">{s}</span>)}
                      </div>
                    </div>
                  ))}
                  <div style={{ width:255, flexShrink:0, background:'var(--cream)', border:'2px dashed var(--border2)', borderRadius:'var(--r)', padding:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer' }} onClick={()=>setShowSquad(true)}>
                    <div style={{ fontSize:24 }}>+</div>
                    <div style={{ fontFamily:'var(--head)', fontSize:12, fontWeight:800, color:'var(--ink3)' }}>Post a Squad Request</div>
                  </div>
                </div>
              </div>
            )}

            {squads.length === 0 && (
              <div style={{ marginTop:18 }}>
                <div className="row-hdr">
                  <div className="row-title">Find your squad 🤝</div>
                  <div className="row-more" onClick={()=>setShowSquad(true)}>+ Post one</div>
                </div>
                <div style={{ margin:'0 20px', padding:20, background:'var(--cream)', border:'2px dashed var(--border2)', borderRadius:'var(--r)', textAlign:'center', cursor:'pointer' }} onClick={()=>setShowSquad(true)}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🤝</div>
                  <div style={{ fontFamily:'var(--head)', fontSize:13, fontWeight:800, color:'var(--ink3)' }}>No squad requests yet — be the first!</div>
                </div>
              </div>
            )}

            {/* Reels */}
            <div style={{ marginTop:18 }}>
              <div className="row-hdr"><div className="row-title">Reels 🎬</div></div>
              <div className="hscroll">
                {REELS.map(r => (
                  <div key={r.id} style={{ width:90, height:140, borderRadius:'var(--r)', flexShrink:0, background:r.bg, overflow:'hidden', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <div style={{ fontSize:36, opacity:.6 }}>{r.emoji}</div>
                    <div style={{ position:'absolute', width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>▶</div>
                    <div style={{ position:'absolute', bottom:7, left:0, right:0, textAlign:'center', fontSize:9, fontWeight:700, color:'#fff', fontFamily:'var(--head)' }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div style={{ marginTop:18 }}>
              <div className="row-hdr">
                <div className="row-title">Campus snaps 📸</div>
                <div style={{ fontSize:11, color:'var(--ink3)', fontWeight:500 }}>{loading ? 'Loading...' : `${posts.length} posts`}</div>
              </div>
              {loading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:40 }}><span className="spinner-dark spinner" /></div>
              ) : posts.length === 0 ? (
                <div className="empty-state"><div className="empty-emoji">📭</div><div className="empty-title">No posts yet</div><div className="empty-sub">Be the first to post!</div></div>
              ) : (
                <div className="hscroll" style={{ alignItems:'flex-start' }}>
                  {posts.map(post => {
                    const liked = profile ? post.likes.includes(profile.uid) : false
                    return (
                      <div key={post.id} style={{ width:200, flexShrink:0, background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                        <div style={{ width:'100%', height:150, background: post.mediaColor, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:5, position:'relative' }}>
                          <span style={{ fontSize:36 }}>{post.mediaEmoji}</span>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,.65)', fontWeight:600, textAlign:'center', padding:'0 8px' }}>{post.mediaCaption}</span>
                        </div>
                        <div style={{ padding:'10px 11px 11px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                            <div style={{ width:24, height:24, borderRadius:8, background: post.authorAvatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>{post.authorInitials}</div>
                            <div><div style={{ fontSize:11, fontWeight:700 }}>{post.authorName}</div><div style={{ fontSize:9, color:'var(--ink3)' }}>{fmtTime(post.createdAt)}</div></div>
                          </div>
                          <div style={{ fontSize:11, color:'var(--ink2)', fontWeight:500, lineHeight:1.45, marginBottom:7 }}>{post.caption}</div>
                          <div style={{ display:'flex', gap:10 }}>
                            <button onClick={()=>profile&&toggleLike(post.id, profile.uid, liked)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:11, fontWeight:600, color: liked ? 'var(--coral)' : 'var(--ink3)', padding:0 }}>
                              {liked?'❤️':'🤍'} {post.likes.length}
                            </button>
                            <span style={{ fontSize:11, color:'var(--ink3)', fontWeight:600 }}>💬 {post.commentCount}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div style={{ height:20 }} />
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showPost && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setShowPost(false) }}>
          <form className="modal-sheet" onSubmit={submitPost}>
            <div className="modal-handle" />
            <div className="modal-title">New Post ✦</div>
            <div style={{ padding:'0 20px 14px' }}>
              <textarea className="field" placeholder="What's happening? Use #hashtags" value={caption} onChange={e=>setCaption(e.target.value)} required rows={3} style={{ resize:'none' }} />
            </div>
            <div style={{ fontSize:10, fontWeight:800, color:'var(--ink2)', letterSpacing:.6, textTransform:'uppercase', padding:'0 20px', marginBottom:8, fontFamily:'var(--head)' }}>Pick a vibe</div>
            <div className="hscroll" style={{ paddingBottom:14 }}>
              {MEDIA.map(m => (
                <div key={m.emoji} onClick={()=>setSelMedia(m)} style={{ width:85, height:85, borderRadius:'var(--r)', flexShrink:0, background:m.color, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4, cursor:'pointer', border: selMedia.emoji===m.emoji ? '2.5px solid var(--ink)' : '2px solid transparent' }}>
                  <span style={{ fontSize:22 }}>{m.emoji}</span>
                  <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,.8)', textAlign:'center', padding:'0 4px' }}>{m.caption}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" type="submit" disabled={posting}>
                {posting ? <span className="spinner" /> : 'Post →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Squad Modal */}
      {showSquad && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setShowSquad(false) }}>
          <form className="modal-sheet" onSubmit={submitSquad}>
            <div className="modal-handle" />
            <div className="modal-title">Post a Squad Request ✦</div>
            <div className="modal-sub">Teammates will see this and apply</div>
            <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:14 }}>
              {[{l:'Team Name / Project',p:'e.g. Team Nexus, Smart Canteen App...',v:sqTitle,s:setSqTitle},{l:'Event / Hackathon',p:'e.g. TechFest Hackathon 2025',v:sqEvent,s:setSqEvent},{l:'Roles Needed',p:'e.g. UI Designer, ML Engineer...',v:sqRoles,s:setSqRoles}].map(f=>(
                <div key={f.l}><div className="field-label">{f.l}</div><input className="field" placeholder={f.p} value={f.v} onChange={e=>f.s(e.target.value)} /></div>
              ))}
              <div><div className="field-label">About the Project</div><textarea className="field" placeholder="What are you building? Keep it real." value={sqDesc} onChange={e=>setSqDesc(e.target.value)} rows={3} style={{ resize:'none' }} /></div>
              <div>
                <div className="field-label">Skills Required</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {ALL_SKILLS.map(sk=>(
                    <button key={sk} type="button" onClick={()=>setSqSkills(p=>p.includes(sk)?p.filter(x=>x!==sk):[...p,sk])}
                      style={{ padding:'7px 13px', borderRadius:'var(--rpill)', border:'1.5px solid', borderColor: sqSkills.includes(sk)?'var(--ink)':'var(--border2)', background: sqSkills.includes(sk)?'var(--ink)':'var(--cream)', color: sqSkills.includes(sk)?'#fff':'var(--ink3)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                      {sk}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">Team Size</div>
                <div style={{ display:'flex', gap:8 }}>
                  {SIZES.map(sz=>(
                    <button key={sz} type="button" onClick={()=>setSqSize(sz)} style={{ flex:1, padding:'10px', borderRadius:'var(--rpill)', border:'1.5px solid', borderColor: sqSize===sz?'var(--ink)':'var(--border2)', background: sqSize===sz?'var(--ink)':'var(--cream)', color: sqSize===sz?'#fff':'var(--ink3)', fontSize:12, fontWeight:700, cursor:'pointer' }}>{sz}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop:16 }}>
              <button className="btn-primary" type="submit" disabled={sqPosting}>
                {sqPosting ? <span className="spinner" /> : 'Post Squad Request →'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// src/pages/RadioPage.tsx
import React, { useState, useEffect, useRef } from 'react'

type Mode = 'vibe' | 'pulse'

const QUEUE = [
  { id:'1', title:'Study With Me',   artist:'Café Beats',      dur:'4:32', emoji:'🎶', bg:'#f0e6ff' },
  { id:'2', title:'Electric Dreams', artist:'Indie Collective', dur:'3:48', emoji:'🎸', bg:'#e6f5ec' },
  { id:'3', title:'Late Night Code', artist:'Synthwave Dept.',  dur:'5:21', emoji:'🎹', bg:'#fff0e6' },
]
const PULSES = [
  { id:'1', type:'Tournament',    tColor:'#7a4e00', icon:'🏆', iconBg:'#fff5cc', text:'CSE vs ECE Football Finals: 2–1 (HT). CSE leading! Ground A', time:'2m ago' },
  { id:'2', type:'Announcement', tColor:'#006633', icon:'📢', iconBg:'#e6fff0', text:'Raga jam in Canteen B — happening NOW. Come chill!',           time:'8m ago' },
  { id:'3', type:'Stranger Story',tColor:'var(--purple)', icon:'👤', iconBg:'#f0e6ff', text:'"Found a wallet near library. Left at guard desk. You\'re welcome!"', time:'14m ago' },
  { id:'4', type:'Admin Alert',   tColor:'var(--coral)', icon:'⚠️', iconBg:'#ffe6ec', text:'Buses leaving Gate 2 at 4:30PM due to rain. Plan ahead.',        time:'22m ago' },
]

function WaveBar({ delay, pulse }: { delay: number; pulse?: boolean }) {
  return (
    <div className={`wave-bar ${pulse ? 'pulse' : ''}`}
      style={{ animationDelay: `${delay * 0.065}s`, animationDuration: `${0.5 + Math.random() * 0.5}s`, height: `${20 + Math.floor(Math.random() * 60)}%` }} />
  )
}

export default function RadioPage() {
  const [mode,      setMode]      = useState<Mode>('vibe')
  const [playing,   setPlaying]   = useState(true)
  const [progress,  setProgress]  = useState(44)

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 0.05), 100)
    return () => clearInterval(t)
  }, [playing])

  return (
    <div className="page-scroll page-enter">
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ fontFamily:'var(--head)', fontSize:26, fontWeight:800, letterSpacing:-.5 }}>Radio 📻</div>
        <div style={{ fontSize:11, color:'var(--ink3)', fontWeight:500, marginTop:3 }}>Vibe out or tune in live</div>
      </div>

      {/* Toggle */}
      <div style={{ margin:'14px 20px 0', display:'grid', gridTemplateColumns:'1fr 1fr', background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', padding:4, gap:4 }}>
        {(['vibe','pulse'] as Mode[]).map(m => (
          <button key={m} onClick={()=>setMode(m)}
            style={{ padding:11, textAlign:'center', borderRadius:'var(--rsm)', border:'none', cursor:'pointer', background: m==='vibe'&&mode==='vibe' ? 'var(--ink)' : m==='pulse'&&mode==='pulse' ? 'var(--coral)' : 'transparent', transition:'all .2s' }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{m==='vibe'?'🎵':'📡'}</div>
            <div style={{ fontFamily:'var(--head)', fontSize:13, fontWeight:800, color: mode===m ? '#fff' : 'var(--ink)' }}>{m==='vibe'?'Vibe':'Pulse'}</div>
            <div style={{ fontSize:9, fontWeight:500, color: mode===m ? 'rgba(255,255,255,.6)' : 'var(--ink3)', marginTop:1 }}>{m==='vibe'?'Campus Blend':'Live campus feed'}</div>
          </button>
        ))}
      </div>

      {mode === 'vibe' ? (
        <>
          {/* Vibe Player */}
          <div style={{ margin:'14px 20px 0', background:'var(--ink)', borderRadius:'var(--r)', padding:18 }}>
            <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.35)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10, fontFamily:'var(--head)' }}>NOW PLAYING · CAMPUS BLEND</div>
            <div style={{ fontFamily:'var(--head)', fontSize:20, fontWeight:800, color:'#fff', marginBottom:3 }}>Midnight Hustle</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginBottom:14 }}>Lo-Fi Collective · chill hip-hop</div>
            {/* Waveform */}
            <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:30, marginBottom:14 }}>
              {Array.from({length:26}).map((_,i) => <WaveBar key={i} delay={i} />)}
            </div>
            {/* Progress */}
            <div style={{ height:3, background:'rgba(255,255,255,.1)', borderRadius:'var(--rpill)', marginBottom:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'var(--lime)', borderRadius:'var(--rpill)', transition:'width .1s linear' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', fontWeight:600 }}>2:14</span>
              <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', fontWeight:600 }}>5:07</span>
            </div>
            {/* Controls */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14 }}>
              {['⏮','⏭','🔀'].map((ico,i) => (
                <button key={i} style={{ width:34, height:34, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,.15)', background:'none', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>{ico}</button>
              ))}
              <button onClick={()=>setPlaying(p=>!p)} style={{ width:50, height:50, borderRadius:'50%', background:'var(--lime)', border:'none', fontSize:20, cursor:'pointer', order:-1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {playing ? '⏸' : '▶'}
              </button>
            </div>
          </div>
          {/* Queue */}
          <div style={{ marginTop:16 }}>
            <div className="row-hdr"><div className="row-title">Up Next</div><div className="row-more">Full queue</div></div>
            <div className="hscroll" style={{ paddingBottom:14 }}>
              {QUEUE.map(q => (
                <div key={q.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:12, flexShrink:0, width:220, cursor:'pointer' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:q.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{q.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, fontFamily:'var(--head)' }}>{q.title}</div>
                    <div style={{ fontSize:10, color:'var(--ink3)', marginTop:2 }}>{q.artist}</div>
                  </div>
                  <div style={{ fontSize:9, color:'var(--ink4)', fontWeight:600 }}>{q.dur}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Pulse Player */}
          <div style={{ margin:'14px 20px 0', background:'var(--coral)', borderRadius:'var(--r)', padding:18 }}>
            <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.7)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, fontFamily:'var(--head)' }}>🔴 ON AIR · LIVE CAMPUS PULSE</div>
            <div style={{ fontFamily:'var(--head)', fontSize:18, fontWeight:800, color:'#fff', marginBottom:2 }}>Stranger Story #42</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginBottom:12 }}>Anonymous · verified profile · 3 min ago</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:24, marginBottom:12 }}>
              {Array.from({length:22}).map((_,i) => <WaveBar key={i} delay={i} pulse />)}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,.25)', border:'none', fontSize:18, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>⏸</button>
              <span style={{ fontSize:11, color:'rgba(255,255,255,.7)', fontWeight:600 }}>Live · 00:03:24</span>
            </div>
          </div>
          {/* Pulse feed */}
          <div style={{ marginTop:16 }}>
            <div className="row-hdr"><div className="row-title">Recent Pulses</div><div className="row-more">All</div></div>
            <div className="hscroll" style={{ paddingBottom:14, alignItems:'flex-start' }}>
              {PULSES.map(p => (
                <div key={p.id} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'12px 14px', background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:14, flexShrink:0, width:270, cursor:'pointer' }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:p.iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{p.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:.8, textTransform:'uppercase', fontFamily:'var(--head)', color:p.tColor, marginBottom:3 }}>{p.type}</div>
                    <div style={{ fontSize:12, color:'var(--ink2)', fontWeight:500, lineHeight:1.45 }}>{p.text}</div>
                    <div style={{ fontSize:9, color:'var(--ink4)', marginTop:4, fontWeight:600 }}>{p.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div style={{ height:20 }} />
    </div>
  )
}

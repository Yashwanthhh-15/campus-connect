// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { logOut, updateProfileData } from '../services/authService'
import { useFeedStore } from '../store/feedStore'

export default function SettingsPage() {
  const { profile, set, user } = useAuthStore()
  const { seconds, locked, unlock } = useFeedStore()
  const [studyMode, setStudyMode]   = useState(false)
  const [autoSwitch, setAutoSwitch] = useState(true)
  const [notifs, setNotifs]         = useState(true)

  // Edit profile inline
  const [showEdit,   setShowEdit]   = useState(false)
  const [editName,   setEditName]   = useState(profile?.name || '')
  const [editBio,    setEditBio]    = useState(profile?.bio || '')
  const [editUni,    setEditUni]    = useState(profile?.university || '')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  const used     = 15 - Math.floor(seconds / 60)
  const usedPct  = Math.round((1 - seconds / 900) * 100)
  const timeLeft = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`

  if (!profile || !user) return null

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updates = { name: editName.trim(), bio: editBio.trim(), university: editUni.trim() }
      await updateProfileData(profile.uid, updates)
      set(user, { ...profile, ...updates })
      setSaved(true)
      setTimeout(() => { setSaved(false); setShowEdit(false) }, 1200)
    } finally { setSaving(false) }
  }

  async function handleLogout() {
    await logOut()
    set(null, null)
  }

  return (
    <div className="page-scroll page-enter">
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ fontFamily:'var(--head)', fontSize:26, fontWeight:800, letterSpacing:-.5 }}>More ⚙</div>
        <div style={{ fontSize:11, color:'var(--ink3)', fontWeight:500, marginTop:3 }}>Settings & preferences</div>
      </div>

      {/* Profile card */}
      <div style={{ margin:'14px 20px 0', background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', padding:16, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:48, height:48, borderRadius:14, background: profile.avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--head)', fontSize:16, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>{profile.initials}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--head)', fontSize:14, fontWeight:800 }}>{profile.name}</div>
          <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>{profile.email}</div>
        </div>
        <button onClick={()=>setShowEdit(v=>!v)} style={{ padding:'7px 13px', background: showEdit ? 'var(--ink)' : 'var(--cream)', border:'1.5px solid var(--border2)', borderRadius:'var(--rsm)', fontSize:11, fontWeight:700, cursor:'pointer', color: showEdit ? '#fff' : 'var(--ink)', fontFamily:'var(--head)' }}>
          {showEdit ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Inline edit form */}
      {showEdit && (
        <form onSubmit={saveProfile} style={{ margin:'8px 20px 0', background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          <div><div className="field-label">Display Name</div><input className="field" value={editName} onChange={e=>setEditName(e.target.value)} /></div>
          <div><div className="field-label">Bio</div><textarea className="field" value={editBio} onChange={e=>setEditBio(e.target.value)} rows={2} style={{ resize:'none' }} placeholder="Tell people about yourself..." /></div>
          <div><div className="field-label">University</div><input className="field" value={editUni} onChange={e=>setEditUni(e.target.value)} /></div>
          <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop:4 }}>
            {saving ? <span className="spinner" /> : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </form>
      )}

      <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Focus */}
        <Section title="Focus & Wellbeing">
          {/* Guard — shows real timer state */}
          <div style={{ display:'flex', alignItems:'center', padding:'14px 16px', gap:12, borderBottom:'1.5px solid var(--border)' }}>
            <span style={{ fontSize:18 }}>⏱</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Scroll Guard</div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>
                {locked ? '🔒 Feed locked this hour' : seconds === 900 ? 'Not started yet' : `${used} min used · ${timeLeft} left`}
              </div>
              <div style={{ height:4, background:'var(--border)', borderRadius:'var(--rpill)', marginTop:6, overflow:'hidden', width:120 }}>
                <div style={{ height:'100%', width:`${usedPct}%`, background: locked ? 'var(--coral)' : usedPct > 70 ? 'var(--amber)' : 'var(--lime)', borderRadius:'var(--rpill)', transition:'width .5s' }} />
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
              <span className="badge badge-ink">ALWAYS ON</span>
              {locked && <button onClick={unlock} style={{ fontSize:9, fontWeight:700, color:'var(--coral)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontFamily:'var(--head)' }}>Unlock now</button>}
            </div>
          </div>

          <ToggleRow icon="🌙" name="Study Mode" sub="Mute all non-urgent notifications" value={studyMode} onChange={setStudyMode} />

          <div style={{ display:'flex', alignItems:'center', padding:'14px 16px', gap:12 }}>
            <span style={{ fontSize:18 }}>📊</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Screen Time This Session</div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>{used > 0 ? `${used} min of scroll time used` : 'No scroll time used yet'}</div>
            </div>
          </div>
        </Section>

        {/* Network */}
        <Section title="Campus Network">
          <div style={{ display:'flex', alignItems:'center', padding:'14px 16px', gap:12, borderBottom:'1.5px solid var(--border)' }}>
            <span style={{ fontSize:18 }}>📡</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Network Mode</div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>Cloud · Firebase (internet)</div>
            </div>
            <span className="badge badge-cyan">CLOUD</span>
          </div>
          <ToggleRow icon="🔄" name="Auto-Switch to Local Mesh" sub="Detects campus server when on same WiFi" value={autoSwitch} onChange={setAutoSwitch} />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <ToggleRow icon="🔔" name="Pulse Alerts" sub="Live campus announcements" value={notifs} onChange={setNotifs} />
          <ToggleRow icon="✉" name="Message Notifications" sub="New messages from teammates" value={notifs} onChange={setNotifs} />
          <ToggleRow icon="🤝" name="Squad Requests" sub="New applications to your teams" value={notifs} onChange={setNotifs} />
        </Section>

        {/* Account */}
        <Section title="Account">
          <div style={{ display:'flex', alignItems:'center', padding:'14px 16px', gap:12, borderBottom:'1.5px solid var(--border)' }}>
            <span style={{ fontSize:18 }}>🔒</span>
            <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>Privacy</div><div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>Manage who sees your posts</div></div>
            <span style={{ fontSize:13, color:'var(--ink4)' }}>›</span>
          </div>
          <div onClick={handleLogout} style={{ display:'flex', alignItems:'center', padding:'14px 16px', gap:12, cursor:'pointer' }} onMouseEnter={e=>(e.currentTarget.style.background='var(--cream)')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
            <span style={{ fontSize:18 }}>🚪</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--coral)' }}>Sign Out</div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>Signed in as {profile.email}</div>
            </div>
          </div>
        </Section>

        <div style={{ textAlign:'center', fontSize:11, color:'var(--ink4)', fontWeight:500 }}>CampusConnect+ · v1.0.0 · Spark Plan</div>
      </div>
      <div style={{ height:14 }} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:800, color:'var(--ink3)', letterSpacing:1, textTransform:'uppercase', marginBottom:8, fontFamily:'var(--head)' }}>{title}</div>
      <div style={{ background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>{children}</div>
    </div>
  )
}

function ToggleRow({ icon, name, sub, value, onChange }: { icon:string; name:string; sub:string; value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'14px 16px', gap:12, borderBottom:'1.5px solid var(--border)' }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600 }}>{name}</div>
        <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>{sub}</div>
      </div>
      <button className={`tog ${value?'on':''}`} onClick={()=>onChange(!value)} />
    </div>
  )
}

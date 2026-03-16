// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { postSquad } from '../services/squadService'
import { logOut, updateProfileData } from '../services/authService'
import { subscribeToUserPosts, Post, fmtTime } from '../services/postService'
import { getFollowing, getFollowers, searchUsers, followUser, unfollowUser, isFollowing } from '../services/followService'
import { UserProfile } from '../services/authService'

const SKILLS = ['React','Node.js','Python','Figma','Flutter','ML/AI','Arduino','UI/UX','Marketing','Firebase','Java','C++']
const SIZES  = ['2–3','4–5','6+']

export default function ProfilePage() {
  const { profile, set, user } = useAuthStore()
  const [tab, setTab]               = useState<'posts'|'squads'|'connects'>('posts')
  const [posts, setPosts]           = useState<Post[]>([])
  const [following, setFollowing]   = useState<UserProfile[]>([])
  const [followers, setFollowers]   = useState<UserProfile[]>([])
  const [connectsTab, setConnectsTab] = useState<'following'|'followers'>('following')

  // Modals
  const [showTeam,   setShowTeam]   = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)
  const [showFind,   setShowFind]   = useState(false)

  // Edit profile form
  const [editName,    setEditName]   = useState(profile?.name || '')
  const [editBio,     setEditBio]    = useState(profile?.bio || '')
  const [editUni,     setEditUni]    = useState(profile?.university || '')
  const [editRoles,   setEditRoles]  = useState(profile?.roles.join(', ') || '')
  const [savingEdit,  setSavingEdit] = useState(false)

  // Find people
  const [searchQ,    setSearchQ]    = useState('')
  const [searchRes,  setSearchRes]  = useState<UserProfile[]>([])
  const [followState, setFollowState] = useState<Record<string, boolean>>({})
  const [searching,  setSearching]  = useState(false)

  // Create team form
  const [sqTitle,  setSqTitle]   = useState('')
  const [sqEvent,  setSqEvent]   = useState('')
  const [sqDesc,   setSqDesc]    = useState('')
  const [sqSkills, setSqSkills]  = useState<string[]>([])
  const [sqSize,   setSqSize]    = useState('2–3')
  const [sqPosting, setSqPosting] = useState(false)

  if (!profile || !user) return null

  // Load real posts
  useEffect(() => {
    return subscribeToUserPosts(profile.uid, setPosts)
  }, [profile.uid])

  // Load following/followers when connects tab opens
  useEffect(() => {
    if (tab !== 'connects') return
    getFollowing(profile.uid).then(setFollowing)
    getFollowers(profile.uid).then(setFollowers)
  }, [tab, profile.uid])

  // Search users
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await searchUsers(searchQ, profile.uid)
      setSearchRes(res)
      // Check follow state for each result
      const states: Record<string, boolean> = {}
      await Promise.all(res.map(async u => {
        states[u.uid] = await isFollowing(profile.uid, u.uid)
      }))
      setFollowState(states)
      setSearching(false)
    }, 400)
    return () => clearTimeout(t)
  }, [searchQ])

  async function handleFollow(u: UserProfile) {
    const currently = followState[u.uid]
    setFollowState(p => ({ ...p, [u.uid]: !currently }))
    if (currently) await unfollowUser(profile.uid, u.uid)
    else await followUser(profile.uid, u.uid)
    // Refresh following list
    getFollowing(profile.uid).then(setFollowing)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSavingEdit(true)
    try {
      const updates = {
        name: editName.trim(),
        bio: editBio.trim(),
        university: editUni.trim(),
        roles: editRoles.split(',').map(r => r.trim()).filter(Boolean),
      }
      await updateProfileData(profile.uid, updates)
      // Update local store
      set(user, { ...profile, ...updates })
      setShowEdit(false)
    } finally { setSavingEdit(false) }
  }

  async function submitTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!sqTitle.trim() || !sqEvent.trim()) return
    setSqPosting(true)
    try {
      await postSquad({
        ownerUid: profile.uid, ownerName: profile.name,
        ownerInitials: profile.initials, ownerAvatarColor: profile.avatarColor,
        ownerBranch: profile.branch,
        title: sqTitle.trim(), eventName: sqEvent.trim(),
        description: sqDesc.trim(), skills: sqSkills, teamSize: sqSize,
      })
      setSqTitle(''); setSqEvent(''); setSqDesc(''); setSqSkills([]); setSqSize('2–3')
      setShowTeam(false)
    } finally { setSqPosting(false) }
  }

  async function handleLogout() {
    await logOut()
    set(null, null)
  }

  const displayList = connectsTab === 'following' ? following : followers

  return (
    <>
      <div className="page-scroll page-enter">
        {/* Cover */}
        <div style={{ height:110, background:'var(--ink)', position:'relative', overflow:'hidden', display:'flex', alignItems:'flex-end', padding:'12px 20px' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 0,transparent 50%)', backgroundSize:'14px 14px' }} />
          <div style={{ marginLeft:'auto', display:'flex', gap:8, zIndex:2 }}>
            <button onClick={()=>setShowEdit(true)} style={{ padding:'7px 13px', background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.22)', borderRadius:'var(--rsm)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--head)' }}>Edit Profile</button>
            <button onClick={handleLogout} style={{ padding:'7px 13px', background:'rgba(255,61,90,.2)', border:'1.5px solid rgba(255,61,90,.4)', borderRadius:'var(--rsm)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--head)' }}>Sign out</button>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ position:'relative', marginTop:-28, marginLeft:20, width:'fit-content' }}>
          <div style={{ width:68, height:68, borderRadius:20, background: profile.avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--head)', fontSize:22, fontWeight:800, color:'var(--ink)', border:'3px solid var(--white)' }}>{profile.initials}</div>
          <div style={{ position:'absolute', bottom:2, right:2, width:13, height:13, borderRadius:'50%', background:'var(--lime)', border:'2.5px solid var(--white)' }} />
        </div>

        {/* Info */}
        <div style={{ padding:'10px 20px 0' }}>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
            <span className="badge badge-lime">● Online</span>
          </div>
          <div style={{ fontFamily:'var(--head)', fontSize:22, fontWeight:800, letterSpacing:-.5 }}>{profile.name}</div>
          <div style={{ fontSize:12, color:'var(--ink3)', fontWeight:500, marginTop:2 }}>{profile.handle} · {profile.branch} · {profile.semester} · {profile.university}</div>
          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
            {profile.roles.map((r,i) => <span key={r} className={`badge ${i===0?'badge-ink':i===1?'badge-lime':'badge-outline'}`}>{r}</span>)}
          </div>
          {profile.bio && <div style={{ fontSize:13, color:'var(--ink2)', fontWeight:500, marginTop:10, lineHeight:1.55 }}>{profile.bio}</div>}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1, margin:'14px 20px 0', background:'var(--border)', borderRadius:'var(--r)', overflow:'hidden', border:'1.5px solid var(--border)' }}>
          {[['Posts', String(posts.length)], ['Following', String(profile.followingCount||0)], ['Followers', String(profile.followersCount||0)]].map(([l,n]) => (
            <div key={l} style={{ background:'var(--white)', padding:'12px 8px', textAlign:'center', cursor: l!=='Posts'?'pointer':'default' }}
              onClick={()=>{ if(l!=='Posts'){ setTab('connects'); setConnectsTab(l==='Following'?'following':'followers') } }}>
              <div style={{ fontFamily:'var(--head)', fontSize:20, fontWeight:800 }}>{n}</div>
              <div style={{ fontSize:9, color:'var(--ink3)', fontWeight:700, letterSpacing:.4, textTransform:'uppercase', marginTop:2, fontFamily:'var(--head)' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Find people button */}
        <div style={{ padding:'12px 20px 0' }}>
          <button onClick={()=>setShowFind(true)} style={{ width:'100%', padding:'11px', background:'var(--cream)', border:'1.5px dashed var(--border2)', borderRadius:'var(--r)', fontSize:13, fontWeight:600, color:'var(--ink3)', cursor:'pointer', fontFamily:'var(--head)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            🔍 Find people you know
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1.5px solid var(--border)', marginTop:14, padding:'0 20px' }}>
          {(['posts','squads','connects'] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, textAlign:'center', padding:'9px 4px', background:'none', border:'none', borderBottom: tab===t ? '2.5px solid var(--ink)' : '2.5px solid transparent', fontSize:11, fontWeight:800, color: tab===t ? 'var(--ink)' : 'var(--ink3)', cursor:'pointer', fontFamily:'var(--head)', letterSpacing:.2, transition:'all .15s' }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* Posts grid — real data from Firestore */}
        {tab === 'posts' && (
          posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">📷</div>
              <div className="empty-title">No posts yet</div>
              <div className="empty-sub">Your posts will appear here</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2 }}>
              {posts.map(p => (
                <div key={p.id} style={{ aspectRatio:'1', background: p.mediaColor || 'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4, cursor:'pointer', position:'relative' }}>
                  <span style={{ fontSize:26 }}>{p.mediaEmoji}</span>
                  <span style={{ fontSize:8, color:'rgba(255,255,255,.7)', fontWeight:600, textAlign:'center', padding:'0 4px', position:'absolute', bottom:5, left:0, right:0 }}>{fmtTime(p.createdAt)}</span>
                </div>
              ))}
            </div>
          )
        )}

        {/* Squads tab */}
        {tab === 'squads' && (
          <div style={{ padding:'0 0 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px 10px' }}>
              <div style={{ fontFamily:'var(--head)', fontSize:15, fontWeight:800 }}>My Squads</div>
              <button onClick={()=>setShowTeam(true)} style={{ background:'var(--ink)', color:'#fff', border:'none', borderRadius:'var(--rpill)', padding:'8px 14px', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'var(--head)' }}>+ Create Team</button>
            </div>
            <div className="empty-state">
              <div className="empty-emoji">🤝</div>
              <div className="empty-title">No squads yet</div>
              <div className="empty-sub">Create a team or join one from the Scroll feed</div>
              <button className="btn-primary" style={{ maxWidth:200, marginTop:16 }} onClick={()=>setShowTeam(true)}>Create a Team</button>
            </div>
          </div>
        )}

        {/* Connects tab */}
        {tab === 'connects' && (
          <div style={{ padding:'0 0 20px' }}>
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', margin:'0 20px' }}>
              {(['following','followers'] as const).map(t => (
                <button key={t} onClick={()=>setConnectsTab(t)} style={{ flex:1, padding:'10px', background:'none', border:'none', borderBottom: connectsTab===t ? '2px solid var(--ink)' : '2px solid transparent', fontSize:12, fontWeight:700, color: connectsTab===t ? 'var(--ink)' : 'var(--ink3)', cursor:'pointer', fontFamily:'var(--head)', textTransform:'capitalize' }}>{t}</button>
              ))}
            </div>
            {displayList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">{connectsTab==='following'?'👥':'❤️'}</div>
                <div className="empty-title">No {connectsTab} yet</div>
                <div className="empty-sub">{connectsTab==='following' ? 'Find and follow people you know' : 'When people follow you, they appear here'}</div>
                {connectsTab==='following' && <button className="btn-primary" style={{ maxWidth:200, marginTop:16 }} onClick={()=>setShowFind(true)}>Find People</button>}
              </div>
            ) : (
              <div style={{ padding:'8px 20px' }}>
                {displayList.map(u => (
                  <div key={u.uid} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderBottom:'1.5px solid var(--border)' }}>
                    <div style={{ width:42, height:42, borderRadius:13, background: u.avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--head)', fontSize:13, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>{u.initials}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{u.name}</div>
                      <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>{u.handle} · {u.branch}</div>
                    </div>
                    {connectsTab==='following' && (
                      <button onClick={()=>handleFollow(u)} style={{ padding:'7px 14px', borderRadius:'var(--rpill)', border:'1.5px solid var(--border2)', background:'var(--cream)', color:'var(--ink)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--head)' }}>Unfollow</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setShowEdit(false) }}>
          <form className="modal-sheet" onSubmit={saveEdit}>
            <div className="modal-handle" />
            <div className="modal-title">Edit Profile</div>
            <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:14 }}>
              <div><div className="field-label">Full Name</div><input className="field" value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Your name" /></div>
              <div><div className="field-label">Bio</div><textarea className="field" value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="Tell people about yourself..." rows={3} style={{ resize:'none' }} /></div>
              <div><div className="field-label">University</div><input className="field" value={editUni} onChange={e=>setEditUni(e.target.value)} placeholder="Your university" /></div>
              <div><div className="field-label">Roles (comma separated)</div><input className="field" value={editRoles} onChange={e=>setEditRoles(e.target.value)} placeholder="e.g. Student, Dev Club Lead, NSS Member" /></div>
            </div>
            <div className="modal-footer" style={{ marginTop:16 }}>
              <button className="btn-primary" type="submit" disabled={savingEdit}>{savingEdit ? <span className="spinner" /> : 'Save Changes'}</button>
              <button type="button" onClick={()=>setShowEdit(false)} style={{ width:'100%', marginTop:10, padding:13, background:'none', border:'none', fontSize:13, fontWeight:600, color:'var(--ink3)', cursor:'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Find People Modal */}
      {showFind && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setShowFind(false) }}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Find People 🔍</div>
            <div style={{ padding:'0 20px 14px' }}>
              <input className="field" placeholder="Search by name..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus />
            </div>
            <div style={{ padding:'0 20px', maxHeight:320, overflowY:'auto' }}>
              {searching && <div style={{ textAlign:'center', padding:20 }}><span className="spinner spinner-dark" /></div>}
              {!searching && searchQ && searchRes.length === 0 && (
                <div className="empty-state" style={{ paddingTop:20 }}>
                  <div className="empty-emoji">🔍</div>
                  <div className="empty-title">No results</div>
                  <div className="empty-sub">Try a different name</div>
                </div>
              )}
              {!searching && searchRes.map(u => (
                <div key={u.uid} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0', borderBottom:'1.5px solid var(--border)' }}>
                  <div style={{ width:42, height:42, borderRadius:13, background: u.avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--head)', fontSize:13, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>{u.initials}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{u.name}</div>
                    <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>{u.handle} · {u.branch} · {u.semester}</div>
                  </div>
                  <button onClick={()=>handleFollow(u)} style={{ padding:'7px 14px', borderRadius:'var(--rpill)', border:'1.5px solid', borderColor: followState[u.uid] ? 'var(--border2)' : 'var(--ink)', background: followState[u.uid] ? 'var(--cream)' : 'var(--ink)', color: followState[u.uid] ? 'var(--ink)' : '#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--head)', transition:'all .15s' }}>
                    {followState[u.uid] ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
              {!searchQ && (
                <div className="empty-state" style={{ paddingTop:20 }}>
                  <div className="empty-emoji">👥</div>
                  <div className="empty-title">Search for classmates</div>
                  <div className="empty-sub">Type a name to find people from your college</div>
                </div>
              )}
            </div>
            <div style={{ padding:'14px 20px' }}>
              <button onClick={()=>setShowFind(false)} className="btn-outline" style={{ width:'100%', padding:12 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showTeam && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setShowTeam(false) }}>
          <form className="modal-sheet" onSubmit={submitTeam}>
            <div className="modal-handle" />
            <div className="modal-title">Create a Team ✦</div>
            <div className="modal-sub">Post a squad request — teammates will apply</div>
            <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:14 }}>
              <div><div className="field-label">Team Name / Project</div><input className="field" placeholder="e.g. Team Nexus..." value={sqTitle} onChange={e=>setSqTitle(e.target.value)} required /></div>
              <div><div className="field-label">Event / Hackathon</div><input className="field" placeholder="e.g. TechFest Hackathon 2025" value={sqEvent} onChange={e=>setSqEvent(e.target.value)} required /></div>
              <div><div className="field-label">About the Project</div><textarea className="field" placeholder="What are you building?" value={sqDesc} onChange={e=>setSqDesc(e.target.value)} rows={3} style={{ resize:'none' }} /></div>
              <div>
                <div className="field-label">Skills Required</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {SKILLS.map(sk => (
                    <button key={sk} type="button" onClick={()=>setSqSkills(p=>p.includes(sk)?p.filter(x=>x!==sk):[...p,sk])} style={{ padding:'7px 13px', borderRadius:'var(--rpill)', border:'1.5px solid', borderColor: sqSkills.includes(sk)?'var(--ink)':'var(--border2)', background: sqSkills.includes(sk)?'var(--ink)':'var(--cream)', color: sqSkills.includes(sk)?'#fff':'var(--ink3)', fontSize:11, fontWeight:700, cursor:'pointer' }}>{sk}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">Team Size</div>
                <div style={{ display:'flex', gap:8 }}>
                  {['2–3','4–5','6+'].map(sz => (
                    <button key={sz} type="button" onClick={()=>setSqSize(sz)} style={{ flex:1, padding:'10px', borderRadius:'var(--rpill)', border:'1.5px solid', borderColor: sqSize===sz?'var(--ink)':'var(--border2)', background: sqSize===sz?'var(--ink)':'var(--cream)', color: sqSize===sz?'#fff':'var(--ink3)', fontSize:12, fontWeight:700, cursor:'pointer' }}>{sz}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop:16 }}>
              <button className="btn-primary" type="submit" disabled={sqPosting}>{sqPosting ? <span className="spinner" /> : 'Post Squad Request →'}</button>
              <button type="button" onClick={()=>setShowTeam(false)} style={{ width:'100%', marginTop:10, padding:13, background:'none', border:'none', fontSize:13, fontWeight:600, color:'var(--ink3)', cursor:'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

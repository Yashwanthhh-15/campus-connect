// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react'
import { signIn, signUp } from '../services/authService'
import { useAuthStore } from '../store/authStore'

const BRANCHES  = ['CSE','ECE','ME','CE','EEE','IT','MBA','BCA','Other']
const SEMESTERS = ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8']

const CACHE_KEY = 'cc_cached_profile'

function isLocalMode(): boolean {
  const port     = window.location.port
  const hostname = window.location.hostname
  if (port === '3000') return true
  if (hostname.includes('netlify') || hostname.includes('vercel')) return false
  if (/^(10\.|192\.168\.|172\.)/.test(hostname)) return true
  return false
}

function getCachedProfile() {
  try {
    const s = localStorage.getItem(CACHE_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function cacheProfile(profile: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(profile))
}

export default function LoginPage() {
  const { set } = useAuthStore()
  const [mode,    setMode]    = useState<'login'|'signup'>('login')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [name,    setName]    = useState('')
  const [branch,  setBranch]  = useState('CSE')
  const [sem,     setSem]     = useState('Sem 1')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const local = isLocalMode()

  // In local mode — auto login from cache if available
  useEffect(() => {
    if (local) {
      const cached = getCachedProfile()
      if (cached) {
        set(null, cached)
      }
    }
  }, [local])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)

    try {
      if (local) {
        // LOCAL MODE — use cached profile from last Firebase login
        const cached = getCachedProfile()
        if (cached) {
          set(null, cached)
        } else {
          // No cache — tell user to login with internet first
          setError('No saved account found. Please sign in with internet first (at home or on mobile data), then come back on college WiFi.')
        }
      } else {
        // CLOUD MODE — normal Firebase login
        if (mode === 'login') {
          const { user, profile } = await signIn(email, pass)
          // Cache profile for offline use
          if (profile) cacheProfile(profile)
          set(user, profile)
        } else {
          if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return }
          if (pass.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return }
          const { user, profile } = await signUp(email, pass, name, branch, sem)
          if (profile) cacheProfile(profile)
          set(user, profile)
        }
      }
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password.'
        : err.code === 'auth/email-already-in-use'
        ? 'Email already in use. Sign in instead.'
        : err.message || 'Something went wrong.'
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ flex:1, overflowY:'auto', background:'var(--white)' }}>
      {/* Hero */}
      <div style={{ height:200, background:'var(--ink)', position:'relative', overflow:'hidden', display:'flex', alignItems:'flex-end', padding:'22px' }}>
        <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'var(--lime)', opacity:.12, top:-50, right:-40 }} />
        <div style={{ position:'absolute', width:100, height:100, borderRadius:'50%', background:'var(--purple)', opacity:.18, bottom:10, right:50 }} />
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ fontFamily:'var(--head)', fontSize:30, fontWeight:800, color:'#fff', letterSpacing:-1, lineHeight:1 }}>
            Campus<span style={{ color:'var(--lime)' }}>Connect</span><span style={{ color:'var(--coral)' }}>+</span>
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4, fontWeight:500 }}>Your college life, supercharged ✦</div>
        </div>
      </div>

      {/* Network mode pill */}
      <div style={{ margin:'16px 20px 0', padding:'9px 13px', borderRadius:'var(--rsm)', background: local ? 'rgba(186,255,57,0.08)' : 'rgba(0,223,255,0.06)', border:`1.5px solid ${local ? 'rgba(186,255,57,0.3)' : 'rgba(0,223,255,0.2)'}`, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background: local ? 'var(--lime)' : 'var(--cyan)', flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--ink)' }}>
            {local ? '● Campus Mesh — Local Mode' : '● Cloud Mode — Firebase'}
          </div>
          <div style={{ fontSize:10, color:'var(--ink3)', marginTop:1 }}>
            {local
              ? getCachedProfile()
                ? `Signed in as ${getCachedProfile().name} · tap below to continue`
                : 'Sign in with internet first to enable offline access'
              : 'Internet required · data syncs to Firebase'}
          </div>
        </div>
        <span className={`badge ${local ? 'badge-lime' : 'badge-cyan'}`}>{local ? 'LOCAL' : 'CLOUD'}</span>
      </div>

      <form onSubmit={submit} style={{ padding:'20px 20px' }}>

        {local ? (
          // LOCAL MODE UI
          getCachedProfile() ? (
            // Has cached profile — show it and let them continue
            <div style={{ marginBottom:20 }}>
              <div style={{ background:'var(--cream)', border:'1.5px solid var(--border)', borderRadius:'var(--r)', padding:16, display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:13, background: getCachedProfile().avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--head)', fontSize:14, fontWeight:800, color:'var(--ink)', flexShrink:0 }}>
                  {getCachedProfile().initials}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{getCachedProfile().name}</div>
                  <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>{getCachedProfile().email}</div>
                </div>
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Continue as ' + getCachedProfile().name + ' →'}
              </button>
              <button type="button" onClick={()=>{ localStorage.removeItem(CACHE_KEY); window.location.reload() }}
                style={{ width:'100%', marginTop:10, padding:12, background:'none', border:'none', fontSize:13, fontWeight:600, color:'var(--ink3)', cursor:'pointer' }}>
                Switch account
              </button>
            </div>
          ) : (
            // No cache — tell them to login with internet first
            <div style={{ textAlign:'center', padding:'30px 0' }}>
              <div style={{ fontSize:36, marginBottom:16 }}>📱</div>
              <div style={{ fontFamily:'var(--head)', fontSize:16, fontWeight:800, marginBottom:8 }}>First-time setup needed</div>
              <div style={{ fontSize:13, color:'var(--ink3)', lineHeight:1.6, marginBottom:24 }}>
                To use campus mesh mode, you need to sign in <strong>once with internet</strong> (at home or on mobile data). After that, you can use the app at college without internet.
              </div>
              <div style={{ background:'rgba(186,255,57,0.1)', border:'1.5px solid rgba(186,255,57,0.3)', borderRadius:'var(--rsm)', padding:'12px 16px', fontSize:12, color:'var(--ink2)', fontWeight:500 }}>
                💡 Open <strong>sunny-ganache-dfa947.netlify.app</strong> on mobile data → sign in → come back here
              </div>
            </div>
          )
        ) : (
          // CLOUD MODE — full login/signup form
          <>
            {/* Toggle */}
            <div style={{ display:'flex', background:'var(--cream)', borderRadius:'var(--rsm)', padding:4, marginBottom:24, gap:4 }}>
              {(['login','signup'] as const).map(m => (
                <button key={m} type="button" onClick={()=>{ setMode(m); setError('') }}
                  style={{ flex:1, padding:'10px', borderRadius:'calc(var(--rsm) - 2px)', border:'none', cursor:'pointer', background: mode===m ? 'var(--ink)' : 'transparent', color: mode===m ? '#fff' : 'var(--ink3)', fontFamily:'var(--head)', fontSize:13, fontWeight:700, transition:'all .15s' }}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {mode === 'signup' && <>
              <div style={{ marginBottom:14 }}>
                <div className="field-label">Full Name</div>
                <input className="field" placeholder="Arjun Sharma" value={name} onChange={e=>setName(e.target.value)} required />
              </div>
              <div style={{ marginBottom:14 }}>
                <div className="field-label">Branch</div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {BRANCHES.map(b => (
                    <button key={b} type="button" onClick={()=>setBranch(b)}
                      style={{ padding:'7px 13px', borderRadius:'var(--rpill)', border:'1.5px solid', borderColor: branch===b?'var(--ink)':'var(--border2)', background: branch===b?'var(--ink)':'var(--cream)', color: branch===b?'#fff':'var(--ink3)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div className="field-label">Semester</div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {SEMESTERS.map(s => (
                    <button key={s} type="button" onClick={()=>setSem(s)}
                      style={{ padding:'7px 13px', borderRadius:'var(--rpill)', border:'1.5px solid', borderColor: sem===s?'var(--ink)':'var(--border2)', background: sem===s?'var(--ink)':'var(--cream)', color: sem===s?'#fff':'var(--ink3)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>}

            <div style={{ marginBottom:14 }}>
              <div className="field-label">College Email</div>
              <input className="field" type="email" placeholder="arjun@srm.edu.in" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: error ? 10 : 20 }}>
              <div className="field-label">Password</div>
              <input className="field" type="password" placeholder={mode==='signup'?'Min 6 characters':'••••••••'} value={pass} onChange={e=>setPass(e.target.value)} required />
            </div>

            {error && <div style={{ background:'#fff0f2', border:'1.5px solid #ffd0d8', borderRadius:'var(--rsm)', padding:'10px 14px', fontSize:13, color:'#cc0033', marginBottom:16 }}>{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : mode==='login' ? 'Sign In →' : 'Create Account →'}
            </button>

            <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--ink3)' }}>
              {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ fontWeight:700, color:'var(--ink)', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:2 }}
                onClick={()=>{ setMode(mode==='login'?'signup':'login'); setError('') }}>
                {mode==='login' ? 'Create one' : 'Sign in'}
              </span>
            </div>
          </>
        )}

        {error && !local && <div style={{ background:'#fff0f2', border:'1.5px solid #ffd0d8', borderRadius:'var(--rsm)', padding:'10px 14px', fontSize:13, color:'#cc0033', marginTop:12 }}>{error}</div>}
      </form>
    </div>
  )
}
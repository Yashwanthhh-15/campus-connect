// src/App.tsx
import React, { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { onAuthChange, getProfile } from './services/authService'
import LoginPage    from './pages/LoginPage'
import ScrollPage   from './pages/ScrollPage'
import RadioPage    from './pages/RadioPage'
import InboxPage    from './pages/InboxPage'
import ProfilePage  from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

type Tab = 'scroll' | 'radio' | 'inbox' | 'profile' | 'settings'

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'scroll',   emoji: '✦',  label: 'Scroll'  },
  { id: 'radio',    emoji: '📻', label: 'Radio'   },
  { id: 'profile',  emoji: '👤', label: 'You'     },
  { id: 'inbox',    emoji: '✉',  label: 'Inbox'   },
  { id: 'settings', emoji: '⚙',  label: 'More'    },
]

export default function App() {
  const { user, ready, set, setReady } = useAuthStore()
  const [tab, setTab] = useState<Tab>('scroll')

  // Firebase auth persistence — re-logs user in on page refresh
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getProfile(firebaseUser.uid)
        set(firebaseUser, profile)
      } else {
        set(null, null)
      }
      setReady(true)
    })
    return unsub
  }, [])

  // Loading splash
  if (!ready) {
    return (
      <div id="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--head)', fontSize: 26, fontWeight: 800, marginBottom: 16 }}>
            Campus<span style={{ color: 'var(--lime)', background: 'var(--ink)', padding: '0 4px', borderRadius: 6 }}>Connect</span>
            <span style={{ color: 'var(--coral)' }}>+</span>
          </div>
          <span className="spinner spinner-dark" />
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div id="app-shell">
        <LoginPage />
      </div>
    )
  }

  // Logged in — render shell with nav
  const Page = {
    scroll:   <ScrollPage />,
    radio:    <RadioPage />,
    inbox:    <InboxPage />,
    profile:  <ProfilePage />,
    settings: <SettingsPage />,
  }[tab]

  return (
    <div id="app-shell">
      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {Page}
      </div>

      {/* Bottom nav */}
      <nav className="bnav">
        {TABS.map(t => (
          <button key={t.id} className={`ni ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <div className="ni-ico">{t.emoji}</div>
            <div className="ni-lbl">{t.label}</div>
          </button>
        ))}
      </nav>
    </div>
  )
}

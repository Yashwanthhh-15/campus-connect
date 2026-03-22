// src/services/localAuthService.ts
// Simple local auth — stores user in localStorage, no Firebase needed

import { UserProfile } from './authService'

const STORAGE_KEY = 'cc_local_user'

const COLORS = ['#f0e6ff','#e6f5ec','#e6eeff','#fff0e6','#ffe6ec','#e6fff5']
const randColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]
const mkInitials = (n: string) => n.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2)

export function localSignUp(
  name: string, email: string, branch: string, semester: string
): UserProfile {
  const profile: UserProfile = {
    uid:           'local_' + Date.now(),
    name, email,
    handle:        '@' + name.toLowerCase().replace(/\s+/g,'.'),
    branch, semester,
    university:    'My University',
    bio:           '',
    roles:         ['Student'],
    avatarColor:   randColor(),
    initials:      mkInitials(name),
    followersCount: 0,
    followingCount: 0,
    createdAt:     Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  return profile
}

export function localSignIn(name: string): UserProfile | null {
  // In local mode just use stored profile or create one
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored) as UserProfile
  }
  return localSignUp(name, `${name.toLowerCase()}@local`, 'CSE', 'Sem 1')
}

export function getLocalProfile(): UserProfile | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : null
}

export function clearLocalProfile() {
  localStorage.removeItem(STORAGE_KEY)
}

export function updateLocalProfile(updates: Partial<UserProfile>) {
  const profile = getLocalProfile()
  if (!profile) return
  const updated = { ...profile, ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

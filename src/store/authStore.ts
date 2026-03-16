import { create } from 'zustand'
import { User } from 'firebase/auth'
import { UserProfile } from '../services/authService'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  ready: boolean
  set: (user: User | null, profile: UserProfile | null) => void
  setReady: (v: boolean) => void
}

export const useAuthStore = create<AuthState>(set => ({
  user: null, profile: null, ready: false,
  set: (user, profile) => set({ user, profile }),
  setReady: ready => set({ ready }),
}))
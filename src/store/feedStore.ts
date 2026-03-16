// src/store/feedStore.ts
import { create } from 'zustand'

const LIMIT = 15 * 60   // 15 minutes
const LOCK  = 45 * 60   // 45 minute cooldown

interface FeedState {
  seconds: number; running: boolean
  locked: boolean; lockdown: number
  start: () => void; pause: () => void
  tick: () => void;  tickLock: () => void
  unlock: () => void
}

export const useFeedStore = create<FeedState>((set, get) => ({
  seconds: LIMIT, running: false, locked: false, lockdown: LOCK,

  start: () => { if (!get().locked) set({ running: true }) },
  pause: () => set({ running: false }),

  tick: () => {
    const { running, locked, seconds } = get()
    if (!running || locked) return
    const next = Math.max(0, seconds - 1)
    set({ seconds: next })
    if (next === 0) set({ locked: true, running: false })
  },

  tickLock: () => {
    const { locked, lockdown } = get()
    if (!locked) return
    set({ lockdown: Math.max(0, lockdown - 1) })
  },

  unlock: () => set({ locked: false, seconds: LIMIT, lockdown: LOCK }),
}))

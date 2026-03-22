// src/store/networkStore.ts
import { create } from 'zustand'
import { localAPI } from '../services/localApiService'

export type NetworkMode = 'LOCAL' | 'CLOUD' | 'DETECTING'

interface NetworkState {
  mode: NetworkMode
  serverURL: string | null
  detecting: boolean
  detect: () => Promise<void>
}

const CANDIDATES = [
  'http://localhost:3000',
  'http://192.168.137.1:3000',
  'http://192.168.1.1:3000',
  'http://172.20.10.1:3000',
  'http://10.0.0.1:3000',
]

async function pingURL(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 800)
    const res = await fetch(`${url}/ping`, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      return data.status === 'LOCAL'
    }
    return false
  } catch {
    return false
  }
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  mode: 'DETECTING',
  serverURL: null,
  detecting: false,

  detect: async () => {
    if (get().detecting) return
    set({ detecting: true, mode: 'DETECTING' })

    // Add current host if opened via local IP
    const host = window.location.hostname
    const candidates = [...CANDIDATES]
    if (host !== 'localhost' && !host.includes('netlify') && !host.includes('vercel')) {
      candidates.unshift(`http://${host}:3000`)
    }

    // Try all candidates in parallel — use first one that responds
    try {
      const results = await Promise.all(
        candidates.map(async url => ({ url, ok: await pingURL(url) }))
      )
      const found = results.find(r => r.ok)
      if (found) {
        localAPI.setBaseURL(found.url)
        set({ mode: 'LOCAL', serverURL: found.url, detecting: false })
      } else {
        set({ mode: 'CLOUD', serverURL: null, detecting: false })
      }
    } catch {
      set({ mode: 'CLOUD', serverURL: null, detecting: false })
    }
  },
}))
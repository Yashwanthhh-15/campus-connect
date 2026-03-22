export type NetworkMode = 'LOCAL' | 'CLOUD' | 'DETECTING'

export async function detectNetwork(): Promise<{ mode: NetworkMode; serverURL: string | null }> {
  const host = window.location.hostname
  const port = window.location.port
  
  // If opened via server port 3000 → definitely LOCAL
  if (port === '3000') {
    return { mode: 'LOCAL', serverURL: `http://${host}:3000` }
  }
  
  // If on Netlify/Vercel → definitely CLOUD
  if (host.includes('netlify') || host.includes('vercel')) {
    return { mode: 'CLOUD', serverURL: null }
  }
  
  // Try pinging local server
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 800)
    const res = await fetch(`http://${host}:3000/ping`, { signal: controller.signal, cache: 'no-store' })
    if (res.ok) return { mode: 'LOCAL', serverURL: `http://${host}:3000` }
  } catch {}
  
  return { mode: 'CLOUD', serverURL: null }
}
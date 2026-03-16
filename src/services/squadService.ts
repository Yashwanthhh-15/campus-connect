// src/services/squadService.ts
import {
  collection, addDoc, query, orderBy, where,
  onSnapshot, updateDoc, doc, arrayUnion,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface SquadRequest {
  id: string; ownerUid: string; ownerName: string
  ownerInitials: string; ownerAvatarColor: string; ownerBranch: string
  title: string; eventName: string; description: string
  skills: string[]; teamSize: string
  applicants: string[]; status: 'open' | 'closed'
  createdAt: Timestamp | null
}

export function subscribeSquads(cb: (squads: SquadRequest[]) => void) {
  const q = query(collection(db,'squads'), where('status','==','open'), orderBy('createdAt','desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SquadRequest))  )
}

export async function postSquad(data: Omit<SquadRequest,'id'|'applicants'|'status'|'createdAt'>) {
  await addDoc(collection(db,'squads'), { ...data, applicants: [], status: 'open', createdAt: serverTimestamp() })
}

export async function applySquad(id: string, uid: string) {
  await updateDoc(doc(db,'squads',id), { applicants: arrayUnion(uid) })
}

export function fmtTime(ts: Timestamp | null) {
  if (!ts) return 'just now'
  const m = Math.floor((Date.now() - ts.toMillis()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m/60)}h ago`
}

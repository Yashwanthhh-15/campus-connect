// src/services/messageService.ts
import {
  collection, addDoc, query, orderBy, onSnapshot,
  doc, setDoc, getDoc, updateDoc, where,
  serverTimestamp, Timestamp, increment,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Message {
  id: string; fromUid: string; fromName: string
  text: string; createdAt: Timestamp | null
}
export interface Thread {
  id: string; participants: string[]
  participantNames: Record<string,string>
  participantInitials: Record<string,string>
  participantAvatarColors: Record<string,string>
  lastMessage: string; lastMessageAt: Timestamp | null
  unreadCount: Record<string,number>
}

export function threadId(a: string, b: string) { return [a,b].sort().join('_') }

export async function getOrCreateThread(
  myUid: string, myName: string, myInit: string, myColor: string,
  theirUid: string, theirName: string, theirInit: string, theirColor: string,
) {
  const tid = threadId(myUid, theirUid)
  const ref = doc(db, 'threads', tid)
  if (!(await getDoc(ref)).exists()) {
    await setDoc(ref, {
      participants: [myUid, theirUid],
      participantNames:        { [myUid]: myName,  [theirUid]: theirName },
      participantInitials:     { [myUid]: myInit,  [theirUid]: theirInit },
      participantAvatarColors: { [myUid]: myColor, [theirUid]: theirColor },
      lastMessage: '', lastMessageAt: null,
      unreadCount: { [myUid]: 0, [theirUid]: 0 },
    })
  }
  return tid
}

export async function sendMessage(tid: string, fromUid: string, fromName: string, text: string, otherUid: string) {
  await addDoc(collection(db, 'threads', tid, 'messages'), { fromUid, fromName, text, createdAt: serverTimestamp() })
  await updateDoc(doc(db, 'threads', tid), {
    lastMessage: text, lastMessageAt: serverTimestamp(),
    [`unreadCount.${otherUid}`]: increment(1),
  })
}

export function subscribeMessages(tid: string, cb: (msgs: Message[]) => void) {
  const q = query(collection(db, 'threads', tid, 'messages'), orderBy('createdAt','asc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Message))  )
}

export function subscribeThreads(uid: string, cb: (threads: Thread[]) => void) {
  const q = query(collection(db,'threads'), where('participants','array-contains',uid), orderBy('lastMessageAt','desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Thread)))
}

export async function markRead(tid: string, uid: string) {
  await updateDoc(doc(db,'threads',tid), { [`unreadCount.${uid}`]: 0 })
}

export function fmtTime(ts: Timestamp | null) {
  if (!ts) return ''
  const m = Math.floor((Date.now() - ts.toMillis()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  return `${Math.floor(m/60)}h`
}

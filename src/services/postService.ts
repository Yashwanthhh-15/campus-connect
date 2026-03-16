import {
  collection, addDoc, query, orderBy, where,
  limit, onSnapshot, updateDoc, doc,
  arrayUnion, arrayRemove, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Post {
  id: string; authorUid: string; authorName: string
  authorInitials: string; authorAvatarColor: string; authorRole: string
  caption: string; tags: string[]
  mediaEmoji: string; mediaCaption: string; mediaColor: string
  type: 'photo' | 'video' | 'text'
  likes: string[]; commentCount: number
  createdAt: Timestamp | null
}

export function subscribeToPosts(cb: (posts: Post[]) => void, count = 30) {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(count))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post)))
}

export function subscribeToUserPosts(uid: string, cb: (posts: Post[]) => void) {
  const q = query(
    collection(db, 'posts'),
    where('authorUid', '==', uid),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post)))
}

export async function createPost(data: Omit<Post, 'id' | 'likes' | 'commentCount' | 'createdAt'>) {
  await addDoc(collection(db, 'posts'), {
    ...data, likes: [], commentCount: 0, createdAt: serverTimestamp()
  })
}

export async function toggleLike(postId: string, uid: string, liked: boolean) {
  await updateDoc(doc(db, 'posts', postId), {
    likes: liked ? arrayRemove(uid) : arrayUnion(uid)
  })
}

export function fmtTime(ts: Timestamp | null): string {
  if (!ts) return 'just now'
  const m = Math.floor((Date.now() - ts.toMillis()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
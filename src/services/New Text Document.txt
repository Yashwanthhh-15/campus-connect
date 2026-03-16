import {
  doc, setDoc, deleteDoc, getDoc,
  collection, getDocs, onSnapshot,
  serverTimestamp, increment, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { UserProfile, getProfile } from './authService'

export async function followUser(myUid: string, theirUid: string) {
  await setDoc(doc(db, 'users', myUid, 'following', theirUid), {
    uid: theirUid, followedAt: serverTimestamp()
  })
  await setDoc(doc(db, 'users', theirUid, 'followers', myUid), {
    uid: myUid, followedAt: serverTimestamp()
  })
  await updateDoc(doc(db, 'users', myUid),    { followingCount: increment(1) })
  await updateDoc(doc(db, 'users', theirUid), { followersCount: increment(1) })
}

export async function unfollowUser(myUid: string, theirUid: string) {
  await deleteDoc(doc(db, 'users', myUid,    'following', theirUid))
  await deleteDoc(doc(db, 'users', theirUid, 'followers', myUid))
  await updateDoc(doc(db, 'users', myUid),    { followingCount: increment(-1) })
  await updateDoc(doc(db, 'users', theirUid), { followersCount: increment(-1) })
}

export async function isFollowing(myUid: string, theirUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', myUid, 'following', theirUid))
  return snap.exists()
}

export async function getFollowing(myUid: string): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users', myUid, 'following'))
  const profiles = await Promise.all(snap.docs.map(d => getProfile(d.id)))
  return profiles.filter(Boolean) as UserProfile[]
}

export async function getFollowers(myUid: string): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users', myUid, 'followers'))
  const profiles = await Promise.all(snap.docs.map(d => getProfile(d.id)))
  return profiles.filter(Boolean) as UserProfile[]
}

export async function searchUsers(q: string, myUid: string): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs
    .map(d => d.data() as UserProfile)
    .filter(u => u.uid !== myUid && u.name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 15)
}

export function subscribeFollowCounts(
  uid: string,
  cb: (d: { followers: number; following: number }) => void
) {
  return onSnapshot(doc(db, 'users', uid), snap => {
    const data = snap.data() || {}
    cb({ followers: data.followersCount || 0, following: data.followingCount || 0 })
  })
}
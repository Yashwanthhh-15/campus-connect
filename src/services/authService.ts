import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export interface UserProfile {
  uid: string; name: string; handle: string; email: string
  branch: string; semester: string; university: string
  bio: string; roles: string[]
  avatarColor: string; initials: string
  followersCount: number; followingCount: number
  createdAt: any
}

const COLORS = ['#f0e6ff', '#e6f5ec', '#e6eeff', '#fff0e6', '#ffe6ec', '#e6fff5', '#fff5e6', '#e6f0ff']
const randColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]
const mkInitials = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export async function signUp(email: string, password: string, name: string, branch: string, semester: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  const profile: UserProfile = {
    uid: user.uid, name, email,
    handle: '@' + name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 99),
    branch, semester, university: 'My University',
    bio: '', roles: ['Student'],
    avatarColor: randColor(), initials: mkInitials(name),
    followersCount: 0, followingCount: 0,
    createdAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'users', user.uid), profile)
  return { user, profile }
}

export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getProfile(user.uid)
  return { user, profile }
}

export async function logOut() { await signOut(auth) }

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() as UserProfile : null
}

export async function updateProfileData(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), data)
}

export function onAuthChange(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb)
}
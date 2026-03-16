// src/services/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyBLRjaYgQdLCnN6IH5vfrleD5ImftVZKxc',
  authDomain:        'campusconnect-c7a62.firebaseapp.com',
  projectId:         'campusconnect-c7a62',
  storageBucket:     'campusconnect-c7a62.firebasestorage.app',
  messagingSenderId: '932523686433',
  appId:             '1:932523686433:web:d95dc4197d416b1bfb0160',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app

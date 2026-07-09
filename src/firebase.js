import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyCfMU0oyWHq9qJkuHaJnMaqJ25FEORe3u0",
  authDomain:        "biomethane-mis.firebaseapp.com",
  projectId:         "biomethane-mis",
  storageBucket:     "biomethane-mis.firebasestorage.app",
  messagingSenderId: "199660682219",
  appId:             "1:199660682219:web:221c0f7997ddc0fbaff7ae",
  measurementId:     "G-L2YYPE31RC"
}

const app = initializeApp(firebaseConfig)
export const db   = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})
export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch(() => {})

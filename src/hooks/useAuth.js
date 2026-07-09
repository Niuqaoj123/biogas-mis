import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

// Cache role in sessionStorage — instant on revisit, no Firestore call
function getCached(uid) {
  try { return sessionStorage.getItem(`biogas_role_${uid}`) } catch { return null }
}
function setCached(uid, role) {
  try { sessionStorage.setItem(`biogas_role_${uid}`, role) } catch {}
}

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [role,    setRole]    = useState(null)
  const [uid,     setUid]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fw) => {
      if (fw) {
        setUser(fw)
        setUid(fw.uid)

        const cached = getCached(fw.uid)
        if (cached) {
          // Instant — use cache, skip network call
          setRole(cached)
          setLoading(false)
          // Refresh silently in background
          getDoc(doc(db, 'users', fw.uid)).then(snap => {
            if (snap.exists()) {
              const r = snap.data().role || 'Lab Tech'
              setRole(r)
              setCached(fw.uid, r)
            }
          }).catch(() => {})
        } else {
          // First time — fetch then cache
          try {
            const snap = await getDoc(doc(db, 'users', fw.uid))
            const r = snap.exists() ? (snap.data().role || 'Lab Tech') : 'Lab Tech'
            setRole(r)
            setCached(fw.uid, r)
          } catch {
            setRole('Lab Tech')
          }
          setLoading(false)
        }
      } else {
        setUser(null); setRole(null); setUid(null)
        setLoading(false)
      }
    }, () => setLoading(false))
    return unsub
  }, [])

  return { user, role, uid, loading }
}

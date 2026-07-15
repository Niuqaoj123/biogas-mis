import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

function getCached(uid)       { try { return sessionStorage.getItem(`br_${uid}`) } catch { return null } }
function setCached(uid, role) { try { sessionStorage.setItem(`br_${uid}`, role)  } catch {} }

export function useAuth() {
  // Pre-check localStorage for existing Firebase auth session
  // Firebase stores auth state as 'firebase:authUser:...' in localStorage
  const hasExistingSession = Object.keys(localStorage).some(k => k.startsWith('firebase:authUser'))

  const [user,    setUser]    = useState(null)
  const [role,    setRole]    = useState(null)
  const [uid,     setUid]     = useState(null)
  // If no existing session, we know immediately user is logged out → no loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fw) => {
      if (fw) {
        setUser(fw)
        setUid(fw.uid)

        const cached = getCached(fw.uid)
        if (cached) {
          setRole(cached)
          setLoading(false)
          // Silently refresh role in background
          getDoc(doc(db, 'users', fw.uid))
            .then(snap => { if (snap.exists()) { const r = snap.data().role || 'Lab Tech'; setRole(r); setCached(fw.uid, r) } })
            .catch(() => {})
        } else {
          try {
            const snap = await getDoc(doc(db, 'users', fw.uid))
            const r = snap.exists() ? (snap.data().role || 'Lab Tech') : 'Lab Tech'
            setRole(r)
            setCached(fw.uid, r)
          } catch { setRole('Lab Tech') }
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

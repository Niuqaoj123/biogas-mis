import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [role,    setRole]    = useState(null)
  const [uid,     setUid]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fw) => {
      if (fw) {
        setUser(fw); setUid(fw.uid)
        try {
          const snap = await getDoc(doc(db, 'users', fw.uid))
          setRole(snap.exists() ? snap.data().role : 'Lab Tech')
        } catch { setRole('Lab Tech') }
      } else { setUser(null); setRole(null); setUid(null) }
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  return { user, role, uid, loading }
}

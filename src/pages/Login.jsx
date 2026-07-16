import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const ROLES = ['Admin', 'Lab Tech', 'Researcher']

function parseFirebaseError(code) {
  const map = {
    'auth/invalid-email':          'The email address format is not valid.',
    'auth/user-not-found':         'No account found with this email address.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Incorrect email or password. Please check and try again.',
    'auth/email-already-in-use':   'This email is already registered. Try signing in instead.',
    'auth/weak-password':          'Password must be at least 6 characters long.',
    'auth/too-many-requests':      'Too many failed attempts. Wait a few minutes and try again.',
    'auth/network-request-failed': 'Cannot reach Firebase. Check your internet connection.',
    'auth/user-disabled':          'This account has been disabled. Contact your administrator.',
    'auth/operation-not-allowed':  'Email/password sign-in is not enabled in Firebase Console.',
    'auth/missing-password':       'Please enter your password.',
    'auth/missing-email':          'Please enter your email address.',
    'auth/api-key-not-valid':      'Firebase API key is invalid. Check your .env file.',
  }
  return map[code] || `Firebase error: ${code}. Please try again or contact your administrator.`
}

export default function Login() {
  const [mode,      setMode]      = useState('login')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [remember,  setRemember]  = useState(true)
  const [name,      setName]      = useState('')
  const [role,      setRole]      = useState('Lab Tech')
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resetMode, setResetMode] = useState(false)

  const [blocked, setBlocked] = useState(false)

  // Detect if Firebase/Google APIs are being blocked by ad blocker
  useEffect(() => {
    const img = new Image()
    img.onload  = () => setBlocked(false)
    img.onerror = () => setBlocked(true)
    img.src = 'https://www.gstatic.com/firebasejs/1x1.png?' + Date.now()
    setTimeout(() => setBlocked(b => b === false ? false : true), 3000)
  }, [])

  // Pre-fill remembered email
  useEffect(() => {
    const saved = localStorage.getItem('biogas_remembered_email')
    if (saved) setEmail(saved)
  }, [])

  // Detect if Firebase/Firestore is being blocked by ad blocker
  useEffect(() => {
    const testUrl = 'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=projects%2Fbiomethane-mis%2Fdatabases%2F(default)&gsessionid=test&SID=test&RID=test&AID=0&zx=test&t=1'
    fetch(testUrl, { method: 'GET', mode: 'no-cors' })
      .then(() => setBlocked(false))
      .catch(() => setBlocked(true))
    // Simpler check: if net::ERR_BLOCKED_BY_CLIENT fires, blocked=true
    const img = new Image()
    img.onerror = () => {}
    img.onload  = () => {}
    // Check via script tag approach
    const check = async () => {
      try {
        await fetch('https://firestore.googleapis.com/', { mode: 'no-cors', cache: 'no-store' })
        setBlocked(false)
      } catch (e) {
        if (e.message?.includes('blocked') || e.message?.includes('Failed to fetch')) {
          setBlocked(true)
        }
      }
    }
    check()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      if (resetMode) {
        await sendPasswordResetEmail(auth, email)
        setSuccess(`Reset link sent to ${email}. Check your inbox and spam folder.`)
        setLoading(false)
        return
      }
      // Set persistence so user stays logged in across browser sessions
      await setPersistence(auth, browserLocalPersistence)

      if (mode === 'login') {
        if (remember) {
          localStorage.setItem('biogas_remembered_email', email)
        } else {
          localStorage.removeItem('biogas_remembered_email')
        }
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.')
          setLoading(false)
          return
        }
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', user.uid), {
          name, email, role, createdAt: new Date().toISOString(),
        })
      }
    } catch (err) {
      setError(parseFirebaseError(err.code || ''))
    }
    setLoading(false)
  }

  function switchMode(m) {
    setMode(m); setResetMode(false); setError(''); setSuccess('')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(192,57,43,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(74,158,255,0.06) 0%, transparent 50%), #0d1117',
    }}>
      <div style={{ background: '#161b22', border: '1px solid #2d3748', borderRadius: 16, padding: 48, width: 420, boxShadow: '0 0 60px rgba(62,207,142,0.05)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 36, height: 36, background: "var(--red)", borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 13, color: "var(--red)", letterSpacing: '0.1em' }}>BIOGAS MIS</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 11, color: '#64748b' }}>Laboratory Information System</div>
          </div>
        </div>

        {/* Ad blocker warning banner */}
        {blocked && (
          <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.4)', borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:12, lineHeight:1.7 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ fontWeight:600, color:'#f59e0b' }}>Ad blocker detected</span>
            </div>
            <span style={{ color:'#94a3b8' }}>
              Your browser or extension is blocking Firebase — this system cannot load properly.<br/>
              <strong style={{color:'#e2e8f0'}}>Fix options:</strong><br/>
              • Use <strong style={{color:'#e2e8f0'}}>Google Chrome</strong> or <strong style={{color:'#e2e8f0'}}>Microsoft Edge</strong><br/>
              • Or disable your ad blocker / Brave Shields for this site<br/>
              • Or open in an <strong style={{color:'#e2e8f0'}}>Incognito / Private window</strong>
            </span>
          </div>
        )}

        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, color: '#e2e8f0' }}>
          {resetMode ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
          {resetMode ? "Enter your email and we'll send a reset link."
            : mode === 'login' ? 'Sign in to access the lab portal.'
            : 'Register a new lab account.'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && !resetMode && (
            <Field label="FULL NAME">
              <input placeholder="e.g. Dr. Santos" value={name} onChange={e => setName(e.target.value)} required />
            </Field>
          )}

          <Field label="EMAIL">
            <input type="email" placeholder="lab@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </Field>

          {!resetMode && (
            <Field label="PASSWORD">
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                  display: 'flex', alignItems: 'center', padding: 0,
                }}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </Field>
          )}

          {mode === 'login' && !resetMode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -8, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: '#94a3b8' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: "var(--red)", cursor: 'pointer' }}
                />
                Remember me
              </label>
              <span onClick={() => { setResetMode(true); setError(''); setSuccess('') }}
                style={{ fontSize: 12, color: 'var(--gold)', cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>
          )}

          {mode === 'register' && !resetMode && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontFamily: 'Space Mono', color: '#64748b', letterSpacing: '0.05em', marginBottom: 8 }}>ROLE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)} style={{
                    padding: '9px 6px',
                    background: role === r ? 'rgba(192,57,43,0.08)' : '#1c2330',
                    border: `1px solid ${role === r ? "var(--red)" : '#2d3748'}`,
                    borderRadius: 8, color: role === r ? "var(--red)" : '#94a3b8',
                    fontSize: 11, fontFamily: 'Space Mono', cursor: 'pointer',
                  }}>{r}</button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ef4444', marginBottom: 16, lineHeight: 1.6, display: 'flex', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: "var(--red)", marginBottom: 16, lineHeight: 1.6, display: 'flex', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13, background: "var(--red)", border: 'none',
            borderRadius: 8, color: '#0d1117', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: 'DM Sans', transition: 'all 0.2s',
          }}>
            {loading ? 'Please wait...' : resetMode ? 'Send reset link' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#64748b' }}>
          {resetMode
            ? <span onClick={() => { setResetMode(false); setError(''); setSuccess('') }} style={{ color: 'var(--gold)', cursor: 'pointer' }}>← Back to sign in</span>
            : mode === 'login'
            ? <>Don't have an account?{' '}<span onClick={() => switchMode('register')} style={{ color: 'var(--gold)', cursor: 'pointer' }}>Register</span></>
            : <>Already have an account?{' '}<span onClick={() => switchMode('login')} style={{ color: 'var(--gold)', cursor: 'pointer' }}>Sign in</span></>
          }
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontFamily: 'Space Mono', color: '#64748b', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

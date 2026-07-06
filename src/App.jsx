import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { lazy, Suspense } from 'react'

// Lazy load pages — only loads the page you're on, not all at once
const Login      = lazy(() => import('./pages/Login'))
const Dashboard  = lazy(() => import('./pages/Dashboard'))
const Biomethane = lazy(() => import('./pages/Biomethane'))
const Water      = lazy(() => import('./pages/Water'))
const Soil       = lazy(() => import('./pages/Soil'))
const Reports    = lazy(() => import('./pages/Reports'))
const Settings   = lazy(() => import('./pages/Settings'))
const QCReview        = lazy(() => import('./pages/QCReview'))
const Inoculum        = lazy(() => import('./pages/Inoculum'))
const Characterization= lazy(() => import('./pages/Characterization'))
const BMPExperiment   = lazy(() => import('./pages/BMPExperiment'))
const GasLog          = lazy(() => import('./pages/GasLog'))
import Sidebar    from './components/Sidebar'

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTop:'2px solid var(--red)', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ fontFamily:'Space Mono', fontSize:11, color:'var(--text3)' }}>Loading...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function AppLoading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--bg)', gap:16 }}>
      <div style={{ width:36, height:36, background:'var(--red)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>
      </div>
      <div style={{ color:'var(--red)', fontFamily:'Space Mono', fontSize:13, letterSpacing:'0.1em' }}>BIOGAS MIS</div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--red)', opacity:0.4, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  )
}

function PrivateLayout() {
  const { user, role, uid, loading } = useAuth()
  if (loading) return <AppLoading />
  if (!user)   return <Navigate to="/login" replace />

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar user={user} role={role} />
      <main style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/biomethane" element={<BMPExperiment />} />
            <Route path="/water"      element={<Water />} />
            <Route path="/soil"       element={<Soil />} />
            <Route path="/qcreview"        element={<QCReview />} />
            <Route path="/inoculum"         element={<Inoculum />} />
            <Route path="/characterization" element={<Characterization />} />
            <Route path="/gaslog"           element={<GasLog />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/settings"   element={<Settings />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <AppLoading />

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> :
        <Suspense fallback={<AppLoading />}><Login /></Suspense>
      } />
      <Route path="/*" element={<PrivateLayout />} />
    </Routes>
  )
}

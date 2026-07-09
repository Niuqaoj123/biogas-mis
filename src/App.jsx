import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { lazy, Suspense } from 'react'

const Login           = lazy(() => import('./pages/Login'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Biomethane      = lazy(() => import('./pages/Biomethane'))
const Water           = lazy(() => import('./pages/Water'))
const Soil            = lazy(() => import('./pages/Soil'))
const Reports         = lazy(() => import('./pages/Reports'))
const Settings        = lazy(() => import('./pages/Settings'))
const Inoculum        = lazy(() => import('./pages/Inoculum'))
const Characterization= lazy(() => import('./pages/Characterization'))
const BMPExperiment   = lazy(() => import('./pages/BMPExperiment'))
const GasLog          = lazy(() => import('./pages/GasLog'))
const QCReview        = lazy(() => import('./pages/QCReview'))
const WaterQuality    = lazy(() => import('./pages/WaterQuality'))
const Wastewater      = lazy(() => import('./pages/Wastewater'))
import Sidebar from './components/Sidebar'

// ── Mapúa red loading screen ──────────────────────────────────────
function Loading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#111418', gap:14 }}>
      <div style={{ width:36, height:36, background:'#C0392B', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <div style={{ color:'#C0392B', fontFamily:'Space Mono', fontSize:12, letterSpacing:'0.12em' }}>BIOGAS MIS</div>
      <div style={{ display:'flex', gap:5 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:6, height:6, borderRadius:'50%', background:'#C0392B',
            animation:`dot 1s ease-in-out ${i*0.18}s infinite`
          }}/>
        ))}
      </div>
      <style>{`@keyframes dot{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

// ── Page-level spinner (smaller, for tab switches) ────────────────
function PageSpinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
      <div style={{ width:28, height:28, border:'2px solid #2E3340', borderTop:'2px solid #C0392B', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function PrivateLayout() {
  const { user, role, loading } = useAuth()
  if (loading) return <Loading />
  if (!user)   return <Navigate to="/login" replace />
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar user={user} role={role} />
      <main style={{ flex:1, overflowY:'auto', background:'#111418' }}>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/"                 element={<Dashboard />} />
            <Route path="/biomethane"       element={<Biomethane />} />
            <Route path="/bmp-testing"      element={<Biomethane />} />
            <Route path="/water"            element={<Water />} />
            <Route path="/waterquality"     element={<WaterQuality />} />
            <Route path="/wastewater"       element={<Wastewater />} />
            <Route path="/soil"             element={<Soil />} />
            <Route path="/reports"          element={<Reports />} />
            <Route path="/settings"         element={<Settings />} />
            <Route path="/inoculum"         element={<Inoculum />} />
            <Route path="/characterization" element={<Characterization />} />
            <Route path="/experiment"       element={<BMPExperiment />} />
            <Route path="/gaslog"           element={<GasLog />} />
            <Route path="/qcreview"         element={<QCReview />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> :
        <Suspense fallback={<Loading />}><Login /></Suspense>
      }/>
      <Route path="/*" element={<PrivateLayout />} />
    </Routes>
  )
}

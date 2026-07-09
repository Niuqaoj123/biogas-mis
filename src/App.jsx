import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Biomethane     from './pages/Biomethane'
import Water          from './pages/Water'
import Soil           from './pages/Soil'
import Reports        from './pages/Reports'
import Settings       from './pages/Settings'
import Inoculum       from './pages/Inoculum'
import Characterization from './pages/Characterization'
import BMPExperiment  from './pages/BMPExperiment'
import GasLog         from './pages/GasLog'
import QCReview       from './pages/QCReview'
import Sidebar        from './components/Sidebar'

function Loading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0d1117', gap:16 }}>
      <div style={{ width:36, height:36, background:'#3ecf8e', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>
      </div>
      <div style={{ color:'#3ecf8e', fontFamily:'Space Mono', fontSize:13, letterSpacing:'0.1em' }}>BIOGAS LIMS</div>
      <div style={{ color:'#64748b', fontFamily:'Space Mono', fontSize:11 }}>Loading...</div>
    </div>
  )
}

function PrivateLayout() {
  const { user, role, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar user={user} role={role} />
      <main style={{ flex:1, overflowY:'auto', background:'#0d1117' }}>
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/biomethane"      element={<Biomethane />} />
          <Route path="/water"           element={<Water />} />
          <Route path="/soil"            element={<Soil />} />
          <Route path="/reports"         element={<Reports />} />
          <Route path="/settings"        element={<Settings />} />
          <Route path="/inoculum"        element={<Inoculum />} />
          <Route path="/characterization" element={<Characterization />} />
          <Route path="/experiment"      element={<BMPExperiment />} />
          <Route path="/gaslog"          element={<GasLog />} />
          <Route path="/qcreview"        element={<QCReview />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*"     element={<PrivateLayout />} />
    </Routes>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login            from './pages/Login'
import Dashboard        from './pages/Dashboard'
import Biomethane       from './pages/Biomethane'
import Water            from './pages/Water'
import Soil             from './pages/Soil'
import Reports          from './pages/Reports'
import Settings         from './pages/Settings'
import Inoculum         from './pages/Inoculum'
import Characterization from './pages/Characterization'
import BMPExperiment    from './pages/BMPExperiment'
import GasLog           from './pages/GasLog'
import QCReview         from './pages/QCReview'
import WaterQuality     from './pages/WaterQuality'
import Wastewater       from './pages/Wastewater'
import Sidebar          from './components/Sidebar'

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
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#C0392B', animation:`dot 1s ease-in-out ${i*0.18}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes dot{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}`}</style>
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

import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const NAV_MAIN = [
  { to:'/',  label:'Dashboard', icon:IGrid },
]
const NAV_MAIN_MODULES = [
  { to:'/bmp-testing',  label:'Biomethane',        icon:IFlask2 },
  { to:'/waterquality', label:'Water Quality',      icon:IDrop   },
  { to:'/wastewater',   label:'Wastewater',         icon:IPipe   },
  { to:'/soil',         label:'Soil & Fertilizer',  icon:ILeaf   },
]
const NAV_BMP = [
  { to:'/inoculum',         label:'Inoculum Batch',     icon:IBeaker },
  { to:'/characterization', label:'Characterization',   icon:IScope  },
  { to:'/experiment',       label:'BMP Experiment',     icon:IFlask  },
  { to:'/gaslog',           label:'Gas Monitoring Log', icon:IChart  },
]
const NAV_OTHER = [
  { to:'/qcreview', label:'QC Review', icon:ICheck },
]
const NAV_BOTTOM = [
  { to:'/reports',  label:'Reports & Export', icon:IFile },
  { to:'/settings', label:'Settings',         icon:IGear },
]

export default function Sidebar({ user, role }) {
  const navigate = useNavigate()
  const initials = (user?.email || 'U').slice(0, 2).toUpperCase()

  async function handleLogout() { await signOut(auth); navigate('/login') }

  return (
    <aside style={{ width:224, minHeight:'100vh', background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'18px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, background:'var(--red)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <div>
          <div style={{ fontFamily:'Space Mono', fontSize:11, color:'var(--red)', letterSpacing:'0.08em', fontWeight:700 }}>BIOGAS MIS</div>
          <div style={{ fontFamily:'Space Mono', fontSize:9, color:'var(--text3)', letterSpacing:'0.04em' }}>Mapúa University</div>
        </div>
      </div>

      <nav style={{ padding:'10px 10px', flex:1, overflowY:'auto' }}>
        <Section label="MAIN"            items={NAV_MAIN} />
        <Section label="LAB MODULES"     items={NAV_MAIN_MODULES} />
        <Section label="BIOGAS WORKFLOW" items={NAV_BMP} />
        <Section label="QUALITY CONTROL" items={NAV_OTHER} />
        <Section label="TOOLS"           items={NAV_BOTTOM} />
      </nav>

      <div style={{ padding:'12px 10px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 8px', borderRadius:8, marginBottom:4 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg, var(--red), var(--red-dim))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>{user?.email?.split('@')[0]}</div>
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'Space Mono' }}>{role}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:6, width:'100%', padding:'7px 8px', borderRadius:6, background:'transparent', border:'none', cursor:'pointer', fontSize:12, color:'var(--text3)', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color='var(--fail-lt)'; e.currentTarget.style.background='rgba(192,57,43,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.background='transparent' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}

function Section({ label, items }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ fontSize:9, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.12em', padding:'8px 6px 4px' }}>{label}</div>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
          display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8,
          cursor:'pointer', fontSize:13, marginBottom:2, textDecoration:'none',
          background: isActive ? 'rgba(192,57,43,0.12)' : 'transparent',
          color: isActive ? 'var(--red)' : 'var(--text2)',
          borderLeft: isActive ? '2px solid var(--red)' : '2px solid transparent',
          transition:'all 0.15s',
        })}>
          <Icon />
          {label}
        </NavLink>
      ))}
    </div>
  )
}

function IGrid()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function IFlask()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg> }
function IFlask2() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31L5.5 17.5C4.68 19.07 5.78 21 7.56 21h8.88c1.78 0 2.88-1.93 2.06-3.5L14 9.31V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg> }
function IDrop()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/></svg> }
function IPipe()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2"/><path d="M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg> }
function ILeaf()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 8C8 10 5.9 16.17 3.82 19.82A9.08 9.08 0 004 21"/><path d="M21 3a15.78 15.78 0 01-6 14"/></svg> }
function IBeaker() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg> }
function IScope()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IChart()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function ICheck()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function IFile()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function IGear()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }

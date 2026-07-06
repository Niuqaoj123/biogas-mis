// Shared UI components used across all pages
export function PageHeader({ title, sub, breadcrumb }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontFamily:'Space Mono', fontSize:11, color:'var(--text3)', marginBottom:8 }}>
        BIOGAS LIMS / <span style={{ color:"var(--red)" }}>{breadcrumb}</span>
      </div>
      <h1 style={{ fontSize:22, fontWeight:600, marginBottom:4 }}>{title}</h1>
      <p style={{ fontSize:13, color:'var(--text2)' }}>{sub}</p>
    </div>
  )
}
export function Card({ title, children, action }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:22, marginBottom:20 }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span>{title}</span>{action}
      </div>
      {children}
    </div>
  )
}
export function KPI({ label, value, color, sub }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
      <div style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:600, fontFamily:'Space Mono', color }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{sub}</div>}
    </div>
  )
}
export function Tabs({ tab, setTab, tabs }) {
  return (
    <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          padding:'9px 18px', fontSize:13, cursor:'pointer', background:'transparent', border:'none',
          borderBottom:`2px solid ${tab===t.id?"var(--red)":'transparent'}`,
          color:tab===t.id?"var(--red)":'var(--text2)', marginBottom:-1, transition:'all 0.15s'
        }}>{t.label}</button>
      ))}
    </div>
  )
}
export function Row({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>{children}</div> }
export function Row3({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>{children}</div> }
export function Field({ label, children, hint }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize:10, color:'var(--text3)' }}>{hint}</span>}
    </div>
  )
}
export function BtnPrimary({ children, ...p }) {
  return <button {...p} style={{ padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:500, background:"var(--red)", border:'none', color:'#0d1117', cursor:p.disabled?'not-allowed':'pointer', opacity:p.disabled?.7:1 }}>{children}</button>
}
export function BtnOutline({ children, ...p }) {
  return <button {...p} style={{ padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:500, background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer' }}>{children}</button>
}
export function BtnDanger({ children, ...p }) {
  return <button {...p} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:500, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', cursor:'pointer' }}>{children}</button>
}
export function Badge({ children, color='var(--red)' }) {
  return <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontFamily:'Space Mono', background:`${color}18`, color, border:`1px solid ${color}44` }}>{children}</span>
}
export function StatusBadge({ status }) {
  const map = { Pass:'var(--red)', Fail:'#ef4444', Review:'#f59e0b', Pending:'#64748b', Approved:'var(--red)', Rejected:'#ef4444' }
  const c = map[status] || '#64748b'
  return <Badge color={c}>{status}</Badge>
}
export function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:'var(--bg2)', border:'1px solid var(--red)', borderRadius:10, padding:'14px 20px', fontSize:13, zIndex:9999, display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:"var(--red)" }} />{msg}
    </div>
  )
}
export function QualityPreview({ result }) {
  if (!result) return null
  return (
    <div style={{ background:`${result.color}10`, border:`1px solid ${result.color}40`, borderRadius:10, padding:'14px 16px', marginTop:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:result.issues.length>0?10:0 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:result.color }} />
        <span style={{ fontSize:12, fontWeight:600, color:result.color }}>Predicted: {result.status}</span>
        <span style={{ fontSize:11, fontFamily:'Space Mono', color:result.color, opacity:.8 }}>{result.rating}</span>
      </div>
      {result.issues.map((iss,i) => (
        <div key={i} style={{ fontSize:11, color:'#f59e0b', marginTop:4, display:'flex', gap:6 }}><span>⚠</span><span>{iss}</span></div>
      ))}
    </div>
  )
}
export function Spinner() { return <div style={{ fontSize:12, color:'var(--text3)', padding:16 }}>Loading...</div> }
export function EmptyState({ msg='No records yet.' }) {
  return <div style={{ padding:'32px 16px', textAlign:'center', fontSize:13, color:'var(--text3)' }}>{msg}</div>
}


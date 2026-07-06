import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase'
import SampleTable from '../components/SampleTable'
import { PageHeader } from './Dashboard'
import { assessBMP } from './statusRules'
import { useAuth } from '../hooks/useAuth'

const FEEDSTOCKS = ['Cattle manure','Swine manure','Food waste','Rice straw','Mixed sludge','Other']
const COLS = [
  { key: 'sampleId',       label: 'SAMPLE ID' },
  { key: 'feedstock',      label: 'FEEDSTOCK' },
  { key: 'ch4Yield',       label: 'CH₄ YIELD (mL/gVS)' },
  { key: 'ch4Content',     label: 'CH₄ %' },
  { key: 'volatileSolids', label: 'VS %' },
  { key: 'rating',         label: 'QUALITY' },
  { key: 'dateCollected',  label: 'DATE' },
]
const empty = { sampleId:'', dateCollected:'', feedstock:'Cattle manure', sampleWeight:'', volatileSolids:'', totalSolids:'', ch4Yield:'', ch4Content:'', notes:'' }

export default function Biomethane() {
  const { uid } = useAuth()
  const [tab,     setTab]     = useState('entry')
  const [form,    setForm]    = useState(empty)
  const [samples, setSamples] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [preview, setPreview] = useState(null)

  // Real-time listener — instant updates, no loading delay
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'bmp_samples'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setSamples(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  // Live quality preview as user types
  useEffect(() => {
    if (form.ch4Yield || form.ch4Content || form.volatileSolids) {
      setPreview(assessBMP(form))
    } else {
      setPreview(null)
    }
  }, [form.ch4Yield, form.ch4Content, form.volatileSolids])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.sampleId.trim()) return showToast('Sample ID is required')
    setSaving(true)
    const assessment = assessBMP(form)
    await addDoc(collection(db, 'bmp_samples'), {
      ...form,
      uid,
      status: assessment.status,
      rating: assessment.rating,
      issues: assessment.issues,
      createdAt: new Date().toISOString(),
    })
    setForm(empty)
    setPreview(null)
    showToast('BMP sample saved!')
    setSaving(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const passCount   = samples.filter(s => s.status === 'Pass').length
  const failCount   = samples.filter(s => s.status === 'Fail').length
  const reviewCount = samples.filter(s => s.status === 'Review').length

  return (
    <div style={{ padding: 32 }}>
      <PageHeader title="Biomethane potential testing" sub="Record and manage BMP analysis for organic feedstock samples." breadcrumb="Biomethane / BMP" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <KPI label="TOTAL SAMPLES"  value={samples.length} color="#8b5cf6" />
        <KPI label="PASS"           value={passCount}      color="var(--red)" sub="Good quality" />
        <KPI label="NEEDS REVIEW"   value={reviewCount}    color="#f59e0b" sub="Fair quality" />
        <KPI label="FAIL"           value={failCount}      color="#ef4444" sub="Poor quality" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{ id:'entry', label:'Data entry' }, { id:'records', label:'Sample records' }]} />

      {tab === 'entry' && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:22 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:20 }}>New BMP sample entry</div>
          <form onSubmit={handleSave}>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. BMP-2026-001" value={form.sampleId} onChange={set('sampleId')} required /></Field>
              <Field label="DATE COLLECTED"><input type="date" value={form.dateCollected} onChange={set('dateCollected')} /></Field>
            </Row>
            <Row>
              <Field label="FEEDSTOCK TYPE">
                <select value={form.feedstock} onChange={set('feedstock')}>
                  {FEEDSTOCKS.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="SAMPLE WEIGHT (g)"><input type="number" step="0.01" placeholder="e.g. 10.5" value={form.sampleWeight} onChange={set('sampleWeight')} /></Field>
            </Row>
            <Row>
              <Field label="VOLATILE SOLIDS (%)"><input type="number" step="0.01" placeholder="e.g. 82.3" value={form.volatileSolids} onChange={set('volatileSolids')} /></Field>
              <Field label="TOTAL SOLIDS (%)"><input type="number" step="0.01" placeholder="e.g. 91.0" value={form.totalSolids} onChange={set('totalSolids')} /></Field>
            </Row>
            <Row>
              <Field label="CH₄ YIELD (mL/gVS)"><input type="number" step="0.1" placeholder="e.g. 312" value={form.ch4Yield} onChange={set('ch4Yield')} /></Field>
              <Field label="CH₄ CONTENT (%)"><input type="number" step="0.1" placeholder="e.g. 63.4" value={form.ch4Content} onChange={set('ch4Content')} /></Field>
            </Row>
            <Field label="NOTES"><textarea rows={2} placeholder="Optional observations..." value={form.notes} onChange={set('notes')} /></Field>

            {/* Live quality preview */}
            {preview && <QualityPreview result={preview} />}

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save sample'}</BtnPrimary>
              <BtnOutline type="button" onClick={() => { setForm(empty); setPreview(null) }}>Clear form</BtnOutline>
            </div>
          </form>
        </div>
      )}

      {tab === 'records' && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:22 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            Sample records <Badge color="#8b5cf6">{samples.length} total</Badge>
          </div>
          <SampleTable samples={samples} columns={COLS} collection="bmp_samples" onDeleted={id => setSamples(s => s.filter(r => r.id !== id))} />
        </div>
      )}
      <Toast msg={toast} />
    </div>
  )
}

function QualityPreview({ result }) {
  return (
    <div style={{ background: `${result.color}10`, border: `1px solid ${result.color}40`, borderRadius: 10, padding: '14px 16px', marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: result.issues.length > 0 ? 10 : 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: result.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: result.color }}>Predicted: {result.status}</span>
        <span style={{ fontSize: 11, fontFamily: 'Space Mono', color: result.color, opacity: 0.8 }}>{result.rating}</span>
      </div>
      {result.issues.map((iss, i) => (
        <div key={i} style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, display: 'flex', gap: 6 }}>
          <span>⚠</span><span>{iss}</span>
        </div>
      ))}
    </div>
  )
}

function KPI({ label, value, color, sub }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
      <div style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:600, fontFamily:'Space Mono', color }}>{value}</div>
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
          borderBottom:`2px solid ${tab===t.id ? 'var(--red)' : 'transparent'}`,
          color: tab===t.id ? 'var(--red)' : 'var(--text2)', marginBottom:-1, transition:'all 0.15s',
        }}>{t.label}</button>
      ))}
    </div>
  )
}
export function Row({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>{children}</div>
}
export function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em' }}>{label}</label>
      {children}
    </div>
  )
}
export function BtnPrimary({ children, ...props }) {
  return <button {...props} style={{ padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:500, background:'var(--red)', border:'none', color:'#0d1117', cursor:props.disabled?'not-allowed':'pointer', opacity:props.disabled?0.7:1, fontFamily:'DM Sans' }}>{children}</button>
}
export function BtnOutline({ children, ...props }) {
  return <button {...props} style={{ padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:500, background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', fontFamily:'DM Sans' }}>{children}</button>
}
export function Badge({ children, color }) {
  return <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontFamily:'Space Mono', background:`${color}18`, color, border:`1px solid ${color}44` }}>{children}</span>
}
export function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:'var(--bg2)', border:'1px solid var(--red)', borderRadius:10, padding:'14px 20px', fontSize:13, zIndex:9999, display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)' }} />
      {msg}
    </div>
  )
}

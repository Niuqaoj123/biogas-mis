import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import SampleTable from '../components/SampleTable'
import { PageHeader } from './Dashboard'
import { Row, Field, BtnPrimary, BtnOutline, Tabs, Toast } from './Shared'
import { assessWaterQuality } from './statusRules'

const COLS = [
  { key:'sampleId',    label:'SAMPLE ID' },
  { key:'source',      label:'SOURCE' },
  { key:'pH',          label:'pH' },
  { key:'turbidity',   label:'TURBIDITY (NTU)' },
  { key:'dissolvedO2', label:'DO (mg/L)' },
  { key:'temp',        label:'TEMP (°C)' },
  { key:'rating',      label:'QUALITY' },
  { key:'dateCollected', label:'DATE' },
]
const empty = { sampleId:'', dateCollected:'', source:'', pH:'', turbidity:'', dissolvedO2:'', temp:'', conductivity:'', notes:'' }

export default function WaterQuality() {
  const [tab,     setTab]     = useState('entry')
  const [form,    setForm]    = useState(empty)
  const [samples, setSamples] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db,'water_quality'), orderBy('createdAt','desc')), snap =>
      setSamples(snap.docs.map(d => ({ id:d.id, ...d.data() }))))
    return unsub
  }, [])

  useEffect(() => {
    if (form.pH || form.dissolvedO2 || form.turbidity) setPreview(assessWaterQuality(form))
    else setPreview(null)
  }, [form.pH, form.dissolvedO2, form.turbidity, form.temp])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.sampleId.trim()) return showToast('Sample ID is required')
    setSaving(true)
    const a = assessWaterQuality(form)
    await addDoc(collection(db,'water_quality'), { ...form, status:a.status, rating:a.rating, issues:a.issues, standard:'DAO 2016-08 WQG', createdAt: new Date().toISOString() })
    setForm(empty); setPreview(null)
    showToast('Water quality sample saved!')
    setSaving(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const passCount = samples.filter(s => s.status === 'Pass').length
  const failCount = samples.filter(s => s.status === 'Fail').length

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Water quality analysis" sub="Assessment based on DENR DAO 2016-08 Water Quality Guidelines (WQG)." breadcrumb="Water Quality" />

      <DaoNote />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="TOTAL SAMPLES" value={samples.length} color="var(--blue)" />
        <KPI label="COMPLIANT"     value={passCount}      color="var(--pass-lt)" sub="Pass WQG" />
        <KPI label="NON-COMPLIANT" value={failCount}      color="var(--fail-lt)" sub="Fail" />
        <KPI label="STANDARD"      value="DAO 2016-08"    color="var(--gold)" sub="WQG Class A" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{ id:'entry', label:'Data entry' }, { id:'records', label:'Sample records' }]} />

      {tab === 'entry' && (
        <Card title="Water quality — new entry" badge="DAO 2016-08 WQG">
          <form onSubmit={handleSave}>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. WQ-2026-001" value={form.sampleId} onChange={set('sampleId')} required /></Field>
              <Field label="DATE COLLECTED"><input type="date" value={form.dateCollected} onChange={set('dateCollected')} /></Field>
            </Row>
            <Row>
              <Field label="SAMPLE SOURCE / LOCATION"><input placeholder="e.g. Digester inlet, River station 1" value={form.source} onChange={set('source')} /></Field>
              <Field label="pH  (WQG Class A: 6.5–8.5)"><input type="number" step="0.01" placeholder="e.g. 7.2" value={form.pH} onChange={set('pH')} /></Field>
            </Row>
            <Row>
              <Field label="DISSOLVED OXYGEN — DO (mg/L)  (WQG: ≥5)"><input type="number" step="0.01" placeholder="e.g. 6.5" value={form.dissolvedO2} onChange={set('dissolvedO2')} /></Field>
              <Field label="TURBIDITY (NTU)"><input type="number" step="0.1" placeholder="e.g. 12" value={form.turbidity} onChange={set('turbidity')} /></Field>
            </Row>
            <Row>
              <Field label="TEMPERATURE (°C)  (WQG: ambient ±3°C)"><input type="number" step="0.1" placeholder="e.g. 28" value={form.temp} onChange={set('temp')} /></Field>
              <Field label="CONDUCTIVITY (µS/cm)"><input type="number" step="0.1" placeholder="e.g. 450" value={form.conductivity} onChange={set('conductivity')} /></Field>
            </Row>
            <Field label="NOTES / OBSERVATIONS"><textarea rows={2} placeholder="Field observations, sampling conditions, etc." value={form.notes} onChange={set('notes')} /></Field>
            {preview && <QualityPreview result={preview} standard="DAO 2016-08 WQG" />}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save sample'}</BtnPrimary>
              <BtnOutline type="button" onClick={() => { setForm(empty); setPreview(null) }}>Clear</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {tab === 'records' && (
        <Card title="Water quality records" badge={`${samples.length} total`}>
          <SampleTable samples={samples} columns={COLS} collection="water_quality" onDeleted={id => setSamples(s => s.filter(r => r.id !== id))} />
        </Card>
      )}

      <Toast msg={toast} />
    </div>
  )
}

function DaoNote() {
  return (
    <div style={{ background:'rgba(192,57,43,0.06)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:24, fontSize:12, color:'var(--text2)', display:'flex', gap:8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Standards reference: <strong style={{color:'var(--gold)'}}>DENR DAO 2016-08</strong> — Water Quality Guidelines (WQG), Philippines Clean Water Act RA 9275.
    </div>
  )
}
function QualityPreview({ result, standard }) {
  return (
    <div style={{ background:`${result.color}12`, border:`1px solid ${result.color}40`, borderRadius:10, padding:'14px 16px', marginTop:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: result.issues.length > 0 ? 10 : 0, flexWrap:'wrap' }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:result.color, flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:600, color:result.color }}>Predicted: {result.status}</span>
        <span style={{ fontSize:11, fontFamily:'Space Mono', color:result.color, opacity:0.8 }}>{result.rating}</span>
        <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'Space Mono', marginLeft:'auto' }}>Basis: {standard}</span>
      </div>
      {result.issues.map((iss, i) => (
        <div key={i} style={{ fontSize:11, color:'var(--review-lt)', marginTop:4, display:'flex', gap:6 }}>
          <span>⚠</span><span>{iss}</span>
        </div>
      ))}
    </div>
  )
}
function Card({ title, badge, children }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:22, marginBottom:20 }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
        {title}
        {badge && <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontFamily:'Space Mono', background:'rgba(201,168,76,0.1)', color:'var(--gold)', border:'1px solid rgba(201,168,76,0.3)' }}>{badge}</span>}
      </div>
      {children}
    </div>
  )
}
function KPI({ label, value, color, sub }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
      <div style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:value?.toString().length > 6 ? 16 : 24, fontWeight:600, fontFamily:'Space Mono', color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

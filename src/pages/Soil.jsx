import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import SampleTable from '../components/SampleTable'
import { PageHeader } from './Dashboard'
import { Tabs, Row, Field, BtnPrimary, BtnOutline, Badge, Toast } from './Biomethane'
import { assessSoil } from './statusRules'
import { useAuth } from '../hooks/useAuth'

const COLS = [
  { key:'sampleId',    label:'SAMPLE ID' },
  { key:'sampleType',  label:'TYPE' },
  { key:'location',    label:'LOCATION' },
  { key:'nitrogen',    label:'N %' },
  { key:'phosphorus',  label:'P %' },
  { key:'potassium',   label:'K %' },
  { key:'soilPH',      label:'pH' },
  { key:'rating',      label:'QUALITY' },
  { key:'dateCollected', label:'DATE' },
]
const SAMPLE_TYPES = ['Digestate solid','Soil','Compost','Biofertilizer','Other']
const empty = { sampleId:'', dateCollected:'', sampleType:'Digestate solid', location:'', nitrogen:'', phosphorus:'', potassium:'', soilPH:'', organicMatter:'', moistureContent:'', notes:'' }

export default function Soil() {
  const { uid } = useAuth()
  const [tab,     setTab]     = useState('entry')
  const [form,    setForm]    = useState(empty)
  const [samples, setSamples] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [preview, setPreview] = useState(null)

  // Real-time listener
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'soil_samples'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setSamples(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  // Live preview
  useEffect(() => {
    if (form.nitrogen || form.phosphorus || form.potassium || form.soilPH) {
      setPreview(assessSoil(form))
    } else {
      setPreview(null)
    }
  }, [form.nitrogen, form.phosphorus, form.potassium, form.soilPH, form.organicMatter])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.sampleId.trim()) return showToast('Sample ID is required')
    setSaving(true)
    const a = assessSoil(form)
    await addDoc(collection(db, 'soil_samples'), {
      ...form,
      uid,
      status: a.status,
      rating: a.rating,
      issues: a.issues,
      createdAt: new Date().toISOString(),
    })
    setForm(empty); setPreview(null)
    showToast('Soil sample saved!')
    setSaving(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const passCount   = samples.filter(s => s.status === 'Pass').length
  const failCount   = samples.filter(s => s.status === 'Fail').length
  const reviewCount = samples.filter(s => s.status === 'Review').length

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Soil & fertilizer analysis" sub="NPK profiling and soil characterization for digestate quality assessment." breadcrumb="Soil & Fertilizer" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="TOTAL SAMPLES" value={samples.length} color="var(--red)" />
        <KPI label="PASS"          value={passCount}      color="var(--red)" sub="Suitable" />
        <KPI label="NEEDS REVIEW"  value={reviewCount}    color="#f59e0b" sub="Fair quality" />
        <KPI label="FAIL"          value={failCount}      color="#ef4444" sub="Not suitable" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{ id:'entry', label:'Data entry' }, { id:'records', label:'Sample records' }]} />

      {tab === 'entry' && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:22 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:20 }}>New soil / fertilizer entry</div>
          <form onSubmit={handleSave}>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. SA-2026-001" value={form.sampleId} onChange={set('sampleId')} required /></Field>
              <Field label="DATE COLLECTED"><input type="date" value={form.dateCollected} onChange={set('dateCollected')} /></Field>
            </Row>
            <Row>
              <Field label="SAMPLE TYPE">
                <select value={form.sampleType} onChange={set('sampleType')}>
                  {SAMPLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="SAMPLE LOCATION"><input placeholder="e.g. Field A" value={form.location} onChange={set('location')} /></Field>
            </Row>
            <Row>
              <Field label="NITROGEN — N (%)"><input type="number" step="0.01" placeholder="e.g. 2.8" value={form.nitrogen} onChange={set('nitrogen')} /></Field>
              <Field label="PHOSPHORUS — P (%)"><input type="number" step="0.01" placeholder="e.g. 1.4" value={form.phosphorus} onChange={set('phosphorus')} /></Field>
            </Row>
            <Row>
              <Field label="POTASSIUM — K (%)"><input type="number" step="0.01" placeholder="e.g. 1.9" value={form.potassium} onChange={set('potassium')} /></Field>
              <Field label="SOIL pH"><input type="number" step="0.01" placeholder="e.g. 6.5" value={form.soilPH} onChange={set('soilPH')} /></Field>
            </Row>
            <Row>
              <Field label="ORGANIC MATTER (%)"><input type="number" step="0.01" placeholder="e.g. 12.4" value={form.organicMatter} onChange={set('organicMatter')} /></Field>
              <Field label="MOISTURE CONTENT (%)"><input type="number" step="0.01" placeholder="e.g. 68.2" value={form.moistureContent} onChange={set('moistureContent')} /></Field>
            </Row>
            <Field label="NOTES"><textarea rows={2} placeholder="Optional observations..." value={form.notes} onChange={set('notes')} /></Field>
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
            Sample records <Badge color="var(--red)">{samples.length} total</Badge>
          </div>
          <SampleTable samples={samples} columns={COLS} collection="soil_samples" onDeleted={id => setSamples(s => s.filter(r => r.id !== id))} />
        </div>
      )}
      <Toast msg={toast} />
    </div>
  )
}

function QualityPreview({ result }) {
  return (
    <div style={{ background:`${result.color}10`, border:`1px solid ${result.color}40`, borderRadius:10, padding:'14px 16px', marginTop:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: result.issues.length > 0 ? 10 : 0 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:result.color, flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:600, color:result.color }}>Predicted: {result.status}</span>
        <span style={{ fontSize:11, fontFamily:'Space Mono', color:result.color, opacity:0.8 }}>{result.rating}</span>
      </div>
      {result.issues.map((iss, i) => (
        <div key={i} style={{ fontSize:11, color:'#f59e0b', marginTop:4, display:'flex', gap:6 }}>
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

import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import SampleTable from '../components/SampleTable'
import { PageHeader } from './Dashboard'
import { Tabs, Row, Field, BtnPrimary, BtnOutline, Badge, Toast } from './Shared'
import { assessWaterQuality, assessWastewater } from './statusRules'

const WQ_COLS = [
  { key:'sampleId',    label:'SAMPLE ID' },
  { key:'source',      label:'SOURCE' },
  { key:'pH',          label:'pH' },
  { key:'turbidity',   label:'TURBIDITY (NTU)' },
  { key:'dissolvedO2', label:'DO (mg/L)' },
  { key:'temp',        label:'TEMP (°C)' },
  { key:'rating',      label:'QUALITY' },
  { key:'dateCollected', label:'DATE' },
]
const WW_COLS = [
  { key:'sampleId',     label:'SAMPLE ID' },
  { key:'receivingBody',label:'RECEIVING BODY' },
  { key:'effluentType', label:'TYPE' },
  { key:'pH',           label:'pH' },
  { key:'BOD',          label:'BOD (mg/L)' },
  { key:'COD',          label:'COD (mg/L)' },
  { key:'TSS',          label:'TSS (mg/L)' },
  { key:'ammoniaN',     label:'NH₃-N (mg/L)' },
  { key:'rating',       label:'QUALITY' },
  { key:'dateCollected',label:'DATE' },
]

const RECEIVING_BODIES = [
  'Class A — Public Water Supply',
  'Class B — Recreational (Primary Contact)',
  'Class C — Fishery / Industrial',
  'Class D — Navigation / Power',
  'Class SB — Marine Recreational',
  'Class SC — Marine Fishery',
]

const emptyWQ = { sampleId:'', dateCollected:'', source:'', pH:'', turbidity:'', dissolvedO2:'', temp:'', conductivity:'', notes:'' }
const emptyWW = { sampleId:'', dateCollected:'', receivingBody:'Class C — Fishery / Industrial', effluentType:'Digester effluent', pH:'', BOD:'', COD:'', TSS:'', ammoniaN:'', color:'', oilGrease:'', notes:'' }

export default function Water() {
  const [tab,       setTab]       = useState('wq')
  const [formWQ,    setFormWQ]    = useState(emptyWQ)
  const [formWW,    setFormWW]    = useState(emptyWW)
  const [samplesWQ, setSamplesWQ] = useState([])
  const [samplesWW, setSamplesWW] = useState([])
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')
  const [previewWQ, setPreviewWQ] = useState(null)
  const [previewWW, setPreviewWW] = useState(null)

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db,'water_quality'), orderBy('createdAt','desc')), snap => setSamplesWQ(snap.docs.map(d=>({id:d.id,...d.data()}))))
    const u2 = onSnapshot(query(collection(db,'wastewater'),    orderBy('createdAt','desc')), snap => setSamplesWW(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return () => { u1(); u2() }
  }, [])

  useEffect(() => {
    if (formWQ.pH || formWQ.dissolvedO2 || formWQ.turbidity) setPreviewWQ(assessWaterQuality(formWQ))
    else setPreviewWQ(null)
  }, [formWQ.pH, formWQ.dissolvedO2, formWQ.turbidity, formWQ.temp])

  useEffect(() => {
    if (formWW.pH || formWW.BOD || formWW.COD || formWW.TSS || formWW.ammoniaN) setPreviewWW(assessWastewater(formWW))
    else setPreviewWW(null)
  }, [formWW.pH, formWW.BOD, formWW.COD, formWW.TSS, formWW.ammoniaN, formWW.color, formWW.oilGrease])

  async function saveWQ(e) {
    e.preventDefault()
    if (!formWQ.sampleId.trim()) return showToast('Sample ID is required')
    setSaving(true)
    const a = assessWaterQuality(formWQ)
    await addDoc(collection(db,'water_quality'), { ...formWQ, status:a.status, rating:a.rating, issues:a.issues, standard:'DAO 2016-08 WQG', createdAt: new Date().toISOString() })
    setFormWQ(emptyWQ); setPreviewWQ(null)
    showToast('Water quality sample saved!')
    setSaving(false)
  }

  async function saveWW(e) {
    e.preventDefault()
    if (!formWW.sampleId.trim()) return showToast('Sample ID is required')
    setSaving(true)
    const a = assessWastewater(formWW)
    await addDoc(collection(db,'wastewater'), { ...formWW, status:a.status, rating:a.rating, issues:a.issues, standard:'DAO 2016-08 Table 9 GES', createdAt: new Date().toISOString() })
    setFormWW(emptyWW); setPreviewWW(null)
    showToast('Wastewater sample saved!')
    setSaving(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const setWQ = k => e => setFormWQ(f => ({ ...f, [k]: e.target.value }))
  const setWW = k => e => setFormWW(f => ({ ...f, [k]: e.target.value }))

  const allSamples = [...samplesWQ, ...samplesWW]
  const passCount  = allSamples.filter(s => s.status === 'Pass').length
  const failCount  = allSamples.filter(s => s.status === 'Fail').length
  const revCount   = allSamples.filter(s => s.status === 'Review').length

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Water & wastewater analysis" sub="Assessment based on DENR DAO 2016-08 Water Quality Guidelines and General Effluent Standards." breadcrumb="Water & Wastewater" />

      <div style={{ background:'rgba(192,57,43,0.06)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:24, fontSize:12, color:'var(--text2)', display:'flex', gap:8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Standards reference: <strong style={{color:'var(--gold)'}}>DENR DAO 2016-08</strong> — Water Quality Guidelines (WQG) and General Effluent Standards (GES), Philippines Clean Water Act RA 9275.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="WATER QUALITY"  value={samplesWQ.length} color="var(--blue)"    sub="Samples" />
        <KPI label="WASTEWATER"     value={samplesWW.length} color="var(--blue)"    sub="Samples" />
        <KPI label="COMPLIANT"      value={passCount}        color="var(--pass-lt)" sub="Pass DAO 2016-08" />
        <KPI label="NON-COMPLIANT"  value={failCount}        color="var(--fail-lt)" sub="Fail / Review" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[
        { id:'wq',      label:'Water quality' },
        { id:'ww',      label:'Wastewater' },
        { id:'records', label:'All records' },
      ]} />

      {/* ── WATER QUALITY FORM ── */}
      {tab === 'wq' && (
        <Card title="Water quality — new entry" badge="DAO 2016-08 WQG">
          <form onSubmit={saveWQ}>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. WQ-2026-001" value={formWQ.sampleId} onChange={setWQ('sampleId')} required /></Field>
              <Field label="DATE COLLECTED"><input type="date" value={formWQ.dateCollected} onChange={setWQ('dateCollected')} /></Field>
            </Row>
            <Row>
              <Field label="SAMPLE SOURCE / LOCATION"><input placeholder="e.g. Digester inlet, River station 1" value={formWQ.source} onChange={setWQ('source')} /></Field>
              <Field label="pH  (WQG Class A: 6.5–8.5)"><input type="number" step="0.01" placeholder="e.g. 7.2" value={formWQ.pH} onChange={setWQ('pH')} /></Field>
            </Row>
            <Row>
              <Field label="DISSOLVED OXYGEN — DO (mg/L)  (WQG: ≥5)"><input type="number" step="0.01" placeholder="e.g. 6.5" value={formWQ.dissolvedO2} onChange={setWQ('dissolvedO2')} /></Field>
              <Field label="TURBIDITY (NTU)"><input type="number" step="0.1" placeholder="e.g. 12" value={formWQ.turbidity} onChange={setWQ('turbidity')} /></Field>
            </Row>
            <Row>
              <Field label="TEMPERATURE (°C)  (WQG: ambient ±3°C)"><input type="number" step="0.1" placeholder="e.g. 28" value={formWQ.temp} onChange={setWQ('temp')} /></Field>
              <Field label="CONDUCTIVITY (µS/cm)"><input type="number" step="0.1" placeholder="e.g. 450" value={formWQ.conductivity} onChange={setWQ('conductivity')} /></Field>
            </Row>
            <Field label="NOTES / OBSERVATIONS"><textarea rows={2} placeholder="Field observations, sampling conditions, etc." value={formWQ.notes} onChange={setWQ('notes')} /></Field>
            {previewWQ && <QualityPreview result={previewWQ} standard="DAO 2016-08 WQG" />}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save sample'}</BtnPrimary>
              <BtnOutline type="button" onClick={() => { setFormWQ(emptyWQ); setPreviewWQ(null) }}>Clear</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {/* ── WASTEWATER FORM ── */}
      {tab === 'ww' && (
        <Card title="Wastewater — new entry" badge="DAO 2016-08 Table 9 GES">
          <form onSubmit={saveWW}>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. WW-2026-001" value={formWW.sampleId} onChange={setWW('sampleId')} required /></Field>
              <Field label="DATE COLLECTED"><input type="date" value={formWW.dateCollected} onChange={setWW('dateCollected')} /></Field>
            </Row>
            <Row>
              <Field label="RECEIVING WATER BODY CLASS">
                <select value={formWW.receivingBody} onChange={setWW('receivingBody')}>
                  {RECEIVING_BODIES.map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="EFFLUENT TYPE">
                <select value={formWW.effluentType} onChange={setWW('effluentType')}>
                  <option>Digester effluent</option>
                  <option>Process water</option>
                  <option>Final discharge</option>
                  <option>Biogas slurry</option>
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="pH  (GES: 6.0–9.0)"><input type="number" step="0.01" placeholder="e.g. 7.4" value={formWW.pH} onChange={setWW('pH')} /></Field>
              <Field label="BOD₅  (mg/L)  (GES Class C: ≤50)"><input type="number" step="0.1" placeholder="e.g. 38" value={formWW.BOD} onChange={setWW('BOD')} /></Field>
            </Row>
            <Row>
              <Field label="COD  (mg/L)  (GES Class C: ≤100)"><input type="number" step="0.1" placeholder="e.g. 142" value={formWW.COD} onChange={setWW('COD')} /></Field>
              <Field label="TSS — Total Suspended Solids  (mg/L)  (GES Class C: ≤100)"><input type="number" step="0.1" placeholder="e.g. 45" value={formWW.TSS} onChange={setWW('TSS')} /></Field>
            </Row>
            <Row>
              <Field label="AMMONIA-N — NH₃-N  (mg/L)  (GES Class C: ≤7.0)"><input type="number" step="0.01" placeholder="e.g. 1.5" value={formWW.ammoniaN} onChange={setWW('ammoniaN')} /></Field>
              <Field label="COLOR (TCU)  (GES Class C: ≤150)"><input type="number" step="1" placeholder="e.g. 80" value={formWW.color} onChange={setWW('color')} /></Field>
            </Row>
            <Row>
              <Field label="OIL & GREASE  (mg/L)  (GES: ≤5)"><input type="number" step="0.01" placeholder="e.g. 2.5" value={formWW.oilGrease} onChange={setWW('oilGrease')} /></Field>
              <div />
            </Row>
            <Field label="NOTES / OBSERVATIONS"><textarea rows={2} placeholder="Treatment method, discharge point, sampling conditions..." value={formWW.notes} onChange={setWW('notes')} /></Field>
            {previewWW && <QualityPreview result={previewWW} standard="DAO 2016-08 Table 9 GES" />}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save sample'}</BtnPrimary>
              <BtnOutline type="button" onClick={() => { setFormWW(emptyWW); setPreviewWW(null) }}>Clear</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {/* ── RECORDS ── */}
      {tab === 'records' && (
        <>
          <Card title="Water quality records" badge={`${samplesWQ.length} total`}>
            <SampleTable samples={samplesWQ} columns={WQ_COLS} collection="water_quality" onDeleted={id => setSamplesWQ(s => s.filter(r => r.id !== id))} />
          </Card>
          <div style={{ height:20 }} />
          <Card title="Wastewater records — DAO 2016-08 GES" badge={`${samplesWW.length} total`}>
            <SampleTable samples={samplesWW} columns={WW_COLS} collection="wastewater" onDeleted={id => setSamplesWW(s => s.filter(r => r.id !== id))} />
          </Card>
        </>
      )}

      <Toast msg={toast} />
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
      <div style={{ fontSize:24, fontWeight:600, fontFamily:'Space Mono', color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

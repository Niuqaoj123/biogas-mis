import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import SampleTable from '../components/SampleTable'
import { PageHeader } from './Dashboard'
import { Row, Field, BtnPrimary, BtnOutline, Tabs, Toast } from './Shared'
import { assessWastewater } from './statusRules'

const COLS = [
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
const empty = { sampleId:'', dateCollected:'', receivingBody:'Class C — Fishery / Industrial', effluentType:'Digester effluent', pH:'', BOD:'', COD:'', TSS:'', ammoniaN:'', color:'', oilGrease:'', notes:'' }

export default function Wastewater() {
  const [tab,     setTab]     = useState('entry')
  const [form,    setForm]    = useState(empty)
  const [samples, setSamples] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db,'wastewater'), orderBy('createdAt','desc')), snap =>
      setSamples(snap.docs.map(d => ({ id:d.id, ...d.data() }))))
    return unsub
  }, [])

  useEffect(() => {
    if (form.pH || form.BOD || form.COD || form.TSS || form.ammoniaN) setPreview(assessWastewater(form))
    else setPreview(null)
  }, [form.pH, form.BOD, form.COD, form.TSS, form.ammoniaN, form.color, form.oilGrease])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.sampleId.trim()) return showToast('Sample ID is required')
    setSaving(true)
    const a = assessWastewater(form)
    await addDoc(collection(db,'wastewater'), { ...form, status:a.status, rating:a.rating, issues:a.issues, standard:'DAO 2016-08 Table 9 GES', createdAt: new Date().toISOString() })
    setForm(empty); setPreview(null)
    showToast('Wastewater sample saved!')
    setSaving(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const passCount = samples.filter(s => s.status === 'Pass').length
  const failCount = samples.filter(s => s.status === 'Fail').length

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Wastewater analysis" sub="Effluent assessment based on DENR DAO 2016-08 General Effluent Standards (GES) Table 9." breadcrumb="Wastewater" />

      <div style={{ background:'rgba(192,57,43,0.06)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:24, fontSize:12, color:'var(--text2)', display:'flex', gap:8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Standards reference: <strong style={{color:'var(--gold)'}}>DENR DAO 2016-08 Table 9</strong> — General Effluent Standards (GES), Philippines Clean Water Act RA 9275.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="TOTAL SAMPLES" value={samples.length} color="var(--blue)" />
        <KPI label="COMPLIANT"     value={passCount}      color="var(--pass-lt)" sub="Pass GES" />
        <KPI label="NON-COMPLIANT" value={failCount}      color="var(--fail-lt)" sub="Fail" />
        <KPI label="STANDARD"      value="DAO 2016-08"    color="var(--gold)" sub="Table 9 GES" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{ id:'entry', label:'Data entry' }, { id:'records', label:'Sample records' }]} />

      {tab === 'entry' && (
        <Card title="Wastewater — new entry" badge="DAO 2016-08 Table 9 GES">
          <form onSubmit={handleSave}>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. WW-2026-001" value={form.sampleId} onChange={set('sampleId')} required /></Field>
              <Field label="DATE COLLECTED"><input type="date" value={form.dateCollected} onChange={set('dateCollected')} /></Field>
            </Row>
            <Row>
              <Field label="RECEIVING WATER BODY CLASS">
                <select value={form.receivingBody} onChange={set('receivingBody')}>
                  {RECEIVING_BODIES.map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="EFFLUENT TYPE">
                <select value={form.effluentType} onChange={set('effluentType')}>
                  <option>Digester effluent</option>
                  <option>Process water</option>
                  <option>Final discharge</option>
                  <option>Biogas slurry</option>
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="pH  (GES: 6.0–9.0)"><input type="number" step="0.01" placeholder="e.g. 7.4" value={form.pH} onChange={set('pH')} /></Field>
              <Field label="BOD₅  (mg/L)  (GES Class C: ≤50)"><input type="number" step="0.1" placeholder="e.g. 38" value={form.BOD} onChange={set('BOD')} /></Field>
            </Row>
            <Row>
              <Field label="COD  (mg/L)  (GES Class C: ≤100)"><input type="number" step="0.1" placeholder="e.g. 142" value={form.COD} onChange={set('COD')} /></Field>
              <Field label="TSS  (mg/L)  (GES Class C: ≤100)"><input type="number" step="0.1" placeholder="e.g. 45" value={form.TSS} onChange={set('TSS')} /></Field>
            </Row>
            <Row>
              <Field label="AMMONIA-N — NH₃-N  (mg/L)  (GES Class C: ≤7.0)"><input type="number" step="0.01" placeholder="e.g. 1.5" value={form.ammoniaN} onChange={set('ammoniaN')} /></Field>
              <Field label="COLOR (TCU)  (GES Class C: ≤150)"><input type="number" step="1" placeholder="e.g. 80" value={form.color} onChange={set('color')} /></Field>
            </Row>
            <Row>
              <Field label="OIL & GREASE  (mg/L)  (GES: ≤5)"><input type="number" step="0.01" placeholder="e.g. 2.5" value={form.oilGrease} onChange={set('oilGrease')} /></Field>
              <div />
            </Row>
            <Field label="NOTES / OBSERVATIONS"><textarea rows={2} placeholder="Treatment method, discharge point, sampling conditions..." value={form.notes} onChange={set('notes')} /></Field>
            {preview && <QualityPreview result={preview} standard="DAO 2016-08 Table 9 GES" />}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save sample'}</BtnPrimary>
              <BtnOutline type="button" onClick={() => { setForm(empty); setPreview(null) }}>Clear</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {tab === 'records' && (
        <Card title="Wastewater records — DAO 2016-08 GES" badge={`${samples.length} total`}>
          <SampleTable samples={samples} columns={COLS} collection="wastewater" onDeleted={id => setSamples(s => s.filter(r => r.id !== id))} />
        </Card>
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
      <div style={{ fontSize:value?.toString().length > 6 ? 16 : 24, fontWeight:600, fontFamily:'Space Mono', color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

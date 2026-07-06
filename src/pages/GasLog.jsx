import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, Card, KPI, Tabs, Row, Row3, Field, BtnPrimary, BtnOutline, BtnDanger, Badge, Toast, Spinner, EmptyState } from './Shared'
import { calcCV } from '../utils/statusRules'

const empty = {
  experimentId:'', bottleId:'', measurementDate:'', dayNumber:'',
  rawGasVolume:'', pressure_kPa:'', temperature_C:'', ch4Pct:'', co2Pct:'',
  h2sPpm:'', correctionFactor:'1.0', notes:''
}

// Normalize gas volume to standard conditions (VDI 4630)
// Vn = Vm * (P - Pw) / P0 * T0 / T
// Standard: P0=101.325 kPa, T0=273.15 K, Pw = 2.338 kPa at 20°C approx
function normalizeGas(Vm, P_kPa, T_C) {
  const P0 = 101.325, T0 = 273.15, Pw = 2.338
  const T = parseFloat(T_C) + 273.15
  const P = parseFloat(P_kPa)
  if (isNaN(Vm)||isNaN(P)||isNaN(T)||T===0) return null
  return ((Vm * (P - Pw)) / P0) * (T0 / T)
}

export default function GasLog() {
  const { uid } = useAuth()
  const [tab, setTab] = useState('entry')
  const [form, setForm] = useState(empty)
  const [logs, setLogs] = useState([])
  const [experiments, setExperiments] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [selExp, setSelExp] = useState('')

  useEffect(() => {
    if (!uid) return
    const u1 = onSnapshot(query(collection(db,'gas_measurements'), where('uid','==',uid), orderBy('createdAt','desc')),
      snap => { setLogs(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false) })
    const u2 = onSnapshot(query(collection(db,'bmp_experiments'), where('uid','==',uid)),
      snap => setExperiments(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return () => { u1(); u2() }
  }, [uid])

  // Normalize on the fly
  const normalizedVol = form.rawGasVolume && form.pressure_kPa && form.temperature_C
    ? normalizeGas(parseFloat(form.rawGasVolume), form.pressure_kPa, form.temperature_C)?.toFixed(2)
    : ''
  const ch4Vol = normalizedVol && form.ch4Pct
    ? (parseFloat(normalizedVol) * parseFloat(form.ch4Pct) / 100).toFixed(2)
    : ''

  function startEdit(record) {
    setForm(record)
    setEditing(record.id)
    setTab('entry')
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editing) return handleSave(e)
    setSaving(true)
    const { id, uid: _u, createdAt: _c, ...fields } = form
    await updateDoc(doc(db, 'gas_measurements', editing), fields)
    setEditing(null)
    setForm(empty)
    show('Record updated!')
    setSaving(false)
  }


  async function handleSave(e) {
    e.preventDefault()
    if (!form.experimentId.trim()) return show('Experiment ID is required')
    if (!form.bottleId.trim()) return show('Bottle ID is required')
    setSaving(true)
    await addDoc(collection(db,'gas_measurements'), {
      ...form,
      normalizedVol_NmL: normalizedVol ? parseFloat(normalizedVol) : null,
      ch4Vol_NmL: ch4Vol ? parseFloat(ch4Vol) : null,
      uid, createdAt: new Date().toISOString()
    })
    setForm(f => ({ ...f, bottleId:'', rawGasVolume:'', ch4Pct:'', co2Pct:'', notes:'' }))
    show('Gas measurement logged!')
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this measurement?')) return
    await deleteDoc(doc(db,'gas_measurements',id))
    show('Deleted.')
  }

  function show(msg) { setToast(msg); setTimeout(()=>setToast(''),3000) }
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const filtered = selExp ? logs.filter(l=>l.experimentId===selExp) : logs
  const totalNmL = filtered.reduce((s,l)=>s+(l.normalizedVol_NmL||0),0).toFixed(1)
  const totalCH4 = filtered.reduce((s,l)=>s+(l.ch4Vol_NmL||0),0).toFixed(1)

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Gas monitoring log" sub="Daily/periodic gas production logging with VDI 4630 normalization." breadcrumb="Gas Log" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="TOTAL MEASUREMENTS" value={logs.length}       color="#4a9eff" />
        <KPI label="TOTAL GAS (NmL)"    value={totalNmL}          color="#4a9eff" sub="Normalized" />
        <KPI label="TOTAL CH₄ (NmL)"   value={totalCH4}          color="#8b5cf6" sub="Methane" />
        <KPI label="EXPERIMENTS"         value={experiments.length} color="#f59e0b" sub="Active" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{id:'entry',label:'Log measurement'},{id:'records',label:'View logs'}]} />

      {tab==='entry' && (
        <Card title="Gas measurement entry">
          <form onSubmit={editing ? handleUpdate : handleSave}>
            {editing && (
              <div style={{ background:'rgba(74,158,255,0.08)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#4a9eff', display:'flex', alignItems:'center', gap:8 }}>
                ✏ Editing existing record — make changes then click Update
              </div>
            )}
            <Row3>
              <Field label="EXPERIMENT ID *">
                <select value={form.experimentId} onChange={set('experimentId')} required>
                  <option value="">— Select experiment —</option>
                  {experiments.map(e=><option key={e.id} value={e.experimentId}>{e.experimentId}</option>)}
                </select>
              </Field>
              <Field label="BOTTLE / REACTOR ID"><input placeholder="e.g. B1" value={form.bottleId} onChange={set('bottleId')} /></Field>
              <Field label="DAY NUMBER"><input type="number" min="0" placeholder="e.g. 3" value={form.dayNumber} onChange={set('dayNumber')} /></Field>
            </Row3>
            <Row>
              <Field label="MEASUREMENT DATE"><input type="date" value={form.measurementDate} onChange={set('measurementDate')} /></Field>
            </Row>

            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', margin:'16px 0 12px', borderBottom:'1px solid var(--border)', paddingBottom:8 }}>RAW GAS DATA</div>
            <Row3>
              <Field label="RAW GAS VOLUME (mL)"><input type="number" step="0.1" placeholder="e.g. 145.2" value={form.rawGasVolume} onChange={set('rawGasVolume')} /></Field>
              <Field label="PRESSURE (kPa)"><input type="number" step="0.01" placeholder="e.g. 101.3" value={form.pressure_kPa} onChange={set('pressure_kPa')} /></Field>
              <Field label="TEMPERATURE (°C)"><input type="number" step="0.1" placeholder="e.g. 37" value={form.temperature_C} onChange={set('temperature_C')} /></Field>
            </Row3>
            <Row3>
              <Field label="CH₄ CONTENT (%)"><input type="number" step="0.1" placeholder="e.g. 62.4" value={form.ch4Pct} onChange={set('ch4Pct')} /></Field>
              <Field label="CO₂ CONTENT (%)"><input type="number" step="0.1" placeholder="e.g. 36.1" value={form.co2Pct} onChange={set('co2Pct')} /></Field>
              <Field label="H₂S (ppm)"><input type="number" step="1" placeholder="e.g. 450" value={form.h2sPpm} onChange={set('h2sPpm')} /></Field>
            </Row3>

            {/* Auto-calculated normalized values */}
            {(normalizedVol || ch4Vol) && (
              <div style={{ background:'rgba(74,158,255,0.06)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
                <div style={{ fontSize:11, fontFamily:'Space Mono', color:'#4a9eff', marginBottom:8 }}>VDI 4630 NORMALIZED VALUES</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div><div style={{ fontSize:10, color:'var(--text3)' }}>NORMALIZED GAS (NmL)</div>
                    <div style={{ fontFamily:'Space Mono', color:'#4a9eff', fontSize:16 }}>{normalizedVol}</div></div>
                  <div><div style={{ fontSize:10, color:'var(--text3)' }}>CH₄ VOLUME (NmL)</div>
                    <div style={{ fontFamily:'Space Mono', color:'#8b5cf6', fontSize:16 }}>{ch4Vol||'—'}</div></div>
                </div>
              </div>
            )}

            <Field label="NOTES"><textarea rows={2} placeholder="Observations, leakage check, anomalies..." value={form.notes} onChange={set('notes')} /></Field>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update measurement' : 'Log measurement'}</BtnPrimary>
              <BtnOutline type="button" onClick={()=>{ setForm(empty); setEditing(null) }}>{editing ? 'Cancel edit' : 'Clear'}</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {tab==='records' && (
        <Card title={<>Gas logs <Badge color="#4a9eff">{filtered.length}</Badge></>}
          action={
            <select value={selExp} onChange={e=>setSelExp(e.target.value)} style={{ fontSize:12, padding:'4px 8px', width:'auto' }}>
              <option value="">All experiments</option>
              {experiments.map(e=><option key={e.id} value={e.experimentId}>{e.experimentId}</option>)}
            </select>
          }>
          {loading ? <Spinner /> : filtered.length===0 ? <EmptyState msg="No gas measurements logged yet." /> : (
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead><tr>
                  <th>EXPERIMENT</th><th>BOTTLE</th><th>DAY</th><th>DATE</th>
                  <th>RAW (mL)</th><th>NORM (NmL)</th><th>CH₄ (NmL)</th><th>CH₄ %</th><th>CO₂ %</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id}>
                      <td style={{ color:'var(--text)', fontWeight:500 }}>{l.experimentId}</td>
                      <td>{l.bottleId}</td>
                      <td style={{ fontFamily:'Space Mono' }}>D{l.dayNumber}</td>
                      <td style={{ fontFamily:'Space Mono', fontSize:11 }}>{l.measurementDate||'—'}</td>
                      <td>{l.rawGasVolume||'—'}</td>
                      <td style={{ color:'#4a9eff', fontFamily:'Space Mono' }}>{l.normalizedVol_NmL?.toFixed(1)||'—'}</td>
                      <td style={{ color:'#8b5cf6', fontFamily:'Space Mono' }}>{l.ch4Vol_NmL?.toFixed(1)||'—'}</td>
                      <td>{l.ch4Pct||'—'}</td>
                      <td>{l.co2Pct||'—'}</td>
                      <td style={{display:'flex',gap:6}}>
                      <button onClick={()=>startEdit(l)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontFamily:'Space Mono',background:'transparent',border:'1px solid rgba(74,158,255,0.3)',color:'#4a9eff',cursor:'pointer'}}>Edit</button>
                      <BtnDanger onClick={()=>handleDelete(l.id)}>×</BtnDanger>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <Toast msg={toast} />
    </div>
  )
}

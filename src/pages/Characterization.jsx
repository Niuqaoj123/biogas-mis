import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, Card, KPI, Tabs, Row, Row3, Field, BtnPrimary, BtnOutline, BtnDanger, Badge, Toast, Spinner, EmptyState } from './Shared'

const SOURCE_TYPES = ['Manure','Sludge','Food waste','Crop residue','Industrial organic waste','Energy crop silage','Digestate','Other']
const empty = {
  sampleId:'', sourceType:'Manure', producer:'', location:'', collectionMethod:'', collector:'',
  collectionDate:'', wetMass:'', dryMass:'', dryingTemp:'105', dryingTime:'',
  dryResidue:'', ashMass:'', ignitionTemp:'550', ignitionTime:'',
  pH:'', conductivity:'', COD:'', totalN:'', ammoniaN:'', cnRatio:'', alkalinity:'', notes:''
}

export default function Characterization() {
  const { uid } = useAuth()
  const [tab, setTab] = useState('entry')
  const [form, setForm] = useState(empty)
  const [records, setRecords] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  // Calculated values
  const TS = form.wetMass && form.dryMass
    ? ((parseFloat(form.dryMass)/parseFloat(form.wetMass))*100).toFixed(2) : ''
  const VS = form.dryResidue && form.ashMass
    ? (((parseFloat(form.dryResidue)-parseFloat(form.ashMass))/parseFloat(form.dryResidue))*100).toFixed(2) : ''

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db,'characterization'), where('uid','==',uid), orderBy('createdAt','desc'))
    const unsub = onSnapshot(q, snap => { setRecords(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false) })
    return unsub
  }, [uid])

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
    await updateDoc(doc(db, 'characterization', editing), fields)
    setEditing(null)
    setForm(empty)
    show('Record updated!')
    setSaving(false)
  }


  async function handleSave(e) {
    e.preventDefault()
    if (!form.sampleId.trim()) return show('Sample ID is required')
    setSaving(true)
    await addDoc(collection(db,'characterization'), {
      ...form, TS_pct: TS||null, VS_pct: VS||null, uid, createdAt: new Date().toISOString()
    })
    setForm(empty); show('Characterization record saved!')
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this record?')) return
    await deleteDoc(doc(db,'characterization',id))
    show('Record deleted.')
  }

  function show(msg) { setToast(msg); setTimeout(()=>setToast(''),3000) }
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Sample characterization" sub="TS/VS measurement workflow with auto-calculation. VDI 4630 core inputs." breadcrumb="Characterization" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="TOTAL RECORDS" value={records.length} color="#f59e0b" sub="Characterized samples" />
        <KPI label="WITH TS/VS"    value={records.filter(r=>r.TS_pct&&r.VS_pct).length} color="#3ecf8e" sub="Complete measurements" />
        <KPI label="INCOMPLETE"    value={records.filter(r=>!r.TS_pct||!r.VS_pct).length} color="#ef4444" sub="Missing TS or VS" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{id:'entry',label:'New entry'},{id:'records',label:'Records'}]} />

      {tab==='entry' && (
        <Card title="Sample characterization — TS/VS workflow">
          <form onSubmit={editing ? handleUpdate : handleSave}>
            {editing && (
              <div style={{ background:'rgba(74,158,255,0.08)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#4a9eff', display:'flex', alignItems:'center', gap:8 }}>
                ✏ Editing existing record — make changes then click Update
              </div>
            )}
            {/* Sample identity */}
            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', marginBottom:12, borderBottom:'1px solid var(--border)', paddingBottom:8 }}>SAMPLE IDENTITY</div>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. SMP-2026-001" value={form.sampleId} onChange={set('sampleId')} required /></Field>
              <Field label="SOURCE TYPE">
                <select value={form.sourceType} onChange={set('sourceType')}>
                  {SOURCE_TYPES.map(s=><option key={s}>{s}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="PRODUCER / SITE"><input placeholder="e.g. UPLB Farm" value={form.producer} onChange={set('producer')} /></Field>
              <Field label="GPS / LOCATION"><input placeholder="e.g. 14.1234, 121.2345" value={form.location} onChange={set('location')} /></Field>
            </Row>
            <Row>
              <Field label="COLLECTION METHOD"><input placeholder="e.g. Grab sample, composite" value={form.collectionMethod} onChange={set('collectionMethod')} /></Field>
              <Field label="COLLECTOR"><input placeholder="Name of person who collected" value={form.collector} onChange={set('collector')} /></Field>
            </Row>
            <Row>
              <Field label="COLLECTION DATE"><input type="date" value={form.collectionDate} onChange={set('collectionDate')} /></Field>
            </Row>

            {/* TS Measurement */}
            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', margin:'20px 0 12px', borderBottom:'1px solid var(--border)', paddingBottom:8 }}>MOISTURE / TS MEASUREMENT</div>
            <Row3>
              <Field label="WET MASS (g)"><input type="number" step="0.001" placeholder="e.g. 10.520" value={form.wetMass} onChange={set('wetMass')} /></Field>
              <Field label="DRY MASS (g)" hint="After drying at set temp"><input type="number" step="0.001" placeholder="e.g. 1.842" value={form.dryMass} onChange={set('dryMass')} /></Field>
              <Field label="TS % (auto-calculated)">
                <input readOnly value={TS ? `${TS}%` : ''} placeholder="Fill wet + dry mass" style={{ background:'var(--bg)', color:'var(--green)', fontFamily:'Space Mono' }} />
              </Field>
            </Row3>
            <Row>
              <Field label="DRYING TEMPERATURE (°C)"><input type="number" value={form.dryingTemp} onChange={set('dryingTemp')} /></Field>
              <Field label="DRYING TIME (hours)"><input type="number" step="0.5" placeholder="e.g. 24" value={form.dryingTime} onChange={set('dryingTime')} /></Field>
            </Row>

            {/* VS Measurement */}
            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', margin:'20px 0 12px', borderBottom:'1px solid var(--border)', paddingBottom:8 }}>VS MEASUREMENT (IGNITION)</div>
            <Row3>
              <Field label="DRY RESIDUE MASS (g)"><input type="number" step="0.0001" placeholder="e.g. 1.8420" value={form.dryResidue} onChange={set('dryResidue')} /></Field>
              <Field label="ASH MASS AFTER IGNITION (g)"><input type="number" step="0.0001" placeholder="e.g. 0.3680" value={form.ashMass} onChange={set('ashMass')} /></Field>
              <Field label="VS % of DM (auto-calculated)">
                <input readOnly value={VS ? `${VS}%` : ''} placeholder="Fill dry + ash mass" style={{ background:'var(--bg)', color:'var(--green)', fontFamily:'Space Mono' }} />
              </Field>
            </Row3>
            <Row>
              <Field label="IGNITION TEMPERATURE (°C)"><input type="number" value={form.ignitionTemp} onChange={set('ignitionTemp')} /></Field>
              <Field label="IGNITION TIME (hours)"><input type="number" step="0.5" placeholder="e.g. 3" value={form.ignitionTime} onChange={set('ignitionTime')} /></Field>
            </Row>

            {/* Optional characterization */}
            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', margin:'20px 0 12px', borderBottom:'1px solid var(--border)', paddingBottom:8 }}>OPTIONAL PARAMETERS</div>
            <Row>
              <Field label="pH"><input type="number" step="0.01" placeholder="e.g. 7.1" value={form.pH} onChange={set('pH')} /></Field>
              <Field label="CONDUCTIVITY (mS/cm)"><input type="number" step="0.01" placeholder="e.g. 4.2" value={form.conductivity} onChange={set('conductivity')} /></Field>
            </Row>
            <Row>
              <Field label="COD (mg/L)"><input type="number" placeholder="e.g. 12400" value={form.COD} onChange={set('COD')} /></Field>
              <Field label="TOTAL N (mg/kg)"><input type="number" placeholder="e.g. 3200" value={form.totalN} onChange={set('totalN')} /></Field>
            </Row>
            <Row>
              <Field label="AMMONIA-N (mg/kg)"><input type="number" placeholder="e.g. 1800" value={form.ammoniaN} onChange={set('ammoniaN')} /></Field>
              <Field label="C/N RATIO"><input type="number" step="0.1" placeholder="e.g. 14.5" value={form.cnRatio} onChange={set('cnRatio')} /></Field>
            </Row>
            <Row>
              <Field label="ALKALINITY (mg CaCO₃/L)"><input type="number" placeholder="e.g. 3500" value={form.alkalinity} onChange={set('alkalinity')} /></Field>
            </Row>
            <Field label="NOTES"><textarea rows={2} placeholder="Homogenization, pre-treatment, observations..." value={form.notes} onChange={set('notes')} /></Field>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update record' : 'Save record'}</BtnPrimary>
              <BtnOutline type="button" onClick={()=>{ setForm(empty); setEditing(null) }}>{editing ? 'Cancel edit' : 'Clear'}</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {tab==='records' && (
        <Card title={<>Characterization records <Badge color="#f59e0b">{records.length}</Badge></>}>
          {loading ? <Spinner /> : records.length===0 ? <EmptyState msg="No characterization records yet." /> : (
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead><tr>
                  <th>SAMPLE ID</th><th>SOURCE</th><th>TS %</th><th>VS % DM</th>
                  <th>pH</th><th>COD</th><th>C/N</th><th>DATE</th><th></th>
                </tr></thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td style={{ color:'var(--text)', fontWeight:500 }}>{r.sampleId}</td>
                      <td>{r.sourceType}</td>
                      <td style={{ fontFamily:'Space Mono', color:'#f59e0b' }}>{r.TS_pct ? `${r.TS_pct}%` : '—'}</td>
                      <td style={{ fontFamily:'Space Mono', color:'#f59e0b' }}>{r.VS_pct ? `${r.VS_pct}%` : '—'}</td>
                      <td>{r.pH||'—'}</td>
                      <td>{r.COD||'—'}</td>
                      <td>{r.cnRatio||'—'}</td>
                      <td style={{ fontFamily:'Space Mono', fontSize:11 }}>{r.collectionDate||'—'}</td>
                      <td style={{display:'flex',gap:6}}>
                      <button onClick={()=>startEdit(r)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontFamily:'Space Mono',background:'transparent',border:'1px solid rgba(74,158,255,0.3)',color:'#4a9eff',cursor:'pointer'}}>Edit</button>
                      <BtnDanger onClick={()=>handleDelete(r.id)}>Delete</BtnDanger>
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

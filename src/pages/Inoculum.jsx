import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, Card, KPI, Tabs, Row, Row3, Field, BtnPrimary, BtnOutline, BtnDanger, Badge, Toast, Spinner, EmptyState } from './Shared'

const empty = {
  batchId:'', originReactor:'', originSite:'', collectionDate:'', acclimationStatus:'Not acclimated',
  storageCondition:'4°C refrigerated', preIncubationDays:'', pH:'', VS:'', TS:'', notes:''
}
const ACCL = ['Not acclimated','Acclimated (7 days)','Acclimated (14 days)','Acclimated (21 days)','Fully acclimated']
const STOR = ['4°C refrigerated','Room temperature','35°C incubator','Other']

export default function Inoculum() {
  const { uid } = useAuth()
  const [tab, setTab] = useState('entry')
  const [form, setForm] = useState(empty)
  const [batches, setBatches] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db,'inoculum_batches'), where('uid','==',uid), orderBy('createdAt','desc'))
    const unsub = onSnapshot(q, snap => { setBatches(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false) })
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
    await updateDoc(doc(db, 'inoculum_batches', editing), fields)
    setEditing(null)
    setForm(empty)
    show('Record updated!')
    setSaving(false)
  }


  async function handleSave(e) {
    e.preventDefault()
    if (!form.batchId.trim()) return show('Batch ID is required')
    setSaving(true)
    await addDoc(collection(db,'inoculum_batches'), { ...form, uid, createdAt: new Date().toISOString() })
    setForm(empty); show('Inoculum batch saved!')
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this batch?')) return
    await deleteDoc(doc(db,'inoculum_batches',id))
    show('Batch deleted.')
  }

  function show(msg) { setToast(msg); setTimeout(()=>setToast(''),3000) }
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const active = batches.filter(b=>b.acclimationStatus?.includes('Acclimated')).length

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Inoculum management" sub="Register and track inoculum batches for BMP assays." breadcrumb="Inoculum" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="TOTAL BATCHES" value={batches.length} color="#f59e0b" sub="All registered" />
        <KPI label="ACCLIMATED"    value={active}          color="#3ecf8e" sub="Ready for assay" />
        <KPI label="NOT ACCLIMATED" value={batches.length-active} color="#ef4444" sub="Needs prep" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{id:'entry',label:'Register batch'},{id:'records',label:'Batch records'}]} />

      {tab==='entry' && (
        <Card title="New inoculum batch">
          <form onSubmit={editing ? handleUpdate : handleSave}>
            {editing && (
              <div style={{ background:'rgba(74,158,255,0.08)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#4a9eff', display:'flex', alignItems:'center', gap:8 }}>
                ✏ Editing existing record — make changes then click Update
              </div>
            )}
            <Row>
              <Field label="BATCH ID *"><input placeholder="e.g. INO-2026-001" value={form.batchId} onChange={set('batchId')} required /></Field>
              <Field label="COLLECTION DATE"><input type="date" value={form.collectionDate} onChange={set('collectionDate')} /></Field>
            </Row>
            <Row>
              <Field label="ORIGIN REACTOR / SITE"><input placeholder="e.g. Reactor R1, UPLB Biogas Plant" value={form.originReactor} onChange={set('originReactor')} /></Field>
              <Field label="ORIGIN SITE ADDRESS"><input placeholder="e.g. Los Baños, Laguna" value={form.originSite} onChange={set('originSite')} /></Field>
            </Row>
            <Row>
              <Field label="ACCLIMATION STATUS">
                <select value={form.acclimationStatus} onChange={set('acclimationStatus')}>
                  {ACCL.map(a=><option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="PRE-INCUBATION DAYS"><input type="number" placeholder="e.g. 7" value={form.preIncubationDays} onChange={set('preIncubationDays')} /></Field>
            </Row>
            <Row>
              <Field label="STORAGE CONDITION">
                <select value={form.storageCondition} onChange={set('storageCondition')}>
                  {STOR.map(s=><option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="pH"><input type="number" step="0.01" placeholder="e.g. 7.2" value={form.pH} onChange={set('pH')} /></Field>
            </Row>
            <Row>
              <Field label="VS (% of wet mass)" hint="Volatile solids — needed for BMP dosing"><input type="number" step="0.01" placeholder="e.g. 3.5" value={form.VS} onChange={set('VS')} /></Field>
              <Field label="TS (% of wet mass)" hint="Total solids"><input type="number" step="0.01" placeholder="e.g. 4.2" value={form.TS} onChange={set('TS')} /></Field>
            </Row>
            <Field label="NOTES"><textarea rows={2} placeholder="Observations, origin reactor history..." value={form.notes} onChange={set('notes')} /></Field>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update batch' : 'Save batch'}</BtnPrimary>
              <BtnOutline type="button" onClick={()=>{ setForm(empty); setEditing(null) }}>{editing ? 'Cancel edit' : 'Clear'}</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {tab==='records' && (
        <Card title={<>Inoculum batches <Badge color="#f59e0b">{batches.length}</Badge></>}>
          {loading ? <Spinner /> : batches.length===0 ? <EmptyState msg="No inoculum batches registered yet." /> : (
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead><tr>
                  <th>BATCH ID</th><th>ORIGIN</th><th>VS %</th><th>TS %</th>
                  <th>ACCLIMATION</th><th>STORAGE</th><th>DATE</th><th></th>
                </tr></thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id}>
                      <td style={{ color:'var(--text)', fontWeight:500 }}>{b.batchId}</td>
                      <td>{b.originReactor||'—'}</td>
                      <td>{b.VS||'—'}</td>
                      <td>{b.TS||'—'}</td>
                      <td><Badge color={b.acclimationStatus?.includes('Acclimated')&&!b.acclimationStatus?.includes('Not')?'#3ecf8e':'#f59e0b'}>{b.acclimationStatus}</Badge></td>
                      <td>{b.storageCondition}</td>
                      <td style={{ fontFamily:'Space Mono', fontSize:11 }}>{b.collectionDate||'—'}</td>
                      <td style={{display:'flex',gap:6}}>
                      <button onClick={()=>startEdit(b)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontFamily:'Space Mono',background:'transparent',border:'1px solid rgba(74,158,255,0.3)',color:'#4a9eff',cursor:'pointer'}}>Edit</button>
                      <BtnDanger onClick={()=>handleDelete(b.id)}>Delete</BtnDanger>
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

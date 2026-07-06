import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, Card, KPI, Tabs, Row, Row3, Field, BtnPrimary, BtnOutline, BtnDanger, Badge, StatusBadge, Toast, Spinner, EmptyState } from './Shared'
import { calcCV, assessQC } from '../utils/statusRules'

const METHODS = ['VDI 4630 (2016)','ISO 11734','Own SOP']
const empty = {
  experimentId:'', method:'VDI 4630 (2016)', sopVersion:'', analyst:'',
  inStartDate:'', inEndDate:'', tempTarget:'37', agitation:'Daily manual',
  substrateId:'', inoculumId:'', sirRatio:'0.5',
  replicates:'3', bottleIds:'',
  inoculumVS_g:'', substrateVS_g:'',
  blankBottles:'', positiveControl:'cellulose',
  notes:''
}

export default function BMPExperiment() {
  const { uid } = useAuth()
  const [tab, setTab] = useState('entry')
  const [form, setForm] = useState(empty)
  const [experiments, setExperiments] = useState([])
  const [inoculumBatches, setInoculumBatches] = useState([])
  const [charRecords, setCharRecords] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const u1 = onSnapshot(query(collection(db,'bmp_experiments'), where('uid','==',uid), orderBy('createdAt','desc')),
      snap => { setExperiments(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false) })
    const u2 = onSnapshot(query(collection(db,'inoculum_batches'), where('uid','==',uid)),
      snap => setInoculumBatches(snap.docs.map(d=>({id:d.id,...d.data()}))))
    const u3 = onSnapshot(query(collection(db,'characterization'), where('uid','==',uid)),
      snap => setCharRecords(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return () => { u1(); u2(); u3() }
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
    await updateDoc(doc(db, 'bmp_experiments', editing), fields)
    setEditing(null)
    setForm(empty)
    show('Record updated!')
    setSaving(false)
  }


  async function handleSave(e) {
    e.preventDefault()
    if (!form.experimentId.trim()) return show('Experiment ID is required')
    setSaving(true)
    await addDoc(collection(db,'bmp_experiments'), {
      ...form, uid,
      approvalStatus:'Pending',
      createdAt: new Date().toISOString()
    })
    setForm(empty); show('BMP experiment saved!')
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this experiment and all gas logs?')) return
    // delete gas logs
    const gasSnap = await getDocs(query(collection(db,'gas_measurements'), where('experimentId','==',id)))
    await Promise.all(gasSnap.docs.map(d => deleteDoc(d.ref)))
    await deleteDoc(doc(db,'bmp_experiments',id))
    show('Experiment deleted.')
  }

  function show(msg) { setToast(msg); setTimeout(()=>setToast(''),3000) }
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const pending = experiments.filter(e=>e.approvalStatus==='Pending').length
  const approved = experiments.filter(e=>e.approvalStatus==='Approved').length

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="BMP experiment design" sub="Define batch assay setup, reactor configuration, controls, and dosing." breadcrumb="BMP Experiment" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="TOTAL EXPERIMENTS" value={experiments.length} color="#8b5cf6" />
        <KPI label="PENDING REVIEW"    value={pending}            color="#f59e0b" sub="Awaiting QC" />
        <KPI label="APPROVED"          value={approved}           color="#3ecf8e" sub="Validated" />
        <KPI label="REJECTED"          value={experiments.filter(e=>e.approvalStatus==='Rejected').length} color="#ef4444" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{id:'entry',label:'New experiment'},{id:'records',label:'All experiments'}]} />

      {tab==='entry' && (
        <Card title="New BMP assay setup">
          <form onSubmit={editing ? handleUpdate : handleSave}>
            {editing && (
              <div style={{ background:'rgba(74,158,255,0.08)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#4a9eff', display:'flex', alignItems:'center', gap:8 }}>
                ✏ Editing existing record — make changes then click Update
              </div>
            )}
            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', marginBottom:12, borderBottom:'1px solid var(--border)', paddingBottom:8 }}>METHOD METADATA</div>
            <Row3>
              <Field label="EXPERIMENT ID *"><input placeholder="e.g. EXP-2026-001" value={form.experimentId} onChange={set('experimentId')} required /></Field>
              <Field label="TEST METHOD">
                <select value={form.method} onChange={set('method')}>
                  {METHODS.map(m=><option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="SOP VERSION"><input placeholder="e.g. SOP-BMP-v2.1" value={form.sopVersion} onChange={set('sopVersion')} /></Field>
            </Row3>
            <Row>
              <Field label="ANALYST"><input placeholder="Name of analyst" value={form.analyst} onChange={set('analyst')} /></Field>
              <Field label="INCUBATION TEMPERATURE (°C)"><input type="number" step="0.5" value={form.tempTarget} onChange={set('tempTarget')} /></Field>
            </Row>
            <Row>
              <Field label="START DATE"><input type="date" value={form.inStartDate} onChange={set('inStartDate')} /></Field>
              <Field label="EXPECTED END DATE"><input type="date" value={form.inEndDate} onChange={set('inEndDate')} /></Field>
            </Row>

            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', margin:'20px 0 12px', borderBottom:'1px solid var(--border)', paddingBottom:8 }}>SUBSTRATE & INOCULUM</div>
            <Row>
              <Field label="SUBSTRATE (Characterization Record)">
                <select value={form.substrateId} onChange={set('substrateId')}>
                  <option value="">— Select substrate —</option>
                  {charRecords.map(c=><option key={c.id} value={c.id}>{c.sampleId} ({c.sourceType})</option>)}
                </select>
              </Field>
              <Field label="INOCULUM BATCH">
                <select value={form.inoculumId} onChange={set('inoculumId')}>
                  <option value="">— Select inoculum —</option>
                  {inoculumBatches.map(b=><option key={b.id} value={b.id}>{b.batchId}</option>)}
                </select>
              </Field>
            </Row>
            <Row3>
              <Field label="SUBSTRATE VS ADDED (g)" hint="Per reactor"><input type="number" step="0.001" placeholder="e.g. 2.500" value={form.substrateVS_g} onChange={set('substrateVS_g')} /></Field>
              <Field label="INOCULUM VS ADDED (g)" hint="Per reactor"><input type="number" step="0.001" placeholder="e.g. 5.000" value={form.inoculumVS_g} onChange={set('inoculumVS_g')} /></Field>
              <Field label="S/I RATIO (VS basis)" hint="Substrate VS / Inoculum VS">
                <input readOnly value={
                  form.substrateVS_g && form.inoculumVS_g
                    ? (parseFloat(form.substrateVS_g)/parseFloat(form.inoculumVS_g)).toFixed(3)
                    : form.sirRatio
                } style={{ fontFamily:'Space Mono', color:'var(--green)', background:'var(--bg)' }} />
              </Field>
            </Row3>

            <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', margin:'20px 0 12px', borderBottom:'1px solid var(--border)', paddingBottom:8 }}>REACTOR SETUP & CONTROLS</div>
            <Row3>
              <Field label="REPLICATES" hint="# of identical reactors"><input type="number" min="1" max="10" value={form.replicates} onChange={set('replicates')} /></Field>
              <Field label="BOTTLE IDs" hint="Comma separated"><input placeholder="e.g. B1, B2, B3" value={form.bottleIds} onChange={set('bottleIds')} /></Field>
              <Field label="AGITATION"><input placeholder="e.g. Daily manual" value={form.agitation} onChange={set('agitation')} /></Field>
            </Row3>
            <Row>
              <Field label="BLANK BOTTLE IDs" hint="Inoculum only — for blank correction"><input placeholder="e.g. BLK1, BLK2" value={form.blankBottles} onChange={set('blankBottles')} /></Field>
              <Field label="POSITIVE CONTROL" hint="e.g. Microcrystalline cellulose"><input placeholder="e.g. cellulose 0.5 g" value={form.positiveControl} onChange={set('positiveControl')} /></Field>
            </Row>
            <Field label="NOTES"><textarea rows={2} placeholder="Additional setup notes..." value={form.notes} onChange={set('notes')} /></Field>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <BtnPrimary type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update experiment' : 'Save experiment'}</BtnPrimary>
              <BtnOutline type="button" onClick={()=>{ setForm(empty); setEditing(null) }}>{editing ? 'Cancel edit' : 'Clear'}</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {tab==='records' && (
        <Card title={<>BMP experiments <Badge color="#8b5cf6">{experiments.length}</Badge></>}>
          {loading ? <Spinner /> : experiments.length===0 ? <EmptyState msg="No experiments yet." /> : (
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead><tr>
                  <th>EXPERIMENT ID</th><th>METHOD</th><th>ANALYST</th><th>S/I RATIO</th>
                  <th>REPLICATES</th><th>START</th><th>STATUS</th><th></th>
                </tr></thead>
                <tbody>
                  {experiments.map(e => (
                    <tr key={e.id}>
                      <td style={{ color:'var(--text)', fontWeight:500 }}>{e.experimentId}</td>
                      <td style={{ fontSize:11 }}>{e.method}</td>
                      <td>{e.analyst||'—'}</td>
                      <td style={{ fontFamily:'Space Mono' }}>{e.sirRatio}</td>
                      <td>{e.replicates}</td>
                      <td style={{ fontFamily:'Space Mono', fontSize:11 }}>{e.inStartDate||'—'}</td>
                      <td><StatusBadge status={e.approvalStatus} /></td>
                      <td style={{display:'flex',gap:6}}>
                      <button onClick={()=>startEdit(e)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontFamily:'Space Mono',background:'transparent',border:'1px solid rgba(74,158,255,0.3)',color:'#4a9eff',cursor:'pointer'}}>Edit</button>
                      <BtnDanger onClick={()=>handleDelete(e.id)}>Delete</BtnDanger>
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

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, addDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, Card, KPI, Tabs, Row, Row3, Field, BtnPrimary, BtnOutline, BtnDanger, Badge, StatusBadge, Toast, Spinner, EmptyState } from './Shared'
import { assessQC, calcCV, getThresholds } from '../utils/statusRules'

export default function QCReview() {
  const { uid, user, role } = useAuth()
  const [tab, setTab] = useState('qc')
  const [experiments, setExperiments] = useState([])
  const [gasLogs, setGasLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [selected, setSelected] = useState(null)
  const [qcForm, setQcForm] = useState({ blankCH4:'', positiveRecovery:'', reviewNote:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!uid) return
    const u1 = onSnapshot(query(collection(db,'bmp_experiments'), where('uid','==',uid), orderBy('createdAt','desc')),
      snap => { setExperiments(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false) })
    const u2 = onSnapshot(query(collection(db,'gas_measurements'), where('uid','==',uid)),
      snap => setGasLogs(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return () => { u1(); u2() }
  }, [uid])

  function getExpLogs(experimentId) {
    return gasLogs.filter(l => l.experimentId === experimentId)
  }

  function calcBMPResult(exp) {
    const logs = getExpLogs(exp.experimentId)
    // Sum cumulative CH4 per bottle, subtract blank average
    const bottles = [...new Set(logs.map(l=>l.bottleId))].filter(b => !b.toLowerCase().includes('blk'))
    const blanks = [...new Set(logs.map(l=>l.bottleId))].filter(b => b.toLowerCase().includes('blk'))
    const blankTotals = blanks.map(b => logs.filter(l=>l.bottleId===b).reduce((s,l)=>s+(l.ch4Vol_NmL||0),0))
    const blankAvg = blankTotals.length ? blankTotals.reduce((a,b)=>a+b,0)/blankTotals.length : 0
    const bottleTotals = bottles.map(b => logs.filter(l=>l.bottleId===b).reduce((s,l)=>s+(l.ch4Vol_NmL||0),0))
    const netTotals = bottleTotals.map(t => Math.max(0, t - blankAvg))
    const vsAdded = parseFloat(exp.substrateVS_g) || 1
    const yields = netTotals.map(n => n / vsAdded)
    const mean = yields.length ? yields.reduce((a,b)=>a+b,0)/yields.length : 0
    const cv = calcCV(yields)
    return { yields, mean: mean.toFixed(2), cv: cv?.toFixed(1)||'N/A', blankAvg: blankAvg.toFixed(2) }
  }

  async function handleQCSubmit(exp) {
    const result = calcBMPResult(exp)
    const qcResult = assessQC({
      blankCH4: qcForm.blankCH4 || result.blankAvg,
      positiveRecovery: qcForm.positiveRecovery,
      replicateCV: result.cv
    })
    setSaving(true)
    await updateDoc(doc(db,'bmp_experiments',exp.id), {
      approvalStatus: qcResult.pass ? 'Approved' : 'Rejected',
      qcFlags: qcResult.flags,
      qcNote: qcForm.reviewNote,
      reviewedBy: user.email,
      reviewedAt: new Date().toISOString(),
      bmpResult_mean: parseFloat(result.mean),
      bmpResult_cv: result.cv,
      blankCH4: result.blankAvg,
    })
    setSelected(null); setQcForm({ blankCH4:'', positiveRecovery:'', reviewNote:'' })
    show(qcResult.pass ? '✓ Experiment approved!' : '✗ Experiment rejected — QC failed')
    setSaving(false)
  }

  function show(msg) { setToast(msg); setTimeout(()=>setToast(''),3500) }

  const pending = experiments.filter(e=>e.approvalStatus==='Pending')
  const reviewed = experiments.filter(e=>e.approvalStatus!=='Pending')

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="QC review & approval" sub="Validate BMP experiments — blank correction, replicate CV, positive control check." breadcrumb="QC Review" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <KPI label="PENDING REVIEW" value={pending.length}                                           color="#f59e0b" />
        <KPI label="APPROVED"       value={experiments.filter(e=>e.approvalStatus==='Approved').length} color="#3ecf8e" />
        <KPI label="REJECTED"       value={experiments.filter(e=>e.approvalStatus==='Rejected').length} color="#ef4444" />
        <KPI label="TOTAL"          value={experiments.length}                                        color="#8b5cf6" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{id:'qc',label:`Pending (${pending.length})`},{id:'history',label:'Review history'}]} />

      {tab==='qc' && (
        pending.length===0
          ? <EmptyState msg="No experiments pending review." />
          : pending.map(exp => {
            const result = calcBMPResult(exp)
            const logs = getExpLogs(exp.experimentId)
            const isSelected = selected===exp.id
            return (
              <Card key={exp.id} title={
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span>{exp.experimentId}</span>
                  <Badge color="#f59e0b">Pending</Badge>
                  <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>{exp.analyst} · {exp.inStartDate}</span>
                </div>
              }>
                {/* Calculated results */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                  <Metric label="MEAN BMP (NmL/gVS)" value={result.mean} color="#8b5cf6" />
                  <Metric label="REPLICATE CV" value={`${result.cv}%`} color={parseFloat(result.cv)>10?'#ef4444':'#3ecf8e'} />
                  <Metric label="BLANK AVG (NmL)" value={result.blankAvg} color="#4a9eff" />
                  <Metric label="GAS LOGS" value={logs.length} color="#f59e0b" />
                </div>

                {isSelected ? (
                  <div style={{ background:'var(--bg3)', borderRadius:10, padding:16, marginTop:8 }}>
                    <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text3)', marginBottom:12 }}>QC CHECK INPUTS</div>
                    <Row3>
                      <Field label="BLANK CH₄ (NmL)" hint="Override auto-calculated if needed">
                        <input type="number" step="0.1" placeholder={result.blankAvg} value={qcForm.blankCH4} onChange={e=>setQcForm(f=>({...f,blankCH4:e.target.value}))} />
                      </Field>
                      <Field label="POSITIVE CONTROL RECOVERY (%)" hint="Target 80–120%">
                        <input type="number" step="0.1" placeholder="e.g. 95" value={qcForm.positiveRecovery} onChange={e=>setQcForm(f=>({...f,positiveRecovery:e.target.value}))} />
                      </Field>
                      <Field label="REPLICATE CV (%)" hint="Auto: {result.cv}%">
                        <input readOnly value={result.cv} style={{ fontFamily:'Space Mono', color: parseFloat(result.cv)>10?'#ef4444':'#3ecf8e', background:'var(--bg)' }} />
                      </Field>
                    </Row3>
                    <Field label="REVIEW NOTE"><textarea rows={2} placeholder="Technical observations, deviations, CAPA actions..." value={qcForm.reviewNote} onChange={e=>setQcForm(f=>({...f,reviewNote:e.target.value}))} /></Field>
                    <div style={{ display:'flex', gap:10, marginTop:16 }}>
                      <BtnPrimary onClick={()=>handleQCSubmit(exp)} disabled={saving}>{saving?'Processing...':'Submit QC review'}</BtnPrimary>
                      <BtnOutline onClick={()=>setSelected(null)}>Cancel</BtnOutline>
                    </div>
                  </div>
                ) : (
                  <BtnPrimary onClick={()=>setSelected(exp.id)}>Start QC review</BtnPrimary>
                )}
              </Card>
            )
          })
      )}

      {tab==='history' && (
        <Card title={<>Review history <Badge color="#3ecf8e">{reviewed.length}</Badge></>}>
          {reviewed.length===0 ? <EmptyState msg="No reviews yet." /> : (
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead><tr>
                  <th>EXPERIMENT</th><th>MEAN BMP (NmL/gVS)</th><th>CV %</th><th>STATUS</th>
                  <th>REVIEWED BY</th><th>REVIEWED AT</th><th>FLAGS</th>
                </tr></thead>
                <tbody>
                  {reviewed.map(e => (
                    <tr key={e.id}>
                      <td style={{ color:'var(--text)', fontWeight:500 }}>{e.experimentId}</td>
                      <td style={{ fontFamily:'Space Mono', color:'#8b5cf6' }}>{e.bmpResult_mean?.toFixed(2)||'—'}</td>
                      <td style={{ fontFamily:'Space Mono', color: parseFloat(e.bmpResult_cv)>10?'#ef4444':'#3ecf8e' }}>{e.bmpResult_cv||'—'}</td>
                      <td><StatusBadge status={e.approvalStatus} /></td>
                      <td style={{ fontSize:11 }}>{e.reviewedBy||'—'}</td>
                      <td style={{ fontFamily:'Space Mono', fontSize:11 }}>{e.reviewedAt?new Date(e.reviewedAt).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}):'—'}</td>
                      <td style={{ fontSize:11, color:'#ef4444' }}>{e.qcFlags?.join(', ')||'None'}</td>
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

function Metric({ label, value, color }) {
  return (
    <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
      <div style={{ fontSize:10, fontFamily:'Space Mono', color:'var(--text3)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:600, fontFamily:'Space Mono', color }}>{value}</div>
    </div>
  )
}

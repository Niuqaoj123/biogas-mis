import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, KPI, Card, Spinner } from './Shared'

export default function Dashboard() {
  const { uid } = useAuth()
  const [counts, setCounts] = useState({ bmp:0, water:0, soil:0, inoculum:0, experiments:0 })
  const [recent, setRecent] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    let bmpD=[], wqD=[], wwD=[], soilD=[], inoD=[], expD=[], charD=[]

    function rebuild() {
      setCounts({
        bmp: bmpD.length,
        water: wqD.length + wwD.length,
        soil: soilD.length,
        inoculum: inoD.length,
        experiments: expD.length,
      })
      const all = [
        ...bmpD.map(d=>({...d,module:'Biomethane',color:'#8b5cf6'})),
        ...wqD.map(d=>({...d,module:'Water Quality',color:'#4a9eff'})),
        ...wwD.map(d=>({...d,module:'Wastewater',color:'#4a9eff'})),
        ...soilD.map(d=>({...d,module:'Soil',color:'var(--red)'})),
        ...charD.map(d=>({...d,module:'Characterization',color:'#f59e0b'})),
        ...expD.map(d=>({...d,module:'BMP Experiment',color:'#8b5cf6'})),
      ]
      all.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))
      setRecent(all.slice(0,8))
      setPending(expD.filter(e => e.approvalStatus === 'Pending'))
      setLoading(false)
    }

    const u = (col, setter) => onSnapshot(
      query(collection(db, col), where('uid','==',uid), orderBy('createdAt','desc')),
      snap => { setter(snap.docs.map(d=>({id:d.id,...d.data()}))); rebuild() }
    )
    // legacy collections (no uid filter for backward compat)
    const uLeg = (col, setter) => onSnapshot(
      query(collection(db, col), orderBy('createdAt','desc')),
      snap => { setter(snap.docs.filter(d=>!d.data().uid||d.data().uid===uid).map(d=>({id:d.id,...d.data()}))); rebuild() }
    )

    const unsubs = [
      uLeg('bmp_samples',     d => { bmpD=d }),
      uLeg('water_quality',   d => { wqD=d }),
      uLeg('wastewater',      d => { wwD=d }),
      uLeg('soil_samples',    d => { soilD=d }),
      u('inoculum_batches',   d => { inoD=d }),
      u('bmp_experiments',    d => { expD=d }),
      u('characterization',   d => { charD=d }),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [uid])

  const total = counts.bmp + counts.water + counts.soil

  return (
    <div style={{ padding:32 }}>
      <PageHeader title="Lab overview" sub="LIMS summary — samples, experiments, and pending approvals." breadcrumb="Dashboard" />

      {pending.length > 0 && (
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'12px 16px', marginBottom:24, fontSize:13, color:'#f59e0b', display:'flex', alignItems:'center', gap:10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {pending.length} experiment{pending.length>1?'s':''} pending QC review
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:28 }}>
        <KPI label="BMP SAMPLES"    value={counts.bmp}         color="#8b5cf6" sub="Biomethane" />
        <KPI label="WATER SAMPLES"  value={counts.water}       color="#4a9eff" sub="Water & WW" />
        <KPI label="SOIL SAMPLES"   value={counts.soil}        color="var(--red)" sub="Soil & fertilizer" />
        <KPI label="INOCULUM BATCHES" value={counts.inoculum}  color="#f59e0b" sub="Active batches" />
        <KPI label="EXPERIMENTS"    value={counts.experiments}  color="#8b5cf6" sub="BMP runs" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card title="Module sample count">
          {loading ? <Spinner /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <ProgressRow label="Biomethane / BMP" value={counts.bmp} max={Math.max(total,1)} color="#8b5cf6" />
              <ProgressRow label="Water & wastewater" value={counts.water} max={Math.max(total,1)} color="#4a9eff" />
              <ProgressRow label="Soil & fertilizer" value={counts.soil} max={Math.max(total,1)} color="var(--red)" />
            </div>
          )}
        </Card>

        <Card title="Recent activity">
          {loading ? <Spinner /> : recent.length === 0
            ? <p style={{ fontSize:13, color:'var(--text3)' }}>No records yet.</p>
            : recent.map(r => (
              <div key={r.id} style={{ display:'flex', gap:12, paddingBottom:10, marginBottom:10, borderBottom:'1px solid rgba(45,55,72,0.4)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:r.color, flexShrink:0, marginTop:5 }} />
                <div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>
                    <strong style={{ color:'var(--text)' }}>{r.sampleId||r.experimentId||r.batchId||r.id.slice(0,8)}</strong> — {r.module}
                  </div>
                  <div style={{ fontSize:10, fontFamily:'Space Mono', color:'var(--text3)', marginTop:2 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                  </div>
                </div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  )
}

function ProgressRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
        <span>{label}</span>
        <span style={{ fontFamily:'Space Mono', color }}>{value} samples</span>
      </div>
      <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.5s' }} />
      </div>
    </div>
  )
}

// Re-export for backward compatibility
export { PageHeader } from './Shared'

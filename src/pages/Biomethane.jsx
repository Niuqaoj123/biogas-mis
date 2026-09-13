import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase'
import SampleTable from '../components/SampleTable'
import { PageHeader } from './Dashboard'
import { assessBMP } from './statusRules'
import { useAuth } from '../hooks/useAuth'

const FEEDSTOCKS = ['Cattle manure','Swine manure','Food waste','Rice straw','Mixed sludge','Other']
const COLS = [
  { key: 'sampleId',       label: 'SAMPLE ID' },
  { key: 'feedstock',      label: 'FEEDSTOCK' },
  { key: 'ch4Yield',       label: 'CH₄ YIELD (mL/gVS)' },
  { key: 'ch4Content',     label: 'CH₄ %' },
  { key: 'volatileSolids', label: 'VS %' },
  { key: 'm3PerTonVS',     label: 'CH₄ (m³/ton VS)' },
  { key: 'rating',         label: 'QUALITY' },
  { key: 'dateCollected',  label: 'DATE' },
]
const empty = { sampleId:'', dateCollected:'', feedstock:'Cattle manure', sampleWeight:'', volatileSolids:'', totalSolids:'', ch4Yield:'', ch4Content:'', notes:'' }

export default function Biomethane() {
  const { uid } = useAuth()
  const [tab,     setTab]     = useState('entry')
  const [form,    setForm]    = useState(empty)
  const [samples, setSamples] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [preview, setPreview] = useState(null)

  // Real-time listener — instant updates, no loading delay
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'bmp_samples'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setSamples(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  // Live quality preview as user types
  useEffect(() => {
    if (form.ch4Yield || form.ch4Content || form.volatileSolids) {
      setPreview(assessBMP(form))
    } else {
      setPreview(null)
    }
  }, [form.ch4Yield, form.ch4Content, form.volatileSolids])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.sampleId.trim()) return showToast('Sample ID is required')
    setSaving(true)
    const assessment = assessBMP(form)
    // Convert mL/gVS to m³/ton VS: divide by 1000
    const m3PerTonVS = form.ch4Yield
      ? (parseFloat(form.ch4Yield) / 1000).toFixed(4) + ' m³/ton VS'
      : '—'
    await addDoc(collection(db, 'bmp_samples'), {
      ...form,
      uid,
      m3PerTonVS,
      status: assessment.status,
      rating: assessment.rating,
      issues: assessment.issues,
      createdAt: new Date().toISOString(),
    })
    setForm(empty)
    setPreview(null)
    showToast('BMP sample saved!')
    setSaving(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const passCount   = samples.filter(s => s.status === 'Pass').length
  const failCount   = samples.filter(s => s.status === 'Fail').length
  const reviewCount = samples.filter(s => s.status === 'Review').length

  // Average m³/ton VS across all samples
  const validYields = samples.filter(s => s.ch4Yield && !isNaN(parseFloat(s.ch4Yield)))
  const avgM3PerTon = validYields.length > 0
    ? (validYields.reduce((sum, s) => sum + parseFloat(s.ch4Yield), 0) / validYields.length / 1000).toFixed(4)
    : '—'

  return (
    <div style={{ padding: 32 }}>
      <PageHeader title="Biomethane potential testing" sub="Record and manage BMP analysis for organic feedstock samples." breadcrumb="Biomethane / BMP" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 28 }}>
        <KPI label="TOTAL SAMPLES"      value={samples.length} color="#8b5cf6" />
        <KPI label="PASS"               value={passCount}      color="var(--red)" sub="Good quality" />
        <KPI label="NEEDS REVIEW"       value={reviewCount}    color="#f59e0b" sub="Fair quality" />
        <KPI label="FAIL"               value={failCount}      color="#ef4444" sub="Poor quality" />
        <KPI label="AVG CH₄ (m³/ton VS)" value={avgM3PerTon}  color="var(--gold)" sub="All samples" />
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={[{ id:'entry', label:'Data entry' }, { id:'records', label:'Sample records' }, { id:'results', label:'Results & charts' }]} />

      {tab === 'entry' && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:22 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:20 }}>New BMP sample entry</div>
          <form onSubmit={handleSave}>
            <Row>
              <Field label="SAMPLE ID *"><input placeholder="e.g. BMP-2026-001" value={form.sampleId} onChange={set('sampleId')} required /></Field>
              <Field label="DATE COLLECTED"><input type="date" value={form.dateCollected} onChange={set('dateCollected')} /></Field>
            </Row>
            <Row>
              <Field label="FEEDSTOCK TYPE">
                <select value={form.feedstock} onChange={set('feedstock')}>
                  {FEEDSTOCKS.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="SAMPLE WEIGHT (g)"><input type="number" step="0.01" placeholder="e.g. 10.5" value={form.sampleWeight} onChange={set('sampleWeight')} /></Field>
            </Row>
            <Row>
              <Field label="VOLATILE SOLIDS (%)"><input type="number" step="0.01" placeholder="e.g. 82.3" value={form.volatileSolids} onChange={set('volatileSolids')} /></Field>
              <Field label="TOTAL SOLIDS (%)"><input type="number" step="0.01" placeholder="e.g. 91.0" value={form.totalSolids} onChange={set('totalSolids')} /></Field>
            </Row>
            <Row>
              <Field label="CH₄ YIELD (mL/gVS)"><input type="number" step="0.1" placeholder="e.g. 312" value={form.ch4Yield} onChange={set('ch4Yield')} /></Field>
              <Field label="CH₄ CONTENT (%)"><input type="number" step="0.1" placeholder="e.g. 63.4" value={form.ch4Content} onChange={set('ch4Content')} /></Field>
            </Row>

            {/* Live m³/ton VS conversion */}
            {form.ch4Yield && (
              <div style={{ background:'rgba(192,57,43,0.06)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{flexShrink:0}}><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                <div>
                  <div style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', marginBottom:3 }}>CALCULATED YIELD</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:16, flexWrap:'wrap' }}>
                    <span>
                      <span style={{ fontSize:20, fontWeight:700, fontFamily:'Space Mono', color:'var(--gold)' }}>
                        {(parseFloat(form.ch4Yield) / 1000).toFixed(4)}
                      </span>
                      <span style={{ fontSize:12, color:'var(--text2)', marginLeft:6 }}>m³ CH₄ / ton VS</span>
                    </span>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>
                      = {form.ch4Yield} mL/gVS ÷ 1,000
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Field label="NOTES"><textarea rows={2} placeholder="Optional observations..." value={form.notes} onChange={set('notes')} /></Field>

            {/* Live quality preview */}
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
            Sample records <Badge color="#8b5cf6">{samples.length} total</Badge>
          </div>
          <SampleTable samples={samples} columns={COLS} collection="bmp_samples" onDeleted={id => setSamples(s => s.filter(r => r.id !== id))} />
        </div>
      )}
      {tab === 'results' && (
        <ResultsTab samples={samples} avgM3PerTon={avgM3PerTon} />
      )}

      <Toast msg={toast} />
    </div>
  )
}

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background:'#1A1D23', border:'1px solid #2E3340', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'#9A9490', marginBottom:4, fontFamily:'Space Mono', fontSize:10 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, fontFamily:'Space Mono' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── RESULTS TAB ────────────────────────────────────────────────────
function ResultsTab({ samples, avgM3PerTon }) {
  if (samples.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)', fontSize:13 }}>
        No samples recorded yet. Add samples in the Data entry tab to see charts here.
      </div>
    )
  }

  // ── Chart A: CH₄ yield by feedstock (bar) ──────────────────────
  const feedstockMap = {}
  samples.forEach(s => {
    if (!s.feedstock || !s.ch4Yield) return
    if (!feedstockMap[s.feedstock]) feedstockMap[s.feedstock] = { total: 0, count: 0 }
    feedstockMap[s.feedstock].total += parseFloat(s.ch4Yield) / 1000
    feedstockMap[s.feedstock].count += 1
  })
  const barData = Object.entries(feedstockMap).map(([name, d]) => ({
    name: name.length > 12 ? name.slice(0,12)+'…' : name,
    fullName: name,
    'Avg m³/ton VS': parseFloat((d.total / d.count).toFixed(4)),
    samples: d.count,
  })).sort((a,b) => b['Avg m³/ton VS'] - a['Avg m³/ton VS'])

  // ── Chart B: Trend over time (line) ─────────────────────────────
  const sorted = [...samples]
    .filter(s => s.ch4Yield && s.dateCollected)
    .sort((a,b) => new Date(a.dateCollected) - new Date(b.dateCollected))
  const lineData = sorted.map(s => ({
    date: s.dateCollected,
    'm³/ton VS': parseFloat((parseFloat(s.ch4Yield) / 1000).toFixed(4)),
    'CH₄ %': parseFloat(s.ch4Content) || 0,
    name: s.sampleId,
  }))

  // ── Chart C: Quality donut (pie) ────────────────────────────────
  const pass   = samples.filter(s => s.status === 'Pass').length
  const review = samples.filter(s => s.status === 'Review').length
  const fail   = samples.filter(s => s.status === 'Fail').length
  const pieData = [
    { name: 'Pass',   value: pass,   color: '#2E7D52' },
    { name: 'Review', value: review, color: '#B8860B' },
    { name: 'Fail',   value: fail,   color: '#A93226' },
  ].filter(d => d.value > 0)

  const CARD = { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:22 }
  const TITLE = { fontSize:13, fontWeight:600, marginBottom:4, color:'var(--text)' }
  const SUB   = { fontSize:11, color:'var(--text3)', marginBottom:18 }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Summary strip */}
      <div style={{ background:'rgba(192,57,43,0.06)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:10, padding:'14px 20px', display:'flex', gap:40, flexWrap:'wrap' }}>
        <SumItem label="Total samples"       value={samples.length} unit="" />
        <SumItem label="Avg CH₄ yield"       value={avgM3PerTon}    unit="m³/ton VS" />
        <SumItem label="Pass rate"           value={samples.length ? Math.round(pass/samples.length*100) : 0} unit="%" />
        <SumItem label="Feedstocks tested"   value={Object.keys(feedstockMap).length} unit="types" />
      </div>

      {/* Chart A — Bar: yield by feedstock */}
      <div style={CARD}>
        <div style={TITLE}>CH₄ yield by feedstock</div>
        <div style={SUB}>Average m³ CH₄ per ton VS per feedstock type</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top:4, right:16, left:0, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E3340" />
            <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9A9490', fontFamily:'Space Mono' }} />
            <YAxis tick={{ fontSize:11, fill:'#9A9490', fontFamily:'Space Mono' }} tickFormatter={v => v.toFixed(3)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Avg m³/ton VS" fill="#C0392B" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>

        {/* Chart B — Line: trend over time */}
        <div style={CARD}>
          <div style={TITLE}>CH₄ yield trend over time</div>
          <div style={SUB}>m³/ton VS per sample date — shows production trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top:4, right:16, left:0, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E3340" />
              <XAxis dataKey="date" tick={{ fontSize:10, fill:'#9A9490' }} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize:10, fill:'#9A9490' }} tickFormatter={v => v.toFixed(3)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="m³/ton VS" stroke="#C9A84C" strokeWidth={2} dot={{ fill:'#C9A84C', r:3 }} activeDot={{ r:5 }} />
              <Line type="monotone" dataKey="CH₄ %" stroke="#C0392B" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              <Legend wrapperStyle={{ fontSize:11, color:'#9A9490' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart C — Donut: quality breakdown */}
        <div style={CARD}>
          <div style={TITLE}>Quality breakdown</div>
          <div style={SUB}>Pass / Review / Fail distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} samples`, n]} contentStyle={{ background:'#1A1D23', border:'1px solid #2E3340', fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11, color:'#9A9490' }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend counts */}
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:8 }}>
            {pieData.map(p => (
              <div key={p.name} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:700, fontFamily:'Space Mono', color:p.color }}>{p.value}</div>
                <div style={{ fontSize:10, color:'#9A9490', fontFamily:'Space Mono' }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function SumItem({ label, value, unit }) {
  return (
    <div>
      <div style={{ fontSize:10, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em', marginBottom:4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize:20, fontWeight:700, fontFamily:'Space Mono', color:'var(--gold)' }}>
        {value} <span style={{ fontSize:12, fontWeight:400, color:'var(--text2)' }}>{unit}</span>
      </div>
    </div>
  )
}

function QualityPreview({ result }) {
  return (
    <div style={{ background: `${result.color}10`, border: `1px solid ${result.color}40`, borderRadius: 10, padding: '14px 16px', marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: result.issues.length > 0 ? 10 : 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: result.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: result.color }}>Predicted: {result.status}</span>
        <span style={{ fontSize: 11, fontFamily: 'Space Mono', color: result.color, opacity: 0.8 }}>{result.rating}</span>
      </div>
      {result.issues.map((iss, i) => (
        <div key={i} style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, display: 'flex', gap: 6 }}>
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
export function Tabs({ tab, setTab, tabs }) {
  return (
    <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          padding:'9px 18px', fontSize:13, cursor:'pointer', background:'transparent', border:'none',
          borderBottom:`2px solid ${tab===t.id ? 'var(--red)' : 'transparent'}`,
          color: tab===t.id ? 'var(--red)' : 'var(--text2)', marginBottom:-1, transition:'all 0.15s',
        }}>{t.label}</button>
      ))}
    </div>
  )
}
export function Row({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>{children}</div>
}
export function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em' }}>{label}</label>
      {children}
    </div>
  )
}
export function BtnPrimary({ children, ...props }) {
  return <button {...props} style={{ padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:500, background:'var(--red)', border:'none', color:'#0d1117', cursor:props.disabled?'not-allowed':'pointer', opacity:props.disabled?0.7:1, fontFamily:'DM Sans' }}>{children}</button>
}
export function BtnOutline({ children, ...props }) {
  return <button {...props} style={{ padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:500, background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', fontFamily:'DM Sans' }}>{children}</button>
}
export function Badge({ children, color }) {
  return <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontFamily:'Space Mono', background:`${color}18`, color, border:`1px solid ${color}44` }}>{children}</span>
}
export function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:'var(--bg2)', border:'1px solid var(--red)', borderRadius:10, padding:'14px 20px', fontSize:13, zIndex:9999, display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)' }} />
      {msg}
    </div>
  )
}

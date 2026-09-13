import { useState } from 'react'
import { PageHeader } from './Dashboard'

export default function Calculator() {
  const [ch4Yield,     setCh4Yield]     = useState('')
  const [sampleWeight, setSampleWeight] = useState('')
  const [vs,           setVS]           = useState('')
  const [ts,           setTS]           = useState('')

  // Derived calculations
  const y   = parseFloat(ch4Yield)
  const w   = parseFloat(sampleWeight)
  const vsp = parseFloat(vs)
  const tsp = parseFloat(ts)

  const m3PerTonVS      = !isNaN(y) ? y / 1000 : null
  const vsGrams         = (!isNaN(w) && !isNaN(vsp)) ? (w * vsp / 100) : null
  const totalCH4mL      = (!isNaN(y) && vsGrams !== null) ? y * vsGrams : null
  const totalCH4m3      = totalCH4mL !== null ? totalCH4mL / 1e6 : null
  const totalCH4PerTon  = m3PerTonVS !== null ? m3PerTonVS * 1000 : null // m³/ton VS × 1000 kg
  const tsGrams         = (!isNaN(w) && !isNaN(tsp)) ? (w * tsp / 100) : null
  const vsFraction      = (!isNaN(vsp) && !isNaN(tsp)) ? (vsp / tsp * 100) : null

  function reset() {
    setCh4Yield(''); setSampleWeight(''); setVS(''); setTS('')
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Biogas yield calculator"
        sub="Calculate CH₄ yield in m³/ton VS and total biogas volume from sample data."
        breadcrumb="Calculator"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ── INPUT PANEL ── */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:24 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            Input values
            <span style={{ fontSize:10, fontFamily:'Space Mono', background:'rgba(201,168,76,0.1)', color:'var(--gold)', border:'1px solid rgba(201,168,76,0.3)', padding:'2px 8px', borderRadius:20 }}>
              VDI 4630
            </span>
          </div>

          <Field label="CH₄ YIELD (mL/gVS)" hint="From BMP experiment result">
            <input type="number" step="0.1" placeholder="e.g. 312"
              value={ch4Yield} onChange={e => setCh4Yield(e.target.value)} />
          </Field>
          <Field label="SAMPLE WEIGHT (g)" hint="Total weight of substrate sample">
            <input type="number" step="0.01" placeholder="e.g. 10.5"
              value={sampleWeight} onChange={e => setSampleWeight(e.target.value)} />
          </Field>
          <Field label="VOLATILE SOLIDS — VS (%)" hint="% VS of dry weight">
            <input type="number" step="0.01" placeholder="e.g. 82.3"
              value={vs} onChange={e => setVS(e.target.value)} />
          </Field>
          <Field label="TOTAL SOLIDS — TS (%)" hint="% TS of wet weight (optional)">
            <input type="number" step="0.01" placeholder="e.g. 91.0"
              value={ts} onChange={e => setTS(e.target.value)} />
          </Field>

          <button onClick={reset} style={{
            marginTop:8, padding:'9px 20px', borderRadius:8, fontSize:13,
            background:'transparent', border:'1px solid var(--border)',
            color:'var(--text2)', cursor:'pointer', fontFamily:'DM Sans'
          }}>Clear all</button>
        </div>

        {/* ── RESULTS PANEL ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Primary result */}
          <div style={{ background:'rgba(192,57,43,0.06)', border:`2px solid ${m3PerTonVS !== null ? 'var(--red)' : 'var(--border)'}`, borderRadius:12, padding:24, textAlign:'center' }}>
            <div style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.08em', marginBottom:10 }}>
              CH₄ YIELD
            </div>
            <div style={{ fontSize:48, fontWeight:700, fontFamily:'Space Mono', color: m3PerTonVS !== null ? 'var(--gold)' : 'var(--text3)', lineHeight:1 }}>
              {m3PerTonVS !== null ? m3PerTonVS.toFixed(4) : '—'}
            </div>
            <div style={{ fontSize:14, color:'var(--text2)', marginTop:8 }}>m³ CH₄ / ton VS</div>
            {m3PerTonVS !== null && (
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:6, fontFamily:'Space Mono' }}>
                = {ch4Yield} mL/gVS ÷ 1,000
              </div>
            )}
          </div>

          {/* Secondary results */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:20, display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Derived values</div>

            <ResultRow
              label="VS weight in sample"
              value={vsGrams !== null ? vsGrams.toFixed(4) + ' g VS' : '—'}
              formula={vsGrams !== null ? `${sampleWeight}g × ${vs}% ÷ 100` : null}
              active={vsGrams !== null}
            />
            <ResultRow
              label="Total CH₄ volume"
              value={totalCH4mL !== null ? totalCH4mL.toFixed(2) + ' mL' : '—'}
              formula={totalCH4mL !== null ? `${ch4Yield} mL/gVS × ${vsGrams?.toFixed(4)}g VS` : null}
              active={totalCH4mL !== null}
            />
            <ResultRow
              label="Total CH₄ volume (m³)"
              value={totalCH4m3 !== null ? totalCH4m3.toFixed(6) + ' m³' : '—'}
              formula={totalCH4m3 !== null ? `${totalCH4mL?.toFixed(2)} mL ÷ 1,000,000` : null}
              active={totalCH4m3 !== null}
            />
            <ResultRow
              label="TS weight in sample"
              value={tsGrams !== null ? tsGrams.toFixed(4) + ' g TS' : '—'}
              formula={tsGrams !== null ? `${sampleWeight}g × ${ts}% ÷ 100` : null}
              active={tsGrams !== null}
            />
            <ResultRow
              label="VS as % of TS"
              value={vsFraction !== null ? vsFraction.toFixed(2) + ' %' : '—'}
              formula={vsFraction !== null ? `${vs}% VS ÷ ${ts}% TS × 100` : null}
              active={vsFraction !== null}
            />
          </div>

          {/* Reference table */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>Standard reference ranges</div>
            <table style={{ fontSize:11 }}>
              <thead>
                <tr>
                  <th>Feedstock</th>
                  <th>Typical range (m³/ton VS)</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Food waste',     '0.400 – 0.600', 'Excellent'],
                  ['Swine manure',   '0.300 – 0.400', 'Good'],
                  ['Cattle manure',  '0.200 – 0.300', 'Good'],
                  ['Rice straw',     '0.150 – 0.220', 'Fair'],
                  ['Mixed sludge',   '0.250 – 0.350', 'Good'],
                ].map(([feed, range, quality]) => (
                  <tr key={feed}>
                    <td>{feed}</td>
                    <td style={{ fontFamily:'Space Mono', fontSize:10 }}>{range}</td>
                    <td>
                      <span style={{
                        padding:'2px 8px', borderRadius:20, fontSize:10, fontFamily:'Space Mono',
                        background: quality === 'Excellent' ? 'rgba(46,125,82,0.15)' : quality === 'Good' ? 'rgba(58,158,104,0.1)' : 'rgba(184,134,11,0.1)',
                        color:      quality === 'Excellent' ? '#3A9E68' : quality === 'Good' ? '#3A9E68' : '#D4A017',
                        border:     `1px solid ${quality === 'Excellent' ? 'rgba(46,125,82,0.3)' : quality === 'Good' ? 'rgba(58,158,104,0.3)' : 'rgba(184,134,11,0.3)'}`,
                      }}>{quality}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {m3PerTonVS !== null && (
              <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, fontSize:12, color:'var(--text2)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{marginRight:6, verticalAlign:'middle'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Your result of <strong style={{color:'var(--gold)', fontFamily:'Space Mono'}}>{m3PerTonVS.toFixed(4)} m³/ton VS</strong>{' '}
                {m3PerTonVS >= 0.4 ? 'is Excellent — above most feedstock benchmarks.'
                  : m3PerTonVS >= 0.25 ? 'is Good — within typical range for quality feedstocks.'
                  : m3PerTonVS >= 0.15 ? 'is Fair — typical for high-fiber or lignocellulosic feedstocks.'
                  : 'is below typical ranges — review feedstock quality or experiment setup.'}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontFamily:'Space Mono', color:'var(--text3)', letterSpacing:'0.05em', marginBottom:4 }}>{label}</label>
      {hint && <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>{hint}</div>}
      {children}
    </div>
  )
}

function ResultRow({ label, value, formula, active }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:12, borderBottom:'1px solid rgba(46,51,64,0.5)' }}>
      <div>
        <div style={{ fontSize:12, color: active ? 'var(--text)' : 'var(--text3)' }}>{label}</div>
        {formula && <div style={{ fontSize:10, fontFamily:'Space Mono', color:'var(--text3)', marginTop:2 }}>{formula}</div>}
      </div>
      <div style={{ fontFamily:'Space Mono', fontSize:13, fontWeight:600, color: active ? 'var(--gold)' : 'var(--text3)', textAlign:'right', flexShrink:0, marginLeft:16 }}>
        {value}
      </div>
    </div>
  )
}

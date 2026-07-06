import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { PageHeader } from './Dashboard'
import { useAuth } from '../hooks/useAuth'
import { Row, Field, BtnPrimary, BtnOutline, Toast } from './Biomethane'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const MODULES = [
  { id: 'all',       label: 'All modules' },
  { id: 'bmp',       label: 'Biomethane / BMP',   col: 'bmp_samples' },
  { id: 'waterqual', label: 'Water quality',        col: 'water_quality' },
  { id: 'wastewater',label: 'Wastewater',           col: 'wastewater' },
  { id: 'soil',      label: 'Soil & fertilizer',   col: 'soil_samples' },
]

export default function Reports() {
  const { uid } = useAuth()
  const [module,   setModule]   = useState('all')
  const [format,   setFormat]   = useState('PDF')
  const [prepBy,   setPrepBy]   = useState('')
  const [samples,  setSamples]  = useState([])
  const [counts,   setCounts]   = useState({})
  const [loading,  setLoading]  = useState(true)
  const [genLoad,  setGenLoad]  = useState(false)
  const [toast,    setToast]    = useState('')

  useEffect(() => { loadCounts() }, [])

  async function loadCounts() {
    setLoading(true)
    const cols = ['bmp_samples', 'water_quality', 'wastewater', 'soil_samples']
    const snaps = await Promise.all(cols.map(c => getDocs(collection(db, c))))
    const c = {}
    cols.forEach((col, i) => { c[col] = snaps[i].size })
    setCounts(c)
    setLoading(false)
  }

  async function fetchData(colName) {
    const q = query(collection(db, colName), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.uid || d.uid === uid)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setGenLoad(true)

    let allData = []
    if (module === 'all') {
      const [bmp, wq, ww, soil] = await Promise.all([
        fetchData('bmp_samples'),
        fetchData('water_quality'),
        fetchData('wastewater'),
        fetchData('soil_samples'),
      ])
      allData = [
        ...bmp.map(r => ({ ...r, _module: 'BMP' })),
        ...wq.map(r =>  ({ ...r, _module: 'Water Quality' })),
        ...ww.map(r =>  ({ ...r, _module: 'Wastewater' })),
        ...soil.map(r => ({ ...r, _module: 'Soil' })),
      ]
    } else {
      const m = MODULES.find(m => m.id === module)
      allData = await fetchData(m.col)
    }

    if (allData.length === 0) {
      showToast('No data found for selected module.')
      setGenLoad(false)
      return
    }

    const title   = `Biogas Lab MIS — ${MODULES.find(m => m.id === module)?.label}`
    const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    const headers = Object.keys(allData[0]).filter(k => !['id', 'notes', 'createdAt'].includes(k))
    const rows    = allData.map(r => headers.map(h => r[h] ?? '—'))

    if (format === 'PDF') {
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(16)
      doc.setTextColor(40)
      doc.text('BIOGAS LAB MIS', 14, 16)
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(title, 14, 24)
      doc.text(`Generated: ${dateStr}${prepBy ? `   Prepared by: ${prepBy}` : ''}`, 14, 31)
      autoTable(doc, {
        head: [headers.map(h => h.toUpperCase())],
        body: rows,
        startY: 38,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [62, 207, 142], textColor: [13, 17, 23], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      })
      doc.save(`biogas-report-${module}-${Date.now()}.pdf`)
      showToast('PDF exported successfully!')

    } else if (format === 'Excel') {
      const wsData = [headers.map(h => h.toUpperCase()), ...rows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Report')
      XLSX.writeFile(wb, `biogas-report-${module}-${Date.now()}.xlsx`)
      showToast('Excel file exported successfully!')

    } else {
      // CSV
      const csvRows = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))]
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `biogas-report-${module}-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast('CSV exported successfully!')
    }

    setGenLoad(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Reports & export"
        sub="Generate and download lab reports across all modules."
        breadcrumb="Reports"
      />

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <KPI label="TOTAL SAMPLES"    value={loading ? '...' : total}                    color="var(--red)" />
        <KPI label="BMP SAMPLES"      value={loading ? '...' : counts['bmp_samples'] || 0}   color="#8b5cf6" />
        <KPI label="WATER SAMPLES"    value={loading ? '...' : (counts['water_quality'] || 0) + (counts['wastewater'] || 0)} color="#4a9eff" />
        <KPI label="SOIL SAMPLES"     value={loading ? '...' : counts['soil_samples'] || 0}  color="var(--red)" />
      </div>

      {/* Generate form */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 22, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Generate new report</div>
        <form onSubmit={handleGenerate}>
          <Row>
            <Field label="MODULE">
              <select value={module} onChange={e => setModule(e.target.value)}>
                {MODULES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="FORMAT">
              <select value={format} onChange={e => setFormat(e.target.value)}>
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="PREPARED BY">
              <input placeholder="e.g. Dr. Santos" value={prepBy} onChange={e => setPrepBy(e.target.value)} />
            </Field>
            <div />
          </Row>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <BtnPrimary type="submit" disabled={genLoad}>
              {genLoad ? 'Generating...' : `Generate & export ${format}`}
            </BtnPrimary>
          </div>
        </form>
      </div>

      {/* Summary table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Database summary</div>
        <table>
          <thead>
            <tr>
              <th>MODULE</th>
              <th>FIRESTORE COLLECTION</th>
              <th>SAMPLE COUNT</th>
              <th>QUICK EXPORT</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.filter(m => m.col).map(m => (
              <tr key={m.id}>
                <td style={{ color: 'var(--text)' }}>{m.label}</td>
                <td style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text3)' }}>{m.col}</td>
                <td style={{ fontFamily: 'Space Mono', color: 'var(--red)' }}>
                  {loading ? '...' : counts[m.col] || 0}
                </td>
                <td>
                  <button
                    onClick={() => { setModule(m.id); setFormat('CSV'); showToast(`Select format and click Generate`) }}
                    style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'Space Mono', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer' }}>
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast msg={toast} />
    </div>
  )
}

function KPI({ label, value, color, sub }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, fontFamily: 'Space Mono', color: 'var(--text3)', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'Space Mono', color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

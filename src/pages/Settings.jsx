import { useState, useEffect } from 'react'
import { PageHeader } from './Dashboard'
import { BtnPrimary, BtnOutline, Toast, Row, Field } from './Biomethane'

const FIXED_BASIS = {
  bmp: {
    ch4YieldGood:  250, ch4YieldExcellent: 350,
    ch4ContentGood: 50, ch4ContentExcellent: 60,
    vsMin: 50, vsGood: 70,
  },
  waterQuality: {
    phMin: 6.5, phMax: 8.5,
    doMin: 4,   doGood: 6,
    turbidityGood: 5, turbidityMax: 25,
  },
  wastewater: {
    phMin: 6.0, phMax: 9.0,       // DAO 2016-08 Table 9
    bodGood: 30, bodMax: 50,       // Class B=30, Class C=50 mg/L
    codGood: 60, codMax: 100,      // Class B=60, Class C=100 mg/L
    tssGood: 70, tssMax: 100,      // Class B=70, Class C=100 mg/L
    ammoniaNGood: 0.5, ammoniaNMax: 7.0, // Class B=0.5, Class C=7.0 mg/L
    colorMax: 150, oilGreaseMax: 5,
  },
  soil: {
    nMin: 1.0, nGood: 2.0,
    pMin: 0.5, pGood: 1.0,
    kMin: 0.8, kGood: 1.5,
    phMin: 5.5, phMax: 7.5,
    omMin: 2.0, omGood: 5.0,
  },
}

const STORAGE_KEY = 'biogas_mis_thresholds'

export function loadThresholds() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : FIXED_BASIS
  } catch { return FIXED_BASIS }
}

export function saveThresholds(t) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
}

export function resetThresholds() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function Settings() {
  const [basis,      setBasis]   = useState('fixed')
  const [thresholds, setT]       = useState(loadThresholds())
  const [toast,      setToast]   = useState('')
  const [section,    setSection] = useState('bmp')
  const [dirty,      setDirty]   = useState(false)   // track unsaved changes

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setBasis('custom')
  }, [])

  function handleSave() {
    saveThresholds(thresholds)
    setBasis('custom')
    setDirty(false)
    showToast('Custom thresholds saved! All future assessments will use these values.')
  }

  function handleReset() {
    resetThresholds()
    setT(FIXED_BASIS)
    setBasis('fixed')
    setDirty(false)
    showToast('Reset to standard laboratory thresholds.')
  }

  // Selecting "Fixed basis" card no longer auto-resets — user must click Reset button
  function handleSelectBasis(b) {
    setBasis(b)
  }

  function set(module, key) {
    return e => {
      setT(prev => ({
        ...prev,
        [module]: { ...prev[module], [key]: parseFloat(e.target.value) || 0 }
      }))
      setDirty(true)
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const sections = [
    { id: 'bmp',          label: 'Biomethane / BMP',   color: '#8b5cf6' },
    { id: 'waterQuality', label: 'Water quality',       color: '#4a9eff' },
    { id: 'wastewater',   label: 'Wastewater',          color: '#4a9eff' },
    { id: 'soil',         label: 'Soil & fertilizer',   color: 'var(--red)' },
  ]

  const t = thresholds

  return (
    <div style={{ padding: 32 }}>
      <PageHeader title="Assessment settings" sub="Choose fixed standard thresholds or set your own custom basis for quality assessment." breadcrumb="Settings" />

      {/* Basis selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <BasisCard
          active={basis === 'fixed'}
          title="Fixed basis"
          sub="Standard laboratory thresholds based on international biogas research standards."
          color="#4a9eff"
          onClick={() => handleSelectBasis('fixed')}
        />
        <BasisCard
          active={basis === 'custom'}
          title="Custom basis"
          sub="Set your own threshold values for each parameter. Ideal for lab-specific standards."
          color="#8b5cf6"
          onClick={() => handleSelectBasis('custom')}
        />
      </div>

      {/* Current basis info */}
      <div style={{ background: basis === 'fixed' ? 'rgba(74,158,255,0.06)' : 'rgba(139,92,246,0.06)', border: `1px solid ${basis === 'fixed' ? 'rgba(74,158,255,0.3)' : 'rgba(139,92,246,0.3)'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={basis === 'fixed' ? '#4a9eff' : '#8b5cf6'} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {basis === 'fixed'
          ? 'Currently using standard thresholds. Edit any field below and click Save to switch to custom.'
          : dirty
            ? '⚠ You have unsaved changes — click Save custom thresholds to apply them.'
            : 'Using your saved custom thresholds. Changes take effect on new samples saved after this point.'}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #2d3748' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '9px 18px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${section === s.id ? s.color : 'transparent'}`,
            color: section === s.id ? s.color : '#94a3b8', marginBottom: -1, transition: 'all 0.15s',
          }}>{s.label}</button>
        ))}
      </div>

      {/* BMP */}
      {section === 'bmp' && (
        <ThresholdCard title="Biomethane / BMP thresholds" color="#8b5cf6">
          <Row>
            <Field label="CH₄ YIELD — GOOD (mL/gVS)"><input type="number" value={t.bmp.ch4YieldGood} onChange={set('bmp','ch4YieldGood')} /></Field>
            <Field label="CH₄ YIELD — EXCELLENT (mL/gVS)"><input type="number" value={t.bmp.ch4YieldExcellent} onChange={set('bmp','ch4YieldExcellent')} /></Field>
          </Row>
          <Row>
            <Field label="CH₄ CONTENT — GOOD (%)"><input type="number" value={t.bmp.ch4ContentGood} onChange={set('bmp','ch4ContentGood')} /></Field>
            <Field label="CH₄ CONTENT — EXCELLENT (%)"><input type="number" value={t.bmp.ch4ContentExcellent} onChange={set('bmp','ch4ContentExcellent')} /></Field>
          </Row>
          <Row>
            <Field label="VOLATILE SOLIDS — MIN (%)"><input type="number" value={t.bmp.vsMin} onChange={set('bmp','vsMin')} /></Field>
            <Field label="VOLATILE SOLIDS — GOOD (%)"><input type="number" value={t.bmp.vsGood} onChange={set('bmp','vsGood')} /></Field>
          </Row>
        </ThresholdCard>
      )}

      {/* Water Quality */}
      {section === 'waterQuality' && (
        <ThresholdCard title="Water quality thresholds" color="#4a9eff">
          <Row>
            <Field label="pH MIN"><input type="number" step="0.1" value={t.waterQuality.phMin} onChange={set('waterQuality','phMin')} /></Field>
            <Field label="pH MAX"><input type="number" step="0.1" value={t.waterQuality.phMax} onChange={set('waterQuality','phMax')} /></Field>
          </Row>
          <Row>
            <Field label="DO MIN (mg/L)"><input type="number" step="0.1" value={t.waterQuality.doMin} onChange={set('waterQuality','doMin')} /></Field>
            <Field label="DO GOOD (mg/L)"><input type="number" step="0.1" value={t.waterQuality.doGood} onChange={set('waterQuality','doGood')} /></Field>
          </Row>
          <Row>
            <Field label="TURBIDITY GOOD (NTU)"><input type="number" step="0.1" value={t.waterQuality.turbidityGood} onChange={set('waterQuality','turbidityGood')} /></Field>
            <Field label="TURBIDITY MAX (NTU)"><input type="number" step="0.1" value={t.waterQuality.turbidityMax} onChange={set('waterQuality','turbidityMax')} /></Field>
          </Row>
        </ThresholdCard>
      )}

      {/* Wastewater */}
      {section === 'wastewater' && (
        <ThresholdCard title="Wastewater thresholds" color="#4a9eff">
          <Row>
            <Field label="pH MIN"><input type="number" step="0.1" value={t.wastewater.phMin} onChange={set('wastewater','phMin')} /></Field>
            <Field label="pH MAX"><input type="number" step="0.1" value={t.wastewater.phMax} onChange={set('wastewater','phMax')} /></Field>
          </Row>
          <Row>
            <Field label="BOD GOOD (mg/L)"><input type="number" value={t.wastewater.bodGood} onChange={set('wastewater','bodGood')} /></Field>
            <Field label="BOD MAX (mg/L)"><input type="number" value={t.wastewater.bodMax} onChange={set('wastewater','bodMax')} /></Field>
          </Row>
          <Row>
            <Field label="COD GOOD (mg/L)"><input type="number" value={t.wastewater.codGood} onChange={set('wastewater','codGood')} /></Field>
            <Field label="COD MAX (mg/L)"><input type="number" value={t.wastewater.codMax} onChange={set('wastewater','codMax')} /></Field>
          </Row>
          <Row>
            <Field label="TSS GOOD (mg/L)"><input type="number" value={t.wastewater.tssGood} onChange={set('wastewater','tssGood')} /></Field>
            <Field label="TSS MAX (mg/L)"><input type="number" value={t.wastewater.tssMax} onChange={set('wastewater','tssMax')} /></Field>
          </Row>
        </ThresholdCard>
      )}

      {/* Soil */}
      {section === 'soil' && (
        <ThresholdCard title="Soil & fertilizer thresholds" color="var(--red)">
          <Row>
            <Field label="NITROGEN MIN (%)"><input type="number" step="0.01" value={t.soil.nMin} onChange={set('soil','nMin')} /></Field>
            <Field label="NITROGEN GOOD (%)"><input type="number" step="0.01" value={t.soil.nGood} onChange={set('soil','nGood')} /></Field>
          </Row>
          <Row>
            <Field label="PHOSPHORUS MIN (%)"><input type="number" step="0.01" value={t.soil.pMin} onChange={set('soil','pMin')} /></Field>
            <Field label="PHOSPHORUS GOOD (%)"><input type="number" step="0.01" value={t.soil.pGood} onChange={set('soil','pGood')} /></Field>
          </Row>
          <Row>
            <Field label="POTASSIUM MIN (%)"><input type="number" step="0.01" value={t.soil.kMin} onChange={set('soil','kMin')} /></Field>
            <Field label="POTASSIUM GOOD (%)"><input type="number" step="0.01" value={t.soil.kGood} onChange={set('soil','kGood')} /></Field>
          </Row>
          <Row>
            <Field label="pH MIN"><input type="number" step="0.1" value={t.soil.phMin} onChange={set('soil','phMin')} /></Field>
            <Field label="pH MAX"><input type="number" step="0.1" value={t.soil.phMax} onChange={set('soil','phMax')} /></Field>
          </Row>
          <Row>
            <Field label="ORGANIC MATTER MIN (%)"><input type="number" step="0.01" value={t.soil.omMin} onChange={set('soil','omMin')} /></Field>
            <Field label="ORGANIC MATTER GOOD (%)"><input type="number" step="0.01" value={t.soil.omGood} onChange={set('soil','omGood')} /></Field>
          </Row>
        </ThresholdCard>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <BtnPrimary onClick={handleSave}>
          {dirty ? '⚠ Save custom thresholds' : 'Save custom thresholds'}
        </BtnPrimary>
        <BtnOutline onClick={handleReset}>Reset to fixed basis</BtnOutline>
      </div>

      <Toast msg={toast} />
    </div>
  )
}

function BasisCard({ active, title, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', background: active ? `${color}10` : 'var(--bg2)', border: `1px solid ${active ? color : 'var(--border)'}`, borderRadius: 12, padding: 20, transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: active ? color : '#4a5568', border: `2px solid ${active ? color : '#4a5568'}` }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: active ? color : 'var(--text)' }}>{title}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{sub}</p>
    </div>
  )
}

function ThresholdCard({ title, color, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 22 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  )
}

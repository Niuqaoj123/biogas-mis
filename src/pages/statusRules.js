// ─────────────────────────────────────────────────────────────────
//  BIOGAS MIS — Quality / Status Assessment Rules
//  Water & Wastewater based on: DENR DAO 2016-08
//  (Water Quality Guidelines and General Effluent Standards)
//  Reference: https://emb.gov.ph — DAO 2016-08, Table 9 GES
// ─────────────────────────────────────────────────────────────────

function getT() {
  try {
    const saved = localStorage.getItem('biogas_mis_thresholds')
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULTS
}

// ── Default thresholds ────────────────────────────────────────────
export const DEFAULTS = {
  bmp: {
    ch4YieldGood: 250, ch4YieldExcellent: 350,
    ch4ContentGood: 50, ch4ContentExcellent: 60,
    vsMin: 50, vsGood: 70,
  },

  // DAO 2016-08 Water Quality Guidelines — Class A freshwater (recreational/fisheries)
  waterQuality: {
    phMin: 6.5, phMax: 8.5,    // WQG Class A: 6.5–8.5
    doMin: 5.0, doGood: 7.0,   // WQG Class A: ≥5 mg/L min, ≥7 good
    turbidityGood: 5, turbidityMax: 50,  // NTU — Class A threshold
    tempMax: 30,               // °C — ambient ±3°C per DAO 2016-08
    conductivityMax: 500,      // µS/cm — typical freshwater standard
  },

  // DAO 2016-08 Table 9 General Effluent Standards — Class C receiving water body
  // (most common classification for industrial/agricultural discharge in PH)
  wastewater: {
    phMin: 6.0,   phMax: 9.0,   // DAO 2016-08 Table 9: 6.0–9.0
    bodMax: 50,   bodGood: 30,   // DAO 2016-08: Class C = 50 mg/L; Class B = 30 mg/L
    codMax: 100,  codGood: 60,   // DAO 2016-08: Class C = 100 mg/L; Class B = 60 mg/L
    tssMax: 100,  tssGood: 70,   // DAO 2016-08: Class C = 100 mg/L; Class B = 70 mg/L
    ammoniaNMax: 7.0, ammoniaNGood: 0.5, // DAO 2016-08: Class B = 0.5, Class C = 7.0 mg/L
    colorMax: 150,               // DAO 2016-08: 150 TCU for Class C
    oilGreaseMax: 5,             // DAO 2016-08: 5 mg/L
  },

  soil: {
    nMin: 1.0, nGood: 2.0,
    pMin: 0.5, pGood: 1.0,
    kMin: 0.8, kGood: 1.5,
    phMin: 5.5, phMax: 7.5,
    omMin: 2.0, omGood: 5.0,
  },
}

// ── BMP assessment ────────────────────────────────────────────────
export function assessBMP({ ch4Yield, ch4Content, volatileSolids }) {
  const t = getT().bmp
  const y = parseFloat(ch4Yield), c = parseFloat(ch4Content), vs = parseFloat(volatileSolids)
  const issues = []
  let score = 0

  if (!isNaN(y)) {
    if (y >= t.ch4YieldExcellent)         { score += 3 }
    else if (y >= t.ch4YieldGood)          { score += 2 }
    else if (y >= t.ch4YieldGood * 0.6)   { score += 1 }
    else { issues.push(`CH₄ yield ${y} mL/gVS — below minimum viable threshold`) }
  }
  if (!isNaN(c)) {
    if (c >= t.ch4ContentExcellent)        { score += 3 }
    else if (c >= t.ch4ContentGood)        { score += 2 }
    else if (c >= t.ch4ContentGood - 10)   { score += 1 }
    else { issues.push(`CH₄ content ${c}% — below acceptable gas quality level`) }
  }
  if (!isNaN(vs)) {
    if (vs >= t.vsGood)    { score += 2 }
    else if (vs >= t.vsMin){ score += 1 }
    else { issues.push(`Volatile solids ${vs}% — below minimum (${t.vsMin}%)`) }
  }

  return grade(score, 8, issues)
}

// ── Water Quality — DAO 2016-08 WQG ──────────────────────────────
export function assessWaterQuality({ pH, dissolvedO2, turbidity, temp }) {
  const t = getT().waterQuality
  const ph = parseFloat(pH), do_ = parseFloat(dissolvedO2)
  const ntu = parseFloat(turbidity), tmp = parseFloat(temp)
  const issues = []
  let score = 0

  if (!isNaN(ph)) {
    if (ph >= t.phMin && ph <= t.phMax)                  { score += 3 }
    else if (ph >= t.phMin - 0.5 && ph <= t.phMax + 0.5) { score += 1; issues.push(`pH ${ph} — slightly outside DAO 2016-08 Class A range (${t.phMin}–${t.phMax})`) }
    else { issues.push(`pH ${ph} — outside DAO 2016-08 acceptable range (${t.phMin}–${t.phMax})`) }
  }
  if (!isNaN(do_)) {
    if (do_ >= t.doGood)      { score += 2 }
    else if (do_ >= t.doMin)  { score += 1; issues.push(`DO ${do_} mg/L — below DAO 2016-08 Class A optimal (≥${t.doGood} mg/L)`) }
    else { issues.push(`DO ${do_} mg/L — critically low, below DAO 2016-08 minimum (${t.doMin} mg/L)`) }
  }
  if (!isNaN(ntu)) {
    if (ntu <= t.turbidityGood)      { score += 2 }
    else if (ntu <= t.turbidityMax)  { score += 1; issues.push(`Turbidity ${ntu} NTU — elevated (ideal ≤${t.turbidityGood} NTU per WQG)`) }
    else { issues.push(`Turbidity ${ntu} NTU — exceeds DAO 2016-08 limit (${t.turbidityMax} NTU)`) }
  }
  if (!isNaN(tmp) && tmp > t.tempMax) {
    issues.push(`Temperature ${tmp}°C — exceeds DAO 2016-08 ambient threshold (${t.tempMax}°C)`)
  }

  return grade(score, 7, issues)
}

// ── Wastewater — DAO 2016-08 Table 9 GES ─────────────────────────
export function assessWastewater({ pH, BOD, COD, TSS, ammoniaN, color, oilGrease }) {
  const t = getT().wastewater
  const ph=parseFloat(pH), bod=parseFloat(BOD), cod=parseFloat(COD)
  const tss=parseFloat(TSS), nh3=parseFloat(ammoniaN)
  const clr=parseFloat(color), og=parseFloat(oilGrease)
  const issues = []
  let score = 0, maxScore = 0

  // pH — DAO 2016-08 Table 9: 6.0–9.0
  if (!isNaN(ph)) {
    maxScore += 2
    if (ph >= t.phMin && ph <= t.phMax) { score += 2 }
    else { issues.push(`pH ${ph} — outside DAO 2016-08 GES discharge standard (${t.phMin}–${t.phMax})`) }
  }

  // BOD — DAO 2016-08 Class C = 50 mg/L
  if (!isNaN(bod)) {
    maxScore += 3
    if (bod <= t.bodGood)      { score += 3 }
    else if (bod <= t.bodMax)  { score += 1; issues.push(`BOD ${bod} mg/L — exceeds Class B standard (${t.bodGood} mg/L); within Class C limit (${t.bodMax} mg/L)`) }
    else { issues.push(`BOD ${bod} mg/L — exceeds DAO 2016-08 Class C GES limit (${t.bodMax} mg/L)`) }
  }

  // COD — DAO 2016-08 Class C = 100 mg/L
  if (!isNaN(cod)) {
    maxScore += 3
    if (cod <= t.codGood)      { score += 3 }
    else if (cod <= t.codMax)  { score += 1; issues.push(`COD ${cod} mg/L — exceeds Class B standard (${t.codGood} mg/L); within Class C limit (${t.codMax} mg/L)`) }
    else { issues.push(`COD ${cod} mg/L — exceeds DAO 2016-08 Class C GES limit (${t.codMax} mg/L)`) }
  }

  // TSS — DAO 2016-08 Class C = 100 mg/L
  if (!isNaN(tss)) {
    maxScore += 2
    if (tss <= t.tssGood)      { score += 2 }
    else if (tss <= t.tssMax)  { score += 1; issues.push(`TSS ${tss} mg/L — exceeds Class B standard (${t.tssGood} mg/L); within Class C limit (${t.tssMax} mg/L)`) }
    else { issues.push(`TSS ${tss} mg/L — exceeds DAO 2016-08 Class C GES limit (${t.tssMax} mg/L)`) }
  }

  // Ammonia-N — DAO 2016-08 Class B = 0.5 mg/L, Class C = 7.0 mg/L
  if (!isNaN(nh3)) {
    maxScore += 2
    if (nh3 <= t.ammoniaNGood)  { score += 2 }
    else if (nh3 <= t.ammoniaNMax) { score += 1; issues.push(`Ammonia-N ${nh3} mg/L — exceeds Class B standard (${t.ammoniaNGood} mg/L); within Class C limit (${t.ammoniaNMax} mg/L)`) }
    else { issues.push(`Ammonia-N ${nh3} mg/L — exceeds DAO 2016-08 Class C GES limit (${t.ammoniaNMax} mg/L)`) }
  }

  // Color — DAO 2016-08 Class C = 150 TCU
  if (!isNaN(clr) && clr > t.colorMax) {
    issues.push(`Color ${clr} TCU — exceeds DAO 2016-08 Class C limit (${t.colorMax} TCU)`)
  }

  // Oil & Grease — DAO 2016-08 = 5 mg/L
  if (!isNaN(og) && og > t.oilGreaseMax) {
    issues.push(`Oil & Grease ${og} mg/L — exceeds DAO 2016-08 GES limit (${t.oilGreaseMax} mg/L)`)
  }

  if (maxScore === 0) return { status: 'Pending', rating: 'Enter values to assess', color: '#9A9490', issues: [] }
  return grade(score, maxScore, issues)
}

// ── Soil assessment ───────────────────────────────────────────────
export function assessSoil({ nitrogen, phosphorus, potassium, soilPH, organicMatter }) {
  const t = getT().soil
  const n=parseFloat(nitrogen), p=parseFloat(phosphorus), k=parseFloat(potassium)
  const ph=parseFloat(soilPH), om=parseFloat(organicMatter)
  const issues = []
  let score = 0

  if (!isNaN(n)) {
    if (n >= t.nGood)      { score += 3 }
    else if (n >= t.nMin)  { score += 1; issues.push(`N ${n}% — low nitrogen (target ≥${t.nGood}%)`) }
    else { issues.push(`N ${n}% — very low nitrogen (<${t.nMin}%) — not suitable as fertilizer`) }
  }
  if (!isNaN(p)) {
    if (p >= t.pGood)      { score += 2 }
    else if (p >= t.pMin)  { score += 1; issues.push(`P ${p}% — low phosphorus (target ≥${t.pGood}%)`) }
    else { issues.push(`P ${p}% — very low phosphorus (<${t.pMin}%)`) }
  }
  if (!isNaN(k)) {
    if (k >= t.kGood)      { score += 2 }
    else if (k >= t.kMin)  { score += 1; issues.push(`K ${k}% — low potassium (target ≥${t.kGood}%)`) }
    else { issues.push(`K ${k}% — very low potassium (<${t.kMin}%)`) }
  }
  if (!isNaN(ph)) {
    if (ph >= t.phMin && ph <= t.phMax)                   { score += 2 }
    else if (ph >= t.phMin - 0.5 && ph <= t.phMax + 0.5)  { score += 1; issues.push(`pH ${ph} — slightly outside optimal crop range (${t.phMin}–${t.phMax})`) }
    else { issues.push(`pH ${ph} — outside acceptable crop pH range`) }
  }
  if (!isNaN(om)) {
    if (om >= t.omGood)   { score += 1 }
    else if (om < t.omMin){ issues.push(`Organic matter ${om}% — very low (<${t.omMin}%)`) }
  }

  return grade(score, 10, issues, true)
}

// ── Shared grader ─────────────────────────────────────────────────
function grade(score, max, issues, isSoil = false) {
  const pct = (score / max) * 100
  if (isSoil) {
    if (pct >= 75) return { status:'Pass',   rating:'Excellent — suitable as biofertilizer', color:'#3A9E68', issues }
    if (pct >= 50) return { status:'Pass',   rating:'Good — suitable with minor amendments', color:'#3A9E68', issues }
    if (pct >= 30) return { status:'Review', rating:'Fair — needs improvement',              color:'#D4A017', issues }
    return          { status:'Fail',   rating:'Poor — not suitable as fertilizer',           color:'#C0392B', issues }
  }
  if (pct >= 75) return { status:'Pass',   rating:'Compliant',        color:'#3A9E68', issues }
  if (pct >= 50) return { status:'Pass',   rating:'Meets standard',   color:'#3A9E68', issues }
  if (pct >= 30) return { status:'Review', rating:'Marginal',         color:'#D4A017', issues }
  return          { status:'Fail',   rating:'Non-compliant',    color:'#C0392B', issues }
}

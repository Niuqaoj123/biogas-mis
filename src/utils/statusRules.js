const STORAGE_KEY = 'biogas_mis_thresholds'
export const FIXED_BASIS = {
  bmp: { ch4YieldGood:250, ch4YieldExcellent:350, ch4ContentGood:50, ch4ContentExcellent:60, vsMin:50, vsGood:70 },
  waterQuality: { phMin:6.5, phMax:8.5, doMin:4, doGood:6, turbidityGood:5, turbidityMax:25 },
  wastewater: { bodGood:30, bodMax:50, codGood:100, codMax:200, tssGood:50, tssMax:100, phMin:6.0, phMax:9.0 },
  soil: { nMin:1.0, nGood:2.0, pMin:0.5, pGood:1.0, kMin:0.8, kGood:1.5, phMin:5.5, phMax:7.5, omMin:2.0, omGood:5.0 },
  qc: { blankMax:20, positiveMin:80, positiveMax:120, replicateCV:10 }
}
export function getThresholds() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? { ...FIXED_BASIS, ...JSON.parse(s) } : FIXED_BASIS } catch { return FIXED_BASIS }
}
export function saveThresholds(t) { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)) }
export function resetThresholds() { localStorage.removeItem(STORAGE_KEY) }
export function calcCV(values) {
  const nums = values.map(parseFloat).filter(v => !isNaN(v))
  if (nums.length < 2) return null
  const mean = nums.reduce((a,b)=>a+b,0)/nums.length
  const sd = Math.sqrt(nums.reduce((a,b)=>a+Math.pow(b-mean,2),0)/(nums.length-1))
  return mean===0?0:(sd/mean)*100
}
export function assessBMP({ ch4Yield, ch4Content, volatileSolids }) {
  const t=getThresholds().bmp; const y=parseFloat(ch4Yield),c=parseFloat(ch4Content),vs=parseFloat(volatileSolids)
  const issues=[]; let score=0
  if(!isNaN(y)){if(y>=t.ch4YieldExcellent)score+=3;else if(y>=t.ch4YieldGood)score+=2;else if(y>=t.ch4YieldGood*.6)score+=1;else issues.push(`CH₄ yield ${y} mL/gVS — below minimum`)}
  if(!isNaN(c)){if(c>=t.ch4ContentExcellent)score+=3;else if(c>=t.ch4ContentGood)score+=2;else if(c>=t.ch4ContentGood-10)score+=1;else issues.push(`CH₄ content ${c}% — below acceptable`)}
  if(!isNaN(vs)){if(vs>=t.vsGood)score+=2;else if(vs>=t.vsMin)score+=1;else issues.push(`Volatile solids ${vs}% — below minimum`)}
  const pct=(score/8)*100
  if(pct>=75)return{status:'Pass',rating:'Excellent',color:'#3ecf8e',issues}
  if(pct>=50)return{status:'Pass',rating:'Good',color:'#3ecf8e',issues}
  if(pct>=30)return{status:'Review',rating:'Fair',color:'#f59e0b',issues}
  return{status:'Fail',rating:'Poor',color:'#ef4444',issues}
}
export function assessWaterQuality({ pH, dissolvedO2, turbidity }) {
  const t=getThresholds().waterQuality; const ph=parseFloat(pH),do_=parseFloat(dissolvedO2),ntu=parseFloat(turbidity)
  const issues=[]; let score=0
  if(!isNaN(ph)){if(ph>=t.phMin&&ph<=t.phMax)score+=3;else if(ph>=t.phMin-.5&&ph<=t.phMax+.5){score+=1;issues.push(`pH ${ph} — slightly outside range`)}else issues.push(`pH ${ph} — outside safe range`)}
  if(!isNaN(do_)){if(do_>=t.doGood)score+=2;else if(do_>=t.doMin){score+=1;issues.push(`DO ${do_} mg/L — below optimal`)}else issues.push(`DO ${do_} mg/L — critically low`)}
  if(!isNaN(ntu)){if(ntu<=t.turbidityGood)score+=2;else if(ntu<=t.turbidityMax){score+=1;issues.push(`Turbidity ${ntu} NTU — moderate`)}else issues.push(`Turbidity ${ntu} NTU — high`)}
  const pct=(score/7)*100
  if(pct>=75)return{status:'Pass',rating:'Excellent',color:'#3ecf8e',issues}
  if(pct>=50)return{status:'Pass',rating:'Good',color:'#3ecf8e',issues}
  if(pct>=30)return{status:'Review',rating:'Fair',color:'#f59e0b',issues}
  return{status:'Fail',rating:'Poor',color:'#ef4444',issues}
}
export function assessWastewater({ pH, BOD, COD, TSS }) {
  const t=getThresholds().wastewater; const ph=parseFloat(pH),bod=parseFloat(BOD),cod=parseFloat(COD),tss=parseFloat(TSS)
  const issues=[]; let score=0
  if(!isNaN(ph)){if(ph>=t.phMin&&ph<=t.phMax)score+=2;else issues.push(`pH outside range`)}
  if(!isNaN(bod)){if(bod<=t.bodGood)score+=3;else if(bod<=t.bodMax){score+=1;issues.push(`BOD ${bod} above standard`)}else issues.push(`BOD high`)}
  if(!isNaN(cod)){if(cod<=t.codGood)score+=3;else if(cod<=t.codMax){score+=1;issues.push(`COD ${cod} above standard`)}else issues.push(`COD high`)}
  if(!isNaN(tss)){if(tss<=t.tssGood)score+=2;else if(tss<=t.tssMax){score+=1;issues.push(`TSS ${tss} above standard`)}else issues.push(`TSS high`)}
  const pct=(score/10)*100
  if(pct>=75)return{status:'Pass',rating:'Excellent',color:'#3ecf8e',issues}
  if(pct>=50)return{status:'Pass',rating:'Good',color:'#3ecf8e',issues}
  if(pct>=30)return{status:'Review',rating:'Fair',color:'#f59e0b',issues}
  return{status:'Fail',rating:'Poor',color:'#ef4444',issues}
}
export function assessSoil({ nitrogen, phosphorus, potassium, soilPH, organicMatter }) {
  const t=getThresholds().soil; const n=parseFloat(nitrogen),p=parseFloat(phosphorus),k=parseFloat(potassium),ph=parseFloat(soilPH),om=parseFloat(organicMatter)
  const issues=[]; let score=0
  if(!isNaN(n)){if(n>=t.nGood)score+=3;else if(n>=t.nMin){score+=1;issues.push(`N ${n}% — low`)}else issues.push(`N very low`)}
  if(!isNaN(p)){if(p>=t.pGood)score+=2;else if(p>=t.pMin){score+=1;issues.push(`P ${p}% — low`)}else issues.push(`P very low`)}
  if(!isNaN(k)){if(k>=t.kGood)score+=2;else if(k>=t.kMin){score+=1;issues.push(`K ${k}% — low`)}else issues.push(`K very low`)}
  if(!isNaN(ph)){if(ph>=t.phMin&&ph<=t.phMax)score+=2;else if(ph>=t.phMin-.5&&ph<=t.phMax+.5){score+=1;issues.push(`pH slightly outside`)}else issues.push(`pH outside crop range`)}
  if(!isNaN(om)){if(om>=t.omGood)score+=1;else if(om<t.omMin)issues.push(`Organic matter very low`)}
  const pct=(score/10)*100
  if(pct>=75)return{status:'Pass',rating:'Excellent — suitable as biofertilizer',color:'#3ecf8e',issues}
  if(pct>=50)return{status:'Pass',rating:'Good — suitable with minor amendments',color:'#3ecf8e',issues}
  if(pct>=30)return{status:'Review',rating:'Fair — needs improvement',color:'#f59e0b',issues}
  return{status:'Fail',rating:'Poor — not suitable',color:'#ef4444',issues}
}
export function assessQC({ blankCH4, positiveRecovery, replicateCV }) {
  const t=getThresholds().qc; const flags=[]
  if(blankCH4!==undefined&&parseFloat(blankCH4)>t.blankMax)flags.push(`Blank CH₄ ${blankCH4} NmL — exceeds max (${t.blankMax})`)
  if(positiveRecovery!==undefined){const r=parseFloat(positiveRecovery);if(r<t.positiveMin||r>t.positiveMax)flags.push(`Positive control recovery ${r}% — outside range`)}
  if(replicateCV!==undefined&&parseFloat(replicateCV)>t.replicateCV)flags.push(`Replicate CV ${replicateCV}% — exceeds max (${t.replicateCV}%)`)
  return{pass:flags.length===0,flags}
}

import { useState } from 'react'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import DeleteModal from './DeleteModal'

export default function SampleTable({ samples, columns, collection, onDeleted }) {
  const [toDelete,      setToDelete]   = useState(null)
  const [expandedIssues,setExpanded]   = useState(null)
  const [editing,       setEditing]    = useState(null)   // { id, ...fields }
  const [saving,        setSaving]     = useState(false)

  async function handleConfirmDelete() {
    await deleteDoc(doc(db, collection, toDelete.id))
    onDeleted(toDelete.id)
    setToDelete(null)
  }

  async function handleSaveEdit() {
    if (!editing) return
    setSaving(true)
    const { id, ...fields } = editing
    await updateDoc(doc(db, collection, id), fields)
    setSaving(false)
    setEditing(null)
  }

  if (samples.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)', fontSize:13 }}>
        No records yet. Add a sample using the form above.
      </div>
    )
  }

  return (
    <>
      <div style={{ overflowX:'auto' }}>
        <table>
          <thead>
            <tr>
              {columns.map(c => <th key={c.key}>{c.label}</th>)}
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {samples.map(row => (
              <>
                {/* ── View row ── */}
                <tr key={row.id}>
                  {columns.map(c => (
                    <td key={c.key} style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {row[c.key] ?? '—'}
                    </td>
                  ))}
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <StatusBadge status={row.status} />
                      {row.issues && row.issues.length > 0 && (
                        <button onClick={() => setExpanded(expandedIssues === row.id ? null : row.id)}
                          title="View issues"
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#f59e0b', fontSize:13, padding:0 }}>
                          ⚠
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button
                        onClick={() => setEditing({ id: row.id, ...row })}
                        style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontFamily:'Space Mono', background:'transparent', border:'1px solid rgba(74,158,255,0.3)', color:'#4a9eff', cursor:'pointer', transition:'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(74,158,255,0.1)'; e.currentTarget.style.borderColor='#4a9eff' }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(74,158,255,0.3)' }}>
                        Edit
                      </button>
                      <button
                        onClick={() => setToDelete({ id: row.id, sampleId: row.sampleId })}
                        style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontFamily:'Space Mono', background:'transparent', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', cursor:'pointer', transition:'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor='#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>

                {/* ── Inline edit row ── */}
                {editing?.id === row.id && (
                  <tr key={`${row.id}-edit`}>
                    <td colSpan={columns.length + 2} style={{ background:'rgba(74,158,255,0.04)', borderLeft:'3px solid #4a9eff', padding:'16px' }}>
                      <div style={{ fontSize:11, fontFamily:'Space Mono', color:'#4a9eff', marginBottom:12 }}>EDITING RECORD</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12, marginBottom:14 }}>
                        {columns.map(c => (
                          <div key={c.key} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            <label style={{ fontSize:10, fontFamily:'Space Mono', color:'var(--text3)' }}>{c.label}</label>
                            <input
                              value={editing[c.key] ?? ''}
                              onChange={e => setEditing(prev => ({ ...prev, [c.key]: e.target.value }))}
                              style={{ padding:'7px 10px', borderRadius:6, fontSize:12, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text)' }}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={handleSaveEdit} disabled={saving}
                          style={{ padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:500, background:'#4a9eff', border:'none', color:'#0d1117', cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
                          {saving ? 'Saving...' : 'Save changes'}
                        </button>
                        <button onClick={() => setEditing(null)}
                          style={{ padding:'8px 16px', borderRadius:7, fontSize:12, background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* ── Issues row ── */}
                {expandedIssues === row.id && row.issues && row.issues.length > 0 && (
                  <tr key={`${row.id}-issues`}>
                    <td colSpan={columns.length + 2} style={{ background:'rgba(245,158,11,0.06)', borderLeft:'3px solid #f59e0b', padding:'10px 16px' }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#f59e0b', marginBottom:6, fontFamily:'Space Mono' }}>ASSESSMENT ISSUES</div>
                      {row.issues.map((iss, i) => (
                        <div key={i} style={{ fontSize:12, color:'#94a3b8', marginBottom:4, display:'flex', gap:8 }}>
                          <span style={{ color:'#f59e0b' }}>•</span>{iss}
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {toDelete && (
        <DeleteModal sampleId={toDelete.sampleId} onConfirm={handleConfirmDelete} onCancel={() => setToDelete(null)} />
      )}
    </>
  )
}

function StatusBadge({ status }) {
  const map = {
    Pass:   { bg:'rgba(192,57,43,0.1)',  color:'var(--red)', border:'rgba(192,57,43,0.3)' },
    Fail:   { bg:'rgba(239,68,68,0.1)',   color:'#ef4444', border:'rgba(239,68,68,0.3)' },
    Review: { bg:'rgba(245,158,11,0.1)',  color:'#f59e0b', border:'rgba(245,158,11,0.3)' },
    Pending:{ bg:'rgba(148,163,184,0.1)', color:'#94a3b8', border:'rgba(148,163,184,0.3)' },
  }
  const s = map[status] || map.Pending
  return (
    <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontFamily:'Space Mono', background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {status || 'Pending'}
    </span>
  )
}

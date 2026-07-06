export default function DeleteModal({ sampleId, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 32, width: 360, textAlign: 'center',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Delete sample?</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, lineHeight: 1.6 }}>
          You are about to permanently delete
        </p>
        <p style={{ fontFamily: 'Space Mono', fontSize: 13, color: 'var(--red)', marginBottom: 24 }}>{sampleId}</p>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24 }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'var(--red)', border: 'none', color: '#fff', cursor: 'pointer',
          }}>Yes, delete</button>
        </div>
      </div>
    </div>
  )
}

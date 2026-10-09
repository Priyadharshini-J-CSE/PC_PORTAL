export default function ImportResult({ result, onClose }) {
  if (!result) return null;
  return (
    <div className="box" style={{ marginTop: 16, borderColor: result.rejected > 0 ? 'var(--warn)' : 'var(--ok)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>{result.message}</b>
        <button className="s" onClick={onClose} style={{ padding: '4px 10px' }}>✕</button>
      </div>
      {result.rejectedRows?.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--err)' }}>
            {result.rejectedRows.length} rejected rows
          </summary>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: '0.85rem' }}>
            {result.rejectedRows.map((r, i) => (
              <li key={i}><b>{r.row}</b>: {r.reason}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

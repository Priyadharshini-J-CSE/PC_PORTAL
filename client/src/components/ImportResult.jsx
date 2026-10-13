import Icon from './Icon';

export default function ImportResult({ result, onClose }) {
  if (!result) return null;

  const isError = result.type === 'error';

  return (
    <div className="box" style={{ marginTop: 16, borderLeft: `4px solid ${isError ? 'var(--err, #ef4444)' : result.rejected > 0 ? 'var(--warn, #f59e0b)' : 'var(--ok, #22c55e)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          {isError ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon name="triangle-exclamation" style={{ color: 'var(--err, #ef4444)' }} />
                <b style={{ color: 'var(--err, #ef4444)' }}>{result.error}</b>
              </div>

              {result.detail && (
                <p style={{ margin: '4px 0', fontSize: '.875rem', color: 'var(--t2)' }}>
                  <b>What was found:</b> {result.detail}
                </p>
              )}

              {result.hint && (
                <p style={{ margin: '4px 0', fontSize: '.875rem' }}>
                  <Icon name="info" style={{ marginRight: 6, color: 'var(--o)' }} />{result.hint}
                </p>
              )}

              {(result.expectedData1 || result.expectedData2) && (
                <div style={{ marginTop: 10, fontSize: '.82rem', background: 'var(--bg)', borderRadius: 6, padding: '10px 14px' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Expected column formats:</p>
                  {result.expectedData1 && (
                    <p style={{ margin: '2px 0', color: 'var(--t2)' }}>
                      <b style={{ color: 'var(--t1)' }}>Data 1:</b> {result.expectedData1}
                    </p>
                  )}
                  {result.expectedData2 && (
                    <p style={{ margin: '2px 0', color: 'var(--t2)' }}>
                      <b style={{ color: 'var(--t1)' }}>Data 2:</b> {result.expectedData2}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: result.rejectedRows?.length ? 6 : 0 }}>
                <Icon name="circle-check" style={{ color: result.rejected > 0 ? 'var(--warn, #f59e0b)' : 'var(--ok, #22c55e)' }} />
                <b>{result.message}</b>
              </div>

              {result.rejectedRows?.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--err, #ef4444)', fontSize: '.875rem' }}>
                    <Icon name="triangle-exclamation" style={{ marginRight: 6 }} />
                    {result.rejectedRows.length} row{result.rejectedRows.length > 1 ? 's' : ''} rejected — click to see details
                  </summary>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: '0.82rem', lineHeight: 1.8 }}>
                    {result.rejectedRows.map((r, i) => (
                      <li key={i}><b>{r.row}</b>: {r.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
        <button className="s" onClick={onClose} style={{ padding: '4px 10px', flexShrink: 0 }}>
          <Icon name="xmark" />
        </button>
      </div>
    </div>
  );
}

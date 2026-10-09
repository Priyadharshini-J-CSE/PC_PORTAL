import { useEffect, useState } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function FacultyInterviews() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    api.get('/api/interviews', { params: { company: search, result: filterResult, page, limit: LIMIT } })
      .then((r) => { setRecords(r.data.records); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filterResult, page]);

  return (
    <>
      <div className="top"><div><small>Faculty Portal</small><h1>Post-Interview Inquiry</h1></div></div>
      <span className="tag">👁 View only</span>

      <div className="row" style={{ marginTop: 12 }}>
        <input placeholder="Filter by company..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 260 }} />
        <select value={filterResult} onChange={(e) => { setFilterResult(e.target.value); setPage(1); }} style={{ maxWidth: 200 }}>
          <option value="">All results</option>
          <option value="Placed">Placed</option>
          <option value="Not Placed">Not Placed</option>
          <option value="Result Awaited">Result Awaited</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <p><b>{total}</b> submissions</p>
          <div className="tw">
            <table>
              <thead>
                <tr><th>Reg No.</th><th>Name</th><th>Company</th><th>Role</th><th>Result</th><th>Rounds</th><th></th></tr>
              </thead>
              <tbody>
                {records.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--t2)' }}>No submissions yet</td></tr>}
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>{r.registerNo}</td><td>{r.studentName || '—'}</td>
                    <td>{r.companyName}</td><td>{r.jobRole || '—'}</td>
                    <td><span className={`tag ${r.finalResult === 'Placed' ? 'ok' : r.finalResult === 'Not Placed' ? 'err' : ''}`}>{r.finalResult}</span></td>
                    <td>{r.rounds?.length ?? 0}</td>
                    <td><button className="s" style={{ padding: '4px 10px' }} onClick={() => setSelected(r)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="s" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>Page {page} of {Math.ceil(total / LIMIT) || 1}</span>
            <button className="s" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="box" style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <b>{selected.companyName} — {selected.registerNo}</b>
              <button className="s" onClick={() => setSelected(null)}>✕</button>
            </div>
            <p style={{ margin: '4px 0' }}>
              <span className={`tag ${selected.finalResult === 'Placed' ? 'ok' : 'err'}`}>{selected.finalResult}</span>
              {selected.jobRole && <> · {selected.jobRole}</>}
            </p>
            {selected.rounds?.map((r, i) => (
              <div key={i} className="round f" style={{ marginTop: 12 }}>
                <b>Round {i + 1}{r.roundName ? ` — ${r.roundName}` : ''}</b>
                {r.questions?.length > 0 && <ol style={{ margin: '6px 0 6px 18px', padding: 0 }}>{r.questions.map((q, j) => <li key={j}>{q}</li>)}</ol>}
                {r.experience && <div><b>Experience:</b> {r.experience}</div>}
              </div>
            ))}
            {selected.overallExperience && <div style={{ marginTop: 12 }}><b>Overall:</b> {selected.overallExperience}</div>}
          </div>
        </div>
      )}
    </>
  );
}

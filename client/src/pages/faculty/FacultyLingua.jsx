import { useEffect, useState } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';

export default function FacultyLingua() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/api/lingua', { params: { search } })
      .then((r) => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const paid = records.filter((r) => r.paid === 'Yes');
  const done = records.filter((r) => r.examStatus === 'Completed');
  const paidNotDone = paid.filter((r) => r.examStatus !== 'Completed');

  return (
    <>
      <div className="top"><div><small>Faculty Portal</small><h1>Lingua Skills</h1></div></div>
      <span className="tag">👁 View only</span>

      <div className="stats" style={{ marginTop: 16 }}>
        <StatCard icon="✅" value={done.length} label="Total completed" />
        <StatCard icon="₹" value={paid.length} label="Total paid" />
        <StatCard icon="⏳" value={paidNotDone.length} label="Paid but not taken exam" />
        <StatCard icon="✗" value={records.length - paid.length} label="Not paid" />
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="tw">
          <table>
            <thead>
              <tr><th>Reg No.</th><th>Name</th><th>Paid?</th><th>Amount</th><th>Exam Status</th><th>Slot</th><th>Result</th></tr>
            </thead>
            <tbody>
              {records.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--t2)' }}>No records yet</td></tr>}
              {records.map((r) => (
                <tr key={r.registerNo}>
                  <td>{r.registerNo}</td><td>{r.studentName || '—'}</td>
                  <td><span className={`tag ${r.paid === 'Yes' ? 'ok' : 'err'}`}>{r.paid}</span></td>
                  <td>{r.amount ? `Rs. ${r.amount}` : '—'}</td>
                  <td><span className={`tag ${r.examStatus === 'Completed' ? 'ok' : ''}`}>{r.examStatus}</span></td>
                  <td>{r.slot || '—'}</td><td>{r.result || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

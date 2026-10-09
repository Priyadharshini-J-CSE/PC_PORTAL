import { useEffect, useState } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function FacultyLeetCode() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/leetcode')
      .then((r) => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="top"><div><small>Faculty Portal</small><h1>LeetCode</h1></div></div>
      <span className="tag">👁 View only</span>

      {loading ? <LoadingSpinner /> : (
        <div className="tw" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Reg No.</th><th>Name</th><th>LeetCode ID</th>
                <th>Global Rank</th><th>Contest Rating</th><th>Contests</th>
                <th>Total</th><th>Easy</th><th>Medium</th><th>Hard</th><th>Last Fetched</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--t2)' }}>No records yet</td></tr>
              )}
              {records.map((r) => (
                <tr key={r.registerNo}>
                  <td>{r.registerNo}</td>
                  <td>{r.studentName || '—'}</td>
                  <td>{r.leetcodeUsername || '—'}</td>
                  <td>{r.globalRank ?? '—'}</td>
                  <td>{r.contestRating ?? '—'}</td>
                  <td>{r.contestsAttended ?? '—'}</td>
                  <td>{r.totalSolved ?? '—'}</td>
                  <td>{r.easySolved ?? '—'}</td>
                  <td>{r.mediumSolved ?? '—'}</td>
                  <td>{r.hardSolved ?? '—'}</td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {r.lastFetchedAt ? new Date(r.lastFetchedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

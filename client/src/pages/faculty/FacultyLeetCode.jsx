import { useEffect, useState } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

export default function FacultyLeetCode() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/leetcode').then(r => setRecords(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="top"><div><small>Faculty Portal</small><h1>LeetCode</h1></div></div>
      <span className="tag"><Icon name="eye" style={{ marginRight: 6 }} />View only</span>
      {loading ? <LoadingSpinner /> : (
        <>
          <p style={{ marginTop: 12 }}><b>{records.length}</b> students with LeetCode records</p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Roll No.</th><th>Name</th><th>LeetCode Username</th>
                  <th>Global Rank</th><th>Contest Rating</th><th>Contests</th>
                  <th>Total Solved</th><th>Easy</th><th>Medium</th><th>Hard</th>
                  <th>Status</th><th>Last Fetched</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && <tr><td colSpan={12} style={{ textAlign: 'center', color: 'var(--t2)' }}>No records yet</td></tr>}
                {records.map(r => (
                  <tr key={r.registerNo}>
                    <td>{r.rollNo || r.registerNo}</td>
                    <td>{r.name || '—'}</td>
                    <td>
                      {r.leetcodeUsername
                        ? <a href={`https://leetcode.com/${r.leetcodeUsername}`} target="_blank" rel="noreferrer">{r.leetcodeUsername}</a>
                        : '—'}
                    </td>
                    <td>{r.globalRank ?? '—'}</td>
                    <td>{r.contestRating ?? '—'}</td>
                    <td>{r.contestsAttended ?? '—'}</td>
                    <td><b>{r.totalSolved ?? '—'}</b></td>
                    <td style={{ color: '#22c55e' }}>{r.easySolved ?? '—'}</td>
                    <td style={{ color: '#f59e0b' }}>{r.mediumSolved ?? '—'}</td>
                    <td style={{ color: '#ef4444' }}>{r.hardSolved ?? '—'}</td>
                    <td>
                      <span className={`tag ${r.fetchStatus === 'success' ? 'ok' : r.fetchStatus === 'error' ? 'err' : ''}`}>
                        {r.fetchStatus || 'never'}
                      </span>
                    </td>
                    <td style={{ fontSize: '.75rem', whiteSpace: 'nowrap' }}>
                      {r.lastFetchedAt ? new Date(r.lastFetchedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

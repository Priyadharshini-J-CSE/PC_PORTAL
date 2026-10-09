import { useEffect, useState } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

function BarChart({ data }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  if (!entries.length) return <p style={{ margin: '8px 0 0', color: 'var(--t2)' }}>No data yet.</p>;
  return entries.map(([k, v]) => (
    <div key={k} className="bar">
      {k} · {v}
      <span className="bar-track"><span className="bar-fill" style={{ width: `${(v / max) * 100}%` }} /></span>
    </div>
  ));
}

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/analytics/faculty')
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'));
  }, []);

  if (error) return <div className="msg">{error}</div>;
  if (!data) return <LoadingSpinner />;

  const { avgCgpa, withArrears, topCgpa, topLc, domainCounts, companyCounts, placed } = data;

  return (
    <>
      <div className="top"><div><small>Faculty Portal</small><h1>Dashboard</h1></div></div>

      <div className="box" style={{ marginBottom: 20 }}>
        <b>Welcome, Faculty</b>
        <p style={{ marginBottom: 0 }}>Academic and placement-readiness overview of the class. View-only.</p>
      </div>

      <h3>Class performance</h3>
      <div className="stats">
        <StatCard icon="📊" value={avgCgpa ?? 'N/A'} label="Average CGPA" />
        <StatCard icon="⚠" value={withArrears} label="Students with standing arrears" />
        <StatCard icon="✅" value={placed} label="Students reported placed" />
      </div>

      <div className="cards" style={{ marginTop: 16 }}>
        <div className="box">
          <b>Top LeetCode solvers</b>
          {topLc.length === 0
            ? <p style={{ margin: '8px 0 0', color: 'var(--t2)' }}>No data yet.</p>
            : <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {topLc.map((r) => <li key={r.registerNo}>{r.studentName} — {r.totalSolved} solved</li>)}
              </ul>
          }
        </div>
        <div className="box">
          <b>Top CGPA</b>
          {topCgpa.length === 0
            ? <p style={{ margin: '8px 0 0', color: 'var(--t2)' }}>No data yet.</p>
            : <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {topCgpa.map((s) => <li key={s.registerNo}>{s.name} — {s.cgpa}</li>)}
              </ul>
          }
        </div>
        <div className="box">
          <b>Interested domains</b>
          <BarChart data={domainCounts} />
        </div>
        <div className="box">
          <b>Companies in interview reports</b>
          <BarChart data={companyCounts} />
        </div>
      </div>
    </>
  );
}

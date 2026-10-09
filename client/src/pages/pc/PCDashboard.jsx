import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

function pct(a, b) { return b ? Math.round((a / b) * 100) + '%' : '0%'; }

export default function PCDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/analytics/pc')
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'));
  }, []);

  if (error) return <div className="msg">{error}</div>;
  if (!data) return <LoadingSpinner />;

  const { totalStudents, lcCount, withResume, withPortfolio, withVideo, ivCount,
    linguaPaid, linguaCompleted, linguaPaidNotDone, recentInterviews } = data;

  return (
    <>
      <div className="top">
        <div><small>PC Portal</small><h1>Dashboard</h1></div>
      </div>

      <div className="box" style={{ marginBottom: 20 }}>
        <b>Welcome, Placement Coordinator</b>
        <p style={{ marginBottom: 0 }}>Track data coverage and see what still needs your attention.</p>
      </div>

      <h3>Data coverage</h3>
      <div className="stats">
        <StatCard icon="👥" value={totalStudents} label="Students" onClick={() => navigate('/pc/students')} />
        <StatCard icon="⌨" value={pct(lcCount, totalStudents)} label="LeetCode IDs added" onClick={() => navigate('/pc/leetcode')} />
        <StatCard icon="📄" value={pct(withResume, totalStudents)} label="Resumes submitted" />
        <StatCard icon="🎥" value={pct(withVideo, totalStudents)} label="1-min videos" />
        <StatCard icon="💬" value={ivCount} label="Interview sheets" onClick={() => navigate('/pc/interviews')} />
      </div>

      <h3>Lingua Skills</h3>
      <div className="stats">
        <StatCard icon="₹" value={linguaPaid} label="Paid" onClick={() => navigate('/pc/lingua')} />
        <StatCard icon="✅" value={linguaCompleted} label="Exams completed" />
        <StatCard icon="⏳" value={linguaPaidNotDone} label="Paid, yet to complete" />
      </div>

      <div className="cards" style={{ marginTop: 16 }}>
        <div className="box">
          <b>Pending actions</b>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>{totalStudents - lcCount} students without a LeetCode ID</li>
            <li>{totalStudents - withResume} students without a resume link</li>
            <li>{totalStudents - withVideo} students without a video link</li>
            <li>{linguaPaidNotDone} paid students yet to complete Lingua exam</li>
          </ul>
          <div className="row">
            <button className="s" onClick={() => navigate('/pc/leetcode')}>⌨ Add LeetCode IDs</button>
            <button className="s" onClick={() => navigate('/pc/lingua')}>🌐 Lingua Skills</button>
          </div>
        </div>

        <div className="box">
          <b>Latest interview submissions</b>
          {recentInterviews.length === 0 ? (
            <p style={{ margin: '8px 0 0' }}>No submissions yet.</p>
          ) : (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {recentInterviews.map((iv) => (
                <li key={iv._id}>{iv.registerNo} — {iv.companyName} ({iv.finalResult})</li>
              ))}
            </ul>
          )}
          <div className="row">
            <button className="s" onClick={() => navigate('/pc/interviews')}>💬 View all</button>
          </div>
        </div>
      </div>
    </>
  );
}

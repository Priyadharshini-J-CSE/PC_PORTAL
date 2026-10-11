import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

const PROFILE_KEYS = [
  ['resumeLink','Resume link'],['portfolioLink','Portfolio link'],
  ['videoLink','1-minute video'],['interestedDomain','Interested domain'],
  ['cgpa','CGPA'],['certLink','Certificate link'],
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/analytics/student').then(r => setData(r.data)).catch(() => setError('Failed to load dashboard'));
  }, []);

  if (error) return <div className="msg">{error}</div>;
  if (!data) return <LoadingSpinner />;

  const { master, profile, lc, lingua, ivCount } = data;
  const missing = PROFILE_KEYS.filter(([k]) => !profile[k]);
  const completeness = Math.round(((PROFILE_KEYS.length - missing.length) / PROFILE_KEYS.length) * 100);
  const hackWins = (+profile.internalHackWon || 0) + (+profile.externalHackWon || 0) + (+profile.externalOnlineHackWon || 0);

  return (
    <>
      <div className="top"><div><small>Student Portal</small><h1>Dashboard</h1></div></div>
      <div className="box" style={{ marginBottom: 20 }}>
        <b>Welcome, {master.name || user.registerNo}</b>
        <p style={{ marginBottom: 0 }}>{user.registerNo} · {master.dept || 'CSE'} · Keep your profile complete and share your interview experiences.</p>
      </div>

      <h3>My progress</h3>
      <div className="stats">
        <StatCard icon="circle-check"  value={`${completeness}%`} label="Profile completeness"  onClick={() => navigate('/student/profile')} />
        <StatCard icon="comments"      value={ivCount}             label="Interview sheets"       onClick={() => navigate('/student/interviews')} />
        <StatCard icon="code"          value={lc.totalSolved ?? 'N/A'} label="LeetCode solved" />
        <StatCard icon="trophy"        value={hackWins}            label="Hackathons won" />
      </div>

      <div className="cards" style={{ marginTop: 16 }}>
        <div className="box">
          <b>To complete in my profile</b>
          {missing.length === 0
            ? <p style={{ margin: '8px 0 0', color: 'var(--ok)' }}><Icon name="circle-check" style={{ marginRight: 6 }} />Profile is complete!</p>
            : <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 2 }}>{missing.map(([, l]) => <li key={l}>{l}</li>)}</ul>}
          <div className="row">
            <button className="s" onClick={() => navigate('/student/profile')}><Icon name="id-card" /> Edit profile</button>
            <button className="s" onClick={() => navigate('/student/interviews')}><Icon name="comments" /> Add experience</button>
          </div>
        </div>

        <div className="box">
          <b><Icon name="code" style={{ marginRight: 8, color: 'var(--o)' }} />LeetCode</b>
          {lc.leetcodeUsername
            ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 2 }}>
                <li>ID: {lc.leetcodeUsername}</li>
                <li>Global rank: {lc.globalRank ?? '—'}</li>
                <li>Contest rating: {lc.contestRating ?? '—'}</li>
                <li>Easy / Medium / Hard: {lc.easySolved ?? '—'} / {lc.mediumSolved ?? '—'} / {lc.hardSolved ?? '—'}</li>
              </ul>
            : <p style={{ margin: '8px 0 0', color: 'var(--t2)' }}>Your LeetCode ID has not been added by the PC yet.</p>}
        </div>

        <div className="box">
          <b><Icon name="language" style={{ marginRight: 8, color: 'var(--o)' }} />Lingua Skills</b>
          {lingua.registerNo
            ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 2 }}>
                <li>Paid: {lingua.paid}</li>
                <li>Exam: {lingua.examStatus}</li>
                <li>Slot: {lingua.slot || '—'}</li>
                <li>Result: {lingua.result || '—'}</li>
              </ul>
            : <p style={{ margin: '8px 0 0', color: 'var(--t2)' }}>No Lingua Skills record yet.</p>}
        </div>
      </div>
    </>
  );
}

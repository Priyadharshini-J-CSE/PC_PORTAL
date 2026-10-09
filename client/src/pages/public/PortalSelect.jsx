import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const PORTALS = [
  {
    id: 'student',
    icon: '🎓',
    title: 'Student Portal',
    desc: 'Login with your roll number. Update your profile, add interview experiences, and track your placement readiness.',
    color: '#4f46e5',
    note: 'Login with Roll Number',
  },
  {
    id: 'pc',
    icon: '🏢',
    title: 'PC Portal',
    desc: 'Manage student master data, LeetCode IDs, Lingua Skills records, and view interview submissions.',
    color: '#C6531B',
    note: 'Login / Register with Email',
  },
  {
    id: 'faculty',
    icon: '📚',
    title: 'Faculty Portal',
    desc: 'View-only access to student data, LeetCode rankings, interview experiences, and Lingua Skills.',
    color: '#0891b2',
    note: 'Login / Register with Email',
  },
];

export default function PortalSelect() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, margin: '0 0 10px' }}>
            Choose your <span className="hl">portal</span>
          </h1>
          <p style={{ color: 'var(--t2)', margin: 0, fontSize: '1.05rem' }}>
            Each portal has its own login, permissions, and dashboard.
          </p>
        </div>

        <div className="cards">
          {PORTALS.map(p => (
            <div
              key={p.id}
              className="card"
              tabIndex={0}
              onClick={() => navigate(`/portal/${p.id}`)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/portal/${p.id}`)}
              style={{ padding: 28 }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>{p.icon}</div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>{p.title}</h2>
              <p style={{ color: 'var(--t2)', margin: '0 0 18px', fontSize: '.9rem', lineHeight: 1.55 }}>{p.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.78rem', color: 'var(--t2)', background: 'var(--mu)', padding: '4px 10px', borderRadius: 999 }}>
                  {p.note}
                </span>
                <span style={{ color: 'var(--o)', fontWeight: 700, fontSize: '1.1rem' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

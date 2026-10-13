import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

const PORTALS = [
  { id: 'student', icon: 'user-graduate',   title: 'Student Portal', desc: 'Login with your roll number. Update your profile, add interview experiences, and track your placement readiness.', note: 'Roll Number + Password' },
  { id: 'pc',      icon: 'building',         title: 'PC Portal',      desc: 'Manage student master data, LeetCode IDs, Lingua Skills records, and view interview submissions.',                  note: 'Email + Password' },
  { id: 'faculty', icon: 'chalkboard-user',  title: 'Faculty Portal', desc: 'View-only access to student data, LeetCode rankings, interview experiences, and Lingua Skills.',                   note: 'Email + Password' },
  { id: 'admin',   icon: 'shield-halved',    title: 'Admin Portal',   desc: 'Approve and manage faculty and PC staff accounts.',                                                                   note: 'Email + Password' },
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, maxWidth: 760, margin: '0 auto' }}>
          {PORTALS.map(p => (
            <div
              key={p.id}
              className="card"
              tabIndex={0}
              onClick={() => navigate(`/portal/${p.id}`)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/portal/${p.id}`)}
              style={{ padding: 28 }}
            >
              <div style={{ width: 48, height: 48, background: '#FBEDE5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: 'var(--o)', fontSize: '1.3rem' }}>
                <Icon name={p.icon} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>{p.title}</h2>
              <p style={{ color: 'var(--t2)', margin: '0 0 18px', fontSize: '.9rem', lineHeight: 1.55 }}>{p.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.78rem', color: 'var(--t2)', background: 'var(--mu)', padding: '4px 10px', borderRadius: 999 }}>
                  {p.note}
                </span>
                <Icon name="arrow-right" style={{ color: 'var(--o)', fontSize: '1rem' }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

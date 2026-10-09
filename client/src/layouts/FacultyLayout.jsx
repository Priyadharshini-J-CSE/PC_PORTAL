import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

const MENU = [
  { to: '/faculty/dashboard',  label: 'Dashboard',      icon: 'gauge' },
  { to: '/faculty/students',   label: 'Students',        icon: 'users' },
  { to: '/faculty/leetcode',   label: 'LeetCode',        icon: 'code' },
  { to: '/faculty/interviews', label: 'Post-Interview',  icon: 'comments' },
  { to: '/faculty/lingua',     label: 'Lingua Skills',   icon: 'language' },
];

export default function FacultyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <Icon name="bullseye" style={{ color: 'var(--o)', fontSize: '1.1rem' }} />
          SECE Placement
        </div>
        <div className="rl">Faculty Portal</div>

        {MENU.map(m => (
          <NavLink key={m.to} to={m.to} className={({ isActive }) => `mi ${isActive ? 'on' : ''}`}>
            <Icon name={m.icon} style={{ marginRight: 10, width: 16 }} />
            {m.label}
          </NavLink>
        ))}

        <div style={{ margin: '12px 0', background: '#FBEDE5', borderRadius: 10, padding: '8px 12px', fontSize: '.8rem', color: 'var(--o)', fontWeight: 600 }}>
          <Icon name="eye" style={{ marginRight: 6 }} /> View-only access
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--b)', marginLeft: -12, marginRight: -12, paddingLeft: 12, paddingRight: 12 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--t2)', marginBottom: 8 }}>
            Logged in as<br />
            <b style={{ color: 'var(--t)', wordBreak: 'break-all' }}>{user?.email}</b>
          </div>
          <button className="s" style={{ width: '100%', justifyContent: 'center' }}
            onClick={async () => { await logout(); navigate('/'); }}>
            <Icon name="right-from-bracket" /> Logout
          </button>
        </div>
      </aside>
      <section className="content"><Outlet /></section>
    </div>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

const MENU = [
  { to: '/admin/approvals', label: 'Staff Approvals', icon: 'user-check' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <Icon name="bullseye" style={{ color: 'var(--o)', fontSize: '1.1rem' }} />
          SECE Placement
        </div>
        <div className="rl">Admin Portal</div>

        {MENU.map(m => (
          <NavLink key={m.to} to={m.to} className={({ isActive }) => `mi ${isActive ? 'on' : ''}`}>
            <Icon name={m.icon} style={{ marginRight: 10, width: 16 }} />
            {m.label}
          </NavLink>
        ))}

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

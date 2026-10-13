import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

const ROLE_META = {
  student: { label: 'Student Portal', color: '#4f46e5', icon: '🎓' },
  pc:      { label: 'PC Portal',      color: '#C6531B', icon: '🏢' },
  faculty: { label: 'Faculty Portal', color: '#0891b2', icon: '📚' },
  admin:   { label: 'Admin Portal',   color: '#16a34a', icon: '🔐' },
};
const REDIRECTS = { student: '/student/dashboard', pc: '/pc/dashboard', faculty: '/faculty/dashboard', admin: '/admin/approvals' };

export default function AuthPage() {
  const { role } = useParams();
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const meta = ROLE_META[role];
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';

  const [tab, setTab] = useState('login');
  const [adminExists, setAdminExists] = useState(true); // assume exists until checked
  const [checking, setChecking] = useState(isAdmin);

  // Form fields
  const [identifier, setIdentifier] = useState(''); // roll no or email
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // For admin: check if admin account already exists
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/api/setup/status')
      .then(r => {
        setAdminExists(r.data.adminExists);
        if (!r.data.adminExists) setTab('register'); // first time → show register
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [isAdmin]);

  function reset() { setError(''); setPassword(''); setConfirmPw(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    if (tab === 'register' && !isStudent) {
      if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
      if (password !== confirmPw) { setError('Passwords do not match'); return; }
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const body = isStudent
          ? { registerNo: identifier.trim().toUpperCase(), password }
          : { email: identifier.trim().toLowerCase(), password };
        const res = await api.post(`/api/auth/${role}/login`, body);
        setUser(res.data);
        navigate(REDIRECTS[role]);

      } else {
        // Register
        const res = await api.post(`/api/auth/${role}/register`, {
          email: identifier.trim().toLowerCase(),
          password,
        });
        if (role === 'faculty' || role === 'pc') {
          toast('Registration submitted. Awaiting admin approval before you can log in.', 'info');
          setTab('login'); reset();
        } else if (role === 'admin') {
          setUser(res.data);
          navigate(REDIRECTS['admin']);
        } else {
          setUser(res.data);
          navigate(REDIRECTS[role]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!meta) return <div style={{ padding: 40 }}>Invalid portal.</div>;

  if (checking) {
    return (
      <div className="auth-wrap" style={{ background: 'var(--bg)' }}>
        <div className="auth-box" style={{ textAlign: 'center', color: 'var(--t2)' }}>
          Checking setup status...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap" style={{
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(to right,rgba(90,78,67,.075) 1px,transparent 1px),linear-gradient(to bottom,rgba(90,78,67,.075) 1px,transparent 1px)',
      backgroundSize: '42px 42px',
    }}>
      <div className="auth-box">
        {/* Back link */}
        <Link to="/portal" style={{ fontSize: '.85rem', color: 'var(--t2)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to portal selection
        </Link>

        {/* Portal badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: '1.6rem' }}>{meta.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{meta.label}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--t2)' }}>SECE Placement Portal</div>
          </div>
        </div>

        {/* Tabs — only for PC, Faculty; Admin only if no admin exists yet */}
        {(!isStudent && !(isAdmin && adminExists)) && (
          <div className="auth-tabs" style={{ marginTop: 18 }}>
            <button type="button" className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); reset(); }}>Login</button>
            <button type="button" className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); reset(); }}>Register</button>
          </div>
        )}

        {/* First-time admin setup banner */}
        {isAdmin && !adminExists && (
          <div style={{ background: '#FBEDE5', borderRadius: 12, padding: '12px 16px', margin: '16px 0', fontSize: '.88rem' }}>
            <b>First-time setup</b><br />
            No admin account exists yet. Create the admin account to manage staff approvals.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: isStudent ? 20 : 4 }}>
          <label>{isStudent ? 'Roll Number' : 'Email Address'}</label>
          <input
            type={isStudent ? 'text' : 'email'}
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder={isStudent ? 'e.g. 24CS141' : `${role}@sece.ac.in`}
            required
            autoFocus
            autoComplete={isStudent ? 'username' : 'email'}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder={tab === 'register' ? 'Min 8 characters' : ''}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />

          {tab === 'register' && !isStudent && (
            <>
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
            </>
          )}

          {error && <div className="msg" style={{ marginTop: 10 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 18, padding: '11px', fontSize: '1rem', justifyContent: 'center' }}>
            {loading ? 'Please wait...' : tab === 'login' ? `Login to ${meta.label}` : 'Register'}
          </button>
        </form>

        {/* Helper notes */}
        {isStudent && (
          <p style={{ fontSize: '.82rem', color: 'var(--t2)', marginTop: 16, lineHeight: 1.5 }}>
            Use your roll number (e.g. <b>24CS141</b>) and the initial password provided by your Placement Coordinator. You will be asked to set a new password on first login.
          </p>
        )}
        {(role === 'faculty' || role === 'pc') && tab === 'register' && (
          <p style={{ fontSize: '.82rem', color: 'var(--t2)', marginTop: 12 }}>
            Accounts require admin approval before login is enabled.
          </p>
        )}
      </div>
    </div>
  );
}

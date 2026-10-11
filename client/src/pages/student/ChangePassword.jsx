import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import Icon from '../../components/Icon';

export default function ChangePassword() {
  const { setUser, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (next.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (next !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/student/change-password', { currentPassword: current, newPassword: next });
      toast('Password changed successfully', 'success');
      setUser({ ...user, mustChangePassword: false });
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap" style={{ background: 'var(--bg)' }}>
      <div className="auth-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, background: '#FBEDE5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--o)', fontSize: '1.2rem' }}>
            <Icon name="id-card" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Set Your Password</div>
            <div style={{ fontSize: '.8rem', color: 'var(--t2)' }}>SECE Placement Portal</div>
          </div>
        </div>

        <div style={{ background: '#FBEDE5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '.88rem' }}>
          <Icon name="info" style={{ marginRight: 6, color: 'var(--o)' }} />
          You must set a new password before continuing. Use the initial password provided by your PC as the current password.
        </div>

        <form onSubmit={handleSubmit}>
          <label>Current (initial) password</label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required autoComplete="current-password" />
          <label>New password (min 8 characters)</label>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} required autoComplete="new-password" />
          <label>Confirm new password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
          {error && <div className="msg">{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}>
            <Icon name="floppy-disk" /> {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export default function ChangePassword() {
  const { setUser, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (next.length < 8) { setError('New password must be at least 8 characters'); return; }
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
    <div style={{ maxWidth: 420, margin: '48px auto', padding: '0 24px' }}>
      <div className="box">
        <h2>Set Your Password</h2>
        <p style={{ color: 'var(--t2)' }}>You must set a new password before continuing.</p>
        <form onSubmit={handleSubmit}>
          <label>Current (initial) password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <label>New password (min 8 characters)</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
          {error && <div className="msg">{error}</div>}
          <div className="row" style={{ marginTop: 16 }}>
            <button type="submit" disabled={loading}>{loading ? '...' : 'Set Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

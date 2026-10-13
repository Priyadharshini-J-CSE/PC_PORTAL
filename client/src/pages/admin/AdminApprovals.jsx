import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

const ROLE_LABEL = { pc: 'PC', faculty: 'Faculty' };
const ROLE_COLOR = { pc: '#7c3aed', faculty: '#0ea5e9' };

function RoleBadge({ role }) {
  return (
    <span style={{ background: ROLE_COLOR[role] + '22', color: ROLE_COLOR[role], borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: '.8rem' }}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export default function AdminApprovals() {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/staff');
      setStaff(res.data);
    } catch { toast('Failed to load accounts', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    try {
      await api.patch(`/api/auth/staff/${id}/approve`);
      toast('Account approved', 'success');
      load();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function deactivate(id) {
    try {
      await api.patch(`/api/auth/staff/${id}/deactivate`);
      toast('Account deactivated', 'success');
      load();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
  }

  const pending = staff.filter(u => !u.isActive);
  const active  = staff.filter(u => u.isActive);

  return (
    <>
      <div className="top"><div><small>Admin Portal</small><h1>Staff Approvals</h1></div></div>

      <div className="stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <Icon name="hourglass-half" style={{ color: 'var(--o)', fontSize: '1.4rem' }} />
          <div><b style={{ fontSize: '1.5rem' }}>{pending.length}</b><div style={{ fontSize: '.8rem', color: 'var(--t2)' }}>Pending approval</div></div>
        </div>
        <div className="stat-card">
          <Icon name="circle-check" style={{ color: '#22c55e', fontSize: '1.4rem' }} />
          <div><b style={{ fontSize: '1.5rem' }}>{active.length}</b><div style={{ fontSize: '.8rem', color: 'var(--t2)' }}>Active accounts</div></div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="hourglass-half" style={{ color: 'var(--o)' }} />
            Pending Approval
            {pending.length > 0 && (
              <span style={{ background: 'var(--o)', color: '#fff', borderRadius: 999, fontSize: '.75rem', padding: '1px 8px', fontWeight: 700 }}>
                {pending.length}
              </span>
            )}
          </h3>
          <div className="tw" style={{ marginBottom: 24 }}>
            <table>
              <thead><tr><th>Email</th><th>Role</th><th>Registered</th><th></th></tr></thead>
              <tbody>
                {pending.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--t2)' }}>No pending requests</td></tr>
                )}
                {pending.map(u => (
                  <tr key={u._id}>
                    <td>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => approve(u._id)} style={{ background: '#22c55e', color: '#fff', padding: '4px 14px' }}>
                        <Icon name="circle-check" /> Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="users" style={{ color: 'var(--o)' }} /> Active Accounts
          </h3>
          <div className="tw">
            <table>
              <thead><tr><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {active.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--t2)' }}>No active accounts</td></tr>
                )}
                {active.map(u => (
                  <tr key={u._id}>
                    <td>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="s" onClick={() => deactivate(u._id)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        <Icon name="ban" /> Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

const ROLE_LABEL = { pc: 'PC', faculty: 'Faculty' };
const ROLE_COLOR = { pc: '#7c3aed', faculty: '#0ea5e9' };

export default function PCApprovals() {
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [addForm, setAddForm]   = useState({ email: '', password: '', role: 'faculty' });
  const [adding, setAdding]     = useState(false);
  const { user } = useAuth();
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

  async function handleAdd(e) {
    e.preventDefault();
    if (!addForm.email || !addForm.password) { toast('Email and password required', 'error'); return; }
    setAdding(true);
    try {
      if (addForm.role === 'pc') {
        await api.post('/api/auth/staff/register-pc', { email: addForm.email, password: addForm.password });
      } else {
        // faculty self-registers but we can also create directly — reuse faculty register endpoint
        await api.post('/api/auth/faculty/register', { email: addForm.email, password: addForm.password });
        // auto-approve since PC is creating it
        const res = await api.get('/api/auth/staff');
        const created = res.data.find(u => u.email === addForm.email);
        if (created) await api.patch(`/api/auth/staff/${created._id}/approve`);
      }
      toast(`${ROLE_LABEL[addForm.role]} account created`, 'success');
      setAddForm({ email: '', password: '', role: 'faculty' });
      load();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setAdding(false); }
  }

  const pending  = staff.filter(u => !u.isActive);
  const active   = staff.filter(u => u.isActive);

  return (
    <>
      <div className="top"><div><small>PC Portal</small><h1>Staff Approvals</h1></div></div>

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

      {/* ── Add account ── */}
      <details className="box" style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}><Icon name="plus" style={{ marginRight: 8 }} />Create new account</summary>
        <form onSubmit={handleAdd}>
          <div className="grid" style={{ marginTop: 12 }}>
            <div>
              <label>Role</label>
              <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                <option value="faculty">Faculty</option>
                <option value="pc">PC</option>
              </select>
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@sece.ac.in" />
            </div>
            <div>
              <label>Password (min 8 chars)</label>
              <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button type="submit" disabled={adding}><Icon name="plus" /> {adding ? 'Creating…' : 'Create Account'}</button>
          </div>
        </form>
      </details>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* ── Pending ── */}
          {pending.length > 0 && (
            <>
              <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="hourglass-half" style={{ color: 'var(--o)' }} /> Pending Approval
              </h3>
              <div className="tw" style={{ marginBottom: 20 }}>
                <table>
                  <thead>
                    <tr><th>Email</th><th>Role</th><th>Registered</th><th></th></tr>
                  </thead>
                  <tbody>
                    {pending.map(u => (
                      <tr key={u._id}>
                        <td>{u.email}</td>
                        <td><span style={{ background: ROLE_COLOR[u.role] + '22', color: ROLE_COLOR[u.role], borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: '.8rem' }}>{ROLE_LABEL[u.role]}</span></td>
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
            </>
          )}

          {/* ── Active ── */}
          <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="users" style={{ color: 'var(--o)' }} /> Active Accounts
          </h3>
          <div className="tw">
            <table>
              <thead>
                <tr><th>Email</th><th>Role</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {active.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--t2)' }}>No active accounts</td></tr>
                )}
                {active.map(u => (
                  <tr key={u._id}>
                    <td>
                      {u.email}
                      {u.email === user?.email && <span style={{ marginLeft: 8, fontSize: '.75rem', color: 'var(--t2)' }}>(you)</span>}
                    </td>
                    <td><span style={{ background: ROLE_COLOR[u.role] + '22', color: ROLE_COLOR[u.role], borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: '.8rem' }}>{ROLE_LABEL[u.role]}</span></td>
                    <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.email !== user?.email && (
                        <button className="s" onClick={() => deactivate(u._id)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                          <Icon name="ban" /> Deactivate
                        </button>
                      )}
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

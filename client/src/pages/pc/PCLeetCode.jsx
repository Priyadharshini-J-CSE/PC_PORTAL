import { useEffect, useState, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportResult from '../../components/ImportResult';
import { ROSTER } from '../../config/roster';

export default function PCLeetCode() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState(null);
  const [singleReg, setSingleReg] = useState('');
  const [singleUser, setSingleUser] = useState('');
  const [refreshing, setRefreshing] = useState({});
  const toast = useToast();
  const fileRef = useRef();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/leetcode');
      setRecords(res.data);
    } catch { toast('Failed to load LeetCode data', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!singleReg || !singleUser) { toast('Select register number and enter LeetCode ID', 'error'); return; }
    try {
      await api.post('/api/leetcode', { registerNo: singleReg, leetcodeUsername: singleUser });
      toast('LeetCode ID saved', 'success');
      setSingleReg(''); setSingleUser('');
      load();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleRefresh(registerNo) {
    setRefreshing(r => ({ ...r, [registerNo]: true }));
    try {
      await api.post(`/api/leetcode/${registerNo}/refresh`);
      toast('Refreshed', 'success');
      load();
    } catch (err) { toast(err.response?.data?.error || 'Refresh failed', 'error'); }
    finally { setRefreshing(r => ({ ...r, [registerNo]: false })); }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/api/leetcode/import', fd);
      setImportResult(res.data);
      toast(res.data.message, 'success');
      load();
    } catch (err) { toast(err.response?.data?.error || 'Import failed', 'error'); }
    e.target.value = '';
  }

  function downloadTemplate() {
    const csv = 'Roll No.,LeetCode ID\n24CS141,example_user\n24CS142,another_user';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'leetcode-template.csv'; a.click();
  }

  return (
    <>
      <div className="top"><div><small>PC Portal</small><h1>LeetCode</h1></div></div>

      <div className="box" style={{ marginBottom: 16 }}>
        <b>Bulk import LeetCode IDs</b>
        <br /><small>Upload CSV or Excel with columns: <b>Roll No., LeetCode ID</b></small>
        <div className="row">
          <button className="s" onClick={() => fileRef.current.click()}>⬆ Upload file</button>
          <button className="s" onClick={downloadTemplate}>⬇ Download template</button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      <ImportResult result={importResult} onClose={() => setImportResult(null)} />

      <details className="box" style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Add single student</summary>
        <div className="grid" style={{ marginTop: 12 }}>
          <div>
            <label>Register No.</label>
            <select value={singleReg} onChange={(e) => setSingleReg(e.target.value)}>
              <option value="">-- Select --</option>
              {ROSTER.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label>LeetCode Username</label>
            <input value={singleUser} onChange={(e) => setSingleUser(e.target.value)} placeholder="username" />
          </div>
        </div>
        <div className="row"><button onClick={handleAdd}>Add / Update</button></div>
      </details>

      {loading ? <LoadingSpinner /> : (
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Reg No.</th><th>Name</th><th>LeetCode ID</th>
                <th>Global Rank</th><th>Contest Rating</th><th>Contests</th>
                <th>Total</th><th>Easy</th><th>Medium</th><th>Hard</th>
                <th>Status</th><th>Last Fetched</th><th></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={13} style={{ textAlign: 'center', color: 'var(--t2)' }}>No LeetCode records yet</td></tr>
              )}
              {records.map((r) => (
                <tr key={r.registerNo}>
                  <td>{r.registerNo}</td>
                  <td>{r.studentName || '—'}</td>
                  <td>{r.leetcodeUsername || '—'}</td>
                  <td>{r.globalRank ?? '—'}</td>
                  <td>{r.contestRating ?? '—'}</td>
                  <td>{r.contestsAttended ?? '—'}</td>
                  <td>{r.totalSolved ?? '—'}</td>
                  <td>{r.easySolved ?? '—'}</td>
                  <td>{r.mediumSolved ?? '—'}</td>
                  <td>{r.hardSolved ?? '—'}</td>
                  <td>
                    <span className={`tag ${r.fetchStatus === 'success' ? 'ok' : r.fetchStatus === 'error' ? 'err' : ''}`}>
                      {r.fetchStatus || 'never'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {r.lastFetchedAt ? new Date(r.lastFetchedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button
                      className="s"
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      disabled={refreshing[r.registerNo]}
                      onClick={() => handleRefresh(r.registerNo)}
                    >
                      {refreshing[r.registerNo] ? '...' : '↻'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

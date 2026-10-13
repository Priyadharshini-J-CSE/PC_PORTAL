import { useEffect, useState, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportResult from '../../components/ImportResult';
import Icon from '../../components/Icon';
import { ROSTER } from '../../config/roster';

const LC_COLS = [
  ['Name',              'Student full name',                                    false],
  ['Roll Number',       'Roll number — e.g. 24CS141 (must be in approved list)', true],
  ['LeetCode Username', 'LeetCode profile username (not the full URL)',          true],
];

function ColGuide({ cols, onDownload }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontWeight: 600, fontSize: '.9rem' }}>
          <Icon name="info" style={{ marginRight: 8, color: 'var(--o)' }} />Expected column format
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="s" style={{ padding: '3px 10px', fontSize: '.78rem' }}
            onClick={e => { e.stopPropagation(); onDownload(); }}>
            <Icon name="download" /> Template
          </button>
          <Icon name={open ? 'chevron-down' : 'arrow-right'} style={{ color: 'var(--t2)', fontSize: '.8rem' }} />
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 14px 12px' }}>
          <table style={{ width: '100%', fontSize: '.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px 4px 0', color: 'var(--t2)', fontWeight: 600 }}>#</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--t2)', fontWeight: 600 }}>Exact column name</th>
                <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--t2)', fontWeight: 600 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {cols.map(([col, desc, required], i) => (
                <tr key={col} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '5px 8px 5px 0', color: 'var(--t2)' }}>{i + 1}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <code style={{ background: required ? '#fff3e0' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: '.78rem' }}>
                      {col}
                    </code>
                    {required && <span style={{ marginLeft: 6, fontSize: '.7rem', color: 'var(--o)', fontWeight: 700 }}>required</span>}
                  </td>
                  <td style={{ padding: '5px 0', color: 'var(--t2)' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: '8px 0 0', fontSize: '.75rem', color: 'var(--t2)' }}>
            <Icon name="triangle-exclamation" style={{ marginRight: 4, color: 'var(--o)' }} />
            Column names must match exactly (case-sensitive). Extra columns are ignored.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PCLeetCode() {
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [singleReg, setSingleReg]       = useState('');
  const [singleUser, setSingleUser]     = useState('');
  const toast = useToast();
  const fileRef = useRef();

  async function load() {
    setLoading(true);
    try { const res = await api.get('/api/leetcode'); setRecords(res.data); }
    catch { toast('Failed to load LeetCode data', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!singleReg || !singleUser) { toast('Select register number and enter LeetCode username', 'error'); return; }
    try {
      await api.post('/api/leetcode', { registerNo: singleReg, leetcodeUsername: singleUser });
      await api.post(`/api/leetcode/${singleReg}/refresh`);
      toast('Added and stats fetched', 'success');
      setSingleReg(''); setSingleUser(''); load();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleRefreshAll() {
    setRefreshingAll(true);
    try {
      const res = await api.post('/api/leetcode/refresh-all');
      toast(res.data.message, 'success');
      // Poll twice to pick up background results
      setTimeout(load, 5000);
      setTimeout(load, 15000);
    } catch (err) { toast(err.response?.data?.error || 'Refresh failed', 'error'); }
    finally { setRefreshingAll(false); }
  }

  async function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/api/leetcode/import', fd);
      setImportResult({ type: 'success', ...res.data });
      toast(res.data.message, 'success');
      setTimeout(load, 4000);
      setTimeout(load, 12000);
    } catch (err) {
      const d = err.response?.data || {};
      setImportResult({ type: 'error', error: d.error || 'Import failed', detail: d.detail, hint: d.hint, expected: d.expected });
    }
    e.target.value = '';
  }

  function downloadTemplate() {
    const csv = 'Name,Roll Number,LeetCode Username\nJohn Doe S,24CS141,johndoe\nJane Smith R,24CS142,janesmith';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'leetcode-template.csv'; a.click();
  }

  return (
    <>
      <div className="top"><div><small>PC Portal</small><h1>LeetCode</h1></div></div>

      {/* Import box */}
      <div className="box" style={{ marginBottom: 16 }}>
        <b>Bulk import LeetCode usernames</b>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="s" onClick={() => fileRef.current.click()}><Icon name="upload" /> Upload CSV / Excel</button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      <ColGuide cols={LC_COLS} onDownload={downloadTemplate} />

      <ImportResult result={importResult} onClose={() => setImportResult(null)} />

      {/* Single add */}
      <details className="box" style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          <Icon name="plus" style={{ marginRight: 8 }} />Add single student
        </summary>
        <div className="grid" style={{ marginTop: 12 }}>
          <div>
            <label>Register No.</label>
            <select value={singleReg} onChange={e => setSingleReg(e.target.value)}>
              <option value="">-- Select --</option>
              {ROSTER.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label>LeetCode Username</label>
            <input value={singleUser} onChange={e => setSingleUser(e.target.value)} placeholder="username" />
          </div>
        </div>
        <div className="row"><button onClick={handleAdd}><Icon name="plus" /> Add / Update</button></div>
      </details>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Toolbar */}
          <div className="row" style={{ marginBottom: 12 }}>
            <p style={{ margin: 0 }}><b>{records.length}</b> students with LeetCode records</p>
            <button
              onClick={handleRefreshAll}
              disabled={refreshingAll || records.length === 0}
              style={{ marginLeft: 'auto' }}>
              <Icon name="rotate" style={refreshingAll ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshingAll ? ' Refreshing…' : ' Refresh All Profiles'}
            </button>
          </div>

          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>LeetCode Username</th>
                  <th>Global Rank</th>
                  <th>Contest Rating</th>
                  <th>Contests</th>
                  <th>Total Solved</th>
                  <th>Easy</th>
                  <th>Medium</th>
                  <th>Hard</th>
                  <th>Status</th>
                  <th>Last Fetched</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && (
                  <tr><td colSpan={12} style={{ textAlign: 'center', color: 'var(--t2)' }}>No LeetCode records yet — import a file above</td></tr>
                )}
                {records.map(r => (
                  <tr key={r.registerNo}>
                    <td>{r.rollNo || r.registerNo}</td>
                    <td>{r.name || '—'}</td>
                    <td>
                      {r.leetcodeUsername
                        ? <a href={`https://leetcode.com/u/${r.leetcodeUsername}`} target="_blank" rel="noreferrer">{r.leetcodeUsername}</a>
                        : '—'}
                    </td>
                    <td>{r.globalRank ?? '—'}</td>
                    <td>{r.contestRating ?? '—'}</td>
                    <td>{r.contestsAttended ?? '—'}</td>
                    <td><b>{r.totalSolved ?? '—'}</b></td>
                    <td style={{ color: '#22c55e' }}>{r.easySolved ?? '—'}</td>
                    <td style={{ color: '#f59e0b' }}>{r.mediumSolved ?? '—'}</td>
                    <td style={{ color: '#ef4444' }}>{r.hardSolved ?? '—'}</td>
                    <td>
                      <span className={`tag ${r.fetchStatus === 'success' ? 'ok' : r.fetchStatus === 'error' ? 'err' : ''}`}>
                        {r.fetchStatus === 'pending'
                          ? <><Icon name="hourglass-half" /> pending</>
                          : r.fetchStatus === 'error'
                            ? <span title={r.fetchError}><Icon name="triangle-exclamation" /> error</span>
                            : r.fetchStatus || 'never'}
                      </span>
                    </td>
                    <td style={{ fontSize: '.75rem', whiteSpace: 'nowrap' }}>
                      {r.lastFetchedAt ? new Date(r.lastFetchedAt).toLocaleString() : '—'}
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

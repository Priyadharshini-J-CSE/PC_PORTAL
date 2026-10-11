import { useEffect, useState, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportResult from '../../components/ImportResult';
import StatCard from '../../components/StatCard';
import Icon from '../../components/Icon';
import { ROSTER } from '../../config/roster';

export default function PCLingua() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [form, setForm] = useState({ registerNo: '', paid: 'No', amount: '', examStatus: 'Pending', slot: '', result: '' });
  const toast = useToast();
  const fileRef = useRef();

  async function load() {
    setLoading(true);
    try { const res = await api.get('/api/lingua', { params: { search } }); setRecords(res.data); }
    catch { toast('Failed to load Lingua data', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [search]);

  const paid = records.filter(r => r.paid === 'Yes');
  const done = records.filter(r => r.examStatus === 'Completed');
  const paidNotDone = paid.filter(r => r.examStatus !== 'Completed');
  const notPaid = records.filter(r => r.paid !== 'Yes');

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.registerNo) { toast('Select a register number', 'error'); return; }
    try { await api.post('/api/lingua', form); toast('Record saved', 'success'); setForm({ registerNo: '', paid: 'No', amount: '', examStatus: 'Pending', slot: '', result: '' }); load(); }
    catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleToggle(r) {
    try { await api.put(`/api/lingua/${r.registerNo}`, { ...r, examStatus: r.examStatus === 'Completed' ? 'Pending' : 'Completed' }); load(); }
    catch { toast('Update failed', 'error'); }
  }

  async function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { const res = await api.post('/api/lingua/import', fd); setImportResult(res.data); toast(res.data.message, 'success'); load(); }
    catch (err) { toast(err.response?.data?.error || 'Import failed', 'error'); }
    e.target.value = '';
  }

  async function handleExport() {
    const res = await api.get('/api/lingua/export', { responseType: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(res.data); a.download = 'lingua.csv'; a.click();
  }

  function downloadTemplate() {
    const csv = 'Student Name,Roll No.,Paid?,Amount,Exam Status,Slot,Result\nTest Student,24CS141,Yes,1500,Completed,10 AM,Pass';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'lingua-template.csv'; a.click();
  }

  return (
    <>
      <div className="top"><div><small>PC Portal</small><h1>Lingua Skills</h1></div></div>

      <div className="stats">
        <StatCard icon="circle-check"      value={done.length}     label="Total completed" />
        <StatCard icon="indian-rupee-sign" value={`${paid.length} (Rs. ${paid.reduce((a, r) => a + (+r.amount || 0), 0)})`} label="Total paid" />
        <StatCard icon="hourglass-half"    value={paidNotDone.length} label="Paid, not taken exam" />
        <StatCard icon="user-xmark"        value={notPaid.length}  label="Not paid" />
      </div>

      <div className="box" style={{ marginTop: 16 }}>
        <b>Bulk import</b><br />
        <small style={{ color: 'var(--t2)' }}>CSV/Excel: <b>Student Name, Roll No., Paid?, Amount, Exam Status, Slot, Result</b></small>
        <div className="row">
          <button className="s" onClick={() => fileRef.current.click()}><Icon name="upload" /> Upload</button>
          <button className="s" onClick={downloadTemplate}><Icon name="download" /> Template</button>
          <button className="s" onClick={handleExport}><Icon name="download" /> Export CSV</button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      <ImportResult result={importResult} onClose={() => setImportResult(null)} />

      <details className="box" style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}><Icon name="plus" style={{ marginRight: 8 }} />Add single record</summary>
        <form onSubmit={handleAdd}>
          <div className="grid" style={{ marginTop: 12 }}>
            <div><label>Register No.</label>
              <select value={form.registerNo} onChange={e => setForm(f => ({ ...f, registerNo: e.target.value }))}>
                <option value="">-- Select --</option>
                {ROSTER.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label>Paid?</label>
              <select value={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.value }))}><option>Yes</option><option>No</option></select>
            </div>
            <div><label>Amount</label><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><label>Exam Status</label>
              <select value={form.examStatus} onChange={e => setForm(f => ({ ...f, examStatus: e.target.value }))}><option>Pending</option><option>Completed</option></select>
            </div>
            <div><label>Slot</label><input value={form.slot} onChange={e => setForm(f => ({ ...f, slot: e.target.value }))} placeholder="10 AM" /></div>
            <div><label>Result</label><input value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))} /></div>
          </div>
          <div className="row"><button type="submit"><Icon name="plus" /> Add</button></div>
        </form>
      </details>

      <div className="row" style={{ marginTop: 16 }}>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <Icon name="search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)', pointerEvents: 'none' }} />
          <input placeholder="Search by name or register number..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="tw">
          <table>
            <thead>
              <tr><th>Reg No.</th><th>Name</th><th>Paid?</th><th>Amount</th><th>Exam Status</th><th>Slot</th><th>Result</th><th>Toggle</th></tr>
            </thead>
            <tbody>
              {records.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--t2)' }}>No records yet</td></tr>}
              {records.map(r => (
                <tr key={r.registerNo}>
                  <td>{r.registerNo}</td><td>{r.studentName || '—'}</td>
                  <td><span className={`tag ${r.paid === 'Yes' ? 'ok' : 'err'}`}>{r.paid}</span></td>
                  <td>{r.amount ? `Rs. ${r.amount}` : '—'}</td>
                  <td><span className={`tag ${r.examStatus === 'Completed' ? 'ok' : ''}`}>{r.examStatus}</span></td>
                  <td>{r.slot || '—'}</td><td>{r.result || '—'}</td>
                  <td>
                    <label style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={r.examStatus === 'Completed'} onChange={() => handleToggle(r)} />
                      {r.examStatus === 'Completed' ? 'Completed' : 'Pending'}
                    </label>
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

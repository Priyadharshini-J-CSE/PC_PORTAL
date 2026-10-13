import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportResult from '../../components/ImportResult';
import StatCard from '../../components/StatCard';
import Icon from '../../components/Icon';
import { ROSTER } from '../../config/roster';

const PAID_OPTS   = ['Yes', 'No'];
const STATUS_OPTS = ['Pending', 'Completed'];

export default function PCLingua() {
  const [rows, setRows]             = useState([]);   // working copy — editable
  const [original, setOriginal]     = useState([]);   // snapshot for dirty detection
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [importResult, setImportResult] = useState(null);
  const [addForm, setAddForm]       = useState({ registerNo: '', paid: 'No', amount: '', examStatus: 'Pending', slot: '', result: '' });
  const toast = useToast();
  const fileRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/lingua', { params: { search } });
      setRows(res.data.map(r => ({ ...r })));
      setOriginal(res.data.map(r => ({ ...r })));
    } catch { toast('Failed to load Lingua data', 'error'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  // Mark a cell edit on a row
  function edit(registerNo, field, value) {
    setRows(prev => prev.map(r => r.registerNo === registerNo ? { ...r, [field]: value } : r));
  }

  // Detect which rows changed
  const dirtyRows = rows.filter(r => {
    const orig = original.find(o => o.registerNo === r.registerNo);
    if (!orig) return true;
    return ['paid', 'amount', 'examStatus', 'slot', 'result'].some(f => String(r[f] ?? '') !== String(orig[f] ?? ''));
  });

  async function saveAll() {
    if (!dirtyRows.length) { toast('No changes to save', 'error'); return; }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const r of dirtyRows) {
      try {
        await api.put(`/api/lingua/${r.registerNo}`, r);
        ok++;
      } catch { fail++; }
    }
    setSaving(false);
    if (fail) toast(`${ok} saved, ${fail} failed`, 'error');
    else toast(`${ok} record${ok > 1 ? 's' : ''} saved`, 'success');
    load();
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!addForm.registerNo) { toast('Select a register number', 'error'); return; }
    try {
      await api.post('/api/lingua', addForm);
      toast('Record added', 'success');
      setAddForm({ registerNo: '', paid: 'No', amount: '', examStatus: 'Pending', slot: '', result: '' });
      load();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
  }

  async function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/api/lingua/import', fd);
      setImportResult({ type: 'success', ...res.data });
      toast(res.data.message, 'success'); load();
    } catch (err) {
      const d = err.response?.data || {};
      setImportResult({ type: 'error', error: d.error || 'Import failed', detail: d.detail, hint: d.hint });
    }
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

  const paid       = rows.filter(r => r.paid === 'Yes');
  const done       = rows.filter(r => r.examStatus === 'Completed');
  const paidNotDone = paid.filter(r => r.examStatus !== 'Completed');
  const notPaid    = rows.filter(r => r.paid !== 'Yes');

  // Filtered view for search
  const visible = search
    ? rows.filter(r => r.registerNo.includes(search.toUpperCase()) || (r.studentName || '').toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <>
      <div className="top">
        <div><small>PC Portal</small><h1>Lingua Skills</h1></div>
        <button
          onClick={saveAll}
          disabled={saving || dirtyRows.length === 0}
          style={{ background: dirtyRows.length ? 'var(--o)' : undefined, color: dirtyRows.length ? '#fff' : undefined }}>
          <Icon name="floppy-disk" style={saving ? { animation: 'spin 1s linear infinite' } : {}} />
          {saving ? ' Saving…' : dirtyRows.length ? ` Save ${dirtyRows.length} change${dirtyRows.length > 1 ? 's' : ''}` : ' Save Changes'}
        </button>
      </div>

      <div className="stats">
        <StatCard icon="circle-check"      value={done.length}        label="Total completed" />
        <StatCard icon="indian-rupee-sign" value={`${paid.length} / Rs.${paid.reduce((a, r) => a + (+r.amount || 0), 0)}`} label="Paid" />
        <StatCard icon="hourglass-half"    value={paidNotDone.length} label="Paid, not taken" />
        <StatCard icon="user-xmark"        value={notPaid.length}     label="Not paid" />
      </div>

      {/* ── Toolbar ── */}
      <div className="row" style={{ marginTop: 16, marginBottom: 4 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Icon name="search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)', pointerEvents: 'none' }} />
          <input placeholder="Search name or reg no…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        <button className="s" onClick={() => fileRef.current.click()}><Icon name="upload" /> Import</button>
        <button className="s" onClick={downloadTemplate}><Icon name="download" /> Template</button>
        <button className="s" onClick={handleExport}><Icon name="download" /> Export</button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />


      </div>

      <ImportResult result={importResult} onClose={() => setImportResult(null)} />

      {/* ── Add single record ── */}
      <details className="box" style={{ marginBottom: 12 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}><Icon name="plus" style={{ marginRight: 8 }} />Add single record</summary>
        <form onSubmit={handleAdd}>
          <div className="grid" style={{ marginTop: 12 }}>
            <div><label>Register No.</label>
              <select value={addForm.registerNo} onChange={e => setAddForm(f => ({ ...f, registerNo: e.target.value }))}>
                <option value="">-- Select --</option>
                {ROSTER.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label>Paid?</label>
              <select value={addForm.paid} onChange={e => setAddForm(f => ({ ...f, paid: e.target.value }))}>
                {PAID_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div><label>Amount (Rs.)</label>
              <input type="number" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div><label>Exam Status</label>
              <select value={addForm.examStatus} onChange={e => setAddForm(f => ({ ...f, examStatus: e.target.value }))}>
                {STATUS_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div><label>Slot</label>
              <input value={addForm.slot} onChange={e => setAddForm(f => ({ ...f, slot: e.target.value }))} placeholder="e.g. 10 AM" />
            </div>
            <div><label>Result</label>
              <input value={addForm.result} onChange={e => setAddForm(f => ({ ...f, result: e.target.value }))} />
            </div>
          </div>
          <div className="row"><button type="submit"><Icon name="plus" /> Add</button></div>
        </form>
      </details>

      {/* ── Inline-editable table ── */}
      {loading ? <LoadingSpinner /> : (
        <>
          <p style={{ fontSize: '.82rem', color: 'var(--t2)', margin: '0 0 6px' }}>
            <Icon name="info" style={{ marginRight: 6 }} />
            Edit any cell directly in the table, then click <b>Save Changes</b> at the top.
            {dirtyRows.length > 0 && <span style={{ color: 'var(--o)', marginLeft: 8 }}>{dirtyRows.length} unsaved change{dirtyRows.length > 1 ? 's' : ''}</span>}
          </p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Reg No.</th><th>Name</th>
                  <th>Paid?</th><th>Amount (Rs.)</th>
                  <th>Exam Status</th><th>Slot</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--t2)' }}>No records found</td></tr>
                )}
                {visible.map(r => {
                  const dirty = dirtyRows.some(d => d.registerNo === r.registerNo);
                  return (
                    <tr key={r.registerNo} style={{ background: dirty ? '#fff8f0' : undefined }}>
                      <td style={{ whiteSpace: 'nowrap' }}>{r.registerNo}</td>
                      <td>{r.studentName || '—'}</td>
                      <td>
                        <select value={r.paid} onChange={e => edit(r.registerNo, 'paid', e.target.value)}
                          style={{ border: 'none', background: 'transparent', fontWeight: 600, color: r.paid === 'Yes' ? 'var(--ok, #22c55e)' : 'var(--err, #ef4444)', cursor: 'pointer', padding: '2px 4px' }}>
                          {PAID_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" value={r.amount ?? ''} onChange={e => edit(r.registerNo, 'amount', e.target.value)}
                          style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }} />
                      </td>
                      <td>
                        <select value={r.examStatus}
                          disabled={r.paid !== 'Yes'}
                          onChange={e => edit(r.registerNo, 'examStatus', e.target.value)}
                          style={{ border: 'none', background: 'transparent', fontWeight: 600, color: r.examStatus === 'Completed' ? 'var(--ok, #22c55e)' : 'var(--t2)', cursor: r.paid !== 'Yes' ? 'not-allowed' : 'pointer', padding: '2px 4px', opacity: r.paid !== 'Yes' ? 0.4 : 1 }}>
                          {STATUS_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </td>
                      <td>
                        <input value={r.slot ?? ''} onChange={e => edit(r.registerNo, 'slot', e.target.value)}
                          placeholder="—" style={{ width: 90, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }} />
                      </td>
                      <td>
                        <input value={r.result ?? ''}
                          disabled={r.examStatus !== 'Completed'}
                          onChange={e => edit(r.registerNo, 'result', e.target.value)}
                          placeholder="—" style={{ width: 90, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', opacity: r.examStatus !== 'Completed' ? 0.4 : 1, cursor: r.examStatus !== 'Completed' ? 'not-allowed' : 'text' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

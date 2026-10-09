import { useEffect, useState, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportResult from '../../components/ImportResult';

const COLS = [
  ['registerNo', 'Reg No.'], ['rollNo', 'Roll No.'], ['name', 'Name'],
  ['dept', 'Dept'], ['year', 'Year'], ['cgpa', 'CGPA'],
  ['arrearsStanding', 'Stand. Arrears'], ['mobile', 'Mobile'],
  ['hostelDay', 'Hostel/Day'], ['gender', 'Gender'],
];

export default function PCStudents() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const toast = useToast();
  const fileRef = useRef();
  const LIMIT = 50;

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/students', { params: { search, page, limit: LIMIT } });
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch {
      toast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, page]);

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/api/students/import', fd);
      setImportResult(res.data);
      toast(res.data.message, 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Import failed', 'error');
    }
    e.target.value = '';
  }

  async function handleExport() {
    const res = await api.get('/api/students/export', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
  }

  async function handleSave(registerNo, updates) {
    try {
      await api.put(`/api/students/${registerNo}`, updates);
      toast('Student updated', 'success');
      setEditStudent(null);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Update failed', 'error');
    }
  }

  return (
    <>
      <div className="top"><div><small>PC Portal</small><h1>Students</h1></div></div>

      <div className="row">
        <input
          placeholder="Search by name or register number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 320 }}
        />
        <button className="s" onClick={handleExport}>⬇ Export CSV</button>
        <button className="s" onClick={() => fileRef.current.click()}>⬆ Import CSV</button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
        <a
          href="/api/students/export"
          style={{ fontSize: '0.8rem', color: 'var(--t2)' }}
          onClick={(e) => { e.preventDefault(); handleExport(); }}
        >
          Download sample template
        </a>
      </div>

      <ImportResult result={importResult} onClose={() => setImportResult(null)} />

      {loading ? <LoadingSpinner /> : (
        <>
          <p><b>{total}</b> students</p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  {COLS.map(([k, l]) => <th key={k}>{l}</th>)}
                  <th>Profile</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr><td colSpan={COLS.length + 2} style={{ textAlign: 'center', color: 'var(--t2)' }}>No students found</td></tr>
                )}
                {students.map((s) => (
                  <tr key={s.registerNo}>
                    {COLS.map(([k]) => <td key={k}>{s[k] ?? '—'}</td>)}
                    <td>
                      {s.profile?.resumeLink ? <a href={s.profile.resumeLink} target="_blank" rel="noreferrer">Resume</a> : '—'}
                      {' '}
                      {s.profile?.portfolioLink ? <a href={s.profile.portfolioLink} target="_blank" rel="noreferrer">Portfolio</a> : ''}
                    </td>
                    <td>
                      <button className="s" style={{ padding: '4px 10px' }} onClick={() => setEditStudent(s)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="s" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>Page {page} of {Math.ceil(total / LIMIT) || 1}</span>
            <button className="s" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}

      {editStudent && (
        <EditModal student={editStudent} onSave={handleSave} onClose={() => setEditStudent(null)} />
      )}
    </>
  );
}

function EditModal({ student, onSave, onClose }) {
  const [form, setForm] = useState({
    name: student.name || '',
    mobile: student.mobile || '',
    hostelDay: student.hostelDay || '',
    year: student.year || '',
    cgpa: student.cgpa || '',
    arrearsHistory: student.arrearsHistory || '',
    arrearsStanding: student.arrearsStanding || '',
    domainMail: student.domainMail || '',
    personalMail: student.personalMail || '',
    address: student.address || '',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="box" style={{ width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <b>Edit: {student.registerNo}</b>
          <button className="s" onClick={onClose}>✕</button>
        </div>
        <div className="grid">
          {Object.entries(form).map(([k, v]) => (
            <div key={k}>
              <label>{k}</label>
              <input value={v} onChange={(e) => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button onClick={() => onSave(student.registerNo, form)}>Save</button>
          <button className="s" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

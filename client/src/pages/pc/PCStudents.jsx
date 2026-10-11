import { useEffect, useState, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportResult from '../../components/ImportResult';
import Icon from '../../components/Icon';

const COLS = [
  ['registerNo','Reg No.'],['rollNo','Roll No.'],['name','Name'],
  ['dept','Dept'],['year','Year'],['cgpa','CGPA'],
  ['arrearsStanding','Stand. Arrears'],['mobile','Mobile'],
  ['hostelDay','Hostel/Day'],['gender','Gender'],
];
const LIMIT = 50;

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

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/students', { params: { search, page, limit: LIMIT } });
      setStudents(res.data.students); setTotal(res.data.total);
    } catch { toast('Failed to load students', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [search, page]);

  async function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/api/students/import', fd);
      setImportResult(res.data); toast(res.data.message, 'success'); load();
    } catch (err) { toast(err.response?.data?.error || 'Import failed', 'error'); }
    e.target.value = '';
  }

  async function handleExport() {
    const res = await api.get('/api/students/export', { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.data); a.download = 'students.csv'; a.click();
  }

  async function handleSave(registerNo, updates) {
    try {
      await api.put(`/api/students/${registerNo}`, updates);
      toast('Student updated', 'success'); setEditStudent(null); load();
    } catch (err) { toast(err.response?.data?.error || 'Update failed', 'error'); }
  }

  return (
    <>
      <div className="top"><div><small>PC Portal</small><h1>Students</h1></div></div>

      <div className="row">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)', pointerEvents: 'none' }} />
          <input placeholder="Search by name or register number..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }} />
        </div>
        <button className="s" onClick={handleExport}><Icon name="download" /> Export CSV</button>
        <button className="s" onClick={() => fileRef.current.click()}><Icon name="upload" /> Import CSV</button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      <ImportResult result={importResult} onClose={() => setImportResult(null)} />

      {loading ? <LoadingSpinner /> : (
        <>
          <p><b>{total}</b> students</p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  {COLS.map(([k,l]) => <th key={k}>{l}</th>)}
                  <th>Profile</th><th></th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && <tr><td colSpan={COLS.length + 2} style={{ textAlign: 'center', color: 'var(--t2)' }}>No students found</td></tr>}
                {students.map(s => (
                  <tr key={s.registerNo}>
                    {COLS.map(([k]) => <td key={k}>{s[k] ?? '—'}</td>)}
                    <td>
                      {s.profile?.resumeLink ? <a href={s.profile.resumeLink} target="_blank" rel="noreferrer">Resume</a> : '—'}
                      {s.profile?.portfolioLink ? <> · <a href={s.profile.portfolioLink} target="_blank" rel="noreferrer">Portfolio</a></> : ''}
                    </td>
                    <td>
                      <button className="s" style={{ padding: '4px 10px' }} onClick={() => setEditStudent(s)}>
                        <Icon name="pen" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="s" disabled={page === 1} onClick={() => setPage(p => p - 1)}><Icon name="arrow-left" /> Prev</button>
            <span style={{ color: 'var(--t2)', fontSize: '.85rem' }}>Page {page} of {Math.ceil(total / LIMIT) || 1}</span>
            <button className="s" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next <Icon name="arrow-right" /></button>
          </div>
        </>
      )}

      {editStudent && <EditModal student={editStudent} onSave={handleSave} onClose={() => setEditStudent(null)} />}
    </>
  );
}

function EditModal({ student, onSave, onClose }) {
  const [form, setForm] = useState({
    name: student.name || '', mobile: student.mobile || '',
    hostelDay: student.hostelDay || '', year: student.year || '',
    cgpa: student.cgpa || '', arrearsHistory: student.arrearsHistory || '',
    arrearsStanding: student.arrearsStanding || '', domainMail: student.domainMail || '',
    personalMail: student.personalMail || '', address: student.address || '',
  });

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <b>Edit: {student.registerNo}</b>
          <button className="s" style={{ padding: '4px 10px' }} onClick={onClose}><Icon name="xmark" /></button>
        </div>
        <div className="grid">
          {Object.entries(form).map(([k, v]) => (
            <div key={k}>
              <label>{k}</label>
              <input value={v} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button onClick={() => onSave(student.registerNo, form)}><Icon name="floppy-disk" /> Save</button>
          <button className="s" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

const COLS = [
  ['registerNo','Reg No.'],['rollNo','Roll No.'],['name','Name'],
  ['dept','Dept'],['year','Year'],['cgpa','CGPA'],
  ['arrearsStanding','Stand. Arrears'],['hostelDay','Hostel/Day'],
  ['gender','Gender'],['itCore','IT/Core'],
];
const LIMIT = 50;

export default function FacultyStudents() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/students', { params: { search, page, limit: LIMIT } })
      .then(r => { setStudents(r.data.students); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <>
      <div className="top"><div><small>Faculty Portal</small><h1>Students</h1></div></div>
      <span className="tag"><Icon name="eye" style={{ marginRight: 6 }} />View only</span>
      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <Icon name="search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)', pointerEvents: 'none' }} />
          <input placeholder="Search by name or register number..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36 }} />
        </div>
      </div>
      {loading ? <LoadingSpinner /> : (
        <>
          <p><b>{total}</b> students</p>
          <div className="tw">
            <table>
              <thead><tr>{COLS.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
              <tbody>
                {students.length === 0 && <tr><td colSpan={COLS.length} style={{ textAlign: 'center', color: 'var(--t2)' }}>No students found</td></tr>}
                {students.map(s => <tr key={s.registerNo}>{COLS.map(([k]) => <td key={k}>{s[k] ?? '—'}</td>)}</tr>)}
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
    </>
  );
}

import { useEffect, useState } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

const COLS_D1 = [
  ['rollNo',          'Roll No.'],
  ['universityRegNo', 'Reg No. (Univ)'],
  ['name',            'Name'],
  ['technicalSkills', 'Tech Skills'],
  ['mobile',          'Mobile'],
  ['hostelDay',       'Hostel/Day'],
  ['placement',       'Placement'],
  ['dept',            'Dept'],
  ['gender',          'Gender'],
  ['dob',             'DOB'],
  ['itCore',          'IT/Core'],
  ['transport',       'Transport'],
  ['tenth',           '10th %'],
  ['twelfth',         '12th %'],
  ['diploma',         'Diploma %'],
  ['cgpa',            'CGPA'],
  ['arrearsHistory',  'Arrears (Hist)'],
  ['arrearsStanding', 'Arrears (Stand)'],
  ['domainMail',      'Domain Mail'],
  ['personalMail',    'Personal Mail'],
  ['resumeLink',      'Resume'],
  ['videoLink',       '1-Min Video'],
  ['portfolioLink',   'Portfolio'],
  ['interestedDomain','Int. Domain'],
  ['address',         'Address'],
];

const COLS_D2 = [
  ['rollNo',                        'Roll No.'],
  ['universityRegNo',               'Reg No. (Univ)'],
  ['name',                          'Name'],
  ['cgpa',                          'CGPA'],
  ['internalHackParticipated',      'Int. Hack (Part.)'],
  ['internalHackWon',               'Int. Hack (Won)'],
  ['externalHackParticipated',      'Ext. Hack (Part.)'],
  ['externalHackWon',               'Ext. Hack (Won)'],
  ['externalOnlineHackParticipated','Ext. Online (Part.)'],
  ['externalOnlineHackWon',         'Ext. Online (Won)'],
  ['externalInternAttended',        'Intern Attended'],
  ['certName',                      'Certificate'],
  ['certLink',                      'Cert. Link'],
];

const LIMIT = 50;

export default function FacultyStudents() {
  const [students, setStudents] = useState([]);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('d1');

  useEffect(() => {
    setLoading(true);
    api.get('/api/students', { params: { search, page, limit: LIMIT } })
      .then(r => { setStudents(r.data.students); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  const COLS = view === 'd1' ? COLS_D1 : COLS_D2;

  return (
    <>
      <div className="top"><div><small>Faculty Portal</small><h1>Students</h1></div></div>
      <span className="tag"><Icon name="eye" style={{ marginRight: 6 }} />View only</span>

      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)', pointerEvents: 'none' }} />
          <input placeholder="Search by name or register number..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36 }} />
        </div>

        <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setView('d1')}
            style={{ padding: '6px 14px', border: 'none', borderRadius: 0, background: view === 'd1' ? 'var(--o)' : 'transparent', color: view === 'd1' ? '#fff' : 'var(--t1)', fontWeight: view === 'd1' ? 600 : 400, cursor: 'pointer' }}>
            <Icon name="table" /> Data 1
          </button>
          <button
            onClick={() => setView('d2')}
            style={{ padding: '6px 14px', border: 'none', borderRadius: 0, background: view === 'd2' ? 'var(--o)' : 'transparent', color: view === 'd2' ? '#fff' : 'var(--t1)', fontWeight: view === 'd2' ? 600 : 400, cursor: 'pointer' }}>
            <Icon name="chart-bar" /> Data 2
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <p><b>{total}</b> students — showing <b>{view === 'd1' ? 'Data 1 (Student Info)' : 'Data 2 (Hackathon / Certs)'}</b></p>
          <div className="tw">
            <table>
              <thead>
                <tr>{COLS.map(([k, l]) => <th key={k}>{l}</th>)}</tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr><td colSpan={COLS.length} style={{ textAlign: 'center', color: 'var(--t2)' }}>No students found</td></tr>
                )}
                {students.map(s => (
                  <tr key={s.registerNo}>
                    {COLS.map(([k]) => (
                      <td key={k}>
                        {k === 'resumeLink' && s[k] ? <a href={s[k]} target="_blank" rel="noreferrer">Link</a>
                          : k === 'portfolioLink' && s[k] ? <a href={s[k]} target="_blank" rel="noreferrer">Link</a>
                          : k === 'videoLink' && s[k] ? <a href={s[k]} target="_blank" rel="noreferrer">Link</a>
                          : k === 'certLink' && s[k] ? <a href={s[k]} target="_blank" rel="noreferrer">Link</a>
                          : (s[k] ?? '—')}
                      </td>
                    ))}
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
    </>
  );
}

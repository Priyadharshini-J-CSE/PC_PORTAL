import { useEffect, useState, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportResult from '../../components/ImportResult';
import Icon from '../../components/Icon';

// Data 1 — student info columns
const COLS_D1 = [
  ['rollNo',          'Roll No.'],
  ['universityRegNo', 'Reg No. (Univ)'],
  ['registerNo',      'DB Key'],
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

// Data 2 — hackathon / cert columns
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

// Exact column names the server expects
const DATA1_COLS = [
  ['ROLL NO',                          'Roll number — e.g. 24CS141',                         true],
  ['NAME WITH INITIAL AFTER NAME',     'Full name with initial after name',                  false],
  ['REGISTER NO.',                     'University register number — e.g. 722824104141',     false],
  ['Technical skills strong',          'Technical skill strength description',               false],
  ['MOBILE NO',                        'Mobile number',                                      false],
  ['Hostel/Dayscholar',                'Hostel or Dayscholar',                               false],
  ['Placement',                        'Placement status',                                   false],
  ['DEPT',                             'Department — e.g. CSE',                              false],
  ['GENDER',                           'Gender',                                             false],
  ['DOB',                              'Date of birth',                                      false],
  ['IT/Core (Eg. IT/EIoT/VLSI/CORE)', 'IT or Core stream',                                  false],
  ['Transport',                        'Transport mode',                                     false],
  ['10TH PERCENTAGE',                  '10th standard percentage',                           false],
  ['12TH PERCENTAGE',                  '12th standard percentage',                           false],
  ['DIPLOMA PERCENTAGE',               'Diploma percentage (if applicable)',                 false],
  ['CGPA OUT OF 10 (AS ON DATE)',      'Current CGPA out of 10',                             false],
  ['HISTORY OF ARREARS',               'Total number of arrears ever',                       false],
  ['STANDING ARREARS',                 'Current standing arrears',                           false],
  ['DOMAIN MAIL ID',                   'College domain email',                               false],
  ['PERSONAL MAIL ID',                 'Personal email',                                     false],
  ['RESUME',                           'Resume drive/link URL',                              false],
  ['1 minute Video for Resume link',   '1-minute video resume link',                         false],
  ['PORTFOLIO LINK',                   'Portfolio website link',                             false],
  ['Interested Domain',                'Domain of interest — e.g. Web, AI',                  false],
  ['Address',                          'Home address',                                       false],
];

const DATA2_COLS = [
  ['Register Number',                              'University register number — e.g. 722824104141 (must match Data 1)', true],
  ['NAME WITH INITIAL AFTER NAME',                 'Full name',                                                          false],
  ['CGPA',                                         'Current CGPA',                                                       false],
  ['No of Internal hackathon (participated)',       'Internal hackathon participation count',                             false],
  ['No of Internal hackathon (Won)',                'Internal hackathon wins count',                                      false],
  ['No of External hackathon (participated)',       'External hackathon participation count',                             false],
  ['No of External hackathon (Won)',                'External hackathon wins count',                                      false],
  ['No of External Online hackathon (participated)','External online hackathon participation count',                      false],
  ['No of External Online hackathon (Won)',         'External online hackathon wins count',                               false],
  ['External intern attended',                     'Whether external internship was attended — Yes / No',                false],
  ['Professional certificate',                     'Name of professional certificate',                                   false],
  ['Professional Certificate (drive link)',         'Drive link to certificate',                                          false],
];

function ColGuide({ cols, title, onDownload }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontWeight: 600, fontSize: '.9rem' }}>
          <Icon name="info" style={{ marginRight: 8, color: 'var(--o)' }} />{title} — column guide
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
                <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--t2)', fontWeight: 600 }}>Exact column name in file</th>
                <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--t2)', fontWeight: 600 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {cols.map(([col, desc, required], i) => (
                <tr key={col} style={{ borderBottom: '1px solid var(--border)', opacity: required ? 1 : 0.85 }}>
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

const LIMIT = 50;

export default function PCStudents() {
  const [students, setStudents]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [importResult, setImportResult] = useState(null);
  const [editStudent, setEditStudent]   = useState(null);
  const [view, setView]             = useState('d1'); // 'd1' | 'd2'
  const [importMenu, setImportMenu] = useState(false);
  const toast = useToast();
  const file1Ref = useRef();
  const file2Ref = useRef();
  const importMenuRef = useRef();

  useEffect(() => {
    function close(e) {
      if (importMenuRef.current && !importMenuRef.current.contains(e.target)) setImportMenu(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

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
      setImportResult({ type: 'success', ...res.data });
      toast(res.data.message, 'success'); load();
    } catch (err) {
      const d = err.response?.data || {};
      setImportResult({ type: 'error', error: d.error || 'Import failed', detail: d.detail, hint: d.hint, expectedData1: d.expectedData1, expectedData2: d.expectedData2 });
    }
    e.target.value = '';
    setImportMenu(false);
  }

  async function handleExport() {
    const res = await api.get('/api/students/export', { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.data); a.download = 'students.csv'; a.click();
  }

  function downloadTemplate(fmt) {
    const cols = fmt === 'd1' ? DATA1_COLS : DATA2_COLS;
    const header = cols.map(([c]) => c).join(',');
    const example = cols.map(([c]) => {
      if (c === 'ROLL NO') return '24CS141';
      if (c === 'REGISTER NO.' || c === 'Register Number') return '722824104141';
      if (c === 'NAME WITH INITIAL AFTER NAME') return 'John Doe S';
      if (c === 'CGPA' || c === 'CGPA OUT OF 10 (AS ON DATE)') return '8.5';
      if (c.includes('hackathon') || c.includes('intern')) return '0';
      return '';
    }).join(',');
    const csv = `${header}\n${example}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = fmt === 'd1' ? 'data1-template.csv' : 'data2-template.csv';
    a.click();
  }

  async function handleSave(registerNo, updates) {
    try {
      await api.put(`/api/students/${registerNo}`, updates);
      toast('Student updated', 'success'); setEditStudent(null); load();
    } catch (err) { toast(err.response?.data?.error || 'Update failed', 'error'); }
  }

  const COLS = view === 'd1' ? COLS_D1 : COLS_D2;

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

        {/* Data 1 / Data 2 toggle */}
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

        <button className="s" onClick={handleExport}><Icon name="download" /> Export</button>

        <div style={{ position: 'relative' }} ref={importMenuRef}>
          <button className="s" onClick={() => setImportMenu(m => !m)}>
            <Icon name="upload" /> Import <Icon name="chevron-down" />
          </button>
          {importMenu && (
            <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px #0002', zIndex: 10, minWidth: 190 }}>
              <button className="s" style={{ width: '100%', textAlign: 'left', borderRadius: '8px 8px 0 0' }} onClick={() => file1Ref.current.click()}>
                <Icon name="table" /> Data 1 (Student Info)
              </button>
              <button className="s" style={{ width: '100%', textAlign: 'left', borderRadius: '0 0 8px 8px' }} onClick={() => file2Ref.current.click()}>
                <Icon name="chart-bar" /> Data 2 (Hackathon / Certs)
              </button>
            </div>
          )}
        </div>
        <input ref={file1Ref} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        <input ref={file2Ref} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      <ImportResult result={importResult} onClose={() => setImportResult(null)} />

      <ColGuide title="Data 1 (Student Info)" cols={DATA1_COLS} onDownload={() => downloadTemplate('d1')} />
      <ColGuide title="Data 2 (Hackathon / Certs)" cols={DATA2_COLS} onDownload={() => downloadTemplate('d2')} />

      {loading ? <LoadingSpinner /> : (
        <>
          <p><b>{total}</b> students — showing <b>{view === 'd1' ? 'Data 1 (Student Info)' : 'Data 2 (Hackathon / Certs)'}</b></p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  {COLS.map(([k, l]) => <th key={k}>{l}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr><td colSpan={COLS.length + 1} style={{ textAlign: 'center', color: 'var(--t2)' }}>No students found</td></tr>
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
    // Data 1
    name:             student.name || '',
    technicalSkills:  student.technicalSkills || '',
    mobile:           student.mobile || '',
    hostelDay:        student.hostelDay || '',
    placement:        student.placement || '',
    dept:             student.dept || '',
    gender:           student.gender || '',
    dob:              student.dob || '',
    itCore:           student.itCore || '',
    transport:        student.transport || '',
    tenth:            student.tenth || '',
    twelfth:          student.twelfth || '',
    diploma:          student.diploma || '',
    cgpa:             student.cgpa || '',
    arrearsHistory:   student.arrearsHistory || '',
    arrearsStanding:  student.arrearsStanding || '',
    domainMail:       student.domainMail || '',
    personalMail:     student.personalMail || '',
    resumeLink:       student.resumeLink || '',
    videoLink:        student.videoLink || '',
    portfolioLink:    student.portfolioLink || '',
    interestedDomain: student.interestedDomain || '',
    address:          student.address || '',
    // Data 2
    internalHackParticipated:       student.internalHackParticipated || '',
    internalHackWon:                student.internalHackWon || '',
    externalHackParticipated:       student.externalHackParticipated || '',
    externalHackWon:                student.externalHackWon || '',
    externalOnlineHackParticipated: student.externalOnlineHackParticipated || '',
    externalOnlineHackWon:          student.externalOnlineHackWon || '',
    externalInternAttended:         student.externalInternAttended || '',
    certName:                       student.certName || '',
    certLink:                       student.certLink || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = (k, label) => (
    <div key={k}>
      <label>{label}</label>
      <input value={form[k]} onChange={e => set(k, e.target.value)} />
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 720, width: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <b>Edit: {student.rollNo || student.registerNo}</b>
          <button className="s" style={{ padding: '4px 10px' }} onClick={onClose}><Icon name="xmark" /></button>
        </div>

        <p style={{ fontSize: '.8rem', color: 'var(--t2)', marginBottom: 8 }}>Data 1 — Student Info</p>
        <div className="grid">
          {inp('name',            'Name')}
          {inp('technicalSkills', 'Tech Skills')}
          {inp('mobile',          'Mobile')}
          {inp('hostelDay',       'Hostel/Day')}
          {inp('placement',       'Placement')}
          {inp('dept',            'Dept')}
          {inp('gender',          'Gender')}
          {inp('dob',             'DOB')}
          {inp('itCore',          'IT/Core')}
          {inp('transport',       'Transport')}
          {inp('tenth',           '10th %')}
          {inp('twelfth',         '12th %')}
          {inp('diploma',         'Diploma %')}
          {inp('cgpa',            'CGPA')}
          {inp('arrearsHistory',  'Arrears (History)')}
          {inp('arrearsStanding', 'Arrears (Standing)')}
          {inp('domainMail',      'Domain Mail')}
          {inp('personalMail',    'Personal Mail')}
          {inp('resumeLink',      'Resume Link')}
          {inp('videoLink',       '1-Min Video Link')}
          {inp('portfolioLink',   'Portfolio Link')}
          {inp('interestedDomain','Interested Domain')}
          {inp('address',         'Address')}
        </div>

        <p style={{ fontSize: '.8rem', color: 'var(--t2)', margin: '16px 0 8px' }}>Data 2 — Hackathon / Certs</p>
        <div className="grid">
          {inp('internalHackParticipated',       'Int. Hack (Participated)')}
          {inp('internalHackWon',                'Int. Hack (Won)')}
          {inp('externalHackParticipated',       'Ext. Hack (Participated)')}
          {inp('externalHackWon',                'Ext. Hack (Won)')}
          {inp('externalOnlineHackParticipated', 'Ext. Online Hack (Participated)')}
          {inp('externalOnlineHackWon',          'Ext. Online Hack (Won)')}
          {inp('externalInternAttended',         'Intern Attended')}
          {inp('certName',                       'Certificate Name')}
          {inp('certLink',                       'Certificate Link')}
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <button onClick={() => onSave(student.registerNo, form)}><Icon name="floppy-disk" /> Save</button>
          <button className="s" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

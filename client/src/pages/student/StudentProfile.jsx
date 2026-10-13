import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

// Master fields shown read-only (PC-maintained)
const READONLY = [
  ['Roll No.',       'registerNo'],
  ['Reg No. (Univ)', 'universityRegNo'],
  ['Name',           'name'],
  ['Department',     'dept'],
  ['Year',           'year'],
  ['Gender',         'gender'],
  ['DOB',            'dob'],
  ['10th %',         'tenth'],
  ['12th %',         'twelfth'],
  ['Diploma %',      'diploma'],
  ['CGPA (Master)',  'cgpa'],
  ['Hostel/Day',     'hostelDay'],
  ['Mobile',         'mobile'],
  ['Domain Mail',    'domainMail'],
  ['Personal Mail',  'personalMail'],
  ['IT/Core',        'itCore'],
  ['Transport',      'transport'],
  ['Placement',      'placement'],
  ['Address',        'address'],
];

const EMPTY_INTERN = { internType: '', internPlace: '', internMode: '', internStipend: '', internOther: '' };

const EMPTY_FORM = {
  resumeLink: '', portfolioLink: '', videoLink: '', interestedDomain: '', cgpa: '',
  internalHackParticipated: '', internalHackWon: '',
  externalHackParticipated: '', externalHackWon: '',
  externalOnlineHackParticipated: '', externalOnlineHackWon: '',
  interns: [],
  certName: '', certLink: '',
};

export default function StudentProfile() {
  const toast = useToast();
  const [master, setMaster]   = useState({});
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false); // show confirm modal
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get('/api/profile/me')
      .then(r => {
        setMaster(r.data.master || {});
        const p = r.data.profile || {};
        setForm({
          resumeLink:                    p.resumeLink                    ?? '',
          portfolioLink:                 p.portfolioLink                 ?? '',
          videoLink:                     p.videoLink                     ?? '',
          interestedDomain:              p.interestedDomain              ?? '',
          cgpa:                          p.cgpa                          ?? '',
          internalHackParticipated:      p.internalHackParticipated      ?? '',
          internalHackWon:               p.internalHackWon               ?? '',
          externalHackParticipated:      p.externalHackParticipated      ?? '',
          externalHackWon:               p.externalHackWon               ?? '',
          externalOnlineHackParticipated:p.externalOnlineHackParticipated ?? '',
          externalOnlineHackWon:         p.externalOnlineHackWon         ?? '',
          // migrate legacy single-intern to array if needed
          interns: p.interns?.length
            ? p.interns
            : p.internPlace
              ? [{ internType: p.internType || '', internPlace: p.internPlace || '', internMode: p.internMode || '', internStipend: p.internStipend || '', internOther: p.internOther || '' }]
              : [],
          certName:                      p.certName                      ?? '',
          certLink:                      p.certLink                      ?? '',
        });
      })
      .catch(() => toast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function doSave() {
    setSaving(true);
    setConfirm(false);
    try {
      const payload = {
        ...form,
        externalInternAttended: form.interns.length > 0 ? 'Yes' : 'No',
      };
      await api.put('/api/profile/me', payload);
      toast('Profile saved successfully', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Intern array helpers
  const addIntern    = () => setForm(f => ({ ...f, interns: [...f.interns, { ...EMPTY_INTERN }] }));
  const removeIntern = (i) => setForm(f => ({ ...f, interns: f.interns.filter((_, idx) => idx !== i) }));
  const setIntern    = (i, k, v) => setForm(f => ({
    ...f,
    interns: f.interns.map((item, idx) => idx === i ? { ...item, [k]: v } : item),
  }));

  if (loading) return <LoadingSpinner />;

  const inp = (k, label, type = 'text') => (
    <div key={k}>
      <label>{label}</label>
      <input type={type} step={type === 'number' ? 'any' : undefined}
        value={form[k] ?? ''} onChange={e => set(k, e.target.value)} />
    </div>
  );

  const sel = (k, label, options) => (
    <div key={k}>
      <label>{label}</label>
      <select value={form[k] ?? ''} onChange={e => set(k, e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <div className="top"><div><small>Student Portal</small><h1>My Profile</h1></div></div>

      {/* ── Master data (read-only) ── */}
      <div className="box" style={{ marginBottom: 16 }}>
        <b>Master data <span style={{ color: 'var(--t2)', fontWeight: 400, fontSize: '.85rem' }}>(maintained by PC — read only)</span></b>
        <div className="grid" style={{ marginTop: 8 }}>
          {READONLY.map(([l, k]) => (
            <div key={k}>
              <label>{l}</label>
              <input value={master[k] ?? '—'} readOnly
                style={{ background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--t2)', border: '1px solid var(--border)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Editable fields ── */}
      <div className="box">
        <b>My editable fields</b>
        <p style={{ color: 'var(--t2)', fontSize: '.85rem', marginBottom: 12 }}>Only these fields can be updated by you.</p>

        <div className="grid">
          {inp('resumeLink',     'Resume link')}
          {inp('portfolioLink',  'Portfolio link')}
          {inp('videoLink',      '1-minute video link')}
          {inp('interestedDomain','Interested domain')}
          {inp('cgpa',           'CGPA', 'number')}
        </div>

        {/* Hackathons */}
        <p style={{ fontWeight: 600, margin: '16px 0 8px', fontSize: '.9rem' }}>
          <Icon name="trophy" style={{ marginRight: 8, color: 'var(--o)' }} />Hackathons
        </p>
        <div className="grid">
          {inp('internalHackParticipated',       'Internal — participated', 'number')}
          {inp('internalHackWon',                'Internal — won',          'number')}
          {inp('externalHackParticipated',       'External — participated', 'number')}
          {inp('externalHackWon',                'External — won',          'number')}
          {inp('externalOnlineHackParticipated', 'External online — participated', 'number')}
          {inp('externalOnlineHackWon',          'External online — won',          'number')}
        </div>

        {/* Internships — multi-entry */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px' }}>
          <p style={{ fontWeight: 600, fontSize: '.9rem', margin: 0 }}>
            <Icon name="briefcase" style={{ marginRight: 8, color: 'var(--o)' }} />
            Internships
            <span style={{ fontWeight: 400, color: 'var(--t2)', fontSize: '.8rem', marginLeft: 8 }}>
              ({form.interns.length} added)
            </span>
          </p>
          <button type="button" className="s" onClick={addIntern}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" /> Add Internship
          </button>
        </div>

        {form.interns.length === 0 && (
          <p style={{ color: 'var(--t2)', fontSize: '.85rem', marginBottom: 8 }}>
            No internships added yet. Click <b>Add Internship</b> to add one.
          </p>
        )}

        {form.interns.map((intern, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, position: 'relative', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <b style={{ fontSize: '.88rem' }}>
                <Icon name="briefcase" style={{ marginRight: 6, color: 'var(--o)' }} />
                Internship {i + 1}
              </b>
              <button type="button" className="s"
                style={{ padding: '3px 8px', color: 'var(--err, #ef4444)' }}
                onClick={() => removeIntern(i)}>
                <Icon name="xmark" /> Remove
              </button>
            </div>
            <div className="grid">
              <div>
                <label>Internship type</label>
                <select value={intern.internType || ''} onChange={e => setIntern(i, 'internType', e.target.value)}>
                  <option value="">-- Select type --</option>
                  <option value="College">College internship (arranged by college)</option>
                  <option value="External">External internship (self-arranged / company)</option>
                </select>
              </div>
              <div>
                <label>Organization / Place</label>
                <input value={intern.internPlace || ''} onChange={e => setIntern(i, 'internPlace', e.target.value)} placeholder="Company or institution name" />
              </div>
              <div>
                <label>Mode</label>
                <select value={intern.internMode || ''} onChange={e => setIntern(i, 'internMode', e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label>Stipend received?</label>
                <select value={intern.internStipend || ''} onChange={e => setIntern(i, 'internStipend', e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Other details (optional)</label>
                <input value={intern.internOther || ''} onChange={e => setIntern(i, 'internOther', e.target.value)} placeholder="Duration, role, etc." />
              </div>
            </div>
          </div>
        ))}

        {/* Certificates */}
        <p style={{ fontWeight: 600, margin: '16px 0 8px', fontSize: '.9rem' }}>
          <Icon name="shield-halved" style={{ marginRight: 8, color: 'var(--o)' }} />Professional Certificate
        </p>
        <div className="grid">
          {inp('certName', 'Certificate name')}
          {inp('certLink', 'Certificate link')}
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          <button type="button" disabled={saving} onClick={() => setConfirm(true)}>
            <Icon name="floppy-disk" /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {confirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <b>Confirm profile update</b>
              <button className="s" style={{ padding: '4px 10px' }} onClick={() => setConfirm(false)}>
                <Icon name="xmark" />
              </button>
            </div>
            <p style={{ color: 'var(--t2)', marginBottom: 16 }}>
              Are you sure you want to save these changes to your profile? Please review your entries before confirming.
            </p>
            <div className="row">
              <button onClick={doSave}><Icon name="circle-check" /> Yes, save changes</button>
              <button className="s" onClick={() => setConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const EDITABLE = [
  { key: 'resumeLink', label: 'Resume link', type: 'text' },
  { key: 'portfolioLink', label: 'Portfolio link', type: 'text' },
  { key: 'videoLink', label: '1-minute video link', type: 'text' },
  { key: 'interestedDomain', label: 'Interested domain', type: 'text' },
  { key: 'cgpa', label: 'CGPA', type: 'number' },
  { key: 'internalHackParticipated', label: 'Internal hackathons participated', type: 'number' },
  { key: 'internalHackWon', label: 'Internal hackathons won', type: 'number' },
  { key: 'externalHackParticipated', label: 'External hackathons participated', type: 'number' },
  { key: 'externalHackWon', label: 'External hackathons won', type: 'number' },
  { key: 'externalOnlineHackParticipated', label: 'External online hackathons participated', type: 'number' },
  { key: 'externalOnlineHackWon', label: 'External online hackathons won', type: 'number' },
  { key: 'externalInternAttended', label: 'External intern attended', type: 'select', options: ['', 'Yes', 'No'] },
  { key: 'internPlace', label: 'Intern place / organization', type: 'text' },
  { key: 'internMode', label: 'Intern mode', type: 'select', options: ['', 'Online', 'Offline', 'Hybrid'] },
  { key: 'internStipend', label: 'Stipend', type: 'select', options: ['', 'Yes', 'No'] },
  { key: 'internOther', label: 'Other internship details', type: 'text' },
  { key: 'certName', label: 'Professional certificate name', type: 'text' },
  { key: 'certLink', label: 'Professional certificate link', type: 'text' },
];

export default function StudentProfile() {
  const toast = useToast();
  const [master, setMaster] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/profile/me')
      .then((r) => {
        setMaster(r.data.master || {});
        const p = r.data.profile || {};
        const initial = {};
        EDITABLE.forEach(({ key }) => { initial[key] = p[key] ?? ''; });
        setForm(initial);
      })
      .catch(() => toast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/profile/me', form);
      toast('Profile saved', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  const READONLY = [
    ['Register No.', master.registerNo], ['Roll No.', master.rollNo], ['Name', master.name],
    ['Department', master.dept], ['Year', master.year], ['Gender', master.gender],
    ['10th %', master.tenth], ['12th %', master.twelfth], ['CGPA (Master)', master.cgpa],
    ['Domain Mail', master.domainMail], ['Personal Mail', master.personalMail],
  ];

  return (
    <>
      <div className="top"><div><small>Student Portal</small><h1>My Profile</h1></div></div>

      <div className="box" style={{ marginBottom: 16 }}>
        <b>Master data (read-only)</b>
        <p style={{ marginBottom: 8 }}>These fields are maintained by the Placement Coordinator.</p>
        <div className="grid">
          {READONLY.map(([l, v]) => (
            <div key={l}>
              <label>{l}</label>
              <input value={v ?? ''} readOnly style={{ background: 'var(--mu)', cursor: 'not-allowed' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="box">
        <b>My editable fields</b>
        <p style={{ marginBottom: 8 }}>You can update only these fields.</p>
        <form onSubmit={handleSave}>
          <div className="grid">
            {EDITABLE.map(({ key, label, type, options }) => (
              <div key={key}>
                <label>{label}</label>
                {type === 'select' ? (
                  <select value={form[key] ?? ''} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}>
                    {options.map((o) => <option key={o} value={o}>{o || '-- Select --'}</option>)}
                  </select>
                ) : (
                  <input
                    type={type}
                    step={type === 'number' ? 'any' : undefined}
                    value={form[key] ?? ''}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
          </div>
        </form>
      </div>
    </>
  );
}

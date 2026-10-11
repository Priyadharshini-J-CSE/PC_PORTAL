import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

const EDITABLE = [
  { key: 'resumeLink',                    label: 'Resume link',                           type: 'text' },
  { key: 'portfolioLink',                 label: 'Portfolio link',                         type: 'text' },
  { key: 'videoLink',                     label: '1-minute video link',                    type: 'text' },
  { key: 'interestedDomain',              label: 'Interested domain',                      type: 'text' },
  { key: 'cgpa',                          label: 'CGPA',                                   type: 'number' },
  { key: 'internalHackParticipated',      label: 'Internal hackathons participated',        type: 'number' },
  { key: 'internalHackWon',              label: 'Internal hackathons won',                 type: 'number' },
  { key: 'externalHackParticipated',      label: 'External hackathons participated',        type: 'number' },
  { key: 'externalHackWon',              label: 'External hackathons won',                 type: 'number' },
  { key: 'externalOnlineHackParticipated',label: 'External online hackathons participated', type: 'number' },
  { key: 'externalOnlineHackWon',        label: 'External online hackathons won',           type: 'number' },
  { key: 'externalInternAttended',        label: 'External intern attended',                type: 'select', options: ['','Yes','No'] },
  { key: 'internPlace',                   label: 'Intern place / organization',             type: 'text' },
  { key: 'internMode',                    label: 'Intern mode',                             type: 'select', options: ['','Online','Offline','Hybrid'] },
  { key: 'internStipend',                 label: 'Stipend',                                 type: 'select', options: ['','Yes','No'] },
  { key: 'internOther',                   label: 'Other internship details',                type: 'text' },
  { key: 'certName',                      label: 'Professional certificate name',           type: 'text' },
  { key: 'certLink',                      label: 'Professional certificate link',           type: 'text' },
];

const READONLY = [
  ['Register No.','registerNo'],['Roll No.','rollNo'],['Name','name'],
  ['Department','dept'],['Year','year'],['Gender','gender'],
  ['10th %','tenth'],['12th %','twelfth'],['Domain Mail','domainMail'],
  ['Personal Mail','personalMail'],
];

export default function StudentProfile() {
  const toast = useToast();
  const [master, setMaster] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/profile/me')
      .then(r => {
        setMaster(r.data.master || {});
        const p = r.data.profile || {};
        const init = {};
        EDITABLE.forEach(({ key }) => { init[key] = p[key] ?? ''; });
        setForm(init);
      })
      .catch(() => toast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try { await api.put('/api/profile/me', form); toast('Profile saved successfully', 'success'); }
    catch (err) { toast(err.response?.data?.error || 'Save failed', 'error'); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="top"><div><small>Student Portal</small><h1>My Profile</h1></div></div>

      <div className="box" style={{ marginBottom: 16 }}>
        <b>Master data <span style={{ color: 'var(--t2)', fontWeight: 400, fontSize: '.85rem' }}>(maintained by PC — read only)</span></b>
        <div className="grid" style={{ marginTop: 8 }}>
          {READONLY.map(([l, k]) => (
            <div key={k}>
              <label>{l}</label>
              <input value={master[k] ?? ''} readOnly style={{ background: 'var(--mu)', cursor: 'not-allowed', color: 'var(--t2)' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="box">
        <b>My editable fields</b>
        <p style={{ marginBottom: 8 }}>Only these fields can be updated by you.</p>
        <form onSubmit={handleSave}>
          <div className="grid">
            {EDITABLE.map(({ key, label, type, options }) => (
              <div key={key}>
                <label>{label}</label>
                {type === 'select'
                  ? <select value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                      {options.map(o => <option key={o} value={o}>{o || '-- Select --'}</option>)}
                    </select>
                  : <input type={type} step={type === 'number' ? 'any' : undefined}
                      value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                }
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 20 }}>
            <button type="submit" disabled={saving}>
              <Icon name="floppy-disk" /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

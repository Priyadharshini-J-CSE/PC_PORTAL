import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';

const EMPTY_ROUND = () => ({ roundName: '', roundType: '', questions: [''], experience: '' });
const EMPTY_DRAFT = () => ({ companyName: '', jobRole: '', interviewDate: '', interviewMode: '', placementType: '', finalResult: 'Result Awaited', overallExperience: '', rounds: [EMPTY_ROUND()] });

export default function StudentInterviews() {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(EMPTY_DRAFT());
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try { const res = await api.get('/api/interviews/mine'); setRecords(res.data); }
    catch { toast('Failed to load interviews', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  const setRound = (i, key, val) => setDraft(d => { const r = [...d.rounds]; r[i] = { ...r[i], [key]: val }; return { ...d, rounds: r }; });
  const setQ = (ri, qi, val) => setDraft(d => { const r = [...d.rounds]; const qs = [...r[ri].questions]; qs[qi] = val; r[ri] = { ...r[ri], questions: qs }; return { ...d, rounds: r }; });
  const addQ = (ri) => setDraft(d => { const r = [...d.rounds]; r[ri] = { ...r[ri], questions: [...r[ri].questions, ''] }; return { ...d, rounds: r }; });
  const removeQ = (ri, qi) => setDraft(d => { const r = [...d.rounds]; const qs = r[ri].questions.filter((_, j) => j !== qi); r[ri] = { ...r[ri], questions: qs.length ? qs : [''] }; return { ...d, rounds: r }; });
  const addRound = () => setDraft(d => ({ ...d, rounds: [...d.rounds, EMPTY_ROUND()] }));
  const removeRound = (i) => setDraft(d => ({ ...d, rounds: d.rounds.filter((_, j) => j !== i) }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!draft.companyName.trim()) { toast('Company name is required', 'error'); return; }
    setSubmitting(true);
    try { await api.post('/api/interviews', draft); toast('Submitted successfully', 'success'); setDraft(EMPTY_DRAFT()); load(); }
    catch (err) { toast(err.response?.data?.error || 'Submit failed', 'error'); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this submission?')) return;
    try { await api.delete(`/api/interviews/${id}`); toast('Deleted', 'success'); load(); }
    catch { toast('Delete failed', 'error'); }
  }

  return (
    <>
      <div className="top"><div><small>Student Portal</small><h1>Interview Experiences</h1></div></div>

      <div className="box">
        <b style={{ fontSize: '1.05rem' }}><Icon name="plus" style={{ marginRight: 8, color: 'var(--o)' }} />Add Interview Experience</b>
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <div className="grid">
            <div><label>Company name *</label><input value={draft.companyName} onChange={e => set('companyName', e.target.value)} required /></div>
            <div><label>Job role</label><input value={draft.jobRole} onChange={e => set('jobRole', e.target.value)} /></div>
            <div><label>Interview date</label><input type="date" value={draft.interviewDate} onChange={e => set('interviewDate', e.target.value)} /></div>
            <div><label>Interview mode</label>
              <select value={draft.interviewMode} onChange={e => set('interviewMode', e.target.value)}>
                <option value="">-- Select --</option><option>Online</option><option>Offline</option><option>Hybrid</option>
              </select>
            </div>
            <div><label>Placement type</label>
              <select value={draft.placementType} onChange={e => set('placementType', e.target.value)}>
                <option value="">-- Select --</option><option>On-campus</option><option>Off-campus</option><option>Pool campus</option>
              </select>
            </div>
            <div><label>Final result</label>
              <select value={draft.finalResult} onChange={e => set('finalResult', e.target.value)}>
                <option>Placed</option><option>Not Placed</option><option>Result Awaited</option>
              </select>
            </div>
          </div>

          <h3>Rounds ({draft.rounds.length})</h3>
          {draft.rounds.map((r, ri) => (
            <div key={ri} className="round f" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <b>Round {ri + 1}</b>
                {draft.rounds.length > 1 && <button type="button" className="d" onClick={() => removeRound(ri)}><Icon name="xmark" /></button>}
              </div>
              <div className="grid">
                <div><label>Round name</label><input value={r.roundName} onChange={e => setRound(ri, 'roundName', e.target.value)} placeholder="e.g. Technical Round 1" /></div>
                <div><label>Round type</label>
                  <select value={r.roundType} onChange={e => setRound(ri, 'roundType', e.target.value)}>
                    <option value="">-- Select --</option><option>Aptitude</option><option>Technical</option><option>Coding</option><option>HR</option><option>Group Discussion</option><option>Other</option>
                  </select>
                </div>
              </div>
              <label>Questions asked</label>
              {r.questions.map((q, qi) => (
                <div key={qi} className="row" style={{ margin: '4px 0' }}>
                  <input style={{ flex: 1, maxWidth: 'none' }} placeholder={`Question ${qi + 1}`} value={q} onChange={e => setQ(ri, qi, e.target.value)} />
                  {r.questions.length > 1 && <button type="button" className="d" onClick={() => removeQ(ri, qi)}><Icon name="xmark" /></button>}
                </div>
              ))}
              <div className="row" style={{ margin: '6px 0' }}>
                <button type="button" className="s" onClick={() => addQ(ri)}><Icon name="plus" /> Add Question</button>
              </div>
              <label>Experience for this round</label>
              <textarea rows={2} value={r.experience} onChange={e => setRound(ri, 'experience', e.target.value)} />
            </div>
          ))}

          <div className="row">
            <button type="button" className="s" onClick={addRound}><Icon name="plus" /> Add Round</button>
          </div>
          <label>Overall experience / summary</label>
          <textarea rows={3} value={draft.overallExperience} onChange={e => set('overallExperience', e.target.value)} />
          <div className="row" style={{ marginTop: 16 }}>
            <button type="submit" disabled={submitting}><Icon name="floppy-disk" /> {submitting ? 'Submitting...' : 'Submit'}</button>
          </div>
        </form>
      </div>

      <h3>My submissions</h3>
      {loading ? <LoadingSpinner /> : records.length === 0
        ? <p style={{ color: 'var(--t2)' }}>No submissions yet.</p>
        : records.map(iv => (
          <div key={iv._id} className="box" style={{ margin: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>{iv.companyName}</b>{' '}
                <span className={`tag ${iv.finalResult === 'Placed' ? 'ok' : iv.finalResult === 'Not Placed' ? 'err' : ''}`}>{iv.finalResult}</span>
                {iv.jobRole && <span style={{ color: 'var(--t2)', marginLeft: 8, fontSize: '.9rem' }}>{iv.jobRole}</span>}
              </div>
              <button className="d" onClick={() => handleDelete(iv._id)}><Icon name="xmark" /></button>
            </div>
            {iv.rounds?.map((r, i) => (
              <div key={i} className="round f" style={{ marginTop: 8 }}>
                <b>Round {i + 1}{r.roundName ? ` — ${r.roundName}` : ''}</b>
                {r.questions?.length > 0 && <ol style={{ margin: '6px 0 6px 18px', padding: 0 }}>{r.questions.map((q, j) => <li key={j}>{q}</li>)}</ol>}
                {r.experience && <div><b>Experience:</b> {r.experience}</div>}
              </div>
            ))}
            {iv.overallExperience && <div style={{ marginTop: 8 }}><b>Overall:</b> {iv.overallExperience}</div>}
          </div>
        ))
      }
    </>
  );
}

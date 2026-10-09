import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/client';

export default function Landing() {
  const navigate = useNavigate();
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    api.get('/api/analytics/pc').then((r) => setSnap(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
        <section className="hero2">
          <div>
            <span className="tag">🎓 Placement Management Platform</span>
            <h1 style={{ marginTop: 16 }}>
              Your Career Journey,{' '}
              <span className="hl">All in One Place</span>
            </h1>
            <p className="lead">
              A centralized placement management platform for students, placement coordinators,
              and faculty to manage student profiles, coding progress, interview experiences,
              documents, and placement readiness.
            </p>
            <div className="row">
              <button onClick={() => navigate('/portal')}>Explore Portal</button>
              <button className="s" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                How It Works
              </button>
            </div>
            <div className="trust">
              <span>🛡 Role-based portals</span>
              <span>⌨ LeetCode tracking</span>
              <span>💬 Interview insights</span>
            </div>
          </div>

          <div className="box pv">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Placement snapshot</b>
              <span className="tag">Live data</span>
            </div>
            {snap ? (
              <div className="mini">
                <div><b>{snap.totalStudents}</b><span>Students</span></div>
                <div><b>{snap.lcCount}</b><span>LeetCode records</span></div>
                <div><b>{snap.withResume}</b><span>Resumes submitted</span></div>
                <div><b>{snap.ivCount}</b><span>Interview experiences</span></div>
              </div>
            ) : (
              <div className="mini">
                {[...Array(4)].map((_, i) => (
                  <div key={i}><div className="skeleton" style={{ height: 32, marginBottom: 6 }} /><div className="skeleton" style={{ height: 14, width: '60%' }} /></div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="how">
          <h2 className="sec-t">How It Works</h2>
          <div className="cards">
            {[
              ['1', 'Choose your portal', 'Student, PC or Faculty — each with its own login and menu.'],
              ['2', 'Maintain your data', 'Students update profiles and share interview experiences; PC manages LeetCode and Lingua data.'],
              ['3', 'Track readiness', 'Faculty and PC monitor progress through searchable, exportable tables.'],
            ].map(([n, t, d]) => (
              <div key={n} className="box">
                <div className="step">STEP {n}</div>
                <b>{t}</b>
                <p style={{ marginBottom: 0 }}>{d}</p>
              </div>
            ))}
          </div>

          <h2 className="sec-t" style={{ marginTop: 48 }}>What's inside</h2>
          <div className="cards">
            {[
              ['⭐', 'LeetCode tracker', 'Global rank, contest rating, contests attended, total solved, easy, medium and hard.'],
              ['💬', 'Post-Interview Inquiry', 'Company, rounds, questions per round, placed or not, and experience.'],
              ['🌐', 'Lingua Skills', 'Payment, exam status, slot and result per student.'],
              ['📄', 'CSV import / export', 'Merge student master data and hackathon data from CSV files.'],
            ].map(([icon, t, d]) => (
              <div key={t} className="box">
                <b>{icon} {t}</b>
                <p style={{ marginBottom: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import GameLoader from '../components/GameLoader';
import MiniLoader from '../components/MiniLoader';

export default function Profile() {
  const { currentUser, updateUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    branch: '',
    currentSemester: '',
    studyHoursPerDay: '',
    consistencyScore: '',
    stressLevel: '',
    preferredStudyTime: '',
    tenthPercentage: '',
    twelfthPercentage: '',
  });

  // Load real data from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true);
      try {
        const res = await profileService.get();
        const d = res.data;
        setForm({
          name: d.name || '',
          email: d.email || '',
          branch: d.branch || '',
          currentSemester: d.currentSemester || '',
          studyHoursPerDay: d.studyHoursPerDay || '',
          consistencyScore: d.consistencyScore || '',
          stressLevel: d.stressLevel || '',
          preferredStudyTime: d.preferredStudyTime || '',
          tenthPercentage: d.tenthPercentage || '',
          twelfthPercentage: d.twelfthPercentage || '',
        });
      } catch (err) {
        console.log(err);
        setError('FAILED TO RETRIEVE USER PROFILE ARCHIVES.');
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        branch: form.branch,
        currentSemester: parseInt(form.currentSemester),
        studyHoursPerDay: parseInt(form.studyHoursPerDay),
        consistencyScore: parseInt(form.consistencyScore),
        stressLevel: parseInt(form.stressLevel),
        preferredStudyTime: form.preferredStudyTime,
        tenthPercentage: parseFloat(form.tenthPercentage),
        twelfthPercentage: parseFloat(form.twelfthPercentage),
      };

      const res = await profileService.update(payload);

      updateUser({
        name: res.data.name,
        branch: res.data.branch,
        currentSemester: res.data.currentSemester,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError('FAILED TO COMMIT PROFILE UPDATES.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <GameLoader message="DECRYPTING USER PROFILE..." subMessage="RETRIEVING IDENTITY PARAMETERS" />;

  return (
    <DashboardLayout>
      <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Page Title */}
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>USER PROFILE</h1>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '12px', letterSpacing: '0.2em' }}>
            USER SETTINGS // PREFERENCES
          </div>
        </header>

        <form onSubmit={handleSave}>

          {/* Account Info */}
          <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h3 style={{ fontSize: '10px', color: 'var(--neon-pink)', letterSpacing: '0.2em', marginBottom: '2rem', textAlign: 'center' }}>ACCOUNT INFORMATION</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>FULL NAME</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="ENTER IDENTITY NAME" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>EMAIL</label>
                <div style={{ padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                  {form.email || '—'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>BRANCH</label>
                <select name="branch" value={form.branch} onChange={handleChange}>
                  <option value="">SELECT BRANCH</option>
                  <option value="CSE">CSE</option>
                  <option value="AIML">AIML</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>ACTIVE SEMESTER</label>
                <select name="currentSemester" value={form.currentSemester} onChange={handleChange}>
                  <option value="">SELECT SEMESTER</option>
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <option key={n} value={n}>SEMESTER {n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Study Behavior */}
          <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h3 style={{ fontSize: '10px', color: 'var(--neon-cyan)', letterSpacing: '0.2em', marginBottom: '2rem', textAlign: 'center' }}>STUDY HABITS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>STUDY HOURS PER DAY</label>
                <input type="number" name="studyHoursPerDay" placeholder="e.g. 5" min="1" max="24" value={form.studyHoursPerDay} onChange={handleChange} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>PREFERRED STUDY TIME</label>
                <select name="preferredStudyTime" value={form.preferredStudyTime} onChange={handleChange}>
                  <option value="">SELECT TIME</option>
                  <option value="MORNING">MORNING</option>
                  <option value="AFTERNOON">AFTERNOON</option>
                  <option value="EVENING">EVENING</option>
                  <option value="NIGHT">NIGHT</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>CONSISTENCY RATING</label>
                <select name="consistencyScore" value={form.consistencyScore} onChange={handleChange}>
                  <option value="">SELECT RATING</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} — {['VERY LOW','LOW','AVERAGE','GOOD','EXCELLENT'][n-1]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>STRESS LEVEL</label>
                <select name="stressLevel" value={form.stressLevel} onChange={handleChange}>
                  <option value="">SELECT LEVEL</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} — {['VERY LOW','LOW','MODERATE','HIGH','VERY HIGH'][n-1]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Academic Baseline */}
          <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h3 style={{ fontSize: '10px', color: 'var(--neon-gold)', letterSpacing: '0.2em', marginBottom: '2rem', textAlign: 'center' }}>ACADEMIC BACKGROUND</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>10TH PERCENTAGE</label>
                <input type="number" name="tenthPercentage" placeholder="e.g. 92.5" min="0" max="100" step="0.01" value={form.tenthPercentage} onChange={handleChange} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.1em' }}>12TH PERCENTAGE</label>
                <input type="number" name="twelfthPercentage" placeholder="e.g. 88.0" min="0" max="100" step="0.01" value={form.twelfthPercentage} onChange={handleChange} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--neon-red)', borderRadius: '8px', color: 'var(--neon-red)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '2rem' }}>
              ERROR: {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
            <button
              type="submit"
              disabled={loading}
              className={saved ? "btn-secondary" : "btn-primary"}
              style={{ minWidth: '300px', padding: '1.2rem', borderColor: saved ? 'var(--neon-green)' : '' }}
            >
              {loading ? <MiniLoader /> : saved ? '✓ PROFILE UPDATED' : 'SAVE CHANGES'}
            </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}
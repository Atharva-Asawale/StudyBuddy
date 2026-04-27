import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GameLoader from '../components/GameLoader';
import MiniLoader from '../components/MiniLoader';

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    studyHoursPerDay: '',
    consistencyScore: '',
    stressLevel: '',
    preferredStudyTime: '',
    tenthPercentage: '',
    twelfthPercentage: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.studyHoursPerDay) return 'DAILY_STUDY_HOURS_REQUIRED';
    if (!formData.consistencyScore) return 'CONSISTENCY_RATING_REQUIRED';
    if (!formData.stressLevel) return 'STRESS_LEVEL_REQUIRED';
    if (!formData.preferredStudyTime) return 'OPTIMAL_TIME_REQUIRED';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.tenthPercentage) return '10TH_PERCENTILE_REQUIRED';
    if (!formData.twelfthPercentage) return '12TH_PERCENTILE_REQUIRED';
    if (formData.tenthPercentage < 0 || formData.tenthPercentage > 100)
      return 'INVALID_PERCENTILE_RANGE';
    if (formData.twelfthPercentage < 0 || formData.twelfthPercentage > 100)
      return 'INVALID_PERCENTILE_RANGE';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) return setError(err);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) return setError(err);

    setLoading(true);
    try {
      await onboardingService.save({
        studyHoursPerDay: parseInt(formData.studyHoursPerDay),
        consistencyScore: parseInt(formData.consistencyScore),
        stressLevel: parseInt(formData.stressLevel),
        preferredStudyTime: formData.preferredStudyTime,
        tenthPercentage: parseFloat(formData.tenthPercentage),
        twelfthPercentage: parseFloat(formData.twelfthPercentage),
      });

      localStorage.removeItem('studybuddy_new_user');
      navigate('/dashboard');
    } catch (err) {
      setError('FAILED_TO_COMMIT_INITIALIZATION_DATA');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <GameLoader message="Setting up your profile..." subMessage="Saving your preferences" />;

  return (
    <div className="page-enter" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--neon-pink)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', marginBottom: '1rem' }}>
            STEP {step} OF 2
          </div>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {step === 1 ? 'Study Habits' : 'Academic Background'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            {step === 1
              ? `Welcome, ${currentUser?.name?.split(' ')[0] || 'Student'}. Tell us about your study habits.`
              : 'Enter your previous academic performance.'}
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '2rem' }}>
            {[1, 2].map((s) => (
              <div key={s} style={{
                height: '4px', flex: 1, borderRadius: '2px',
                background: s <= step ? 'var(--neon-pink)' : 'rgba(255,255,255,0.05)',
                boxShadow: s <= step ? 'var(--glow-pink)' : 'none',
                transition: 'all 0.4s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Step 1 — Study Behavior */}
        {step === 1 && (
          <div className="auth-form">
            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>DAILY STUDY HOURS</label>
              <input type="number" name="studyHoursPerDay" placeholder="e.g. 5" min="1" max="24" value={formData.studyHoursPerDay} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CONSISTENCY RATING (1-5)</label>
              <select name="consistencyScore" value={formData.consistencyScore} onChange={handleChange}>
                <option value="">SELECT RATING</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>STRESS LEVEL (1-5)</label>
              <select name="stressLevel" value={formData.stressLevel} onChange={handleChange}>
                <option value="">SELECT LEVEL</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PREFERRED STUDY TIME</label>
              <select name="preferredStudyTime" value={formData.preferredStudyTime} onChange={handleChange}>
                <option value="">SELECT TIME</option>
                <option value="MORNING">MORNING</option>
                <option value="AFTERNOON">AFTERNOON</option>
                <option value="EVENING">EVENING</option>
                <option value="NIGHT">NIGHT</option>
              </select>
            </div>

            {error && <div style={{ color: 'var(--neon-red)', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '1.5rem', textAlign: 'center' }}>ERROR: {error}</div>}

            <button className="btn-primary" onClick={handleNext} style={{ width: '100%', padding: '1.2rem' }}>
              CONTINUE →
            </button>
          </div>
        )}

        {/* Step 2 — Academic Baseline */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>10TH PERCENTAGE</label>
              <input type="number" name="tenthPercentage" placeholder="e.g. 92.5" min="0" max="100" step="0.01" value={formData.tenthPercentage} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>12TH PERCENTAGE</label>
              <input type="number" name="twelfthPercentage" placeholder="e.g. 88.0" min="0" max="100" step="0.01" value={formData.twelfthPercentage} onChange={handleChange} />
            </div>

            {error && <div style={{ color: 'var(--neon-red)', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '1.5rem', textAlign: 'center' }}>ERROR: {error}</div>}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => { setStep(1); setError(''); }} className="btn-ghost" style={{ flex: 1, padding: '1rem' }}>
                BACK
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem' }} disabled={loading}>
                {loading ? <MiniLoader /> : 'GET STARTED 🎉'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
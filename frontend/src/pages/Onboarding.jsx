import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    if (!formData.studyHoursPerDay) return 'Please enter daily study hours.';
    if (!formData.consistencyScore) return 'Please select consistency score.';
    if (!formData.stressLevel) return 'Please select stress level.';
    if (!formData.preferredStudyTime) return 'Please select preferred study time.';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.tenthPercentage) return 'Please enter 10th percentage.';
    if (!formData.twelfthPercentage) return 'Please enter 12th percentage.';
    if (formData.tenthPercentage < 0 || formData.tenthPercentage > 100)
      return '10th percentage must be between 0 and 100.';
    if (formData.twelfthPercentage < 0 || formData.twelfthPercentage > 100)
      return '12th percentage must be between 0 and 100.';
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
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="auth-card glass-panel" style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '6px' }}>
            {step === 1 ? '📚 Study Behavior' : '🎓 Academic Baseline'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {step === 1
              ? `Welcome, ${currentUser?.name?.split(' ')[0] || 'Student'}! Tell us about your study habits.`
              : 'Almost done! Enter your academic background.'}
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {[1, 2].map((s) => (
              <div key={s} style={{
                height: '4px', flex: 1, borderRadius: '2px',
                background: s <= step ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.3s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Step 1 — Study Behavior */}
        {step === 1 && (
          <div className="auth-form">
            <div className="input-group">
              <label>Daily Study Hours</label>
              <input
                type="number" name="studyHoursPerDay"
                placeholder="e.g. 5" min="1" max="24"
                value={formData.studyHoursPerDay}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Consistency Score (1 = Low, 5 = High)</label>
              <select name="consistencyScore" value={formData.consistencyScore}
                onChange={handleChange}
                style={{
                  padding: '12px 15px', borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.3)', color: 'white',
                  fontSize: '1rem', outline: 'none',
                }}>
                <option value="">Select score</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Stress Level (1 = Low, 5 = High)</label>
              <select name="stressLevel" value={formData.stressLevel}
                onChange={handleChange}
                style={{
                  padding: '12px 15px', borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.3)', color: 'white',
                  fontSize: '1rem', outline: 'none',
                }}>
                <option value="">Select level</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Preferred Study Time</label>
              <select name="preferredStudyTime" value={formData.preferredStudyTime}
                onChange={handleChange}
                style={{
                  padding: '12px 15px', borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.3)', color: 'white',
                  fontSize: '1rem', outline: 'none',
                }}>
                <option value="">Select time</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>

            {error && <span className="error-text">{error}</span>}

            <button className="submit-btn" onClick={handleNext}>
              Next →
            </button>
          </div>
        )}

        {/* Step 2 — Academic Baseline */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>10th Percentage</label>
              <input
                type="number" name="tenthPercentage"
                placeholder="e.g. 92.5" min="0" max="100" step="0.01"
                value={formData.tenthPercentage}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>12th Percentage</label>
              <input
                type="number" name="twelfthPercentage"
                placeholder="e.g. 88.0" min="0" max="100" step="0.01"
                value={formData.twelfthPercentage}
                onChange={handleChange}
              />
            </div>

            {error && <span className="error-text">{error}</span>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                style={{
                  flex: 1, padding: '14px',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: 'white', borderRadius: '10px',
                  fontSize: '1rem', cursor: 'pointer',
                }}>
                ← Back
              </button>
              <button type="submit" className="submit-btn"
                style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup 🎉'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
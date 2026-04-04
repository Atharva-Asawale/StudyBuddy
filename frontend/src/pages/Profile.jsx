import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { onboardingService } from '../services/api';

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: 'white',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.18s',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '0.8rem',
  color: 'rgba(255,255,255,0.5)',
  fontWeight: 500,
  marginBottom: '0.4rem',
  display: 'block',
  letterSpacing: '0.04em',
};

export default function Profile() {
  const { currentUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    studyHoursPerDay: '',
    consistencyScore: '',
    stressLevel: '',
    preferredStudyTime: '',
    tenthPercentage: '',
    twelfthPercentage: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onboardingService.save({
        studyHoursPerDay: parseInt(form.studyHoursPerDay),
        consistencyScore: parseInt(form.consistencyScore),
        stressLevel: parseInt(form.stressLevel),
        preferredStudyTime: form.preferredStudyTime,
        tenthPercentage: parseFloat(form.tenthPercentage),
        twelfthPercentage: parseFloat(form.twelfthPercentage),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      {/* Page Title */}
      <h2 style={{
        fontSize: '1.6rem', fontWeight: 700,
        color: 'white', letterSpacing: '-0.02em',
        marginBottom: '1.5rem',
      }}>
        My Profile
      </h2>

      {/* Account Info — read only */}
      <div style={glass}>
        <h3 style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1.25rem',
        }}>
          Account Information
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}>
          {[
            { label: 'Full Name',        value: currentUser?.name },
            { label: 'Email Address',    value: currentUser?.email },
            { label: 'Branch',           value: currentUser?.branch },
            { label: 'Current Semester', value: `Semester ${currentUser?.currentSemester}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <label style={labelStyle}>{label}</label>
              <div style={{
                ...inputStyle,
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {value || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Profile — editable */}
      <form onSubmit={handleSave}>
        <div style={glass}>
          <h3 style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1.25rem',
          }}>
            Study Behavior
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}>
            <div>
              <label style={labelStyle}>Daily Study Hours</label>
              <input
                style={inputStyle}
                type="number" name="studyHoursPerDay"
                placeholder="e.g. 5" min="1" max="24"
                value={form.studyHoursPerDay}
                onChange={handleChange}
                onFocus={e => e.target.style.borderColor = '#818cf8'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label style={labelStyle}>Preferred Study Time</label>
              <select
                name="preferredStudyTime"
                value={form.preferredStudyTime}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select time</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Consistency Score (1–5)</label>
              <select
                name="consistencyScore"
                value={form.consistencyScore}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select score</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Stress Level (1–5)</label>
              <select
                name="stressLevel"
                value={form.stressLevel}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select level</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Academic Baseline */}
        <div style={glass}>
          <h3 style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1.25rem',
          }}>
            Academic Baseline
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}>
            <div>
              <label style={labelStyle}>10th Percentage</label>
              <input
                style={inputStyle}
                type="number" name="tenthPercentage"
                placeholder="e.g. 92.5"
                min="0" max="100" step="0.01"
                value={form.tenthPercentage}
                onChange={handleChange}
                onFocus={e => e.target.style.borderColor = '#818cf8'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label style={labelStyle}>12th Percentage</label>
              <input
                style={inputStyle}
                type="number" name="twelfthPercentage"
                placeholder="e.g. 88.0"
                min="0" max="100" step="0.01"
                value={form.twelfthPercentage}
                onChange={handleChange}
                onFocus={e => e.target.style.borderColor = '#818cf8'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(252,165,165,0.1)',
            border: '1px solid rgba(252,165,165,0.3)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.85rem 2rem',
            background: saved
              ? 'rgba(110,231,183,0.2)'
              : 'linear-gradient(135deg, #818cf8, #c084fc)',
            border: saved ? '1px solid #6ee7b7' : 'none',
            borderRadius: '10px',
            color: saved ? '#6ee7b7' : 'white',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Saving...' : saved ? '✓ Saved Successfully!' : 'Save Profile'}
        </button>
      </form>

    </DashboardLayout>
  );
}
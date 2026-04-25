import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';

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

const readOnlyStyle = {
  ...inputStyle,
  color: 'rgba(255,255,255,0.4)',
  background: 'rgba(0,0,0,0.15)',
  border: '1px solid rgba(255,255,255,0.05)',
  cursor: 'not-allowed',
};

const labelStyle = {
  fontSize: '0.8rem',
  color: 'rgba(255,255,255,0.5)',
  fontWeight: 500,
  marginBottom: '0.4rem',
  display: 'block',
  letterSpacing: '0.04em',
};

const sectionTitle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '1.25rem',
  textAlign: 'center',
};

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
        setError('Failed to load profile data.');
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

      // Update AuthContext + localStorage so sidebar reflects new name/branch
      updateUser({
        name: res.data.name,
        branch: res.data.branch,
        currentSemester: res.data.currentSemester,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', height: '60vh',
          color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem',
        }}>
          Loading profile...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Title */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{
          fontSize: '1.8rem', fontWeight: 700,
          color: 'white', letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
        }}>
          My Profile
        </h2>
        <p style={{ color: '#000000', fontSize: '0.95rem', fontWeight: 600 }}>
          Manage your account information and study preferences
        </p>
      </div>

      <form onSubmit={handleSave}>

        {/* Account Info — editable */}
        <div style={glass}>
          <h3 style={sectionTitle}>Account Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                style={inputStyle}
                type="text" name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                onFocus={e => e.target.style.borderColor = '#818cf8'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Email — read only, cannot change */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={readOnlyStyle}>{form.email || '—'}</div>
            </div>

            <div>
              <label style={labelStyle}>Branch</label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select branch</option>
                <option value="CSE">CSE</option>
                <option value="AIML">AIML</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Current Semester</label>
              <select
                name="currentSemester"
                value={form.currentSemester}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select semester</option>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Study Behavior */}
        <div style={glass}>
          <h3 style={sectionTitle}>Study Behavior</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

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
              <select name="preferredStudyTime" value={form.preferredStudyTime} onChange={handleChange} style={inputStyle}>
                <option value="">Select time</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Consistency Score (1–5)</label>
              <select name="consistencyScore" value={form.consistencyScore} onChange={handleChange} style={inputStyle}>
                <option value="">Select score</option>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n} — {['Very Low','Low','Average','Good','Excellent'][n-1]}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Stress Level (1–5)</label>
              <select name="stressLevel" value={form.stressLevel} onChange={handleChange} style={inputStyle}>
                <option value="">Select level</option>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n} — {['Very Low','Low','Moderate','High','Very High'][n-1]}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Academic Baseline */}
        <div style={glass}>
          <h3 style={sectionTitle}>Academic Baseline</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            <div>
              <label style={labelStyle}>10th Percentage</label>
              <input
                style={inputStyle}
                type="number" name="tenthPercentage"
                placeholder="e.g. 92.5" min="0" max="100" step="0.01"
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
                placeholder="e.g. 88.0" min="0" max="100" step="0.01"
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

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.85rem 3rem',
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
            {loading ? 'Saving...' : saved ? '✓ Saved Successfully!' : 'Save Changes'}
          </button>
        </div>

      </form>
    </DashboardLayout>
  );
}
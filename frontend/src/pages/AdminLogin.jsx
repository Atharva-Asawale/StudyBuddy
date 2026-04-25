import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, passwordResetService } from '../services/api';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Iridescence from '../components/Iridescence';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // signin, forgot
  const [forgotStep, setForgotStep] = useState(1);

  const [formData, setFormData] = useState({ email: '', password: '' });

  const [forgotData, setForgotData] = useState({
    email: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmNewPassword: '',
    verificationToken: ''
  });

  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [shake, setShake] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setGlobalError('');
  };

  const handleForgotInput = (field, value) => {
    setForgotData({ ...forgotData, [field]: value });
    setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return setGlobalError('Email and Password are required');
    setLoading(true);
    setGlobalError('');

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      const { token, ...userData } = response.data;
      if (userData.role !== 'ADMIN') {
        setGlobalError('This portal is for admins only. Please use the main login.');
        return;
      }

      login(userData, token, false);
      navigate('/admin/dashboard');
    } catch (err) {
      setGlobalError(err.response?.status === 400 || err.response?.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...forgotData.otp];
    newOtp[index] = value;
    handleForgotInput('otp', newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !forgotData.otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...forgotData.otp];
    pasted.forEach((char, index) => { if (!isNaN(char) && index < 6) newOtp[index] = char; });
    handleForgotInput('otp', newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    if (!forgotData.email.includes('@')) return setGlobalError('Valid email is required');
    setLoading(true); setGlobalError('');
    try {
      await passwordResetService.sendOtp(forgotData.email);
      setSuccessMsg('OTP sent successfully'); setResendTimer(60); setForgotStep(2);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setGlobalError(err.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    const otpString = forgotData.otp.join('');
    if (otpString.length < 6) return setGlobalError('Enter complete 6-digit OTP');
    setLoading(true); setGlobalError('');
    try {
      const res = await passwordResetService.verifyOtp(forgotData.email, otpString);
      setForgotData({ ...forgotData, verificationToken: res.data.verificationToken });
      setForgotStep(3);
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Invalid OTP');
      setShake(true); setTimeout(() => setShake(false), 500);
    } finally { setLoading(false); }
  };

  const getPasswordStrength = (pass) => {
    if (pass.length === 0) return { width: '0%', color: 'transparent' };
    if (pass.length < 6) return { width: '33%', color: '#e74c3c' };
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/)) return { width: '100%', color: '#2ecc71' };
    return { width: '66%', color: '#f1c40f' };
  };

  const handleForgotStep3 = async (e) => {
    e.preventDefault();
    if (forgotData.newPassword.length < 6) return setGlobalError('Password must be at least 6 characters');
    if (forgotData.newPassword !== forgotData.confirmNewPassword) return setGlobalError('Passwords do not match');
    setLoading(true); setGlobalError('');
    try {
      await passwordResetService.resetPassword(forgotData.verificationToken, forgotData.newPassword);
      setSuccessMsg('Password reset successful! Redirecting...');
      setTimeout(() => { setMode('signin'); setForgotStep(1); setSuccessMsg(''); }, 2000);
    } catch (err) { setGlobalError(err.response?.data?.error || 'Failed to reset password'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a' }}>

      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%', zIndex: 0,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}>
        <Iridescence color={[0.5, 0.6, 0.9]} speed={1} amplitude={0.1} mouseReact />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '1rem' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.6rem 1.2rem',
            borderRadius: '999px',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            backdropFilter: 'blur(4px)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="auth-card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '16px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'Cyan', margin: 0, fontSize: '24px' }}>StudyBuddy</h1>
          <p style={{ color: '#d5eb0dff', margin: '5px 0 0', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>ADMIN PORTAL</p>
        </div>

        {mode === 'forgot' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: forgotStep >= step ? '#5865F2' : '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{step}</div>
                  {step < 3 && <div style={{ height: '2px', background: forgotStep > step ? '#5865F2' : '#333', flex: 1, margin: '0 10px' }} />}
                </div>
              ))}
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1}>
                <p style={{ color: '#a0a0b0', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>Enter your admin email for OTP</p>
                <div style={{ marginBottom: '15px' }}>
                  <input type="email" placeholder="Admin Email" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'gold' }} value={forgotData.email} onChange={e => handleForgotInput('email', e.target.value)} />
                </div>
                {globalError && <p style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px' }}>{globalError}</p>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#5865F2', color: 'gold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '15px' }}>{loading ? 'Sending...' : 'Send OTP'}</button>
                <p style={{ textAlign: 'center', fontSize: '14px', cursor: 'pointer', color: '#a0a0b0' }} onClick={() => setMode('signin')}>Back to Login</p>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2}>
                <p style={{ color: '#a0a0b0', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>OTP sent to {forgotData.email}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px', animation: shake ? 'shake 0.5s' : 'none' }}>
                  {forgotData.otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" maxLength="1" value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} onPaste={handleOtpPaste} style={{ width: '40px', height: '50px', textAlign: 'center', fontSize: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  ))}
                </div>
                {globalError && <p style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>{globalError}</p>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '15px' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#a0a0b0' }}>
                  <span style={{ cursor: resendTimer === 0 ? 'pointer' : 'default', color: resendTimer === 0 ? '#5865F2' : '#a0a0b0' }} onClick={resendTimer === 0 ? handleForgotStep1 : undefined}>Resend OTP</span> {resendTimer > 0 && `(Wait ${resendTimer}s)`}
                </p>
                <style>{`@keyframes shake { 0%, 100% {transform: translateX(0)} 25% {transform: translateX(-5px)} 75% {transform: translateX(5px)} }`}</style>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotStep3}>
                <div style={{ marginBottom: '15px', position: 'relative' }}>
                  <input type={showNewPassword ? "text" : "password"} placeholder="New Password" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={forgotData.newPassword} onChange={e => handleForgotInput('newPassword', e.target.value)} />
                  <div style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#a0a0b0' }} onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '15px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', transition: 'all 0.3s', ...getPasswordStrength(forgotData.newPassword) }} />
                </div>
                <div style={{ marginBottom: '15px', position: 'relative' }}>
                  <input type={showConfirmNewPassword ? "text" : "password"} placeholder="Confirm New Password" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={forgotData.confirmNewPassword} onChange={e => handleForgotInput('confirmNewPassword', e.target.value)} />
                  <div style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#a0a0b0' }} onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                    {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
                {globalError && <p style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px' }}>{globalError}</p>}
                {successMsg && <p style={{ color: '#2ecc71', fontSize: '12px', marginBottom: '10px' }}>{successMsg}</p>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{loading ? 'Resetting...' : 'Reset Password'}</button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <input type="email" name="email" placeholder="Admin Email" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={formData.email} onChange={handleInput} />
            </div>
            <div style={{ marginBottom: '15px', position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={formData.password} onChange={handleInput} />
              <div style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#a0a0b0' }} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>

            {globalError && <p style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>{globalError}</p>}

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#a0a0b0', cursor: 'pointer' }} onClick={() => setMode('forgot')}>Forgot Password?</span>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

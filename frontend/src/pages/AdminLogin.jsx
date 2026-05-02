import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, passwordResetService } from '../services/api';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Iridescence from '../components/Iridescence';
import MiniLoader from '../components/MiniLoader';

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
      if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
        setGlobalError('ACCESS DENIED: ADMIN PRIVILEGES REQUIRED.');
        return;
      }

      login(userData, token, false);
      navigate('/admin/dashboard');
    } catch (err) {
      setGlobalError(err.response?.status === 400 || err.response?.status === 401 ? 'INVALID CREDENTIALS DETECTED.' : 'SYSTEM ERROR. PLEASE RETRY.');
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
    if (!forgotData.email.includes('@')) return setGlobalError('VALID EMAIL REQUIRED.');
    setLoading(true); setGlobalError('');
    try {
      await passwordResetService.sendOtp(forgotData.email);
      setSuccessMsg('OTP DISPATCHED.'); setResendTimer(60); setForgotStep(2);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setGlobalError(err.response?.data?.error || 'OTP TRANSMISSION FAILED.'); }
    finally { setLoading(false); }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    const otpString = forgotData.otp.join('');
    if (otpString.length < 6) return setGlobalError('ENTER COMPLETE 6-DIGIT OTP.');
    setLoading(true); setGlobalError('');
    try {
      const res = await passwordResetService.verifyOtp(forgotData.email, otpString);
      setForgotData({ ...forgotData, verificationToken: res.data.verificationToken });
      setForgotStep(3);
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'INVALID OTP CODE.');
      setShake(true); setTimeout(() => setShake(false), 500);
    } finally { setLoading(false); }
  };

  const getPasswordStrength = (pass) => {
    if (pass.length === 0) return { width: '0%', color: 'transparent' };
    if (pass.length < 6) return { width: '33%', color: 'var(--neon-red)' };
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/)) return { width: '100%', color: 'var(--neon-green)' };
    return { width: '66%', color: 'var(--neon-gold)' };
  };

  const handleForgotStep3 = async (e) => {
    e.preventDefault();
    if (forgotData.newPassword.length < 6) return setGlobalError('MINIMUM 6 CHARACTERS REQUIRED.');
    if (forgotData.newPassword !== forgotData.confirmNewPassword) return setGlobalError('PASSWORD MISMATCH.');
    setLoading(true); setGlobalError('');
    try {
      await passwordResetService.resetPassword(forgotData.verificationToken, forgotData.newPassword);
      setSuccessMsg('ENCRYPTION UPDATED. REDIRECTING...');
      setTimeout(() => { setMode('signin'); setForgotStep(1); setSuccessMsg(''); }, 2000);
    } catch (err) { setGlobalError(err.response?.data?.error || 'RESET OPERATION FAILED.'); }
    finally { setLoading(false); }
  };

  const Background = useMemo(() => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <Iridescence color={[0.0, 0.4, 0.6]} speed={0.6} amplitude={0.08} mouseReact />
    </div>
  ), []);

  return (
    <div className="page-enter" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {Background}

      <button 
        onClick={() => navigate('/')}
        className="btn-ghost"
        style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 10, fontSize: '12px', fontWeight: '800' }}
      >
        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> BACK TO HOME PAGE
      </button>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '100%' }}>
        <div className="glass-panel" style={{ width: '90vw', maxWidth: '450px', padding: '3.5rem', borderTop: '4px solid var(--neon-gold)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 className="pricedown" style={{ fontSize: '3rem', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.05em' }}>StudyBuddy</h1>
            <div style={{ color: 'var(--neon-gold)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.3em', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>ADMIN PORTAL</div>
          </div>

          {mode === 'forgot' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                {[1, 2, 3].map(step => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '4px', 
                      background: forgotStep >= step ? 'var(--neon-gold)' : 'rgba(255,255,255,0.05)', 
                      color: forgotStep >= step ? 'var(--bg-base)' : 'var(--text-muted)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900,
                      boxShadow: forgotStep >= step ? 'var(--glow-gold)' : 'none'
                    }}>{step}</div>
                    {step < 3 && <div style={{ height: '2px', background: forgotStep > step ? 'var(--neon-gold)' : 'rgba(255,255,255,0.05)', flex: 1, margin: '0 10px' }} />}
                  </div>
                ))}
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleForgotStep1}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>ENTER ADMIN EMAIL FOR OTP</p>
                  <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                    <input type="email" placeholder="EMAIL" style={{ width: '100%', padding: '1.25rem' }} value={forgotData.email} onChange={e => handleForgotInput('email', e.target.value)} />
                  </div>
                  {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '11px', marginBottom: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>{loading ? <MiniLoader /> : 'SEND OTP'}</button>
                  <p style={{ textAlign: 'center', fontSize: '11px', cursor: 'pointer', color: 'var(--text-muted)', letterSpacing: '0.1em' }} onClick={() => setMode('signin')}>BACK TO LOGIN</p>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleForgotStep2}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>OTP SENT TO: {forgotData.email.toUpperCase()}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem', animation: shake ? 'shake 0.5s' : 'none' }}>
                    {forgotData.otp.map((digit, i) => (
                      <input key={i} ref={el => otpRefs.current[i] = el} type="text" maxLength="1" value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} onPaste={handleOtpPaste} style={{ width: '45px', height: '55px', textAlign: 'center', fontSize: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', fontWeight: 800 }} />
                    ))}
                  </div>
                  {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '11px', marginBottom: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>{loading ? <MiniLoader /> : 'VERIFY CODE'}</button>
                  <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ cursor: resendTimer === 0 ? 'pointer' : 'default', color: resendTimer === 0 ? 'var(--neon-gold)' : 'var(--text-muted)' }} onClick={resendTimer === 0 ? handleForgotStep1 : undefined}>RESEND OTP</span> {resendTimer > 0 && `(WAIT ${resendTimer}S)`}
                  </p>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleForgotStep3}>
                  <div className="input-group" style={{ position: 'relative', marginBottom: '1.25rem' }}>
                    <input type={showNewPassword ? "text" : "password"} placeholder="NEW PASSWORD" style={{ width: '100%', padding: '1.25rem' }} value={forgotData.newPassword} onChange={e => handleForgotInput('newPassword', e.target.value)} />
                    <div style={{ position: 'absolute', right: '15px', top: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', transition: 'all 0.3s', ...getPasswordStrength(forgotData.newPassword) }} />
                  </div>
                  <div className="input-group" style={{ position: 'relative', marginBottom: '1.25rem' }}>
                    <input type={showConfirmNewPassword ? "text" : "password"} placeholder="CONFIRM PASSWORD" style={{ width: '100%', padding: '1.25rem' }} value={forgotData.confirmNewPassword} onChange={e => handleForgotInput('confirmNewPassword', e.target.value)} />
                    <div style={{ position: 'absolute', right: '15px', top: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                      {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                  {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '11px', marginBottom: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}
                  {successMsg && <p style={{ color: 'var(--neon-green)', fontSize: '11px', marginBottom: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{successMsg}</p>}
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>{loading ? <MiniLoader /> : 'UPDATE PASSWORD'}</button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: '1rem 0' }}>
              <div className="input-group">
                <input type="email" name="email" placeholder="EMAIL" style={{ width: '100%', padding: '1.25rem' }} value={formData.email} onChange={handleInput} />
              </div>
              <div className="input-group" style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} name="password" placeholder="PASSWORD" style={{ width: '100%', padding: '1.25rem' }} value={formData.password} onChange={handleInput} />
                <div style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>

              {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '11px', marginBottom: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}

              <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer', letterSpacing: '0.1em' }} onClick={() => setMode('forgot')}>FORGOT PASSWORD?</span>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '16px' }}>
                {loading ? <MiniLoader /> : 'LOGIN'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

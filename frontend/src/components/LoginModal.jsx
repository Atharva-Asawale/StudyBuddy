import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, passwordResetService } from '../services/api';
import { Eye, EyeOff, X as CloseIcon } from 'lucide-react';
import MiniLoader from './MiniLoader';

export default function LoginModal({ closeModal }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // signin, signup, forgot
  const [forgotStep, setForgotStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    currentSemester: ''
  });
  
  const [forgotData, setForgotData] = useState({
    email: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmNewPassword: '',
    verificationToken: ''
  });

  const [errors, setErrors] = useState({});
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
    setErrors({ ...errors, [e.target.name]: '' });
    setGlobalError('');
  };

  const validateSignUp = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'NAME_REQUIRED';
    if (!formData.email.includes('@')) newErrors.email = 'VALID_EMAIL_REQUIRED';
    if (formData.password.length < 6) newErrors.password = 'MIN_6_CHARS_REQUIRED';
    if (!formData.branch.trim()) newErrors.branch = 'BRANCH_REQUIRED';
    if (!formData.currentSemester) newErrors.currentSemester = 'SEMESTER_REQUIRED';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignIn = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'EMAIL_REQUIRED';
    if (!formData.password) newErrors.password = 'PASSWORD_REQUIRED';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup' && !validateSignUp()) return;
    if (mode === 'signin' && !validateSignIn()) return;

    setLoading(true);
    setGlobalError('');

    try {
      let response;
      if (mode === 'signin') {
        response = await authService.login({ email: formData.email, password: formData.password });
      } else {
        response = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          branch: formData.branch,
          currentSemester: parseInt(formData.currentSemester),
        });
      }

      const { token, ...userData } = response.data;
      const newUser = mode === 'signup';
      login(userData, token, newUser);
      closeModal();
      navigate(newUser ? '/onboarding' : '/dashboard');
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (err.response?.status === 400) {
        setGlobalError(mode === 'signin' ? 'INVALID_CREDENTIALS.' : 'EMAIL_ALREADY_REGISTERED.');
      } else {
        setGlobalError(err.response?.data?.error || 'SYSTEM_FAILURE. RETRY.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotInput = (field, value) => {
    setForgotData({ ...forgotData, [field]: value });
    setGlobalError('');
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
    if (!forgotData.email.includes('@')) return setGlobalError('VALID_EMAIL_REQUIRED');
    setLoading(true); setGlobalError('');
    try {
      await passwordResetService.sendOtp(forgotData.email);
      setSuccessMsg('OTP_SENT'); setResendTimer(60); setForgotStep(2);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setGlobalError(err.response?.data?.error || 'OTP_FAILED'); }
    finally { setLoading(false); }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    const otpString = forgotData.otp.join('');
    if (otpString.length < 6) return setGlobalError('ENTER_6_DIGITS');
    setLoading(true); setGlobalError('');
    try {
      const res = await passwordResetService.verifyOtp(forgotData.email, otpString);
      setForgotData({ ...forgotData, verificationToken: res.data.verificationToken });
      setForgotStep(3);
    } catch (err) {
      setGlobalError('INVALID_OTP'); setShake(true); setTimeout(() => setShake(false), 500);
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
    if (forgotData.newPassword.length < 6) return setGlobalError('MIN_6_CHARS');
    if (forgotData.newPassword !== forgotData.confirmNewPassword) return setGlobalError('MISMATCH');
    setLoading(true); setGlobalError('');
    try {
      await passwordResetService.resetPassword(forgotData.verificationToken, forgotData.newPassword);
      setSuccessMsg('RESET_SUCCESS');
      setTimeout(() => { setMode('signin'); setForgotStep(1); setSuccessMsg(''); }, 2000);
    } catch (err) { setGlobalError('RESET_FAILED'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className={`glass-panel ${shake ? 'shake' : ''}`} onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', padding: '3rem', position: 'relative', borderTop: `4px solid var(--neon-${mode === 'signup' ? 'pink' : 'cyan'})` }}>
        <button onClick={closeModal} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><CloseIcon size={20} /></button>
        
        {mode === 'forgot' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '4px', 
                    background: forgotStep >= step ? 'var(--neon-gold)' : 'rgba(255,255,255,0.05)', 
                    color: forgotStep >= step ? 'var(--bg-base)' : 'var(--text-muted)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900,
                    boxShadow: forgotStep >= step ? 'var(--glow-gold)' : 'none'
                  }}>{step}</div>
                  {step < 3 && <div style={{ height: '2px', background: forgotStep > step ? 'var(--neon-gold)' : 'rgba(255,255,255,0.05)', flex: 1, margin: '0 8px' }} />}
                </div>
              ))}
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>RESET PASSWORD</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>ENTER YOUR REGISTERED EMAIL</p>
                <div className="input-group">
                  <input type="email" placeholder="EMAIL_ADDRESS" style={{ width: '100%' }} value={forgotData.email} onChange={e => handleForgotInput('email', e.target.value)} />
                </div>
                {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}
                {successMsg && <p style={{ color: 'var(--neon-green)', fontSize: '10px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>{successMsg}</p>}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem', borderColor: 'var(--neon-gold)', color: 'var(--neon-gold)' }}>{loading ? <MiniLoader /> : 'SEND OTP'}</button>
                <p style={{ textAlign: 'center', fontSize: '11px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setMode('signin')}>BACK TO LOGIN</p>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>VERIFY OTP</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>OTP SENT TO: {forgotData.email.toUpperCase()}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '2rem' }}>
                  {forgotData.otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" maxLength="1" value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} onPaste={handleOtpPaste} style={{ width: '40px', height: '50px', textAlign: 'center', fontSize: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800 }} />
                  ))}
                </div>
                {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginBottom: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>{loading ? <MiniLoader /> : 'VERIFY'}</button>
                <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ cursor: resendTimer === 0 ? 'pointer' : 'default', color: resendTimer === 0 ? 'var(--neon-gold)' : 'var(--text-muted)' }} onClick={resendTimer === 0 ? handleForgotStep1 : undefined}>RESEND OTP</span> {resendTimer > 0 && `(${resendTimer}S)`}
                </p>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotStep3}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>SET NEW PASSWORD</h2>
                <div className="input-group" style={{ position: 'relative' }}>
                  <input type={showNewPassword ? "text" : "password"} placeholder="NEW PASSWORD" style={{ width: '100%' }} value={forgotData.newPassword} onChange={e => handleForgotInput('newPassword', e.target.value)} />
                  <div style={{ position: 'absolute', right: '12px', top: '15px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', transition: 'all 0.3s', ...getPasswordStrength(forgotData.newPassword) }} />
                </div>
                <div className="input-group" style={{ position: 'relative' }}>
                  <input type={showConfirmNewPassword ? "text" : "password"} placeholder="CONFIRM PASSWORD" style={{ width: '100%' }} value={forgotData.confirmNewPassword} onChange={e => handleForgotInput('confirmNewPassword', e.target.value)} />
                  <div style={{ position: 'absolute', right: '12px', top: '15px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}
                {successMsg && <p style={{ color: 'var(--neon-green)', fontSize: '10px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>{successMsg}</p>}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>{loading ? <MiniLoader /> : 'UPDATE PASSWORD'}</button>
              </form>
            )}
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{mode === 'signin' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{mode === 'signin' ? 'ENTER YOUR CREDENTIALS TO LOGIN' : 'JOIN THE COMMUNITY'}</p>
            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <>
                  <div className="input-group">
                    <input type="text" name="name" placeholder="FULL NAME" style={{ width: '100%' }} value={formData.name} onChange={handleInput} />
                    {errors.name && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginTop: '4px' }}>{errors.name}</p>}
                  </div>
                  <div className="input-group">
                    <select name="branch" style={{ width: '100%' }} value={formData.branch} onChange={handleInput}>
                      <option value="">SELECT BRANCH</option>
                      <option value="CSE">CSE</option>
                      <option value="AIML">AIML</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                    </select>
                    {errors.branch && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginTop: '4px' }}>{errors.branch}</p>}
                  </div>
                  <div className="input-group">
                    <select name="currentSemester" style={{ width: '100%' }} value={formData.currentSemester} onChange={handleInput}>
                      <option value="">SELECT SEMESTER</option>
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>SEMESTER {n}</option>)}
                    </select>
                    {errors.currentSemester && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginTop: '4px' }}>{errors.currentSemester}</p>}
                  </div>
                </>
              )}

              <div className="input-group">
                <input type="email" name="email" placeholder="EMAIL ADDRESS" style={{ width: '100%' }} value={formData.email} onChange={handleInput} />
                {errors.email && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginTop: '4px' }}>{errors.email}</p>}
              </div>

              <div className="input-group" style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} name="password" placeholder="PASSWORD" style={{ width: '100%' }} value={formData.password} onChange={handleInput} />
                <div style={{ position: 'absolute', right: '12px', top: '15px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                {errors.password && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginTop: '4px' }}>{errors.password}</p>}
              </div>

              {globalError && <p style={{ color: 'var(--neon-red)', fontSize: '10px', marginBottom: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{globalError}</p>}

              {mode === 'signin' && (
                <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer', letterSpacing: '0.1em' }} onClick={() => setMode('forgot')}>FORGOT PASSWORD?</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem', borderColor: `var(--neon-${mode === 'signup' ? 'pink' : 'cyan'})`, color: `var(--neon-${mode === 'signup' ? 'pink' : 'cyan'})` }}>{loading ? <MiniLoader /> : (mode === 'signin' ? 'SIGN IN' : 'SIGN UP')}</button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
              {mode === 'signin' ? "DON'T HAVE AN ACCOUNT? " : 'ALREADY HAVE AN ACCOUNT? '}
              <span style={{ color: `var(--neon-${mode === 'signup' ? 'cyan' : 'pink'})`, cursor: 'pointer', fontWeight: 800 }} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrors({}); setGlobalError(''); }}>{mode === 'signin' ? 'SIGN UP' : 'SIGN IN'}</span>
            </p>
          </>
        )}
      </div>
      <style>{`
        @keyframes modalShake { 0%, 100% {transform: translateX(0)} 25% {transform: translateX(-5px)} 75% {transform: translateX(5px)} }
        .shake { animation: modalShake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
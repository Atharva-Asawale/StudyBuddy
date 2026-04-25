import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, passwordResetService } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginModal({ closeModal }) {
  const { login, isNewUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // signin, signup, forgot
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp, 3: new password
  
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const [resendTimer, setResendTimer] = useState(0);
  const [shake, setShake] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setGlobalError('');
  };

  const validateSignUp = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.currentSemester) newErrors.currentSemester = 'Semester is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignIn = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
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
        response = await authService.login({
          email: formData.email,
          password: formData.password,
        });
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
      if (err.response?.status === 400) {
        setGlobalError(mode === 'signin' ? 'Invalid email or password.' : 'Email already registered.');
      } else {
        setGlobalError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
    
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !forgotData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...forgotData.otp];
    pasted.forEach((char, index) => {
      if (!isNaN(char) && index < 6) newOtp[index] = char;
    });
    handleForgotInput('otp', newOtp);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    if (!forgotData.email.includes('@')) {
      return setGlobalError('Valid email is required');
    }
    setLoading(true);
    setGlobalError('');
    try {
      await passwordResetService.sendOtp(forgotData.email);
      setSuccessMsg('OTP sent successfully');
      setResendTimer(60);
      setForgotStep(2);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    const otpString = forgotData.otp.join('');
    if (otpString.length < 6) return setGlobalError('Enter complete 6-digit OTP');
    setLoading(true);
    setGlobalError('');
    try {
      const res = await passwordResetService.verifyOtp(forgotData.email, otpString);
      setForgotData({ ...forgotData, verificationToken: res.data.verificationToken });
      setForgotStep(3);
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Invalid OTP');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
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
    setLoading(true);
    setGlobalError('');
    try {
      await passwordResetService.resetPassword(forgotData.verificationToken, forgotData.newPassword);
      setSuccessMsg('Password reset successful! Redirecting...');
      setTimeout(() => {
        setMode('signin');
        setForgotStep(1);
        setSuccessMsg('');
      }, 2000);
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
      <div className="auth-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '30px', position: 'relative' }}>
        <button className="close-btn" onClick={closeModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        
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
                <h2 style={{ marginBottom: '10px' }}>Reset Password</h2>
                <p style={{ color: '#a0a0b0', marginBottom: '20px', fontSize: '14px' }}>Enter your registered email and we'll send you an OTP</p>
                <div className="input-group" style={{ marginBottom: '15px' }}>
                  <input type="email" placeholder="Email Address" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={forgotData.email} onChange={e => handleForgotInput('email', e.target.value)} />
                </div>
                {globalError && <p style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px' }}>{globalError}</p>}
                {successMsg && <p style={{ color: '#2ecc71', fontSize: '12px', marginBottom: '10px' }}>{successMsg}</p>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '15px' }}>{loading ? 'Sending...' : 'Send OTP'}</button>
                <p style={{ textAlign: 'center', fontSize: '14px', cursor: 'pointer', color: '#a0a0b0' }} onClick={() => setMode('signin')}>Back to Sign In</p>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2}>
                <h2 style={{ marginBottom: '10px' }}>Enter OTP</h2>
                <p style={{ color: '#a0a0b0', marginBottom: '20px', fontSize: '14px' }}>We sent a 6-digit OTP to {forgotData.email}</p>
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
                <h2 style={{ marginBottom: '10px' }}>Set New Password</h2>
                <div className="input-group" style={{ marginBottom: '15px', position: 'relative' }}>
                  <input type={showNewPassword ? "text" : "password"} placeholder="New Password" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={forgotData.newPassword} onChange={e => handleForgotInput('newPassword', e.target.value)} />
                  <div style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#a0a0b0' }} onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '15px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', transition: 'all 0.3s', ...getPasswordStrength(forgotData.newPassword) }} />
                </div>
                <div className="input-group" style={{ marginBottom: '15px', position: 'relative' }}>
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
          <>
            <h2 style={{ marginBottom: '10px' }}>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
            <p style={{ color: '#a0a0b0', marginBottom: '20px', fontSize: '14px' }}>{mode === 'signin' ? 'Enter your credentials to access your dashboard.' : 'Join StudyBuddy'}</p>
            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <>
                  <div className="input-group" style={{ marginBottom: '15px' }}>
                    <input type="text" name="name" placeholder="Full Name" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={formData.name} onChange={handleInput} />
                    {errors.name && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>}
                  </div>
                  <div className="input-group" style={{ marginBottom: '15px' }}>
                    <select name="branch" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={formData.branch} onChange={handleInput}>
                      <option value="">Select your branch</option>
                      <option value="CSE">CSE</option>
                      <option value="AIML">AIML</option>
                      <option value="MECHANICAL">MECHANICAL</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="ELECTRICAL">ELECTRICAL</option>
                      <option value="ECE">ECE</option>
                    </select>
                    {errors.branch && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{errors.branch}</p>}
                  </div>
                  <div className="input-group" style={{ marginBottom: '15px' }}>
                    <select name="currentSemester" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={formData.currentSemester} onChange={handleInput}>
                      <option value="">Select semester</option>
                      {[...Array(8)].map((_, i) => <option key={i} value={i + 1}>Semester {i + 1}</option>)}
                    </select>
                    {errors.currentSemester && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{errors.currentSemester}</p>}
                  </div>
                </>
              )}

              <div className="input-group" style={{ marginBottom: '15px' }}>
                <input type="email" name="email" placeholder="Email Address" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={formData.email} onChange={handleInput} />
                {errors.email && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
              </div>

              <div className="input-group" style={{ marginBottom: '15px', position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={formData.password} onChange={handleInput} />
                <div style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: '#a0a0b0' }} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
                {errors.password && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
              </div>



              {globalError && <p style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px' }}>{globalError}</p>}

              {mode === 'signin' && (
                <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                  <span style={{ fontSize: '12px', color: '#a0a0b0', cursor: 'pointer' }} onClick={() => setMode('forgot')}>Forgot Password?</span>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '15px' }}>{loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}</button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#a0a0b0' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: '#5865F2', cursor: 'pointer' }} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrors({}); setGlobalError(''); }}>{mode === 'signin' ? 'Sign up' : 'Log in'}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
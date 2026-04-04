import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function LoginModal({ closeModal }) {
  const { login, isNewUser } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    currentSemester: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!isLogin && formData.name.trim().length < 2)
      return 'Name must be at least 2 characters.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return 'Please enter a valid email address.';
    if (formData.password.length < 6)
      return 'Password must be at least 6 characters.';
    if (!isLogin && !formData.branch.trim())
      return 'Please enter your branch.';
    if (!isLogin && !formData.currentSemester)
      return 'Please enter your current semester.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError('');

    try {
      let response;

      if (isLogin) {
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
      const newUser = !isLogin;
      login(userData, token, newUser);
      closeModal();
      navigate(newUser ? '/onboarding' : '/dashboard');

    } catch (err) {
      if (err.response?.status === 400) {
        setError(isLogin ? 'Invalid email or password.' : 'Email already registered.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ name: '', email: '', password: '', branch: '', currentSemester: '' });
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="auth-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={closeModal}>&times;</button>
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p>{isLogin ? 'Enter your credentials to access your dashboard.' : 'Join StudyBuddy to start tracking your learning debt.'}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" name="name" placeholder="John Doe"
                  value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Branch</label>
                <input type="text" name="branch" placeholder="Computer Science"
                  value={formData.branch} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Current Semester</label>
                <input type="number" name="currentSemester" placeholder="4"
                  value={formData.currentSemester} onChange={handleInputChange} />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input type="email" name="email" placeholder="you@university.edu"
              value={formData.email} onChange={handleInputChange} />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••"
              value={formData.password} onChange={handleInputChange} />
          </div>

          {error && <span className="error-text">{error}</span>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={toggleMode}>{isLogin ? 'Sign up' : 'Log in'}</span>
        </p>
      </div>
    </div>
  );
}
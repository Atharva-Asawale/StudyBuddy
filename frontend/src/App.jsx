import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Aurora from './components/Aurora';
import Lightfall from './components/Lightfall';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginModal from './components/LoginModal';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import Performance from './pages/Performance';
import SWOT from './pages/SWOT';
import LearningDebt from './pages/LearningDebt';
import LearnPage from './pages/LearnPage';
import Syllabus from './pages/Syllabus';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import CustomTest from './pages/CustomTest';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminManage from './pages/admin/AdminManage';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/" replace />;
};

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppContent() {
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const scrollProgress = document.getElementById('scroll-progress');
      if (scrollProgress) {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        scrollProgress.style.width = `${progress}%`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div id="scroll-progress"></div>
      <div className="neon-vignette"></div>

      {/* Background */}
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%', zIndex: -1,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}>
        {!showLogin && (
          isLandingPage ? (
            <Lightfall
              colors={['#ff2d78', '#b400ff', '#00f0ff']}
              backgroundColor="#05050a"
              speed={0.3}
              streakCount={3}
              streakWidth={0.8}
              streakLength={1.2}
              glow={0.8}
              density={0.4}
              twinkle={0.8}
              zoom={3}
              backgroundGlow={0.1}
              opacity={0.9}
              mouseInteraction={true}
              mouseStrength={0.35}
              mouseRadius={0.8}
            />
          ) : (
            <Aurora
              colorStops={['#ff2d78', '#b400ff', '#00f0ff']}
              amplitude={0.6}
              blend={0.6}
              speed={0.4}
            />
          )
        )}
      </div>

      {showLogin && <LoginModal closeModal={() => setShowLogin(false)} />}

      <Routes>
        <Route path="/" element={<LandingPage openLogin={() => setShowLogin(true)} />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin/dashboard" element={
          <AdminProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <AdminProtectedRoute><AdminLayout><AdminStudents /></AdminLayout></AdminProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminProtectedRoute><AdminLayout><AdminAnalytics /></AdminLayout></AdminProtectedRoute>
        } />
        <Route path="/admin/manage" element={
          <AdminProtectedRoute><AdminLayout><AdminManage /></AdminLayout></AdminProtectedRoute>
        } />

        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute><Progress /></ProtectedRoute>
        } />
        <Route path="/performance" element={
          <ProtectedRoute><Performance /></ProtectedRoute>
        } />
        <Route path="/swot" element={
          <ProtectedRoute><SWOT /></ProtectedRoute>
        } />
        <Route path="/learning-debt" element={
          <ProtectedRoute><LearningDebt /></ProtectedRoute>
        } />
        <Route path="/learn" element={
          <ProtectedRoute><LearnPage /></ProtectedRoute>
        } />
        <Route path="/learn/:chapterId" element={
          <ProtectedRoute><LearnPage /></ProtectedRoute>
        } />
        <Route path="/syllabus" element={

          <ProtectedRoute><Syllabus /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/custom-test" element={
          <ProtectedRoute><CustomTest /></ProtectedRoute>
        } />
        <Route path="/quiz/:topicId/:topicName" element={
          <ProtectedRoute><Quiz /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Iridescence from './components/Iridescence';
import Galaxy from './components/Galaxy';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginModal from './components/LoginModal';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import Performance from './pages/Performance';
import SWOT from './pages/SWOT';
import LearningDebt from './pages/LearningDebt';
import Syllabus from './pages/Syllabus';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import CustomTest from './pages/CustomTest';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAnalytics from './pages/admin/AdminAnalytics';

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

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* Background */}
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%', zIndex: -1,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}>
        {!showLogin && (
          isLandingPage ? (
            <Galaxy
              mouseInteraction={false}
              mouseRepulsion={false}
              density={0.6}
              glowIntensity={0.4}
              saturation={0}
              hueShift={140}
              twinkleIntensity={0.2}
              rotationSpeed={0.05}
              repulsionStrength={0}
              autoCenterRepulsion={0}
              starSpeed={0.3}
              speed={0.4}
            />
          ) : (
            <Iridescence color={[0.5, 0.6, 0.9]} speed={1} amplitude={0.1} mouseReact />
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

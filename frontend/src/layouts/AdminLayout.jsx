import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, BarChart2, LogOut } from 'lucide-react';
import Iridescence from '../components/Iridescence';

export default function AdminLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#0a0a1a', color: 'white', overflow: 'hidden' }}>
      
      {/* Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Iridescence color={[0.5, 0.6, 0.9]} speed={1} amplitude={0.1} mouseReact />
      </div>

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: 'rgba(10, 10, 30, 0.95)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#818cf8' }}>StudyBuddy</h1>
          <span style={{ 
            fontSize: '0.7rem', 
            background: 'rgba(129, 140, 248, 0.1)', 
            color: '#818cf8', 
            padding: '2px 8px', 
            borderRadius: '12px',
            border: '1px solid rgba(129, 140, 248, 0.3)'
          }}>Admin</span>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 2rem',
                  textDecoration: 'none',
                  color: isActive ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
                  background: isActive ? 'rgba(129, 140, 248, 0.05)' : 'transparent',
                  borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ 
          padding: '2rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{currentUser?.name || 'Admin'}</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>{currentUser?.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: '2rem', 
        overflowY: 'auto', 
        zIndex: 1, 
        position: 'relative',
        background: 'transparent'
      }}>
        {children}
      </main>

    </div>
  );
}

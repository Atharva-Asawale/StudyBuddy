import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, BarChart2, LogOut, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Aurora from '../components/Aurora';

export default function AdminLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
    { name: 'Manage', path: '/admin/manage', icon: ShieldCheck },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#0a0a1a', color: 'white', overflow: 'hidden' }}>
      
      {/* Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Aurora
          colorStops={['#ff2d78', '#b400ff', '#00f0ff']}
          amplitude={0.6}
          blend={0.6}
          speed={0.4}
        />
      </div>

      {/* Sidebar */}
      <aside style={{
        width: isSidebarOpen ? '280px' : '80px',
        background: 'var(--card-bg)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        backdropFilter: 'var(--card-blur)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
        transition: 'width 0.3s ease'
      }}>
        <div style={{ padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', gap: '8px' }}>
          {isSidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#818cf8', whiteSpace: 'nowrap' }}>StudyBuddy</h1>
              <span style={{ 
                fontSize: '0.65rem', 
                background: 'rgba(129, 140, 248, 0.1)', 
                color: '#818cf8', 
                padding: '2px 6px', 
                borderRadius: '10px',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                whiteSpace: 'nowrap'
              }}>Admin</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ 
              background: 'rgba(129, 140, 248, 0.1)', 
              border: '1px solid rgba(129, 140, 248, 0.3)', 
              color: '#818cf8', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.2)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.1)' }}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                title={!isSidebarOpen ? item.name : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  gap: '12px',
                  padding: isSidebarOpen ? '12px 2rem' : '12px 0',
                  textDecoration: 'none',
                  color: isActive ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
                  background: isActive ? 'rgba(129, 140, 248, 0.05)' : 'transparent',
                  borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                <Icon size={20} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ 
          padding: isSidebarOpen ? '2rem' : '1rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSidebarOpen ? 'stretch' : 'center',
          gap: '1rem'
        }}>
          {isSidebarOpen && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{currentUser?.name || 'Admin'}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>{currentUser?.email}</span>
            </div>
          )}
          <button 
            onClick={handleLogout}
            title={!isSidebarOpen ? "Logout" : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: isSidebarOpen ? '8px 12px' : '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <LogOut size={18} />
            {isSidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="landing-scroll-area" style={{ 
        flex: 1, 
        padding: '1rem 2rem 2rem 2rem', 
        overflowY: 'auto', 
        zIndex: 1, 
        position: 'relative',
        background: 'transparent',
        scrollBehavior: 'smooth'
      }}>
        {children}
      </main>

    </div>
  );
}

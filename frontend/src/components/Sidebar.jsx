import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart2, AlertTriangle, Menu, ChevronLeft, FileText, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: 'home', label: 'Dashboard' },
  { path: '/progress', icon: 'chart', label: 'Progress' },
  { path: '/performance', icon: 'activity', label: 'Performance' },
  { path: '/swot', icon: 'bolt', label: 'SWOT' },
  { path: '/learning-debt', icon: 'risk', label: 'Learning Debt' },
  { path: '/learn', icon: 'resources', label: 'Resources' },
  { path: '/syllabus', icon: 'book', label: 'Syllabus' },
  { path: '/custom-test', icon: 'test', label: 'Custom Test' },
  { path: '/profile', icon: 'user', label: 'Profile' },
];

const ICON_MAP = {
  home: String.fromCodePoint(0x1F3E0),
  chart: null,
  activity: null,
  bolt: String.fromCodePoint(0x26A1),
  risk: null,
  resources: null,
  book: String.fromCodePoint(0x1F4DA),
  test: null,
  user: String.fromCodePoint(0x1F464),
};

function NavIcon({ type }) {
  if (type === 'chart') return <BarChart2 size={16} />;
  if (type === 'activity') return <Activity size={16} />;
  if (type === 'risk') return <AlertTriangle size={16} />;
  if (type === 'resources') return <Compass size={16} />;
  if (type === 'test') return <FileText size={16} />;
  return <span>{ICON_MAP[type]}</span>;
}


export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            background: 'var(--neon-pink)',
            border: 'none',
            boxShadow: 'var(--glow-pink)',
            color: 'white',
            width: '45px',
            height: '45px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Menu size={24} />
        </button>
      )}

      <aside style={{
        width: isOpen ? '300px' : '0px',
        minHeight: '100vh',
        background: 'rgba(5, 5, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: isOpen ? '1px solid rgba(255, 45, 120, 0.15)' : 'none',
        boxShadow: '8px 0 32px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        padding: isOpen ? '1.5rem 1rem' : '1.5rem 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        zIndex: 1000
      }}>
        <div style={{ minWidth: '208px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.25rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{String.fromCodePoint(0x1F4D6)}</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                letterSpacing: '0.05em',
                background: 'linear-gradient(to right, var(--neon-pink), var(--neon-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'neonPulse 3s ease infinite'
              }}>
                StudyBuddy
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: 'var(--neon-pink)',
                cursor: 'pointer', 
                display: 'flex', 
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 45, 120, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              background: isActive ? 'rgba(255, 45, 120, 0.12)' : 'transparent',
              color: isActive ? 'var(--neon-pink)' : 'var(--text-secondary)',
              borderLeft: isActive ? '3px solid var(--neon-pink)' : '3px solid transparent',
              boxShadow: isActive ? 'inset 0 0 15px rgba(255, 45, 120, 0.05)' : 'none'
            })}
          >
            <span style={{ fontSize: '1rem', display: 'inline-flex', alignItems: 'center' }}>
              <NavIcon type={icon} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem', marginBottom: '1rem' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(255, 45, 120, 0.15)',
            border: '2px solid var(--neon-pink)',
            boxShadow: 'var(--glow-pink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', color: 'var(--neon-pink)',
            fontFamily: 'var(--font-display)', flexShrink: 0,
          }}>
            {currentUser?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Student'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SEM {currentUser?.currentSemester || '-'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-ghost"
          style={{
            width: '100%', padding: '0.6rem',
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.1em'
          }}
        >
          SIGN OUT
        </button>
      </div>
        </div>
      </aside>
    </>
  );
}
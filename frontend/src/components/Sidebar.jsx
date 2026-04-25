import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart2, AlertTriangle, Menu, ChevronLeft, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: 'home', label: 'Dashboard' },
  { path: '/progress', icon: 'chart', label: 'Progress' },
  { path: '/performance', icon: 'activity', label: 'Performance' },
  { path: '/swot', icon: 'bolt', label: 'SWOT' },
  { path: '/learning-debt', icon: 'risk', label: 'Learning Debt' },
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
  book: String.fromCodePoint(0x1F4DA),
  test: null,
  user: String.fromCodePoint(0x1F464),
};

function NavIcon({ type }) {
  if (type === 'chart') return <BarChart2 size={16} />;
  if (type === 'activity') return <Activity size={16} />;
  if (type === 'risk') return <AlertTriangle size={16} />;
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
            zIndex: 100,
            background: 'rgba(15, 15, 40, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(25, 25, 60, 0.9)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(15, 15, 40, 0.8)'}
        >
          <Menu size={20} />
        </button>
      )}

      <aside style={{
        width: isOpen ? '240px' : '0px',
        minHeight: '100vh',
        background: 'rgba(10, 10, 30, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRight: isOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: isOpen ? '1.5rem 1rem' : '1.5rem 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.3s',
        flexShrink: 0,
      }}>
        <div style={{ minWidth: '208px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.25rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{String.fromCodePoint(0x1F4D6)}</span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                background: 'linear-gradient(to right, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                StudyBuddy
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', display: 'flex', padding: 0,
              }}
            >
              <ChevronLeft size={20} />
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
              padding: '0.7rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.18s ease',
              background: isActive ? 'rgba(129,140,248,0.15)' : 'transparent',
              color: isActive ? '#818cf8' : 'rgba(255,255,255,0.6)',
              borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
            })}
          >
            <span style={{ fontSize: '1rem', display: 'inline-flex', alignItems: 'center' }}>
              <NavIcon type={icon} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0,
          }}>
            {currentUser?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Student'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Sem {currentUser?.currentSemester || '-'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '0.55rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            borderRadius: '8px', cursor: 'pointer',
            fontSize: '0.82rem', transition: 'all 0.18s',
          }}
          onMouseOver={(e) => { e.target.style.borderColor = '#fca5a5'; e.target.style.color = '#fca5a5'; }}
          onMouseOut={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          Sign Out
        </button>
      </div>
        </div>
      </aside>
    </>
  );
}
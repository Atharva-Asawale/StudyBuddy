import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/progress',  icon: '📈', label: 'Progress'  },
  { path: '/swot',      icon: '🎯', label: 'SWOT'      },
  { path: '/syllabus',  icon: '📚', label: 'Syllabus'  },
  { path: '/profile',   icon: '👤', label: 'Profile'   },
];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'rgba(10, 10, 30, 0.7)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>

      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '0.6rem', padding: '0.5rem 0.75rem 2rem',
      }}>
        <span style={{ fontSize: '1.4rem' }}>⬡</span>
        <span style={{
          fontSize: '1.1rem', fontWeight: 700,
          background: 'linear-gradient(to right, #818cf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          StudyBuddy
        </span>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: '0.75rem', padding: '0.7rem 0.85rem',
              borderRadius: '10px', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: 500,
              transition: 'all 0.18s ease',
              background: isActive ? 'rgba(129,140,248,0.15)' : 'transparent',
              color: isActive ? '#818cf8' : 'rgba(255,255,255,0.6)',
              borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
            })}
          >
            <span style={{ fontSize: '1rem' }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: '1rem',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0.6rem', padding: '0.5rem',
          marginBottom: '0.75rem',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: 'white',
            flexShrink: 0,
          }}>
            {currentUser?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '0.85rem', fontWeight: 600,
              color: 'white', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {currentUser?.name || 'Student'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Sem {currentUser?.currentSemester || '—'}
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
          onMouseOver={e => {
            e.target.style.borderColor = '#fca5a5';
            e.target.style.color = '#fca5a5';
          }}
          onMouseOut={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
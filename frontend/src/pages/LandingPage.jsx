import { Link } from 'react-router-dom';

export default function LandingPage({ openLogin }) {
  return (
    <div className="landing-container page-enter" style={{ width: '100%' }}>
      <nav className="navbar glass-panel" style={{ 
        margin: '0', 
        width: '100%', 
        borderRadius: '0', 
        padding: '1.5rem 5%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <h2 className="logo" style={{ fontSize: '1.8rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>STUDYBUDDY</h2>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link to="/admin/login" style={{ 
            color: 'var(--neon-gold)', 
            textShadow: '0 0 10px var(--neon-gold)',
            textDecoration: 'none', 
            fontSize: '13px', 
            fontWeight: '800',
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase'
          }}>ADMIN</Link>
          <button className="btn-secondary" style={{ padding: '12px 32px', fontSize: '12px' }} onClick={openLogin}>SIGN IN</button>
        </div>
      </nav>

      <section className="hero" style={{ marginTop: '160px', padding: '0 5%' }}>
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 6vw, 5rem)', 
          lineHeight: 1.1, 
          marginBottom: '2rem',
          fontFamily: 'var(--font-display)',
          textAlign: 'center'
        }}>
          MASTER YOUR ACADEMICS WITH <br />
          <span style={{ 
            color: 'var(--neon-pink)', 
            textShadow: 'var(--glow-pink)',
            animation: 'neonPulse 3s ease infinite'
          }}>AI-POWERED INTELLIGENCE</span>
        </h1>
        <p style={{ 
          maxWidth: '900px', 
          margin: '0 auto 3rem', 
          fontSize: '1.3rem', 
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.6,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          TRACK PERFORMANCE, DETECT CONCEPT WEAKNESSES, GENERATE AUTOMATED SWOT ANALYSIS, 
          AND VISUALIZE YOUR LEARNING DEBT.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" style={{ padding: '18px 56px', fontSize: '16px' }} onClick={openLogin}>GET STARTED FREE</button>
        </div>
      </section>

      <section className="features" style={{ 
        marginTop: '150px', 
        gap: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '0 5%'
      }}>
        {[
          { icon: '📊', title: 'Progress Tracking', desc: 'Visualize your semester performance, CGPA trends, and compare subject scores in real-time.', color: 'var(--neon-cyan)' },
          { icon: '🧠', title: 'Learning Debt Engine', desc: 'Identify cascading weaknesses across prerequisite concepts before they impact your current grades.', color: 'var(--neon-pink)' },
          { icon: '🎯', title: 'Automated SWOT', desc: 'Receive an instant analysis of your academic Strengths, Weaknesses, Opportunities, and Threats.', color: 'var(--neon-gold)' }
        ].map((f, i) => (
          <div key={i} className="feature-card glass-panel card-animate" style={{ 
            padding: '3rem', 
            flex: '1 1 320px',
            maxWidth: '420px',
            textAlign: 'center',
            borderTop: `4px solid ${f.color}`
          }}>
            <div className="feature-icon" style={{ 
              fontSize: '3rem', 
              marginBottom: '24px',
              width: '80px', height: '80px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `rgba(255,255,255,0.05)`,
              borderRadius: '50%',
              border: `1px solid ${f.color}33`,
              boxShadow: `0 0 25px ${f.color}11`,
              margin: '0 auto 24px'
            }}>{f.icon}</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="footer glass-panel" style={{ 
        marginTop: '150px',
        padding: '80px 5%',
        borderRadius: '0', 
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        background: 'rgba(10, 10, 20, 0.95)',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontFamily: 'var(--font-ui)', letterSpacing: '0.3em', fontSize: '14px', color: 'var(--neon-pink)', marginBottom: '20px', fontWeight: '800' }}>DEVELOPED BY TEAM STUDYBUDDY</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--neon-cyan)', letterSpacing: '0.1em' }}>© 2026 ALL RIGHTS RESERVED | SYSTEM STATUS: OPTIMAL</div>
      </footer>
    </div>
  );
}
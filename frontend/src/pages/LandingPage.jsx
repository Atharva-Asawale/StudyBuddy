import { Link } from 'react-router-dom';

export default function LandingPage({ openLogin }) {
  return (
    <div className="landing-container">
      <nav className="navbar glass-panel">
        <h2 className="logo">StudyBuddy</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link to="/admin/login" style={{ color: '#a0a0b0', textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px' }}>Admin Login</Link>
          <button className="login-btn" onClick={openLogin}>Sign In</button>
        </div>
      </nav>

      <section className="hero">
       
        <h1>
          Master Your Academics with <br />
          <span>AI-Powered Intelligence</span>
        </h1>
        <p>
          Track your performance, detect concept weaknesses, generate automated SWOT analysis, 
          and visualize your learning debt using structured dependency logic.
        </p>
        <button className="cta-btn" onClick={openLogin}>Get Started Free</button>
      </section>

      <section className="features">
        <div className="feature-card glass-panel">
          <div className="feature-icon">📊</div>
          <h3>Progress Tracking</h3>
          <p>Visualize your semester performance, CGPA trends, and compare subject scores in real-time.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-icon">🧠</div>
          <h3>Learning Debt Engine</h3>
          <p>Identify cascading weaknesses across prerequisite concepts before they impact your current grades.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-icon">🎯</div>
          <h3>Automated SWOT</h3>
          <p>Receive an instant analysis of your academic Strengths, Weaknesses, Opportunities, and Threats.</p>
        </div>
      </section>

      <footer className="footer glass-panel" style={{ borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
        <p>Developed by Team StudyBuddy</p>
        <p>© 2026 All Rights Reserved</p>
      </footer>
    </div>
  );
}
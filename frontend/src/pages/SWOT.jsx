import DashboardLayout from '../layouts/DashboardLayout';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/api';

const swotColors = {
  STRENGTHS: { color: '#00ff88', bg: 'rgba(0, 255, 136, 0.05)', border: 'rgba(0, 255, 136, 0.2)', icon: '🛡️' },
  WEAKNESSES: { color: '#ff1744', bg: 'rgba(255, 23, 68, 0.05)', border: 'rgba(255, 23, 68, 0.2)', icon: '⚠️' },
  OPPORTUNITIES: { color: '#00f5ff', bg: 'rgba(0, 245, 255, 0.05)', border: 'rgba(0, 245, 255, 0.2)', icon: '🚀' },
  THREATS: { color: '#ff6b00', bg: 'rgba(255, 107, 0, 0.05)', border: 'rgba(255, 107, 0, 0.2)', icon: '🔥' },
};

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
};

export default function SWOT() {
  const { cachedSwotData, cacheSwotData } = useAuth();
  const [swotData, setSwotData] = useState(cachedSwotData);
  const [loading, setLoading] = useState(!cachedSwotData);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('rule'); // 'rule' or 'ai'

  const fetchSwot = async (force = false) => {
    if (!force && cachedSwotData) {
      setSwotData(cachedSwotData);
      setLoading(false);
      return;
    }

    if (force) setRegenerating(true);
    else setLoading(true);

    setError(null);
    try {
      const res = await studentService.getSwotAnalysis();
      setSwotData(res.data);
      cacheSwotData(res.data);
    } catch (err) {
      console.error('Failed to generate SWOT analysis', err);
      setError("Failed to generate your detailed SWOT analysis. Please try again.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchSwot();
  }, []);

  const handleRegenerate = () => fetchSwot(true);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '60vh', textAlign: 'center'
        }}>
          <div className="spinner" style={{
            width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#00f5ff', borderRadius: '50%', animation: 'spin 1s linear infinite',
            marginBottom: '1.5rem'
          }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
            Performing Deep Academic Audit...
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px', lineHeight: 1.6 }}>
            Our AI is cross-referencing your quiz history, syllabus progress, and branch-specific expectations to build a comprehensive career and academic roadmap.
          </p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ ...glass, textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#ff1744', marginBottom: '1rem' }}>Analysis Interrupted</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>{error}</p>
          <button
            onClick={() => fetchSwot(true)}
            style={{
              padding: '0.85rem 2.5rem', borderRadius: '12px', background: '#00f5ff',
              color: '#1a1a2e', fontWeight: 800, border: 'none', cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 245, 255, 0.3)'
            }}
          >
            Restart Audit
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const data = swotData || {};

  return (
    <DashboardLayout>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.8rem', fontWeight: 900, color: 'white',
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem',
          textShadow: '0 0 20px rgba(0, 245, 255, 0.2)'
        }}>
          Tactical Analysis
        </h1>
        <p style={{ color: '#00f5ff', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.9rem' }}>
          INTELLIGENT PERFORMANCE & CAREER MAPPING
        </p>
      </header>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem', marginBottom: '2.5rem'
      }}>
        {[
          { label: 'Topics Attempted', value: data.totalAttempted, icon: '📚', color: '#93c5fd' },
          { label: 'Topics Mastered', value: data.totalMastered, icon: '🏆', color: '#00ff88' },
          { label: 'Top Subject', value: data.topSubject, icon: '✨', color: '#fde68a' },
          { 
            label: 'CGPA Trend', 
            value: data.cgpaTrend === 0 ? 'Stable' : `${data.cgpaTrend > 0 ? '▲' : '▼'} ${Math.abs(data.cgpaTrend).toFixed(2)}`, 
            icon: '📈', 
            color: data.cgpaTrend >= 0 ? '#00ff88' : '#ff1744' 
          },
        ].map((stat, i) => (
          <div key={i} style={{ 
            ...glass, padding: '1.5rem', borderLeft: `5px solid ${stat.color}`,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {stat.label}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '14px',
          display: 'inline-flex', border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <button
            onClick={() => setViewMode('rule')}
            style={{
              padding: '0.7rem 2rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: viewMode === 'rule' ? '#00f5ff' : 'transparent',
              color: viewMode === 'rule' ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
              fontWeight: 800, transition: 'all 0.3s ease', fontSize: '0.9rem'
            }}
          >
            DATA MATRIX
          </button>
          <button
            onClick={() => setViewMode('ai')}
            style={{
              padding: '0.7rem 2rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: viewMode === 'ai' ? '#00f5ff' : 'transparent',
              color: viewMode === 'ai' ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
              fontWeight: 800, transition: 'all 0.3s ease', fontSize: '0.9rem'
            }}
          >
            AI AUDIT
          </button>
        </div>
      </div>

      {/* Detailed Analysis Section (AI Mode Only) */}
      {viewMode === 'ai' && (
        <div style={{
          ...glass, marginBottom: '2.5rem', borderLeft: '6px solid #00f5ff',
          background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.05) 0%, rgba(15, 15, 40, 0.6) 100%)'
        }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#00f5ff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            🔍 DEEP ACADEMIC AUDIT
          </h3>
          <p style={{
            fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)',
            fontFamily: "'Inter', sans-serif", letterSpacing: '0.01em'
          }}>
            {data.detailedAnalysis}
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem', marginBottom: '2.5rem'
      }}>
        {[
          { key: 'STRENGTHS', items: data.strengths, ai: data.strengthsAI, subtitle: 'Elite Competencies' },
          { key: 'WEAKNESSES', items: data.weaknesses, ai: data.weaknessesAI, subtitle: 'Critical Vulnerabilities' },
          { key: 'OPPORTUNITIES', items: data.opportunities, ai: data.opportunitiesAI, subtitle: 'Growth Vectors' },
          { key: 'THREATS', items: data.threats, ai: data.threatsAI, subtitle: 'Risk Factors' },
        ].map((section) => {
          const config = swotColors[section.key];
          return (
            <div
              key={section.key}
              className="swot-card"
              style={{
                ...glass,
                background: config.bg,
                borderColor: config.border,
                borderTopWidth: '5px',
                borderTopColor: config.color,
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: `0 4px 20px ${config.bg}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: config.color, display: 'flex', alignItems: 'center', gap: '0.6rem', textTransform: 'uppercase' }}>
                    {config.icon} {section.key}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', fontWeight: 600 }}>{section.subtitle}</p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.08)', padding: '0.3rem 0.75rem',
                  borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700
                }}>
                  {viewMode === 'rule' ? (section.items?.length || 0) : 'VERIFIED'}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '220px', paddingRight: '0.5rem' }}>
                {viewMode === 'rule' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {section.items?.length > 0 ? (
                      section.items.map((item, i) => (
                        <div key={i} style={{
                          padding: '0.45rem 1rem', borderRadius: '10px',
                          background: 'rgba(255,255,255,0.05)', border: `1px solid ${config.border}`,
                          color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {item}
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '1rem' }}>
                        No tactical signals detected in this quadrant.
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{
                    color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: 1.7,
                    fontFamily: "'Inter', sans-serif", fontStyle: 'italic', letterSpacing: '0.01em'
                  }}>
                    {section.ai}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Career Advice Section (AI Mode Only) */}
      {viewMode === 'ai' && (
        <div style={{
          ...glass, marginBottom: '2.5rem', borderLeft: '6px solid #00ff88',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, rgba(15, 15, 40, 0.6) 100%)'
        }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#00ff88', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            💼 CAREER PATHWAYS & OPPORTUNITIES
          </h3>
          <p style={{
            fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)',
            fontFamily: "'Inter', sans-serif", letterSpacing: '0.01em'
          }}>
            {data.careerAdvice}
          </p>
        </div>
      )}

      {/* Overall Advice */}
      <div style={{
        ...glass, background: 'linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(15,15,40,0.6) 100%)',
        borderColor: 'rgba(129,140,248,0.3)', borderLeft: '6px solid #818cf8', marginBottom: '3rem'
      }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#818cf8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          🎯 STRATEGIC MENTOR DIRECTIVE
        </h3>
        <div style={{
          fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.95)',
          fontFamily: "'Inter', sans-serif", whiteSpace: 'pre-wrap'
        }}>
          {data.overallAdvice}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          style={{
            padding: '1.1rem 3rem', borderRadius: '15px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontWeight: 800,
            cursor: regenerating ? 'not-allowed' : 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.9rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.transform = 'translateY(-4px)'; e.target.style.borderColor = '#00f5ff'; }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.transform = 'translateY(0)'; e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        >
          {regenerating ? 'RE-SYNCING INTELLIGENCE...' : 'REGENERATE FULL AUDIT'}
        </button>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '1.5rem', fontWeight: 500 }}>
          Detailed audit synchronized with your latest performance metrics.
        </p>
      </div>

      <style>{`
        .swot-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}

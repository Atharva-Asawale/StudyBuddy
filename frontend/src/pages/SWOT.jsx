import DashboardLayout from '../layouts/DashboardLayout';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/api';
import GameLoader from '../components/GameLoader';
import MiniLoader from '../components/MiniLoader';

const swotColors = {
  STRENGTHS: { color: 'var(--neon-green)', bg: 'rgba(0, 255, 136, 0.05)', border: 'rgba(0, 255, 136, 0.2)', icon: '🛡️' },
  WEAKNESSES: { color: 'var(--neon-red)', bg: 'rgba(255, 23, 68, 0.05)', border: 'rgba(255, 23, 68, 0.2)', icon: '⚠️' },
  OPPORTUNITIES: { color: 'var(--neon-cyan)', bg: 'rgba(0, 245, 255, 0.05)', border: 'rgba(0, 245, 255, 0.2)', icon: '🚀' },
  THREATS: { color: 'var(--neon-gold)', bg: 'rgba(255, 107, 0, 0.05)', border: 'rgba(255, 107, 0, 0.2)', icon: '🔥' },
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
      setError("FAILED TO GENERATE ANALYSIS.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchSwot();
  }, []);

  const handleRegenerate = () => fetchSwot(true);

  if (loading) return <GameLoader message="GENERATING ANALYSIS..." subMessage="ANALYZING PERFORMANCE DATA" />;

  if (error) {
    return (
      <DashboardLayout>
        <div className="page-enter" style={{ maxWidth: '600px', margin: '4rem auto' }}>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', borderTop: '4px solid var(--neon-red)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: 'var(--neon-red)', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>ANALYSIS FAILED</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontFamily: 'var(--font-mono)' }}>{error}</p>
            <button onClick={() => fetchSwot(true)} className="btn-primary">RETRY</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const data = swotData || {};

  return (
    <DashboardLayout>
      <div className="page-enter">
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>STRENGTHS & WEAKNESSES</h1>
          <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', fontSize: '11px' }}>
            SWOT ANALYSIS
          </div>
        </header>

        {/* Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem', marginBottom: '3rem'
        }}>
          {[
            { label: 'TOPICS ATTEMPTED', value: data.totalAttempted, color: 'var(--neon-cyan)' },
            { label: 'TOPICS MASTERED', value: data.totalMastered, color: 'var(--neon-green)' },
            { label: 'TOP SUBJECT', value: data.topSubject?.toUpperCase(), color: 'var(--neon-gold)' },
            { 
              label: 'EFFICIENCY TREND', 
              value: data.cgpaTrend === 0 ? 'STABLE' : `${data.cgpaTrend > 0 ? '▲' : '▼'} ${Math.abs(data.cgpaTrend).toFixed(2)}`, 
              color: data.cgpaTrend >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' 
            },
          ].map((stat, i) => (
            <div key={i} className="glass-panel card-animate" style={{ padding: '1.5rem', borderLeft: `4px solid ${stat.color}` }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '8px',
            display: 'inline-flex', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              onClick={() => setViewMode('rule')}
              className={viewMode === 'rule' ? "btn-primary" : "btn-ghost"}
              style={{ borderRadius: '4px', padding: '10px 30px', fontSize: '11px' }}
            >
              DATA VIEW
            </button>
            <button
              onClick={() => setViewMode('ai')}
              className={viewMode === 'ai' ? "btn-primary" : "btn-ghost"}
              style={{ borderRadius: '4px', padding: '10px 30px', fontSize: '11px', marginLeft: '6px' }}
            >
              AI INSIGHTS
            </button>
          </div>
        </div>

        {/* Detailed Analysis Section (AI Mode Only) */}
        {viewMode === 'ai' && (
          <div className="glass-panel card-animate" style={{ marginBottom: '2.5rem', borderLeft: '6px solid var(--neon-cyan)', padding: '2rem' }}>
            <h3 style={{ fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>🔍 DETAILED PERFORMANCE ANALYSIS</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
              {data.detailedAnalysis}
            </p>
          </div>
        )}

        {/* Main Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem', marginBottom: '3rem'
        }}>
          {[
            { key: 'STRENGTHS', items: data.strengths, ai: data.strengthsAI, subtitle: 'AREAS OF EXCELLENCE' },
            { key: 'WEAKNESSES', items: data.weaknesses, ai: data.weaknessesAI, subtitle: 'AREAS FOR IMPROVEMENT' },
            { key: 'OPPORTUNITIES', items: data.opportunities, ai: data.opportunitiesAI, subtitle: 'GROWTH POTENTIAL' },
            { key: 'THREATS', items: data.threats, ai: data.threatsAI, subtitle: 'CHALLENGES' },
          ].map((section) => {
            const config = swotColors[section.key];
            return (
              <div
                key={section.key}
                className="glass-panel card-animate"
                style={{
                  padding: '2rem',
                  borderTop: `4px solid ${config.color}`,
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: config.color, textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
                      {config.icon} {section.key}
                    </h3>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em' }}>{section.subtitle}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>
                    {viewMode === 'rule' ? (section.items?.length || 0) : 'VERIFIED'}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  {viewMode === 'rule' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {section.items?.length > 0 ? (
                        section.items.map((item, i) => (
                          <div key={i} className="badge" style={{ borderColor: `${config.color}44`, color: 'var(--text-primary)', fontSize: '12px' }}>
                            {item.toUpperCase()}
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>NO SIGNALS DETECTED.</p>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, fontStyle: 'italic' }}>
                      {section.ai}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Mode Extra Insights */}
        {viewMode === 'ai' && (
          <>
            <div className="glass-panel card-animate" style={{ marginBottom: '2rem', borderLeft: '6px solid var(--neon-green)', padding: '2rem' }}>
              <h3 style={{ fontSize: '11px', color: 'var(--neon-green)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>💼 CAREER PATHWAYS</h3>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                {data.careerAdvice}
              </p>
            </div>
            <div className="glass-panel card-animate" style={{ marginBottom: '3rem', borderLeft: '6px solid var(--neon-purple)', padding: '2rem' }}>
              <h3 style={{ fontSize: '11px', color: 'var(--neon-purple)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>🎯 OVERALL ADVICE</h3>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap' }}>
                {data.overallAdvice}
              </p>
            </div>
          </>
        )}

        {viewMode === 'rule' && (
          <div className="glass-panel card-animate" style={{ marginBottom: '3rem', borderLeft: '6px solid var(--neon-purple)', padding: '2rem' }}>
            <h3 style={{ fontSize: '11px', color: 'var(--neon-purple)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>🎯 SUMMARY ADVICE</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap' }}>
              {data.overallAdvice}
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-secondary"
            style={{ minWidth: '300px', padding: '1.2rem' }}
          >
            {regenerating ? <MiniLoader /> : 'REFRESH ANALYSIS'}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '1.5rem', fontFamily: 'var(--font-mono)' }}>
            ANALYSIS UPDATED WITH LATEST PERFORMANCE METRICS.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

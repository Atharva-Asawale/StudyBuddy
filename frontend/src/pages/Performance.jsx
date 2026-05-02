import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { studentService } from '../services/api';
import GameLoader from '../components/GameLoader';

const statusConfig = {
  strong: { label: 'STRONG', color: 'var(--neon-green)', bg: 'rgba(0, 255, 136, 0.08)', border: 'rgba(0, 255, 136, 0.3)', description: 'STRONG UNDERSTANDING' },
  fair: { label: 'AVERAGE', color: 'var(--neon-gold)', bg: 'rgba(255, 171, 0, 0.08)', border: 'rgba(255, 171, 0, 0.3)', description: 'AVERAGE UNDERSTANDING' },
  weak: { label: 'WEAK', color: 'var(--neon-red)', bg: 'rgba(255, 23, 68, 0.08)', border: 'rgba(255, 23, 68, 0.3)', description: 'WEAK UNDERSTANDING' },
};

const getTopicStatusKey = (score) => {
  if (score === null) return null;
  if (score < 50) return 'weak';
  if (score < 75) return 'fair';
  return 'strong';
};

const buildHeatmapTopics = (dashboardData) => {
  const topics = Array.isArray(dashboardData?.topicPerformance) ? dashboardData.topicPerformance : [];

  const processed = topics.map((item) => {
    const isCustom = item.topic.startsWith('[Custom Test]');
    const cleanName = isCustom ? item.topic.replace('[Custom Test] ', '') : item.topic;
    const score = item.score;
    const statusKey = getTopicStatusKey(score);

    if (!statusKey) return null;

    return {
      topicName: cleanName,
      score: score,
      isCustom: isCustom,
      statusKey: statusKey,
      statusLabel: statusConfig[statusKey].label,
      statusColor: statusConfig[statusKey].color,
      bg: statusConfig[statusKey].bg,
      border: statusConfig[statusKey].border,
    };
  }).filter(Boolean);

  const grouped = {
    strong: [],
    fair: [],
    weak: []
  };

  processed.forEach(topic => {
    grouped[topic.statusKey].push(topic);
  });

  return Object.entries(grouped).filter(([_, list]) => list.length > 0);
};

export default function Performance() {
  const navigate = useNavigate();

  const [debtData, setDebtData] = useState(null);
  const [hoveredTopicKey, setHoveredTopicKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await studentService.getDashboard();
      setDebtData(response.data || null);
    } catch {
      setError('FAILED TO LOAD HEATMAP DATA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedHeatmapTopics = useMemo(() => buildHeatmapTopics(debtData), [debtData]);

  if (loading) return <GameLoader message="LOADING PERFORMANCE..." subMessage="GENERATING HEATMAP" />;

  return (
    <DashboardLayout>
      <div className="page-enter" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>PERFORMANCE HEATMAP</h1>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '12px', letterSpacing: '0.2em' }}>
            KNOWLEDGE COMPREHENSION MATRIX
          </div>
        </header>

        {error ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', borderTop: '4px solid var(--neon-red)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: 'var(--neon-red)', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>SYSTEM ERROR</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontFamily: 'var(--font-mono)' }}>{error}</p>
            <button onClick={loadData} className="btn-primary">RETRY</button>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '2.5rem', textAlign: 'center' }}>TOPIC PERFORMANCE</h3>
            
            {groupedHeatmapTopics.length ? groupedHeatmapTopics.map(([statusKey, topics]) => (
              <div key={statusKey} style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '4px 12px', background: statusConfig[statusKey].bg, border: `1px solid ${statusConfig[statusKey].color}`, borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: statusConfig[statusKey].color, letterSpacing: '0.2em', fontFamily: 'var(--font-mono)' }}>
                      {statusConfig[statusKey].label}
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
                    {statusConfig[statusKey].description}
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {topics.map((topic) => {
                    const topicKey = `${topic.isCustom ? 'custom' : 'syllabus'}-${topic.topicName}`;
                    const isHovered = hoveredTopicKey === topicKey;

                    return (
                      <div key={topicKey} style={{ position: 'relative' }} onMouseEnter={() => setHoveredTopicKey(topicKey)} onMouseLeave={() => setHoveredTopicKey(null)}>
                        <div style={{ 
                          minHeight: '100px', borderRadius: '8px', border: `1px solid ${topic.border}`, 
                          background: topic.bg, padding: '1.25rem', display: 'flex', flexDirection: 'column', 
                          justifyContent: 'center', transition: 'all 0.2s',
                          boxShadow: isHovered ? `0 0 20px ${topic.statusColor}22` : 'none',
                          transform: isHovered ? 'translateY(-2px)' : 'none'
                        }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', marginBottom: '8px', fontFamily: 'var(--font-ui)' }} title={topic.topicName}>
                            {topic.topicName.toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ fontSize: '18px', color: topic.statusColor, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{Math.round(topic.score)}%</div>
                            {topic.isCustom && (
                              <span style={{ fontSize: '8px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--neon-cyan)', borderRadius: '2px', color: 'var(--neon-cyan)', fontWeight: 800 }}>CUSTOM</span>
                            )}
                          </div>
                        </div>

                        {isHovered && (
                          <div style={{ 
                            position: 'absolute', zIndex: 30, left: '50%', transform: 'translateX(-50%)', bottom: '110%', 
                            width: '240px', background: 'var(--bg-surface)', border: `1px solid ${topic.statusColor}`, 
                            borderRadius: '4px', padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                            animation: 'pageEnter 0.2s ease-out'
                          }}>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', fontSize: '12px', fontFamily: 'var(--font-ui)' }}>{topic.topicName.toUpperCase()}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>ACCURACY: {Math.round(topic.score)}%</div>
                            <div style={{ color: topic.statusColor, fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>STATUS: {topic.statusLabel}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                              TRACKING DATA FROM ALL {topic.isCustom ? 'CUSTOM' : 'SYLLABUS'} ATTEMPTS.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 2rem', fontFamily: 'var(--font-mono)' }}>
                NO PERFORMANCE DATA FOUND. COMPLETE QUIZZES TO POPULATE HEATMAP.
              </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {Object.entries(statusConfig).map(([key, item]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

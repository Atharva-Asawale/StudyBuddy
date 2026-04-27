
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { debtService, studentService } from '../services/api';

const QUIZ_RESULTS_KEY = 'studybuddy_quiz_results';

const glass = {
  background: 'rgba(15, 15, 40, 0.62)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  padding: '1.25rem',
};

const sectionLabel = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.95rem',
  textAlign: 'center',
};

const statusConfig = {
  strong: { label: 'Strong', color: '#22c55e', bg: 'rgba(34,197,94,0.16)', border: 'rgba(34,197,94,0.4)', description: 'all strong' },
  fair: { label: 'Fair', color: '#eab308', bg: 'rgba(234,179,8,0.16)', border: 'rgba(234,179,8,0.4)', description: 'fair topics' },
  weak: { label: 'Weak', color: '#ef4444', bg: 'rgba(239,68,68,0.16)', border: 'rgba(239,68,68,0.4)', description: 'weak' },
};

const parseNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getTopicStatusKey = (score) => {
  if (score === null) return null;
  if (score < 50) return 'weak';
  if (score < 75) return 'fair';
  return 'strong';
};

const readQuizResults = () => {
  try {
    const raw = sessionStorage.getItem(QUIZ_RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const inferSubjectFromTopic = (topicName) => {
  const text = String(topicName || '').toLowerCase();
  if (text.includes('math')) return 'Mathematics';
  if (text.includes('physics')) return 'Physics';
  if (text.includes('chem')) return 'Chemistry';
  if (text.includes('algo') || text.includes('data structure') || text.includes('dbms') || text.includes('os') || text.includes('network')) return 'Computer Science';
  return 'General';
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
  const [quizResults, setQuizResults] = useState([]);
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
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedHeatmapTopics = useMemo(() => buildHeatmapTopics(debtData), [debtData]);

  return (
    <DashboardLayout>
      <style>{`@keyframes perfSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'white', margin: 0 }}>Performance Heatmap</h2>
        </div>

        {loading ? (
          <div style={{ ...glass, textAlign: 'center', padding: '3rem 1.25rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', margin: '0 auto 0.85rem', border: '3px solid rgba(56,189,248,0.25)', borderTop: '3px solid #38bdf8', animation: 'perfSpin 0.95s linear infinite' }} />
            <div style={{ color: '#000000', fontWeight: 600 }}>Loading performance heatmap...</div>
          </div>
        ) : error ? (
          <div style={{ ...glass, textAlign: 'center', padding: '2.6rem 1.25rem' }}>
            <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '0.45rem' }}>{error}</div>
            <button onClick={loadData} style={{ padding: '0.62rem 1.1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}>Retry</button>
          </div>
        ) : (
          <div style={glass}>
            <h3 style={sectionLabel}>Topic Heatmap</h3>
            {groupedHeatmapTopics.length ? groupedHeatmapTopics.map(([statusKey, topics]) => (
              <div key={statusKey} style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: statusConfig[statusKey].color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                  {statusConfig[statusKey].label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', fontWeight: 600 }}>
                  {statusConfig[statusKey].description}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  {topics.map((topic) => {
                    const topicKey = `${topic.isCustom ? 'custom' : 'syllabus'}-${topic.topicName}`;
                    const isHovered = hoveredTopicKey === topicKey;

                    return (
                      <div key={topicKey} style={{ position: 'relative' }} onMouseEnter={() => setHoveredTopicKey(topicKey)} onMouseLeave={() => setHoveredTopicKey(null)}>
                        <div style={{ minHeight: '90px', borderRadius: '12px', border: `1px solid ${topic.border}`, background: topic.bg, padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }} title={topic.topicName}>
                            {topic.topicName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: topic.statusColor, fontWeight: 800 }}>{Math.round(topic.score)}%</div>
                            {topic.isCustom && (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: '4px', color: '#818cf8', fontWeight: 600 }}>CUSTOM</span>
                            )}
                          </div>
                        </div>

                        {isHovered && (
                          <div style={{ position: 'absolute', zIndex: 30, left: '50%', transform: 'translateX(-50%)', top: '100%', marginTop: '0.5rem', width: '220px', background: 'rgba(5,10,22,0.98)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '12px', padding: '0.8rem', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                            <div style={{ color: 'white', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>{topic.topicName}</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Accuracy: {Math.round(topic.score)}%</div>
                            <div style={{ color: topic.statusColor, fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.8rem' }}>Status: {topic.statusLabel}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                              Performance is tracked across all {topic.isCustom ? 'custom' : 'syllabus'} attempts.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : <div style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '2rem' }}>No attempted topics yet. Take a quiz to see your performance heatmap!</div>}

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              {Object.entries(statusConfig).map(([key, item]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
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


import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { debtService } from '../services/api';

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
  weak: { label: 'Weak', color: '#ef4444', bg: 'rgba(239,68,68,0.16)', border: 'rgba(239,68,68,0.4)' },
  average: { label: 'Average', color: '#eab308', bg: 'rgba(234,179,8,0.16)', border: 'rgba(234,179,8,0.4)' },
  strong: { label: 'Strong', color: '#22c55e', bg: 'rgba(34,197,94,0.16)', border: 'rgba(34,197,94,0.4)' },
  not_started: { label: 'Not Started', color: '#9ca3af', bg: 'rgba(156,163,175,0.16)', border: 'rgba(156,163,175,0.4)' },
};

const parseNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getTopicStatusKey = (score) => {
  if (score === null) return 'not_started';
  if (score < 50) return 'weak';
  if (score < 75) return 'average';
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

const buildHeatmapTopics = (debtData, quizResults) => {
  const topicMap = new Map();
  const weakTopics = Array.isArray(debtData?.weakTopics) ? debtData.weakTopics : [];

  weakTopics.forEach((topic, index) => {
    if (typeof topic === 'string') {
      topicMap.set(`debt-${topic.toLowerCase()}`, {
        topicId: null,
        topicName: topic,
        subjectName: inferSubjectFromTopic(topic),
        score: 45,
      });
      return;
    }

    if (topic && typeof topic === 'object') {
      const topicName = topic.topicName || topic.topic || topic.name || `Topic ${index + 1}`;
      const score = parseNumber(topic.score);
      const topicId = topic.topicId || topic.id || null;
      topicMap.set(String(topicId || topicName).toLowerCase(), {
        topicId,
        topicName,
        subjectName: topic.subjectName || topic.subject || inferSubjectFromTopic(topicName),
        score: score,
      });
    }
  });

  quizResults.forEach((item) => {
    if (!item || typeof item !== 'object') return;

    const topicId = item.topicId || item.topic?.id || null;
    const topicName = item.topicName || item.topic?.name || item.topic || 'Untitled Topic';
    const score = parseNumber(item.score ?? item.percentage);
    const subjectName = item.subjectName || item.subject || inferSubjectFromTopic(topicName);
    const key = String(topicId || topicName).toLowerCase();
    const existing = topicMap.get(key);

    topicMap.set(key, {
      topicId: existing?.topicId || topicId,
      topicName: existing?.topicName || topicName,
      subjectName: existing?.subjectName || subjectName,
      score: score ?? existing?.score ?? null,
    });
  });

  const topics = Array.from(topicMap.values()).map((topic) => {
    const statusKey = getTopicStatusKey(topic.score ?? null);
    return {
      ...topic,
      statusLabel: statusConfig[statusKey].label,
      statusColor: statusConfig[statusKey].color,
      bg: statusConfig[statusKey].bg,
      border: statusConfig[statusKey].border,
    };
  });

  const grouped = topics.sort((a, b) => a.topicName.localeCompare(b.topicName)).reduce((acc, topic) => {
    const key = topic.subjectName || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(topic);
    return acc;
  }, {});

  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
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
      const response = await debtService.getGraph();
      setDebtData(response.data || null);
      setQuizResults(readQuizResults());
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event || event.key === QUIZ_RESULTS_KEY) setQuizResults(readQuizResults());
    };
    const handleFocus = () => setQuizResults(readQuizResults());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const groupedHeatmapTopics = useMemo(() => buildHeatmapTopics(debtData, quizResults), [debtData, quizResults]);

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
            {groupedHeatmapTopics.length ? groupedHeatmapTopics.map(([subjectName, topics]) => (
              <div key={subjectName} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.86)', marginBottom: '0.75rem' }}>{subjectName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.65rem' }}>
                  {topics.map((topic) => {
                    const topicKey = `${topic.topicId || 'topic'}-${topic.topicName}`;
                    const isHovered = hoveredTopicKey === topicKey;
                    const canQuiz = Boolean(topic.topicId);

                    return (
                      <div key={topicKey} style={{ position: 'relative' }} onMouseEnter={() => setHoveredTopicKey(topicKey)} onMouseLeave={() => setHoveredTopicKey(null)}>
                        <div style={{ minHeight: '82px', borderRadius: '10px', border: `1px solid ${topic.border}`, background: topic.bg, padding: '0.58rem' }}>
                          <div style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.35rem' }} title={topic.topicName}>{topic.topicName}</div>
                          <div style={{ fontSize: '0.82rem', color: topic.statusColor, fontWeight: 700 }}>{topic.score === null ? 'Not attempted' : Math.round(topic.score)}</div>
                        </div>

                        {isHovered && (
                          <div style={{ position: 'absolute', zIndex: 30, left: '0', top: '100%', marginTop: '0.42rem', width: '240px', background: 'rgba(5,10,22,0.96)', border: '1px solid rgba(56,189,248,0.35)', borderRadius: '10px', padding: '0.65rem', boxShadow: '0 10px 25px rgba(0,0,0,0.35)' }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.84rem' }}>{topic.topicName}</div>
                            <div style={{ color: 'rgba(226,232,240,0.88)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Score: {topic.score === null ? 'Not attempted' : Math.round(topic.score)}</div>
                            <div style={{ color: topic.statusColor, fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.55rem' }}>Status: {topic.statusLabel}</div>
                            <button disabled={!canQuiz} onClick={() => canQuiz && navigate(`/quiz/${topic.topicId}/${encodeURIComponent(topic.topicName)}`)} style={{ width: '100%', padding: '0.46rem 0.55rem', borderRadius: '8px', border: canQuiz ? 'none' : '1px solid rgba(255,255,255,0.2)', background: canQuiz ? 'linear-gradient(135deg, #38bdf8, #22d3ee)' : 'rgba(255,255,255,0.06)', color: canQuiz ? '#032024' : 'rgba(255,255,255,0.5)', fontWeight: 800, cursor: canQuiz ? 'pointer' : 'not-allowed' }}>
                              Take Quiz ?
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : <div style={{ color: 'rgba(255,255,255,0.75)' }}>No topic performance data available yet.</div>}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', justifyContent: 'center' }}>
              {[
                { label: 'Weak - at risk', key: 'weak' },
                { label: 'Average - needs work', key: 'average' },
                { label: 'Strong - mastered', key: 'strong' },
                { label: 'Not started', key: 'not_started' },
              ].map((item) => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusConfig[item.key].color, display: 'inline-block' }} />
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

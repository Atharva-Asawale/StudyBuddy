import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { debtService, studentService } from '../services/api';
import StreakCard from '../components/StreakCard';
import CountUp from '../components/CountUp';
import GameLoader from '../components/GameLoader';
import MiniLoader from '../components/MiniLoader';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList
} from 'recharts';

export default function Dashboard() {
  const {
    currentUser,
    cachedDashboardData,
    cachedDebtData,
    cacheDashboardData,
    cacheDebtData,
  } = useAuth();
  const [loading, setLoading] = useState(!cachedDashboardData || !cachedDebtData);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (cachedDashboardData && cachedDebtData) {
        setLoading(false);
        return;
      }

      try {
        const [dashboardRes, debtRes] = await Promise.all([
          studentService.getDashboard(),
          debtService.getGraph(),
        ]);
        cacheDashboardData(dashboardRes.data);
        cacheDebtData(debtRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        cacheDashboardData({
          totalQuizzes: 0,
          averageScore: 0,
          highestScore: 0,
          recentQuizzes: [],
          performanceTrend: [],
          topicPerformance: [],
        });
        cacheDebtData({ totalDebt: 0, weakTopics: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [cachedDashboardData, cachedDebtData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [dashboardRes, debtRes] = await Promise.all([
        studentService.getDashboard(),
        debtService.getGraph(),
      ]);
      cacheDashboardData(dashboardRes.data);
      cacheDebtData(debtRes.data);
    } catch (err) {
      console.error('Failed to refresh dashboard data', err);
    } finally {
      setRefreshing(false);
    }
  };

  const dashboardData = cachedDashboardData || {
    totalQuizzes: 0,
    averageScore: 0,
    highestScore: 0,
    recentQuizzes: [],
    performanceTrend: [],
    topicPerformance: [],
  };

  const processedTrend = (dashboardData.performanceTrend || []).reduce((acc, curr) => {
    const existing = acc.find(item => item.label === curr.label);
    if (existing) {
      existing.score = Math.round((existing.score + curr.score) / 2);
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.label) - new Date(b.label));

  const debtData = cachedDebtData || { totalDebt: 0, weakTopics: [] };

  const metrics = [
    { label: 'Total Quizzes', value: dashboardData.totalQuizzes ?? 0, color: 'var(--neon-purple)', suffix: '' },
    { label: 'Average Score', value: Math.round(dashboardData.averageScore ?? 0), color: 'var(--neon-green)', suffix: '%' },
    { label: 'Highest Score', value: Math.round(dashboardData.highestScore ?? 0), color: 'var(--neon-cyan)', suffix: '%' },
    { label: 'Attempts', value: dashboardData.recentQuizzes?.length ?? 0, color: 'var(--neon-pink)', suffix: '' },
  ];

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) return <GameLoader message="LOADING DASHBOARD..." subMessage="RETRIEVING DATA" />;

  return (
    <DashboardLayout>
      <div className="page-enter">
        {/* Welcome Card */}
        <div className="glass-panel" style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          borderTop: '2px solid var(--neon-pink)',
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              WELCOME BACK, {currentUser?.name?.split(' ')[0] || 'STUDENT'}
            </h1>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '14px', letterSpacing: '0.1em' }}>
              {currentUser?.branch?.toUpperCase()} / SEMESTER {currentUser?.currentSemester}
            </div>
          </div>

          <button
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ marginTop: '8px', minWidth: '220px' }}
          >
            {refreshing ? <MiniLoader /> : 'REFRESH DATA'}
          </button>
        </div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}>
          {metrics.map((metric) => (
            <div key={metric.label} className="glass-panel card-animate" style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.15em',
                marginBottom: '1rem',
              }}>
                {metric.label}
              </div>
              <div style={{
                fontSize: '3rem',
                color: metric.color,
                lineHeight: 1,
                textShadow: `0 0 20px ${metric.color}44`,
              }}>
                <CountUp end={metric.value} suffix={metric.suffix} />
              </div>
            </div>
          ))}
        </div>

        <div className="card-animate" style={{ marginBottom: '2rem' }}>
          <StreakCard />
        </div>

        {/* Weak Topics */}
        <div className="glass-panel card-animate" style={{ marginBottom: '2rem', borderTop: '2px solid var(--neon-red)', padding: '2.5rem 2rem 2rem' }}>
          <h3 style={{
            fontSize: '11px', color: 'var(--neon-red)',
            letterSpacing: '0.2em', marginBottom: '1.5rem',
            marginTop: '0'
          }}>
            WEAK TOPICS
          </h3>

          {debtData.weakTopics?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {debtData.weakTopics.map((topic, i) => (
                <span key={i} className="badge badge-danger" style={{ animation: 'neonPulse 2s ease infinite' }}>
                  {topic.name || topic.topicName || (typeof topic === 'string' ? topic : 'Unknown')}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              ALL TOPICS MASTERED. PERFORMANCE IS GOOD.
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: '1.5rem', marginBottom: '1.5rem',
        }}>
          <div className="glass-panel card-animate" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '11px', color: 'var(--neon-green)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
              PERFORMANCE TREND
            </h3>
            {processedTrend.length > 0 ? (
              <div style={{ height: '300px', width: '100%', minWidth: '300px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--neon-green)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                      itemStyle={{ color: 'var(--neon-green)' }}
                      labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Accuracy"
                      stroke="var(--neon-green)"
                      strokeWidth={3}
                      dot={{ fill: 'var(--neon-green)', r: 5, strokeWidth: 2, stroke: 'var(--bg-base)' }}
                      activeDot={{ r: 8, shadow: '0 0 15px var(--neon-green)' }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>INSUFFICIENT DATA FOR TREND ANALYSIS</div>
            )}
          </div>

          <div className="glass-panel card-animate" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
              TOP TOPIC SCORES
            </h3>
            {dashboardData.topicPerformance?.length > 0 ? (
              <div style={{ height: `${Math.max(200, (dashboardData.topicPerformance?.length || 0) * 40)}px`, width: '100%', minWidth: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.topicPerformance} layout="vertical" margin={{ left: 100, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="topic" stroke="var(--text-primary)" fontSize={10} width={120} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--neon-cyan)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                      itemStyle={{ color: 'var(--neon-cyan)' }}
                    />
                    <Bar dataKey="score" fill="var(--neon-cyan)" radius={[0, 4, 4, 0]} barSize={15}>
                      <LabelList dataKey="score" position="right" fill="var(--text-primary)" fontSize={10} fontFamily="var(--font-mono)" offset={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>NO TOPIC DATA RECORDED</div>
            )}
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="glass-panel card-animate" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '11px', color: 'var(--neon-purple)', letterSpacing: '0.2em', marginBottom: '1rem' }}>
            RECENT ACTIVITY
          </h3>
          {dashboardData.recentQuizzes?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dashboardData.recentQuizzes.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${item.score >= 70 ? 'var(--neon-green)' : item.score >= 40 ? 'var(--neon-gold)' : 'var(--neon-red)'}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>{item.quiz.toUpperCase()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{formatDate(item.date)}</div>
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: item.score >= 70 ? 'var(--neon-green)' : item.score >= 40 ? 'var(--neon-gold)' : 'var(--neon-red)'
                  }}>
                    {Math.round(item.score)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>NO RECENT ACTIVITY DETECTED</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

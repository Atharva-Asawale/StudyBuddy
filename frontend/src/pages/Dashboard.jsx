import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { debtService, studentService } from '../services/api';
import StreakCard from '../components/StreakCard';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
};

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

  const debtData = cachedDebtData || { totalDebt: 0, weakTopics: [] };

  const metrics = [
    { label: 'Total Quizzes', value: dashboardData.totalQuizzes ?? 0, color: '#818cf8' },
    { label: 'Average Score', value: `${Math.round(dashboardData.averageScore ?? 0)}%`, color: '#6ee7b7' },
    { label: 'Highest Score', value: `${Math.round(dashboardData.highestScore ?? 0)}%`, color: '#93c5fd' },
    { label: 'Recent Attempts', value: dashboardData.recentQuizzes?.length ?? 0, color: '#fde68a' },
  ];

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>

      {/* Welcome Card */}
      <div style={{
        ...glass,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        background: 'rgba(129,140,248,0.08)',
        borderColor: 'rgba(129,140,248,0.2)',
      }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p style={{ color: '#000000', fontSize: '1rem', fontWeight: 600 }}>
            {currentUser?.branch} | Semester {currentUser?.currentSemester}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            style={{
              padding: '0.75rem 1.8rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontWeight: 700,
              cursor: loading || refreshing ? 'not-allowed' : 'pointer',
              opacity: loading || refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Dashboard Data'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={glass}>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.38)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.75rem',
            }}>
              {metric.label}
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: metric.color,
              lineHeight: 1,
            }}>
              {loading ? '--' : metric.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <StreakCard />
      </div>

      {/* Weak Topics */}
      <div style={{ ...glass, marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: '1rem', textAlign: 'center'
        }}>
          Weak Topics
        </h3>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.88rem', textAlign: 'center' }}>
            Analyzing your topics...
          </p>
        ) : debtData.weakTopics?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {debtData.weakTopics.map((topic, i) => (
              <span key={i} style={{
                padding: '0.4rem 0.85rem',
                background: 'rgba(252,165,165,0.15)',
                border: '1px solid rgba(252,165,165,0.3)',
                borderRadius: '999px',
                color: '#fca5a5', fontSize: '0.82rem',
              }}>
                {topic.name || topic.topicName || (typeof topic === 'string' ? topic : 'Unknown Topic')}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6ee7b7', fontSize: '0.88rem' }}>
            No major weaknesses detected yet. Complete some quizzes to track progress.
          </p>
        )}
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem', marginBottom: '1.5rem',
      }}>
        <div style={glass}>
          <h3 style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: '1rem', textAlign: 'center'
          }}>Performance Trend</h3>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
              Loading your performance trend...
            </p>
          ) : dashboardData.performanceTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dashboardData.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6ee7b7"
                  strokeWidth={2}
                  dot={{ fill: '#6ee7b7', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
              No quiz history yet. Attempt a quiz to start tracking your trend.
            </p>
          )}
        </div>

        <div style={glass}>
          <h3 style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: '1rem', textAlign: 'center'
          }}>Top Topic Scores</h3>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
              Loading your topic performance...
            </p>
          ) : dashboardData.topicPerformance?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dashboardData.topicPerformance} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="topic" stroke="#888" fontSize={11} interval={0} angle={-12} height={50} />
                <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }} />
                <Bar dataKey="score" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
              Topic-level performance will appear after your first completed quiz.
            </p>
          )}
        </div>
      </div>

      {/* Recent Quizzes */}
      <div style={glass}>
        <h3 style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: '1rem', textAlign: 'center'
        }}>Recent Quiz Performance</h3>
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
            Loading your recent quizzes...
          </p>
        ) : dashboardData.recentQuizzes?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {dashboardData.recentQuizzes.map((item, i) => (
              <div key={`${item.quiz}-${item.date}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                paddingBottom: '0.85rem',
                borderBottom: i < dashboardData.recentQuizzes.length - 1
                  ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.score >= 70 ? '#6ee7b7' : item.score >= 40 ? '#fde68a' : '#fca5a5',
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>
                  {item.quiz}
                </span>
                <span style={{ fontSize: '0.86rem', color: '#93c5fd', minWidth: '60px', textAlign: 'right' }}>
                  {Math.round(item.score)}%
                </span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', minWidth: '90px', textAlign: 'right' }}>
                  {formatDate(item.date)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
            No recent quizzes yet. Complete a topic quiz to populate this section.
          </p>
        )}
      </div>

    </DashboardLayout>
  );
}

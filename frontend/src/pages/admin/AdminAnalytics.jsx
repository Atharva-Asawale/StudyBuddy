import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, Activity, Award, AlertTriangle, 
  BarChart2, Target, PieChart as PieIcon 
} from 'lucide-react';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AnalyticCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="glass-panel" style={{ 
    background: 'var(--card-bg)', 
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{title}</span>
      <div style={{ color: color, background: `${color}15`, padding: '8px', borderRadius: '10px' }}>
        <Icon size={18} />
      </div>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{subtext}</div>
  </div>
);

export default function AdminAnalytics() {
  const { cachedWeakTopics, cacheWeakTopics, cachedAdminStudents, cacheAdminStudents } = useAuth();
  const [students, setStudents] = useState(cachedAdminStudents || []);
  const [weakTopics, setWeakTopics] = useState(cachedWeakTopics || []);
  const [loading, setLoading] = useState(!cachedWeakTopics);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cachedWeakTopics || students.length === 0) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    if (!cachedWeakTopics) setLoading(true);
    try {
      const [studentsRes, weakTopicsRes] = await Promise.all([
        adminService.getStudents(),
        adminService.getWeakTopics()
      ]);
      setStudents(studentsRes.data);
      setWeakTopics(weakTopicsRes.data);
      cacheAdminStudents(studentsRes.data);
      cacheWeakTopics(weakTopicsRes.data);
    } catch (err) {
      if (!cachedWeakTopics) setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ color: 'white' }}>Loading analytics...</div>;

  // Calculate CGPA Distribution
  const cgpaRanges = [
    { name: '0-4', count: 0 },
    { name: '4-6', count: 0 },
    { name: '6-8', count: 0 },
    { name: '8-10', count: 0 }
  ];

  students.forEach(s => {
    if (!s.latestCgpa) return;
    if (s.latestCgpa < 4) cgpaRanges[0].count++;
    else if (s.latestCgpa < 6) cgpaRanges[1].count++;
    else if (s.latestCgpa < 8) cgpaRanges[2].count++;
    else cgpaRanges[3].count++;
  });

  // Calculate Engagement
  const withQuiz = students.filter(s => s.totalQuizzes > 0).length;
  const withMastery = students.filter(s => s.masteredTopics > 0).length;
  const atRisk = students.filter(s => s.weakTopics >= 5).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Platform Analytics</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', margin: '4px 0 0', fontSize: '0.9rem' }}>Deep dive into student performance and platform engagement</p>
      </div>

      {/* Engagement Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <AnalyticCard 
          title="Quiz Engagement" 
          value={`${Math.round((withQuiz / students.length) * 100)}%`} 
          subtext={`${withQuiz} students have taken at least one quiz`}
          icon={Activity} 
          color="#818cf8" 
        />
        <AnalyticCard 
          title="Mastery Reach" 
          value={`${Math.round((withMastery / students.length) * 100)}%`} 
          subtext={`${withMastery} students reached 100% on a topic`}
          icon={Target} 
          color="#22c55e" 
        />
        <AnalyticCard 
          title="At-Risk Students" 
          value={atRisk} 
          subtext="Students with 5+ weak topics"
          icon={AlertTriangle} 
          color="#ef4444" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* CGPA Distribution */}
        <div className="glass-panel" style={{ background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={18} color="#818cf8" /> CGPA Distribution
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaRanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} label={{ value: 'CGPA Range', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} label={{ value: 'Students', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#1a1a2e', border: 'none', color: 'white' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {cgpaRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#818cf8', '#22c55e'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Summary */}
        <div className="glass-panel" style={{ background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieIcon size={18} color="#c084fc" /> Branch Engagement
          </h3>
          {/* Simple table listing branch stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['CSE', 'AIML'].map(br => {
              const brStudents = students.filter(s => s.branch === br);
              const totalQuizzes = brStudents.reduce((acc, s) => acc + s.totalQuizzes, 0);
              const avgScore = brStudents.length > 0 ? (brStudents.reduce((acc, s) => acc + s.averageScore, 0) / brStudents.length).toFixed(1) : 0;
              return (
                <div key={br} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{br}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{brStudents.length} students</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#818cf8', fontWeight: 'bold' }}>{totalQuizzes} Quizzes</div>
                    <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>{avgScore}% Avg Score</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weak Topics Heatmap Table */}
      <div className="glass-panel" style={{ background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Subject Weakness Heatmap</h3>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Top 15 most frequent weak topics</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Topic Name</th>
                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Weak Count</th>
                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Avg Score</th>
                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>Intensity</th>
              </tr>
            </thead>
            <tbody>
              {weakTopics.map((wt, i) => (
                <tr key={wt.topicName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontSize: '0.9rem' }}>{wt.topicName}</td>
                  <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{wt.weakCount}</td>
                  <td style={{ padding: '12px', fontSize: '0.9rem' }}>{wt.avgScore.toFixed(1)}%</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ 
                      height: '8px', 
                      width: '100px', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min((wt.weakCount / students.length) * 400, 100)}%`, 
                        background: '#ef4444' 
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
              {weakTopics.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No significant weaknesses detected yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

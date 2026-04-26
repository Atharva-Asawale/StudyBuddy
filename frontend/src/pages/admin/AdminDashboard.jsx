import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Brain, TrendingUp, Zap, Trophy, 
  ArrowRight, Activity, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell as BarCell
} from 'recharts';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CountUp = ({ end, duration = 1500, decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = progress * end;
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  const formatted = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString();

  return <span>{formatted}</span>;
};

const StatCard = ({ title, value, icon: Icon, color, decimals = 0 }) => (
  <div className="glass-card" style={{
    background: 'rgba(5, 5, 20, 0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: '-10px',
      right: '-10px',
      width: '60px',
      height: '60px',
      background: color,
      filter: 'blur(40px)',
      opacity: 0.15
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>{title}</span>
      <div style={{ color: color, background: `${color}15`, padding: '8px', borderRadius: '10px' }}>
        <Icon size={20} />
      </div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
      <CountUp end={value} decimals={decimals} />
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { cachedAdminStats, cacheAdminStats } = useAuth();
  const [stats, setStats] = useState(cachedAdminStats);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(!cachedAdminStats);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cachedAdminStats) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    if (!cachedAdminStats) setLoading(true);
    try {
      const [statsRes, studentsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getStudents({ sortBy: 'createdAt' })
      ]);
      setStats(statsRes.data);
      cacheAdminStats(statsRes.data);
      setRecentStudents(studentsRes.data.slice(0, 5));
      setError(null);
    } catch (err) {
      if (!cachedAdminStats) setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'white' }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'white', textAlign: 'center', padding: '4rem' }}>
        <p>{error}</p>
        <button onClick={fetchData} style={{ padding: '8px 16px', borderRadius: '8px', background: '#818cf8', color: 'white', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  // Distribution Data
  const branchData = Object.entries(stats.branchDistribution || {}).map(([name, value]) => ({ name, value }));
  const COLORS = ['#818cf8', '#c084fc', '#3b82f6', '#22c55e'];

  const semData = [1, 2, 3, 4, 5, 6, 7, 8].map(num => ({
    name: `Sem ${num}`,
    students: stats.semesterDistribution?.[`Sem ${num}`] || 0
  }));

  const onboardedPercent = stats.totalStudents > 0 
    ? Math.round((stats.studentsOnboarded / stats.totalStudents) * 100) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Platform Overview</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', margin: '4px 0 0', fontSize: '0.9rem' }}>Real-time statistics across all branches</p>
      </div>

      {/* TOP STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="#3b82f6" />
        <StatCard title="CSE Students" value={stats.totalCSE} icon={BookOpen} color="#818cf8" />
        <StatCard title="AIML Students" value={stats.totalAIML} icon={Brain} color="#c084fc" />
        <StatCard title="Platform Avg CGPA" value={stats.averageCgpa} icon={TrendingUp} color="#22c55e" decimals={2} />
        <StatCard title="Quizzes Taken" value={stats.totalQuizzesTaken} icon={Zap} color="#eab308" />
        <StatCard title="Mastered Topics" value={stats.totalMasteredTopics} icon={Trophy} color="#10b981" />
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ background: 'rgba(5, 5, 20, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>Branch Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={branchData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {branchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ background: 'rgba(5, 5, 20, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>Semester Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                  {semData.map((entry, index) => (
                    <BarCell key={`cell-${index}`} fill="#818cf8" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT STUDENTS TABLE */}
      <div className="glass-card" style={{ background: 'rgba(5, 5, 20, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Recent Registrations</h3>
          <button 
            onClick={() => navigate('/admin/students')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'transparent', border: 'none', color: '#818cf8', 
              cursor: 'pointer', fontSize: '0.9rem' 
            }}
          >
            View All <ArrowRight size={16} />
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Name', 'Email', 'Branch', 'Sem', 'CGPA', 'Quizzes', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: '0.85rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((s, i) => (
                <tr 
                  key={s.userId} 
                  onClick={() => navigate(`/admin/students?selected=${s.userId}`)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px', fontSize: '0.9rem' }}>{s.name}</td>
                  <td style={{ padding: '12px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>{s.email}</td>
                  <td style={{ padding: '12px', fontSize: '0.9rem' }}>{s.branch}</td>
                  <td style={{ padding: '12px', fontSize: '0.9rem' }}>{s.currentSemester}</td>
                  <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', color: s.latestCgpa >= 8 ? '#22c55e' : '#eab308' }}>
                    {s.latestCgpa ? s.latestCgpa.toFixed(2) : '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.9rem' }}>{s.totalQuizzes}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{s.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PLATFORM HEALTH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ background: 'rgba(5, 5, 20, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '4px solid #818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{onboardedPercent}%</span>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Onboarding Rate</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{stats.studentsOnboarded} / {stats.totalStudents} completed profile</p>
          </div>
        </div>

        <div className="glass-card" style={{ background: 'rgba(5, 5, 20, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', padding: '12px', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Avg Quiz Score</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{stats.platformAverageScore ? stats.platformAverageScore.toFixed(1) : '0'}% across all attempts</p>
          </div>
        </div>

        <div className="glass-card" style={{ background: 'rgba(5, 5, 20, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Weak Topics Found</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>High density in AIML Mathematics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

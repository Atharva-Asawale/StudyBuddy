import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const progressData = [
  { week: 'W1', score: 62 },
  { week: 'W2', score: 68 },
  { week: 'W3', score: 65 },
  { week: 'W4', score: 74 },
  { week: 'W5', score: 79 },
  { week: 'W6', score: 83 },
];

const subjectData = [
  { subject: 'DSA',  score: 78 },
  { subject: 'OS',   score: 65 },
  { subject: 'DBMS', score: 54 },
  { subject: 'CN',   score: 82 },
  { subject: 'SE',   score: 70 },
];

const activityFeed = [
  { time: '2h ago',  text: 'Completed Data Structures quiz — 78%' },
  { time: '5h ago',  text: 'Studied Operating Systems for 1.5 hrs' },
  { time: '1d ago',  text: 'Learning debt flagged in DBMS Chapter 3' },
  { time: '2d ago',  text: 'AI Mentor suggested reviewing Binary Trees' },
];

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
};

export default function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <DashboardLayout>

      {/* Welcome Card */}
      <div style={{
        ...glass,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        background: 'rgba(129,140,248,0.08)',
        borderColor: 'rgba(129,140,248,0.2)',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 700,
            marginBottom: '0.25rem',
          }}>
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {currentUser?.branch} · Semester {currentUser?.currentSemester}
          </p>
        </div>

        {/* Learning Debt Score */}
        <div style={{
          textAlign: 'right',
          background: 'rgba(0,0,0,0.2)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: '0.25rem',
          }}>
            Learning Debt
          </div>
          <div style={{
            fontSize: '2.5rem', fontWeight: 700,
            color: '#6ee7b7', lineHeight: 1.1,
          }}>
            24%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6ee7b7', opacity: 0.7 }}>
            ↓ 3% this week
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        {/* Line Chart */}
        <div style={glass}>
          <h3 style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            Learning Progress
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[50, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone" dataKey="score"
                stroke="#6ee7b7" strokeWidth={2}
                dot={{ fill: '#6ee7b7', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div style={glass}>
          <h3 style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            Subject Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="subject" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="score" fill="#818cf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Feed */}
      <div style={glass}>
        <h3 style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1rem',
        }}>
          Recent Activity
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {activityFeed.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '0.85rem',
              borderBottom: i < activityFeed.length - 1
                ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#818cf8', flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>
                {item.text}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

    </DashboardLayout>
  );
}
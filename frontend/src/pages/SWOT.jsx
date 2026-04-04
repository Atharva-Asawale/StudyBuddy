import DashboardLayout from '../layouts/DashboardLayout';

const swotData = {
  Strengths: {
    color: '#6ee7b7',
    icon: '💪',
    items: [
      'Strong in Data Structures — 78% mastery',
      'Consistent attendance record',
      'Good problem-solving approach',
      'High score in Computer Networks — 82%',
    ],
  },
  Weaknesses: {
    color: '#fca5a5',
    icon: '⚠️',
    items: [
      'DBMS concepts weak — 54% mastery',
      'Low quiz scores in Operating Systems',
      'Inconsistent revision schedule',
      'Learning debt detected in Trees & Graphs',
    ],
  },
  Opportunities: {
    color: '#93c5fd',
    icon: '🚀',
    items: [
      'Upcoming internship season in 2 months',
      'Open-source contribution possible',
      'Hackathon participation can boost skills',
      'Strong base in DSA for placements',
    ],
  },
  Threats: {
    color: '#fde68a',
    icon: '🎯',
    items: [
      'Semester exams in 3 weeks',
      'High learning debt in CN propagating',
      'Peer competition increasing rapidly',
      'Weak DBMS may affect overall CGPA',
    ],
  },
};

const glass = {
  background: 'rgba(15, 15, 40, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
};

export default function SWOT() {
  return (
    <DashboardLayout>

      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: '1.6rem', fontWeight: 700,
          color: 'white', letterSpacing: '-0.02em',
          marginBottom: '0.35rem',
        }}>
          SWOT Analysis
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
          Auto-generated based on your quiz performance and topic mastery
        </p>
      </div>

      {/* SWOT Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
      }}>
        {Object.entries(swotData).map(([key, { color, icon, items }]) => (
          <div key={key} style={{
            ...glass,
            borderTop: `3px solid ${color}`,
          }}>
            {/* Card Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '0.5rem', marginBottom: '1.25rem',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
              <h3 style={{
                fontSize: '1rem', fontWeight: 700,
                color: color,
              }}>
                {key}
              </h3>
            </div>

            {/* Items */}
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, i) => (
                <li key={i} style={{
                  display: 'flex', alignItems: 'flex-start',
                  gap: '0.6rem', fontSize: '0.88rem',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.5,
                }}>
                  <div style={{
                    width: '6px', height: '6px',
                    borderRadius: '50%',
                    background: color,
                    marginTop: '6px', flexShrink: 0,
                  }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{
        marginTop: '1.25rem',
        padding: '1rem 1.25rem',
        background: 'rgba(129,140,248,0.08)',
        border: '1px solid rgba(129,140,248,0.2)',
        borderRadius: '12px',
        fontSize: '0.82rem',
        color: 'rgba(255,255,255,0.4)',
      }}>
        💡 SWOT analysis will be auto-generated from your real quiz scores and topic mastery once you complete quizzes in the Syllabus section.
      </div>

    </DashboardLayout>
  );
}
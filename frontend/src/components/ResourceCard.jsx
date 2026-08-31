import { Video, BookOpen, FileText, Layers, ExternalLink } from 'lucide-react';

export default function ResourceCard({ recommendation }) {
  const { topic, priority, reason, resourceType, youtubeSearchUrl, geeksforgeeksSearchUrl, nptelSearchUrl } = recommendation;

  const getPriorityColor = (p) => {
    if (p === 'HIGH') return 'var(--neon-pink)';
    if (p === 'MEDIUM') return 'var(--neon-cyan)';
    return 'var(--neon-green, #00e676)';
  };

  const getPriorityBg = (p) => {
    if (p === 'HIGH') return 'rgba(255, 45, 120, 0.12)';
    if (p === 'MEDIUM') return 'rgba(0, 240, 255, 0.12)';
    return 'rgba(0, 230, 118, 0.12)';
  };

  const renderTypeIcon = (type) => {
    switch (type) {
      case 'VIDEO':
        return <Video size={14} style={{ marginRight: 6 }} />;
      case 'PRACTICE':
        return <BookOpen size={14} style={{ marginRight: 6 }} />;
      case 'READING':
        return <FileText size={14} style={{ marginRight: 6 }} />;
      default:
        return <Layers size={14} style={{ marginRight: 6 }} />;
    }
  };

  const priorityColor = getPriorityColor(priority);

  return (
    <div
      className="glass-panel card-animate"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        border: `1px solid ${priorityColor}`,
        boxShadow: `0 0 15px ${getPriorityBg(priority)}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            background: getPriorityBg(priority),
            color: priorityColor,
            border: `1px solid ${priorityColor}`,
            letterSpacing: '0.05em',
          }}
        >
          {priority} PRIORITY
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {renderTypeIcon(resourceType)}
          {resourceType}
        </span>
      </div>

      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
        {topic}
      </h3>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
        {reason}
      </p>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {youtubeSearchUrl && (
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              fontSize: '11px',
              padding: '6px 12px',
              color: '#ff4444',
              borderColor: 'rgba(255,68,68,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            YouTube <ExternalLink size={12} style={{ marginLeft: 4 }} />
          </a>
        )}

        {geeksforgeeksSearchUrl && (
          <a
            href={geeksforgeeksSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              fontSize: '11px',
              padding: '6px 12px',
              color: 'var(--neon-cyan)',
              borderColor: 'rgba(0,240,255,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            GeeksforGeeks <ExternalLink size={12} style={{ marginLeft: 4 }} />
          </a>
        )}

        {nptelSearchUrl && (
          <a
            href={nptelSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              fontSize: '11px',
              padding: '6px 12px',
              color: 'var(--neon-gold)',
              borderColor: 'rgba(255,171,0,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            NPTEL <ExternalLink size={12} style={{ marginLeft: 4 }} />
          </a>
        )}
      </div>
    </div>
  );
}

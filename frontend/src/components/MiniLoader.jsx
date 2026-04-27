import React from 'react';

export default function MiniLoader() {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 6, height: 6,
          background: 'var(--neon-pink)',
          borderRadius: '50%',
          boxShadow: 'var(--glow-pink)',
          animation: `miniScale 0.6s ease infinite ${i * 0.2}s`
        }} />
      ))}
      <style>{`
        @keyframes miniScale {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.6); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

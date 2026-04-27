import React from 'react';

export default function GameLoader({ message = "LOADING...", subMessage = "PLEASE WAIT" }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5, 5, 10, 0.98)',
      zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Corner Brackets */}
      <div style={{ position: 'absolute', top: 40, left: 40, width: 20, height: 20, borderTop: '2px solid var(--neon-cyan)', borderLeft: '2px solid var(--neon-cyan)' }} />
      <div style={{ position: 'absolute', top: 40, right: 40, width: 20, height: 20, borderTop: '2px solid var(--neon-cyan)', borderRight: '2px solid var(--neon-cyan)' }} />
      <div style={{ position: 'absolute', bottom: 40, left: 40, width: 20, height: 20, borderBottom: '2px solid var(--neon-cyan)', borderLeft: '2px solid var(--neon-cyan)' }} />
      <div style={{ position: 'absolute', bottom: 40, right: 40, width: 20, height: 20, borderBottom: '2px solid var(--neon-cyan)', borderRight: '2px solid var(--neon-cyan)' }} />

      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {/* Outer Ring */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid transparent',
          borderTopColor: 'var(--neon-pink)',
          borderRightColor: 'var(--neon-purple)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        {/* Inner Ring */}
        <div style={{
          position: 'absolute', inset: 20,
          border: '2px solid transparent',
          borderBottomColor: 'var(--neon-cyan)',
          borderLeftColor: 'var(--neon-pink)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite reverse'
        }} />
        {/* Center Dot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 16, height: 16, margin: -8,
          background: 'var(--neon-pink)',
          borderRadius: '50%',
          boxShadow: 'var(--glow-pink)',
          animation: 'neonPulse 1.5s ease infinite'
        }} />
      </div>

      <div style={{
        marginTop: 32,
        fontFamily: 'var(--font-ui)',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: 'var(--neon-pink)',
        textTransform: 'uppercase',
        animation: 'neonPulse 2s ease infinite',
        textAlign: 'center'
      }}>
        {message}
      </div>

      <div style={{
        marginTop: 8,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase'
      }}>
        {subMessage}
      </div>

      <div style={{
        width: 200, height: 2,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 1, marginTop: 24,
        overflow: 'hidden'
      }}>
        <div style={{
          width: '40%', height: '100%',
          background: 'linear-gradient(90deg, var(--neon-pink), var(--neon-purple))',
          borderRadius: 1,
          animation: 'progressPulse 1.5s ease infinite alternate'
        }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progressPulse {
          from { width: 20%; opacity: 0.6; }
          to   { width: 80%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

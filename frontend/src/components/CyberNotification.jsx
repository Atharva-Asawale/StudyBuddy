import React, { useEffect, useState } from 'react';

export default function CyberNotification({ message, subMessage, type = "info", duration = 3000, onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!visible) return null;

  const colors = {
    info: 'var(--neon-cyan)',
    success: 'var(--neon-green)',
    warning: 'var(--neon-orange)',
    danger: 'var(--neon-red)',
    victory: 'var(--neon-gold)'
  };

  const color = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', top: '20%', left: 0, width: '100%',
      zIndex: 11000, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.85)',
        borderTop: `2px solid ${color}`,
        borderBottom: `2px solid ${color}`,
        padding: '20px 60px',
        width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: `0 0 50px ${color}33`,
        animation: 'slideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 48,
          color: color,
          textShadow: `0 0 10px ${color}`,
          letterSpacing: 4,
          textAlign: 'center'
        }}>
          {message}
        </div>
        {subMessage && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 16,
            color: 'var(--text-secondary)',
            marginTop: 10,
            textTransform: 'uppercase'
          }}>
            {subMessage}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

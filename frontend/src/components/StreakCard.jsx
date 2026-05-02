import React, { useEffect, useState } from 'react';
import { streakService } from '../services/api';

const glass = {
  background: 'rgba(5, 40, 10, 0.75)', // Solid dark green, 75% opaque
  backdropFilter: 'blur(12px)',
  border: '2px solid var(--neon-green)',
  borderRadius: '16px',
  padding: '1.5rem',
  transition: 'all 0.3s ease',
  animation: 'streakGlow 3s ease-in-out infinite'
};

export default function StreakCard() {
  const [streakData, setStreakData] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    streakService.getStreak()
      .then((res) => {
        setStreakData(res.data);
        if (res.data.currentStreak > 0) {
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 2000);
        }
      })
      .catch((err) => console.error("Error fetching streak:", err));
  }, []);

  if (!streakData) {
    return (
      <div style={glass} className="streak-placeholder">
        <div style={{ height: '24px', width: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1rem' }}></div>
        <div style={{ height: '40px', width: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
        <div style={{ height: '60px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '1rem' }}></div>
      </div>
    );
  }

  const today = new Date();
  const daysArray = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const pad = (n) => String(n).padStart(2, '0');
    // formatted as YYYY-MM-DD
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const activeDatesSet = new Set(streakData.last30DaysActivity || []);

  return (
    <div style={glass} className={`streak-card-container ${showAnimation ? 'streak-pop' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: 0 }}>Daily Streak</h3>
        <span style={{ fontSize: '1.5rem' }} role="img" aria-label="fire">🔥</span>
      </div>
      
      <div style={{ textAlign: 'center', color: '#fff', marginTop: '0.5rem' }}>
        <div style={{
          fontSize: '3rem', fontWeight: 'bold', display: 'inline-block',
          background: 'linear-gradient(to right, #fb923c, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textShadow: '0 4px 10px rgba(251, 146, 60, 0.3)'
        }}>
          {streakData.currentStreak}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>Days</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
        <div>Longest: <span style={{ fontWeight: 600, color: '#fff' }}>{streakData.longestStreak}</span></div>
        <div>Total days: <span style={{ fontWeight: 600, color: '#fff' }}>{streakData.totalActiveDays}</span></div>
      </div>

      <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Last 30 Days</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
          {daysArray.map((dateStr) => {
            const isActive = activeDatesSet.has(dateStr);
            return (
              <div 
                key={dateStr}
                style={{
                  width: '12px', height: '12px', borderRadius: '2px',
                  background: isActive ? '#f97316' : 'rgba(255,255,255,0.1)',
                  boxShadow: isActive ? '0 0 8px #f97316' : 'none',
                  animation: isActive ? 'neonPulse 2s ease infinite' : 'none'
                }}
                title={dateStr}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

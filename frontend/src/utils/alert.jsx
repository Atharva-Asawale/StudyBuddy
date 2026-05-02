import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const AlertModal = ({ message, isConfirm, onResolve }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleClose = (result) => {
    setVisible(false);
    setTimeout(() => onResolve(result), 300); // Wait for exit animation
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease'
    }}>
      <div style={{
        background: 'var(--card-bg, #111)', border: '1px solid var(--neon-cyan, #0ff)',
        borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '90%',
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
        transform: visible ? 'scale(1)' : 'scale(0.95)', transition: 'transform 0.3s ease',
        textAlign: 'center', color: '#fff'
      }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {isConfirm && (
            <button 
              onClick={() => handleClose(false)}
              style={{
                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', flex: 1
              }}
            >
              CANCEL
            </button>
          )}
          <button 
            onClick={() => handleClose(true)}
            style={{
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
              background: 'var(--neon-cyan, #0ff)', border: 'none',
              color: '#000', fontWeight: 'bold', flex: 1
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

let alertContainer = null;

const createContainer = () => {
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    document.body.appendChild(alertContainer);
  }
  return alertContainer;
};

const removeContainer = (container) => {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
  if (alertContainer === container) {
    alertContainer = null;
  }
};

export const customAlert = (message) => {
  return new Promise((resolve) => {
    const container = createContainer();
    const root = createRoot(container);
    root.render(
      <AlertModal 
        message={message} 
        isConfirm={false} 
        onResolve={() => {
          root.unmount();
          removeContainer(container);
          resolve(true);
        }} 
      />
    );
  });
};

export const customConfirm = (message) => {
  return new Promise((resolve) => {
    const container = createContainer();
    const root = createRoot(container);
    root.render(
      <AlertModal 
        message={message} 
        isConfirm={true} 
        onResolve={(result) => {
          root.unmount();
          removeContainer(container);
          resolve(result);
        }} 
      />
    );
  });
};

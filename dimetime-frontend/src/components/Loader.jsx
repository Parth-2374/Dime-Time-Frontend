import React from 'react';

export default function Loader({ size = 'medium', fullScreen = false }) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  };

  const spinnerStyle = {
    width: size === 'small' ? '24px' : size === 'large' ? '64px' : '40px',
    height: size === 'small' ? '24px' : size === 'large' ? '64px' : '40px',
    border: '3px solid rgba(255, 255, 255, 0.05)',
    borderTop: '3px solid #22c55e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1rem',
        width: '100%',
      };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>
        {fullScreen ? 'Connecting to AI Agents...' : 'Processing...'}
      </span>
    </div>
  );
}

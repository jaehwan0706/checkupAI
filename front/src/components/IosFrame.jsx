import React, { useEffect } from 'react';

const frameStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#1A1A2E',
  padding: '20px 0',
};

const phoneStyle = {
  position: 'relative',
  width: '375px',
  height: '844px',
  backgroundColor: '#F5F7FA',
  borderRadius: '44px',
  border: '10px solid #2A2A3E',
  boxShadow: '0 0 0 2px #3A3A4E, 0 30px 80px rgba(0,0,0,0.6)',
  overflow: 'hidden',
  flexShrink: 0,
};

const notchStyle = {
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '120px',
  height: '30px',
  backgroundColor: '#2A2A3E',
  borderBottomLeftRadius: '18px',
  borderBottomRightRadius: '18px',
  zIndex: 100,
};

const screenStyle = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#F5F7FA',
};

const FONT_BASE = { small: '14px', medium: '16px', large: '20px' };

const applyFontSize = () => {
  const key = localStorage.getItem('fontSize') || 'medium';
  document.documentElement.style.fontSize = FONT_BASE[key] || '16px';
};

export default function IosFrame({ children }) {
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    applyFontSize();
    window.addEventListener('fontSizeChange', applyFontSize);
    return () => window.removeEventListener('fontSizeChange', applyFontSize);
  }, []);

  if (isMobile) {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#F5F7FA', overflow: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <div style={frameStyle}>
      <div style={phoneStyle}>
        <div style={notchStyle} />
        <div style={screenStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}

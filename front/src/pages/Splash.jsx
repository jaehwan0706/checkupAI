import React, { useEffect } from 'react';
import { Icon, Spinner } from '../components/UI';

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div data-screen-label="스플래시" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 22,
      background: 'linear-gradient(160deg,#00B894 0%,#00A382 100%)',
      position: 'relative',
    }}>
      <div style={{ animation: 'hlpop .6s cubic-bezier(.2,.9,.3,1.2)' }}>
        <div style={{ width: 88, height: 88, borderRadius: 26, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <Icon name="heart" size={48} color="#fff" stroke={2.1} />
        </div>
      </div>
      <div style={{ textAlign: 'center', animation: 'hlfadeup .7s ease .15s both' }}>
        <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>검진AI</div>
        <div style={{ fontSize: '0.8438rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 6 }}>AI 건강 코치</div>
      </div>
      <div style={{ position: 'absolute', bottom: 56 }}>
        <Spinner size={26} color="#fff" stroke={2.6} />
      </div>
    </div>
  );
}

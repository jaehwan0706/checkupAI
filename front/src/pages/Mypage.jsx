import React, { useState, useEffect } from 'react';
import { T, Icon, Card, BottomSheet } from '../components/UI';
import api from '../api';

const FONT_SIZE_LABELS = { small: '작게', medium: '보통', large: '크게' };

export default function Mypage({ onNav, onLogout, toast, consent }) {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
  const initial = (user.name || '사용자').charAt(0);
  const [subscriptionDetail, setSubscriptionDetail] = useState('무료');
  const [fontSizeSheet, setFontSizeSheet] = useState(false);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');

  useEffect(() => {
    api.get('/api/user/me').then(res => {
      const expiry = res?.data?.data?.annualPassExpiry;
      if (expiry && new Date(expiry) > new Date()) {
        setSubscriptionDetail('프리미엄 이용 중');
      }
    }).catch(() => {});
  }, []);

  const changeFontSize = (key) => {
    setFontSize(key);
    localStorage.setItem('fontSize', key);
    window.dispatchEvent(new Event('fontSizeChange'));
  };

  const menu = [
    { icon: 'star',     label: '건강 목표 설정',   detail: null,                              to: 'goals'         },
    { icon: 'bell',     label: '알림 설정',        detail: null,                              to: 'notifications' },
    { icon: 'settings', label: '글자 크기',        detail: FONT_SIZE_LABELS[fontSize] || '보통', action: () => setFontSizeSheet(true) },
    { icon: 'shield',   label: '데이터 동의 관리', detail: consent ? '동의함' : '미동의',     to: 'consent'       },
    { icon: 'crown',    label: '구독 관리',        detail: subscriptionDetail,                to: 'premium'       },
    { icon: 'doc',      label: '개인정보 처리방침', detail: null,                             to: 'privacy'       },
    { icon: 'doc',      label: '이용약관',         detail: null,                              to: 'terms'         },
  ];

  return (
    <>
    <div data-screen-label="마이" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '56px 20px 14px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>{user.name || '사용자'}님의 마이페이지</h1>
      </div>
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 프로필 카드 */}
        <Card pad={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 999, background: 'linear-gradient(135deg,#00B894,#4CAF82)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.3125rem', fontWeight: 800, flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: T.ink }}>{user.name || '사용자'}</div>
            <div style={{ fontSize: '0.7812rem', color: T.inkSoft, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(user.loginType === 'KAKAO' || ('kakaoEmail' in user && !user.loginType)) ? (user.kakaoEmail || '이메일 미제공') : (user.email || '이메일 미제공')}
            </div>
          </div>
          <button onClick={() => onNav('profile')} style={{ width: 36, height: 36, borderRadius: 10, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="edit" size={18} color={T.inkMid} stroke={1.9} />
          </button>
        </Card>

        {/* 프리미엄 배너 */}
        <div onClick={() => onNav('premium')} style={{ cursor: 'pointer', borderRadius: 18, padding: 16, display: 'flex', alignItems: 'center', gap: 13, background: 'linear-gradient(135deg,#1E4D8C,#163A6B)', boxShadow: '0 14px 30px rgba(30,77,140,0.3)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(180deg,#F0B445,#E0982A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="crown" size={24} color="#fff" stroke={2.1} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#fff' }}>프리미엄 시작하기</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>전체 해석 · 10년 트렌드 · 연간 9,900원</div>
          </div>
          <Icon name="chevR" size={20} color="#F0B445" />
        </div>

        {/* 메뉴 목록 */}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {menu.map((r, i) => (
            <button key={r.label}
              onClick={() => {
                if (r.action) r.action();
                else if (r.to) onNav(r.to);
                else if (r.toastMsg) toast && toast(r.toastMsg);
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderBottom: i < menu.length - 1 ? '1px solid ' + T.line : 'none', textAlign: 'left' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={r.icon} size={19} color={T.blue} stroke={2} />
              </div>
              <span style={{ flex: 1, fontSize: '0.9062rem', fontWeight: 600, color: T.ink }}>{r.label}</span>
              {r.detail && <span style={{ fontSize: '0.7812rem', color: r.detail === '미동의' ? T.warn : T.inkSoft, fontWeight: 700 }}>{r.detail}</span>}
              {(r.to || r.action || r.toastMsg) && <Icon name="chevR" size={17} color="#C6D3E6" />}
            </button>
          ))}
        </Card>

        <button onClick={onLogout} style={{ height: 50, borderRadius: 14, background: '#fff', border: '1px solid ' + T.line, color: T.inkMid, fontSize: '0.9062rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(26,43,69,0.05)' }}>
          로그아웃
        </button>
      </div>
    </div>
    <BottomSheet open={fontSizeSheet} onClose={() => setFontSizeSheet(false)}>
      <h3 style={{ margin: '0 0 6px 2px', fontSize: '1.125rem', fontWeight: 800, color: T.ink }}>글자 크기</h3>
      <p style={{ margin: '0 0 18px 2px', fontSize: '0.8125rem', color: T.inkSoft, lineHeight: 1.5 }}>앱 전체의 글자 크기를 변경해요</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[
          { key: 'small',  label: '작게', sample: 12 },
          { key: 'medium', label: '보통', sample: 15 },
          { key: 'large',  label: '크게', sample: 18 },
        ].map(({ key, label, sample }) => (
          <button
            key={key}
            onClick={() => { changeFontSize(key); setFontSizeSheet(false); }}
            style={{
              flex: 1, padding: '16px 0', borderRadius: 14,
              background: fontSize === key ? T.blue : '#fff',
              color: fontSize === key ? '#fff' : T.ink,
              border: `1.5px solid ${fontSize === key ? T.blue : T.line}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all .15s ease',
            }}
          >
            <span style={{ fontSize: sample, fontWeight: 800 }}>가</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: fontSize === key ? 'rgba(255,255,255,0.85)' : T.inkSoft }}>{label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
    </>
  );
}

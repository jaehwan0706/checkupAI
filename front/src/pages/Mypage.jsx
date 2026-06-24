import React from 'react';
import { T, Icon, Card } from '../components/UI';

export default function Mypage({ onNav, onLogout, toast, consent }) {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
  const initial = (user.name || '사용자').charAt(0);

  const menu = [
    { icon: 'star',    label: '건강 목표 설정',   detail: null,                   to: 'goals'         },
    { icon: 'bell',    label: '알림 설정',        detail: null,                   to: 'notifications' },
    { icon: 'shield',  label: '데이터 동의 관리', detail: consent ? '동의함' : '미동의', to: 'consent' },
    { icon: 'crown',   label: '구독 관리',        detail: '무료',                 to: 'premium'       },
    { icon: 'doc',     label: '개인정보 처리방침', detail: null,                  to: 'privacy'       },
    { icon: 'doc',     label: '이용약관',         detail: null,                   to: 'terms'         },
  ];

  return (
    <div data-screen-label="마이" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '56px 20px 14px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>{user.name || '사용자'}님의 마이페이지</h1>
      </div>
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 프로필 카드 */}
        <Card pad={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 999, background: 'linear-gradient(135deg,#00B894,#4CAF82)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 21, fontWeight: 800, flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{user.name || '사용자'}</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {'kakaoEmail' in user ? (user.kakaoEmail || '이메일 미제공') : (user.email || '')}
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
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>프리미엄 시작하기</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>전체 해석 · 10년 트렌드 · 연간 9,900원</div>
          </div>
          <Icon name="chevR" size={20} color="#F0B445" />
        </div>

        {/* 메뉴 목록 */}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {menu.map((r, i) => (
            <button key={r.label}
              onClick={() => r.to ? onNav(r.to) : (r.toastMsg && toast && toast(r.toastMsg))}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderBottom: i < menu.length - 1 ? '1px solid ' + T.line : 'none', textAlign: 'left' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={r.icon} size={19} color={T.blue} stroke={2} />
              </div>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: T.ink }}>{r.label}</span>
              {r.detail && <span style={{ fontSize: 12.5, color: r.detail === '미동의' ? T.warn : T.inkSoft, fontWeight: 700 }}>{r.detail}</span>}
              {(r.to || r.toastMsg) && <Icon name="chevR" size={17} color="#C6D3E6" />}
            </button>
          ))}
        </Card>

        <button onClick={onLogout} style={{ height: 50, borderRadius: 14, background: '#fff', border: '1px solid ' + T.line, color: T.inkMid, fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 1px 3px rgba(26,43,69,0.05)' }}>
          <Icon name="logout" size={18} color={T.inkMid} stroke={2} /> 로그아웃
        </button>
      </div>
    </div>
  );
}

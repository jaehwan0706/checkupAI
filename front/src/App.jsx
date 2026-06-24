import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/global.css';
import IosFrame from './components/IosFrame';
import { T, BottomNav, BottomSheet, ConfirmModal, Button, Icon, Toast, Spinner } from './components/UI';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import { Login, Signup, ResetPw } from './pages/Auth';
import Home from './pages/Home';
import Input from './pages/Input';
import Report from './pages/Report';
import Daily from './pages/Daily';
import Premium from './pages/Premium';
import Mypage from './pages/Mypage';
import History from './pages/History';
import HealthGoal from './pages/HealthGoal';
import NotificationSettings from './pages/NotificationSettings';
import ConsentManagement from './pages/ConsentManagement';
import ProfileEdit from './pages/ProfileEdit';
import ExtraInfo from './pages/ExtraInfo';
import TermsDocument from './pages/TermsDocument';
import PremiumReport from './pages/PremiumReport';

const NAV_SCREENS = ['home', 'input', 'report', 'daily', 'trends', 'my', 'history', 'goals', 'notifications', 'consent', 'privacy', 'terms', 'profile', 'premium', 'premiumReport'];
const ONB_KEY = 'kac_onboarded_v1';

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // atob()는 Latin-1 바이트를 반환하므로 한글(UTF-8 멀티바이트)이 깨짐
    // 각 바이트를 %XX로 변환 후 decodeURIComponent로 UTF-8 복원
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch { return {}; }
}

/* ── HealthConsentSheet ── */
function HealthConsentSheet({ open, onAgree, onClose }) {
  const [items, setItems] = useState({ collect: false, ai: false, third: false });
  useEffect(() => { if (open) setItems({ collect: false, ai: false, third: false }); }, [open]);
  const toggle = (k) => setItems(s => ({ ...s, [k]: !s[k] }));
  const reqOk = items.collect && items.ai;
  const Check = ({ on }) => (
    <span style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, background: on ? T.green : '#fff', border: '1.5px solid ' + (on ? T.green : '#CFD8E3'), display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
      <Icon name="check" size={13} color={on ? '#fff' : '#CFD8E3'} stroke={3} />
    </span>
  );
  const rows = [
    { k: 'collect', req: true,  title: '민감정보(건강정보) 수집·이용 동의', desc: '검진 수치 등 건강정보를 해석 목적으로 수집·이용합니다.' },
    { k: 'ai',      req: true,  title: 'AI 분석 처리 동의', desc: '입력한 검진 결과를 AI가 분석해 해석을 제공합니다.' },
    { k: 'third',   req: false, title: '검진기관 연동 동의 (선택)', desc: '제휴 검진기관의 결과를 자동으로 불러옵니다.' },
  ];
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon name="shield" size={24} color={T.blue} stroke={2} />
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink, lineHeight: 1.35 }}>건강정보 활용에<br/>동의가 필요해요</h2>
      <p style={{ margin: '10px 0 18px', fontSize: 13, color: T.inkMid, lineHeight: 1.6 }}>건강검진 결과는 민감정보로, AI 해석을 제공하려면 아래 항목에 동의가 필요해요. 동의는 한 번만 받고, 마이페이지에서 언제든 철회할 수 있어요.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
        {rows.map(r => (
          <button key={r.k} onClick={() => toggle(r.k)} style={{ display: 'flex', gap: 11, padding: '11px 0', textAlign: 'left', borderTop: '1px solid ' + T.line }}>
            <Check on={items[r.k]} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>
                <span style={{ color: r.req ? T.blue : T.inkSoft }}>{r.req ? '[필수] ' : '[선택] '}</span>{r.title}
              </div>
              <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <Button variant="primary" onClick={() => reqOk && onAgree()} disabled={!reqOk}>동의하고 분석 받기</Button>
      <button onClick={onClose} style={{ width: '100%', marginTop: 10, fontSize: 13.5, fontWeight: 600, color: T.inkSoft, padding: 8 }}>나중에 할게요</button>
    </BottomSheet>
  );
}

/* ── AnalyzeOverlay ── */
function AnalyzeOverlay({ show }) {
  if (!show) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 250, background: 'rgba(245,247,250,0.96)', backdropFilter: 'blur(3px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, animation: 'hlfade .2s ease' }}>
      <Spinner size={46} color={T.blue} stroke={3} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>AI가 분석하고 있어요</div>
        <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 5 }}>수치를 쉬운 말로 풀어내는 중이에요...</div>
      </div>
    </div>
  );
}

/* ── MoreSheet ── */
function MoreSheet({ open, onClose, onNav }) {
  const items = [
    { icon: 'crown', label: '프리미엄', sub: '더 자세한 건강 인사이트', to: 'premium', soft: T.warnSoft, color: T.warn },
    { icon: 'user',  label: '마이페이지', sub: '내 정보·기록·설정', to: 'my', soft: T.blueSoft, color: T.blue },
  ];
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h3 style={{ margin: '0 0 14px 2px', fontSize: 18, fontWeight: 800, color: T.ink }}>더보기</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(it => (
          <button key={it.to} onClick={() => { onClose(); onNav(it.to); }} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14, borderRadius: 15, background: T.bg, textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: it.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={it.icon} size={23} color={it.color} stroke={2.1} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{it.label}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{it.sub}</div>
            </div>
            <Icon name="chevR" size={18} color="#C6D3E6" />
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

/* ── Main App ── */
export default function App() {
  const [screen, setScreen] = useState('splash');
  const [more, setMore] = useState(false);
  const [logout, setLogout] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportSource, setReportSource] = useState('직접 입력');
  const [premiumReturn, setPremiumReturn] = useState('home');
  const [consent, setConsent] = useState(() => {
    try { return localStorage.getItem('aiConsent') === '1'; } catch { return false; }
  });
  const [consentOpen, setConsentOpen] = useState(false);
  const pendingAction = useRef(null);
  const [toastState, setToastState] = useState(null);
  const toastTimer = useRef(null);

  /* OAuth callback */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;
    const claims = parseJwt(token);
    localStorage.setItem('token', token);
    // name은 JWT 대신 /api/user/me 응답값 사용 (JWT atob 인코딩 우회)
    localStorage.setItem('user', JSON.stringify({ userId: Number(claims.sub), email: claims.email || '', name: '' }));
    window.history.replaceState({}, '', '/');

    import('./api').then(({ default: api }) => {
      api.get('/api/user/me').then(res => {
        const u = res.data.data || {};
        // API 응답의 name으로 덮어쓰기
        const stored = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
        localStorage.setItem('user', JSON.stringify({ ...stored, name: u.name || '카카오 사용자', kakaoEmail: u.kakaoEmail || null }));
        if (!u.gender || !u.birthDate) {
          setScreen('extra-info');
        } else {
          setScreen('home');
        }
      }).catch(() => setScreen('home'));
    });
  }, []);

  const toast = useCallback((msg, icon) => {
    setToastState({ msg, icon });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(null), 2400);
  }, []);

  const go = useCallback((s) => {
    if (s === 'premium') setPremiumReturn(prev => (screen === 'premium' ? prev : screen));
    setMore(false);
    setScreen(s);
    setTimeout(() => {
      const scroller = document.querySelector('[data-screen-label]');
      if (scroller && scroller.scrollTo) scroller.scrollTo(0, 0);
    }, 50);
  }, [screen]);

  const runAnalysis = useCallback((method) => {
    setReportSource(method);
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); go('report'); }, 2200);
  }, [go]);

  const requireConsent = useCallback((cb) => {
    if (consent) { cb(); return; }
    pendingAction.current = cb;
    setConsentOpen(true);
  }, [consent]);

  const analyze = useCallback((method) => {
    requireConsent(() => runAnalysis(method));
  }, [requireConsent, runAnalysis]);

  const onConsentAgree = useCallback(() => {
    setConsent(true);
    setConsentOpen(false);
    localStorage.setItem('aiConsent', '1');
    const cb = pendingAction.current; pendingAction.current = null;
    if (cb) cb();
  }, []);

  const onConsentCancel = useCallback(() => { setConsentOpen(false); pendingAction.current = null; }, []);
  const withdrawConsent = useCallback(() => {
    setConsent(false);
    localStorage.removeItem('aiConsent');
    toast('건강정보 활용 동의를 철회했어요', 'check');
  }, [toast]);

   const afterSplash = useCallback(() => {
     let seen = false;
     try { seen = localStorage.getItem(ONB_KEY) === '1'; } catch (e) {}
     go(seen ? 'login' : 'onboarding');
   }, [go]);

  

  const finishOnboarding = useCallback(() => {
    try { localStorage.setItem(ONB_KEY, '1'); } catch (e) {}
    go('login');
  }, [go]);

  const goWrapped = useCallback((s) => {
    if (s === 'login') { setConsent(false); localStorage.removeItem('aiConsent'); }
    if (s === 'report' && !consent) { requireConsent(() => go('report')); return; }
    go(s);
  }, [go, consent, requireConsent]);

  const withNav = NAV_SCREENS.includes(screen);

  const renderPage = () => {
    switch (screen) {
      case 'splash':     return <Splash onDone={afterSplash} />;
      case 'onboarding': return <Onboarding onDone={finishOnboarding} />;
      case 'login':      return <Login onLogin={() => go('home')} onNav={go} />;
      case 'signup':     return <Signup onSignup={() => { toast('가입이 완료되었어요', 'check'); go('login'); }} onNav={go} />;
      case 'reset':      return <ResetPw onNav={go} toast={toast} />;
      case 'home':       return <Home onNav={goWrapped} toast={toast} />;
      case 'input':      return <Input onAnalyze={analyze} toast={toast} />;
      case 'report':     return <Report source={reportSource} onPremium={() => go('premium')} toast={toast} />;
      case 'daily':      return <Daily toast={toast} initialMode="맞춤 가이드" onNav={goWrapped} />;
      case 'trends':     return <Daily toast={toast} initialMode="검진 트렌드" onNav={goWrapped} />;
      case 'premium':    return <Premium onClose={() => go(premiumReturn)} toast={toast} onNav={goWrapped} />;
      case 'premiumReport': return <PremiumReport onNav={goWrapped} toast={toast} />;
      case 'my':         return <Mypage onNav={goWrapped} onLogout={() => setLogout(true)} toast={toast} consent={consent} />;
      case 'history':    return <History onNav={goWrapped} />;
      case 'goals':      return <HealthGoal onNav={goWrapped} toast={toast} />;
      case 'notifications': return <NotificationSettings onNav={goWrapped} />;
      case 'consent':    return <ConsentManagement onNav={goWrapped} consent={consent} onWithdraw={withdrawConsent} />;
      case 'privacy':    return <TermsDocument kind="privacy" onNav={goWrapped} />;
      case 'terms':      return <TermsDocument kind="terms" onNav={goWrapped} />;
      case 'profile':    return <ProfileEdit onNav={goWrapped} toast={toast} />;
      case 'extra-info': return <ExtraInfo onDone={() => go('home')} toast={toast} />;
      default:           return <Home onNav={goWrapped} />;
    }
  };

  return (
    <IosFrame>
      <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: screen === 'splash' ? '#00B894' : T.bg }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {renderPage()}
        </div>
        {withNav && <BottomNav active={screen} onNav={goWrapped} onMore={() => setMore(true)} />}
        <MoreSheet open={more} onClose={() => setMore(false)} onNav={goWrapped} />
        <ConfirmModal
          open={logout} title="로그아웃 하시겠어요?"
          body="다시 로그인하면 내 건강 정보를 계속 확인할 수 있어요."
          confirmLabel="로그아웃" danger
          onConfirm={() => {
            setLogout(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            go('login');
          }}
          onClose={() => setLogout(false)}
        />
        <HealthConsentSheet open={consentOpen} onAgree={onConsentAgree} onClose={onConsentCancel} />
        <AnalyzeOverlay show={analyzing} />
        <Toast toast={toastState} />
      </div>
    </IosFrame>
  );
}

import React, { useState } from 'react';
import { T, Button, Field, Icon, SubHeader, Spinner } from '../components/UI';
import api from '../api';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Logo({ size = 56, radius = 16, iconSize = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(135deg,#00B894,#4CAF82)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(0,184,148,0.32)' }}>
      <Icon name="heart" size={iconSize} color="#fff" stroke={2.2} />
    </div>
  );
}

function KakaoButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', height: 52, borderRadius: 14, background: '#FEE500', color: '#191600', fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-1 3.6 4-2.4c.6.1 1.2.1 1.8.1 5 0 9-3.1 9-7s-4-7.4-9-7.4Z" fill="#191600"/>
      </svg>
      카카오로 로그인
    </button>
  );
}

export function Login({ onLogin, onNav }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e = {};
    if (!email.trim()) e.email = '이메일을 입력해주세요';
    else if (!emailRe.test(email)) e.email = '올바른 이메일 형식이 아니에요';
    if (!pw.trim()) e.pw = '비밀번호를 입력해주세요';
    setErr(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password: pw });
      const data = res.data.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, userId: data.userId, loginType: data.loginType }));
      onLogin();
    } catch (err) {
      setErr({ pw: err.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요' });
    } finally {
      setLoading(false);
    }
  };

  const kakaoLogin = () => {
    window.location.href = (process.env.REACT_APP_API_URL || 'http://localhost:8081') + '/oauth2/authorization/kakao';
  };

  return (
    <div data-screen-label="로그인" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '60px 26px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block' }}><Logo /></div>
        <h1 style={{ margin: '16px 0 0', fontSize: '1.4375rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>다시 만나 반가워요</h1>
        <p style={{ margin: '8px 0 0', fontSize: '0.8438rem', color: T.inkSoft }}>검진AI에 로그인하고 내 건강을 확인하세요</p>
      </div>

      <div style={{ padding: '28px 26px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="이메일" type="email" placeholder="example@email.com" value={email}
          onChange={v => { setEmail(v); setErr(e => ({ ...e, email: undefined })); }}
          icon="mail" error={err.email} inputMode="email" />
        <Field label="비밀번호" type="password" placeholder="비밀번호를 입력하세요" value={pw}
          onChange={v => { setPw(v); setErr(e => ({ ...e, pw: undefined })); }}
          icon="lock" error={err.pw} onEnter={submit} />
        <div style={{ textAlign: 'right', marginTop: -2 }}>
          <button onClick={() => onNav('reset')} style={{ fontSize: '0.7812rem', fontWeight: 600, color: T.inkMid, padding: 2 }}>비밀번호 찾기</button>
        </div>
        <div style={{ marginTop: 4 }}>
          <Button variant="primary" onClick={submit} disabled={loading}>
            {loading ? <Spinner size={22} color="#fff" stroke={2.5} /> : '로그인'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '22px 26px 18px' }}>
        <div style={{ flex: 1, height: 1, background: T.line }} />
        <span style={{ fontSize: '0.75rem', color: T.inkSoft, fontWeight: 600 }}>또는</span>
        <div style={{ flex: 1, height: 1, background: T.line }} />
      </div>
      <div style={{ padding: '0 26px' }}><KakaoButton onClick={kakaoLogin} /></div>

      <div style={{ textAlign: 'center', padding: '26px 26px 30px', fontSize: '0.8438rem', color: T.inkMid }}>
        아직 회원이 아니신가요?{' '}
        <button onClick={() => onNav('signup')} style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.blue }}>회원가입</button>
      </div>
    </div>
  );
}

export function Signup({ onSignup, onNav }) {
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '', birth: '', gender: '' });
  const [err, setErr] = useState({});
  const [agreeAll, setAgreeAll] = useState(false);
  const [agree, setAgree] = useState({ service: false, privacy: false, health: false });
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => { setF(s => ({ ...s, [k]: v })); setErr(e => ({ ...e, [k]: undefined })); };
  const toggleAll = () => { const v = !agreeAll; setAgreeAll(v); setAgree({ service: v, privacy: v, health: v }); };
  const toggle = (k) => { const n = { ...agree, [k]: !agree[k] }; setAgree(n); setAgreeAll(n.service && n.privacy && n.health); };

  const submit = async () => {
    const e = {};
    if (!f.name.trim()) e.name = '이름을 입력해주세요';
    if (!f.email.trim()) e.email = '이메일을 입력해주세요';
    else if (!emailRe.test(f.email)) e.email = '올바른 이메일 형식이 아니에요';
    if (!f.pw) e.pw = '비밀번호를 입력해주세요';
    else if (f.pw.length < 8) e.pw = '비밀번호는 8자 이상이어야 해요';
    if (f.pw2 !== f.pw) e.pw2 = '비밀번호가 일치하지 않아요';
    if (!f.birth.trim()) e.birth = '생년월일을 입력해주세요';
    if (!f.gender) e.gender = '성별을 선택해주세요';
    if (!agree.service || !agree.privacy || !agree.health) e.agree = '필수 약관에 동의해주세요';
    setErr(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await api.post('/api/auth/signup', { 
      name: f.name, 
      email: f.email, 
      password: f.pw, 
      birthDate: f.birth.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      gender: f.gender === '남' ? 'MALE' : 'FEMALE'
    });
      onSignup();
    } catch (err) {
      setErr({ email: err.response?.data?.message || '회원가입에 실패했어요' });
    } finally {
      setLoading(false);
    }
  };

  const Check = ({ on, big }) => (
    <span style={{ width: big ? 22 : 20, height: big ? 22 : 20, borderRadius: 999, flexShrink: 0, background: on ? T.green : '#fff', border: '1.5px solid ' + (on ? T.green : '#CFD8E3'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s ease' }}>
      <Icon name="check" size={big ? 13 : 12} color={on ? '#fff' : '#CFD8E3'} stroke={3} />
    </span>
  );

  return (
    <div data-screen-label="회원가입" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title="회원가입" onBack={() => onNav('login')} />
      <div style={{ padding: '4px 26px 0' }}>
        <p style={{ margin: 0, fontSize: '0.8438rem', color: T.inkSoft }}>몇 가지 정보만 입력하면 바로 시작해요</p>
      </div>

      <div style={{ padding: '20px 26px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="이름" placeholder="이름을 입력하세요" value={f.name} onChange={set('name')} icon="user" error={err.name} />
        <Field label="이메일" type="email" placeholder="example@email.com" value={f.email} onChange={set('email')} icon="mail" error={err.email} inputMode="email" />
        <Field label="비밀번호" type="password" placeholder="8자 이상 입력하세요" value={f.pw} onChange={set('pw')} icon="lock" error={err.pw} />
        <Field label="비밀번호 확인" type="password" placeholder="비밀번호를 다시 입력하세요" value={f.pw2} onChange={set('pw2')} icon="lock" error={err.pw2} />
        <Field label="생년월일" placeholder="YYYY.MM.DD" value={f.birth} onChange={set('birth')} icon="cal" error={err.birth} inputMode="numeric" />

        <div>
          <label style={{ display: 'block', fontSize: '0.7812rem', fontWeight: 700, color: T.inkMid, margin: '0 0 7px 2px' }}>성별</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['남', '여'].map(g => {
              const on = f.gender === g;
              return (
                <button key={g} onClick={() => set('gender')(g)} style={{ flex: 1, height: 52, borderRadius: 14, fontSize: '0.9375rem', fontWeight: 700, background: on ? T.blueSoft : '#fff', color: on ? T.blue : T.inkSoft, border: '1.5px solid ' + (on ? T.blue : T.line), transition: 'all .15s ease' }}>{g}</button>
              );
            })}
          </div>
          {err.gender && <div style={{ fontSize: '0.7188rem', color: T.danger, fontWeight: 600, margin: '6px 0 0 4px' }}>{err.gender}</div>}
        </div>
      </div>

      <div style={{ margin: '20px 26px 0', padding: 16, borderRadius: 16, background: '#fff', border: '1px solid ' + (err.agree ? T.danger : T.line) }}>
        <button onClick={toggleAll} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, paddingBottom: 12, borderBottom: '1px solid ' + T.line, textAlign: 'left' }}>
          <Check on={agreeAll} big /><span style={{ fontSize: '0.9062rem', fontWeight: 800, color: T.ink }}>약관 전체 동의</span>
        </button>
        {[
          { k: 'service', label: '이용약관 동의' },
          { k: 'privacy', label: '개인정보 처리방침 동의' },
          { k: 'health',  label: '민감정보(건강정보) 처리 동의' },
        ].map(it => (
          <button key={it.k} onClick={() => toggle(it.k)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', textAlign: 'left' }}>
            <Check on={agree[it.k]} />
            <span style={{ flex: 1, fontSize: '0.8438rem', fontWeight: 500, color: T.inkMid }}><span style={{ color: T.blue, fontWeight: 700 }}>[필수] </span>{it.label}</span>
            <Icon name="chevR" size={16} color="#C6D3E6" />
          </button>
        ))}
      </div>
      {err.agree && <div style={{ fontSize: '0.7188rem', color: T.danger, fontWeight: 600, margin: '8px 0 0 30px' }}>{err.agree}</div>}

      <div style={{ padding: '20px 26px 32px' }}>
        <Button variant="primary" onClick={submit} disabled={loading}>
          {loading ? <Spinner size={22} color="#fff" stroke={2.5} /> : '가입하기'}
        </Button>
      </div>
    </div>
  );
}

export function ResetPw({ onNav, toast }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!email.trim()) return setErr('이메일을 입력해주세요');
    if (!emailRe.test(email)) return setErr('올바른 이메일 형식이 아니에요');
    setErr(''); setSent(true);
    toast('인증 메일을 발송했습니다', 'mail');
  };

  return (
    <div data-screen-label="비밀번호 찾기" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title="비밀번호 찾기" onBack={() => onNav('login')} />
      <div style={{ padding: '12px 26px 0' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icon name="lock" size={24} color={T.blue} stroke={2} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: T.ink, letterSpacing: '-0.02em' }}>비밀번호를 잊으셨나요?</h2>
        <p style={{ margin: '8px 0 0', fontSize: '0.8438rem', color: T.inkMid, lineHeight: 1.6 }}>가입하신 이메일로 비밀번호 재설정 링크를 보내드릴게요.</p>
      </div>
      <div style={{ padding: '24px 26px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="이메일" type="email" placeholder="example@email.com" value={email}
          onChange={v => { setEmail(v); setErr(''); }} icon="mail" error={err} inputMode="email" onEnter={submit} />
        {sent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 13, background: T.greenSoft }}>
            <Icon name="check" size={17} color={T.green} stroke={2.6} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.ok }}>이메일을 발송했습니다. 메일함을 확인해주세요.</span>
          </div>
        )}
        <Button variant="primary" onClick={submit}>인증메일 발송</Button>
        <button onClick={() => onNav('login')} style={{ height: 50, fontSize: '0.875rem', fontWeight: 700, color: T.inkMid }}>로그인으로 돌아가기</button>
      </div>
    </div>
  );
}

export default Login;

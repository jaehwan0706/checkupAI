import React, { useState, useEffect } from 'react';
import { T, Icon, Button, Field, SubHeader } from '../components/UI';
import api from '../api';

function toDisplayBirth(raw) {
  if (!raw) return '';
  // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss" → "YYYY.MM.DD"
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : raw;
}

export default function ProfileEdit({ onNav, toast }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
  const [f, setF] = useState({
    name:   saved.name   || '',
    birth:  toDisplayBirth(saved.birthDate || saved.birth) || '',
    gender: saved.gender || '',
  });
  const [kakaoEmail, setKakaoEmail] = useState(null);
  const [emailLoaded, setEmailLoaded] = useState(false);
  const set = k => v => setF(s => ({ ...s, [k]: v }));
  const initial = (f.name || '?').charAt(0);

  useEffect(() => {
    api.get('/api/user/me').then(res => {
      const u = res.data.data || {};
      setF(s => ({
        name:   u.name   || s.name,
        birth:  toDisplayBirth(u.birthDate) || s.birth,
        gender: u.gender || s.gender,
      }));
      setKakaoEmail(u.kakaoEmail || null);
      setEmailLoaded(true);
    }).catch(() => { setEmailLoaded(true); });
  }, []);

  const save = async () => {
    try {
      const birthDate = f.birth ? f.birth.replace(/\./g, '-') : null;
      const payload = { name: f.name, email: saved.email || '', birthDate, gender: f.gender };
      await api.put('/api/user/me', payload);
      const updated = { ...saved, name: f.name, birthDate, gender: f.gender };
      localStorage.setItem('user', JSON.stringify(updated));
      toast && toast('프로필이 저장되었어요', 'check');
      onNav('my');
    } catch {
      toast && toast('저장에 실패했어요', 'cross');
    }
  };

  return (
    <div data-screen-label="프로필 편집" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title="프로필 편집" onBack={() => onNav('my')} />
      <div style={{ padding: '12px 26px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: 999, background: 'linear-gradient(135deg,#00B894,#4CAF82)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 800, position: 'relative' }}>
          {initial}
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 999, background: '#fff', border: '1px solid ' + T.line, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(26,43,69,0.12)' }}>
            <Icon name="edit" size={15} color={T.blue} stroke={2} />
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 26px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="이름"     value={f.name}   onChange={set('name')}   icon="user" />
        {emailLoaded && (
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.inkMid, margin: '0 0 7px 2px' }}>이메일</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 14px', borderRadius: 14, background: T.bg, border: '1.5px solid ' + T.line }}>
              <Icon name="mail" size={19} color="#A6B1C2" stroke={2} />
              <span style={{ flex: 1, fontSize: 15, color: kakaoEmail ? T.ink : T.inkSoft }}>
                {kakaoEmail || '이메일 미제공'}
              </span>
              <span style={{ fontSize: 11.5, color: T.inkSoft, background: T.line, borderRadius: 6, padding: '2px 7px' }}>수정불가</span>
            </div>
          </div>
        )}
        <Field label="생년월일" value={f.birth}  onChange={set('birth')}  icon="cal"  inputMode="numeric" placeholder="YYYY.MM.DD" />
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.inkMid, margin: '0 0 7px 2px' }}>성별</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['남', '여'].map(g => {
              const on = f.gender === g;
              return (
                <button key={g} onClick={() => set('gender')(g)} style={{ flex: 1, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 700, background: on ? T.blueSoft : '#fff', color: on ? T.blue : T.inkSoft, border: '1.5px solid ' + (on ? T.blue : T.line), transition: 'all .15s ease' }}>{g}</button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 26px 32px' }}>
        <Button variant="primary" onClick={save}>저장하기</Button>
      </div>
    </div>
  );
}

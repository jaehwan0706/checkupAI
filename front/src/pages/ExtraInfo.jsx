import React, { useState } from 'react';
import { T, Button, Field, Icon } from '../components/UI';
import api from '../api';

export default function ExtraInfo({ onDone, toast }) {
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = gender && birth.match(/^\d{4}\.\d{2}\.\d{2}$/);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const birthDate = birth.replace(/\./g, '-');
      const saved = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
      await api.put('/api/user/me', { name: saved.name || '', email: saved.email || '', birthDate, gender });
      const updated = { ...saved, birthDate, gender };
      localStorage.setItem('user', JSON.stringify(updated));
      onDone();
    } catch {
      toast && toast('저장에 실패했어요', 'cross');
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '72px 26px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="user" size={24} color={T.blue} stroke={2} />
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.3 }}>추가 정보를 입력해 주세요</h1>
          <p style={{ margin: 0, fontSize: 14, color: T.inkSoft, lineHeight: 1.6 }}>더 정확한 건강 분석을 위해 성별과 생년월일이 필요해요.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.inkMid, margin: '0 0 7px 2px' }}>성별</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['남', '여'].map(g => {
                const on = gender === g;
                return (
                  <button key={g} onClick={() => setGender(g)} style={{ flex: 1, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 700, background: on ? T.blueSoft : '#fff', color: on ? T.blue : T.inkSoft, border: '1.5px solid ' + (on ? T.blue : T.line), transition: 'all .15s ease' }}>{g}</button>
                );
              })}
            </div>
          </div>

          <Field
            label="생년월일"
            value={birth}
            onChange={setBirth}
            icon="cal"
            inputMode="numeric"
            placeholder="YYYY.MM.DD"
          />
        </div>
      </div>

      <div style={{ padding: '0 26px 40px' }}>
        <Button variant="primary" onClick={save} disabled={!valid || saving}>
          {saving ? '저장 중...' : '완료'}
        </Button>
      </div>
    </div>
  );
}

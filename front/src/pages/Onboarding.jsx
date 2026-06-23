import React, { useState, useRef } from 'react';
import { T, Button } from '../components/UI';

const SLIDES = [
  {
    emoji: '📋',
    title: '내 건강검진 결과\nAI가 쉽게 해석해줘요',
    body: '복잡한 수치를 이해하기 쉬운 말로 풀어드려요',
  },
  {
    emoji: '💊',
    title: '약봉투·진단서 사진 한 장으로\n복용법과 주의사항 확인',
    body: '카메라로 찍으면 AI가 바로 분석해줘요',
  },
  {
    emoji: '📊',
    title: '매일 혈압·혈당을 기록하고\n건강 변화를 확인하세요',
    body: '꾸준한 기록이 건강한 습관을 만들어요',
  },
];

export default function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);
  const last = idx === SLIDES.length - 1;
  const s = SLIDES[idx];

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (dx < -48) setIdx(i => Math.min(i + 1, SLIDES.length - 1));
    if (dx > 48)  setIdx(i => Math.max(i - 1, 0));
  };

  return (
    <div
      data-screen-label="온보딩"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg, userSelect: 'none' }}
    >
      {/* 건너뛰기 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '54px 22px 0' }}>
        <button onClick={onDone} style={{ fontSize: 14, fontWeight: 600, color: T.inkSoft, padding: 8 }}>건너뛰기</button>
      </div>

      {/* 슬라이드 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 36px', textAlign: 'center' }}>
        <div key={idx} style={{
          width: 180, height: 180, borderRadius: '50%',
          background: T.card,
          boxShadow: '0 8px 32px rgba(0,184,148,0.10), 0 2px 8px rgba(26,43,69,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 40, animation: 'hlpop .4s ease',
        }}>
          <span style={{ fontSize: 84, lineHeight: 1 }}>{s.emoji}</span>
        </div>
        <h2 key={'t' + idx} style={{
          margin: 0, fontSize: 24, fontWeight: 800, lineHeight: 1.45,
          letterSpacing: '-0.02em', color: T.ink, whiteSpace: 'pre-line',
          animation: 'hlfadeup .35s ease',
        }}>
          {s.title}
        </h2>
        <p style={{ margin: '16px 0 0', fontSize: 14.5, lineHeight: 1.65, color: T.inkMid, maxWidth: 280 }}>
          {s.body}
        </p>
      </div>

      {/* 인디케이터 + 버튼 */}
      <div style={{ padding: '0 28px 44px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 9, marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: 8, height: 8, borderRadius: 999, padding: 0,
                background: i === idx ? T.blue : '#C6D3E6',
                transition: 'background .25s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
        <Button onClick={() => last ? onDone() : setIdx(i => i + 1)}>
          {last ? '시작하기' : '다음'}
        </Button>
      </div>
    </div>
  );
}

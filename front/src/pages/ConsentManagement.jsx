import React, { useState } from 'react';
import { T, Icon, Card, SubHeader, ConfirmModal } from '../components/UI';

const ITEMS = [
  { req: true,  title: '민감정보(건강정보) 수집·이용', desc: '검진 수치 등 건강정보를 해석 목적으로 수집·이용' },
  { req: true,  title: 'AI 분석 처리',                desc: '입력한 검진 결과를 AI가 분석해 해석을 제공' },
  { req: false, title: '검진기관 연동 (선택)',         desc: '제휴 검진기관의 결과를 자동으로 불러오기' },
];

export default function ConsentManagement({ onNav, consent, onWithdraw }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div data-screen-label="동의 관리" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title="데이터 동의 관리" onBack={() => onNav('my')} />
      <div style={{ padding: '12px 20px 28px' }}>
        {/* 현재 상태 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, background: consent ? T.greenSoft : T.warnSoft, border: '1px solid ' + (consent ? T.green : T.warn) + '33', marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={consent ? 'shield' : 'lock'} size={22} color={consent ? T.green : T.warn} stroke={2} />
          </div>
          <div>
            <div style={{ fontSize: '0.9062rem', fontWeight: 800, color: consent ? T.ok : '#9A6A12' }}>
              {consent ? '건강정보 활용에 동의함' : '아직 동의하지 않았어요'}
            </div>
            <div style={{ fontSize: '0.75rem', color: T.inkMid, marginTop: 2 }}>
              {consent ? '동의 완료 · AI 분석 가능' : '첫 AI 분석 시 동의를 받아요'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.7812rem', fontWeight: 800, color: T.inkSoft, padding: '0 4px 8px' }}>동의 항목</div>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {ITEMS.map((it, i) => (
            <div key={it.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '14px 16px', borderTop: i ? '1px solid ' + T.line : 'none' }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, marginTop: 1, background: consent ? T.green : '#E0E5EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={13} color="#fff" stroke={3} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8438rem', fontWeight: 700, color: T.ink }}>
                  <span style={{ color: it.req ? T.blue : T.inkSoft }}>{it.req ? '[필수] ' : '[선택] '}</span>{it.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: T.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{it.desc}</div>
              </div>
            </div>
          ))}
        </Card>

        <p style={{ fontSize: '0.7188rem', color: T.inkSoft, lineHeight: 1.55, margin: '14px 4px 0' }}>
          동의를 철회하면 더 이상 AI 해석을 받을 수 없어요. 다음 분석 시 다시 동의를 받습니다.
        </p>

        {consent && (
          <button onClick={() => setConfirm(true)} style={{ width: '100%', height: 50, marginTop: 16, borderRadius: 14, background: '#fff', border: '1px solid ' + T.line, color: T.danger, fontSize: '0.9062rem', fontWeight: 700 }}>
            동의 철회하기
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirm}
        title="동의를 철회하시겠어요?"
        body="철회하면 AI 해석 기능을 이용할 수 없어요. 다음 분석 시 다시 동의가 필요해요."
        confirmLabel="철회"
        danger
        onConfirm={() => { setConfirm(false); onWithdraw(); }}
        onClose={() => setConfirm(false)}
      />
    </div>
  );
}

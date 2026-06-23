import React, { useState } from 'react';
import { T, Card, SubHeader, Toggle } from '../components/UI';

export default function NotificationSettings({ onNav }) {
  const [n, setN] = useState({ checkup: true, reportDone: true, abnormal: true, tips: true, weekly: false, marketing: false, dnd: false });
  const set = k => v => setN(s => ({ ...s, [k]: v }));

  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: 12.5, fontWeight: 800, color: T.inkSoft, padding: '0 4px 8px' }}>{children}</div>
  );

  const Row = ({ label, sub, k, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: last ? 'none' : '1px solid ' + T.line }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <Toggle on={n[k]} onChange={set(k)} />
    </div>
  );

  return (
    <div data-screen-label="알림 설정" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title="알림 설정" onBack={() => onNav('my')} />
      <div style={{ padding: '12px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <SectionTitle>건강 알림</SectionTitle>
          <Card pad={0} style={{ overflow: 'hidden' }}>
            <Row label="검진일 리마인더"    sub="검진 예정일이 다가오면 알려드려요"    k="checkup"    />
            <Row label="AI 리포트 분석 완료" sub="새 해석 결과가 준비되면 알림"         k="reportDone" />
            <Row label="수치 이상 알림"     sub="주의·위험 수치가 감지되면 알림"       k="abnormal"   last />
          </Card>
        </div>
        <div>
          <SectionTitle>콘텐츠</SectionTitle>
          <Card pad={0} style={{ overflow: 'hidden' }}>
            <Row label="맞춤 건강 팁"    sub="내 수치에 맞는 생활 팁을 받아요" k="tips"   />
            <Row label="주간 건강 리포트" sub="매주 월요일 한 주 요약"           k="weekly" last />
          </Card>
        </div>
        <div>
          <SectionTitle>기타</SectionTitle>
          <Card pad={0} style={{ overflow: 'hidden' }}>
            <Row label="마케팅·혜택 알림"  sub="이벤트와 할인 소식"                  k="marketing" />
            <Row label="야간 방해 금지"    sub="오후 10시 ~ 오전 8시 알림 끄기"      k="dnd"       last />
          </Card>
        </div>
      </div>
    </div>
  );
}

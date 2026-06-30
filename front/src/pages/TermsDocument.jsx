import React from 'react';
import { T, SubHeader } from '../components/UI';

const DOC_CONTENT = {
  privacy: {
    title: '개인정보 처리방침',
    updated: '시행일 2025년 11월 1일',
    sections: [
      ['1. 수집하는 개인정보 항목', '검진AI는 회원가입 시 이름·이메일·생년월일·성별을 수집하며, 서비스 이용 과정에서 건강검진 수치(혈압·혈당·콜레스테롤·간수치 등) 등 민감정보를 수집합니다.'],
      ['2. 개인정보의 이용 목적', '수집한 정보는 AI 건강검진 해석 제공, 연도별 변화 분석, 맞춤 건강 가이드 제공 목적으로만 이용됩니다.'],
      ['3. 민감정보의 처리', '건강정보는 정보주체의 별도 동의를 받은 경우에만 처리하며, 동의는 마이페이지에서 언제든 철회할 수 있습니다. 철회 시 관련 데이터는 지체 없이 파기됩니다.'],
      ['4. 보유 및 이용 기간', '회원 탈퇴 또는 동의 철회 시까지 보유하며, 관계 법령에 따른 보존 의무가 없는 한 즉시 파기합니다.'],
      ['5. 제3자 제공', '검진AI는 정보주체의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.'],
    ],
  },
  terms: {
    title: '이용약관',
    updated: '시행일 2025년 11월 1일',
    sections: [
      ['제1조 (목적)', '본 약관은 검진AI(이하 "회사")가 제공하는 AI 건강검진 해석 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.'],
      ['제2조 (서비스의 성격)', '본 서비스가 제공하는 모든 해석·인사이트는 참고용 정보이며, 의료법상 의료행위 또는 의학적 진단이 아닙니다. 정확한 진단과 치료는 반드시 의료 전문가와 상담해야 합니다.'],
      ['제3조 (이용자의 의무)', '이용자는 정확한 검진 정보를 입력해야 하며, 입력 오류로 인한 해석 결과의 부정확성에 대해 회사는 책임을 지지 않습니다.'],
      ['제4조 (면책)', '회사는 본 서비스의 해석 결과를 근거로 한 이용자의 건강상 판단 및 그 결과에 대해 법적 책임을 지지 않습니다.'],
    ],
  },
};

export default function TermsDocument({ kind = 'privacy', onNav }) {
  const d = DOC_CONTENT[kind] || DOC_CONTENT.privacy;
  return (
    <div data-screen-label={d.title} className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title={d.title} onBack={() => onNav('my')} />
      <div style={{ padding: '8px 20px 28px' }}>
        <div style={{ fontSize: '0.75rem', color: T.inkSoft, fontWeight: 600, marginBottom: 16 }}>{d.updated}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {d.sections.map(([h, b]) => (
            <div key={h}>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: T.ink, marginBottom: 6 }}>{h}</div>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.7, color: T.inkMid }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

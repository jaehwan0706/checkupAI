import React, { useState, useEffect } from 'react';
import { T, Icon } from '../components/UI';
import api from '../api';

const S = {
  NORMAL:  { color: T.ok,     soft: T.okSoft,    label: '정상' },
  WARNING: { color: T.warn,   soft: T.warnSoft,   label: '주의' },
  DANGER:  { color: T.danger, soft: T.dangerSoft, label: '위험' },
};

const MOCK_SUMMARY = '전반적인 건강 상태를 분석한 결과, 혈당과 콜레스테롤 수치에서 주의가 필요합니다. 지금부터 올바른 생활습관을 시작하면 3~6개월 내에 수치 개선을 기대할 수 있어요. 규칙적인 운동과 식이 조절을 병행하고, 다음 검진에서 변화를 확인해보세요.';

const MOCK_DETAILS = [
  {
    item: '공복혈당', value: '110 mg/dL', status: 'WARNING',
    explanation: '정상 범위(100 mg/dL)를 초과해 당뇨 전단계에 해당합니다.',
    advice: '식후 30분 걷기와 정제 탄수화물 제한이 효과적이에요.',
  },
  {
    item: '총콜레스테롤', value: '220 mg/dL', status: 'WARNING',
    explanation: '경계 수치(200–239 mg/dL) 범위로 심혈관 위험도가 높아집니다.',
    advice: '포화지방을 줄이고 오메가-3가 풍부한 생선을 주 2회 이상 드세요.',
  },
];

const EXERCISES = [
  {
    icon: 'run', name: '빠르게 걷기',
    reason: '혈당 조절과 심폐 기능 향상에 가장 효과적인 저강도 유산소 운동이에요.',
    duration: '30분', intensity: '중강도', color: T.blue, soft: T.blueSoft,
  },
  {
    icon: 'spark', name: '스쿼트·플랭크',
    reason: '근육량을 늘려 기초 대사량을 높이고 혈당 조절에 도움을 줍니다.',
    duration: '20분', intensity: '중·고강도', color: T.green, soft: T.greenSoft,
  },
  {
    icon: 'drop', name: '수영 또는 자전거',
    reason: '관절 부담 없이 유산소 효과를 극대화할 수 있는 운동이에요.',
    duration: '40분', intensity: '저·중강도', color: T.ok, soft: T.okSoft,
  },
];

const GOOD_FOODS = [
  { emoji: '🥦', name: '브로콜리·녹색 채소', reason: '혈당 조절과 항산화 효과' },
  { emoji: '🐟', name: '연어·고등어', reason: '오메가-3로 콜레스테롤 관리' },
  { emoji: '🌾', name: '현미·통곡물', reason: '식이섬유가 혈당 스파이크를 줄여줘요' },
];

const AVOID_FOODS = [
  { emoji: '🍞', name: '흰 빵·정제 탄수화물', reason: '혈당 스파이크 유발' },
  { emoji: '🍟', name: '튀긴 음식·가공식품', reason: '나쁜 콜레스테롤 증가 원인' },
];

function SectionLabel({ icon, color, soft, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: soft || T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={18} color={color || T.blue} stroke={2.1} />
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color: T.ink, letterSpacing: '-0.02em' }}>{children}</span>
    </div>
  );
}

export default function PremiumReport({ onNav, toast }) {
  const [checkup, setCheckup] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get('/api/checkup/latest')
      .then(res => {
        const data = res.data?.data;
        setCheckup(data);
        if (data?.id) {
          return api.get(`/api/ai/report/${data.id}`).catch(() => null);
        }
        return null;
      })
      .then(res => { if (res) setReport(res.data?.data || null); })
      .catch(() => {});
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
  };

  const summary = report?.summary || MOCK_SUMMARY;
  const details = (report?.details?.length > 0) ? report.details : MOCK_DETAILS;

  return (
    <div data-screen-label="프리미엄리포트" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>

      {/* 헤더 */}
      <div style={{ padding: '54px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => onNav && onNav('premium')}
          style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', border: '1px solid ' + T.line, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Icon name="chevL" size={20} color={T.inkMid} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.warn, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <Icon name="crown" size={12} color={T.warn} stroke={2} /> 프리미엄 AI 리포트
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: '-0.02em' }}>✨ AI 분석 리포트</div>
        </div>
      </div>

      {checkup?.checkupDate && (
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid ' + T.line, padding: '5px 12px', borderRadius: 999 }}>
            <Icon name="cal" size={13} color={T.inkSoft} stroke={2} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft }}>{formatDate(checkup.checkupDate)} 검진 기준</span>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* 섹션 1 – 종합 분석 */}
        <div>
          <SectionLabel icon="spark" color={T.blue} soft={T.blueSoft}>AI 종합 분석</SectionLabel>
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid ' + T.line, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: T.inkMid, lineHeight: 1.75 }}>{summary}</p>
            {details.map((d, i) => {
              const st = S[d.status] || S.NORMAL;
              return (
                <div key={i} style={{ borderRadius: 13, background: st.soft, padding: '13px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{d.item}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: st.color }}>{d.value}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: st.color, background: '#fff', padding: '2px 9px', borderRadius: 999 }}>{st.label}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 12.5, color: T.inkMid, lineHeight: 1.6 }}>{d.explanation}</p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <Icon name="check" size={13} color={st.color} stroke={3} />
                    </div>
                    <span style={{ fontSize: 12.5, color: st.color, fontWeight: 700, lineHeight: 1.6 }}>{d.advice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 섹션 2 – 맞춤 운동 추천 */}
        <div>
          <SectionLabel icon="run" color={T.green} soft={T.greenSoft}>맞춤 운동 추천</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {EXERCISES.map((ex, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + T.line, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: ex.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={ex.icon} size={20} color={ex.color} stroke={2.1} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }}>{ex.name}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginTop: 1 }}>{ex.duration} · {ex.intensity}</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: T.inkMid, lineHeight: 1.6 }}>{ex.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 섹션 3 – 맞춤 식습관 추천 */}
        <div>
          <SectionLabel icon="food" color={T.ok} soft={T.okSoft}>맞춤 식습관 추천</SectionLabel>
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid ' + T.line, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="check" size={13} color={T.green} stroke={2.8} /> 더 드시면 좋아요
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {GOOD_FOODS.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: T.greenSoft }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{f.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{f.name}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginTop: 1 }}>{f.reason}</div>
                    </div>
                    <Icon name="check" size={15} color={T.green} stroke={2.8} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid ' + T.line, paddingTop: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="cross" size={13} color={T.danger} stroke={2.8} /> 줄이면 좋아요
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AVOID_FOODS.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: T.dangerSoft }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{f.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{f.name}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginTop: 1 }}>{f.reason}</div>
                    </div>
                    <Icon name="cross" size={15} color={T.danger} stroke={2.8} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 섹션 4 – 다음 검진 계획 */}
        <div>
          <SectionLabel icon="cal" color={T.warn} soft={T.warnSoft}>다음 검진 계획</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + T.line, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.warnSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="cal" size={19} color={T.warn} stroke={2.1} />
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }}>권장 재검 시기</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.warn, marginBottom: 6 }}>6개월 후 중간 점검 권장</div>
              <p style={{ margin: 0, fontSize: 12.5, color: T.inkMid, lineHeight: 1.65 }}>혈당·콜레스테롤 수치가 경계에 있어, 생활습관 개선 후 중간 점검이 필요해요. 3개월 후 자가 측정으로 먼저 확인해보세요.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + T.line, padding: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, marginBottom: 10 }}>중점 모니터링 항목</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: T.warnSoft }}>
                  <Icon name="drop" size={17} color={T.warn} stroke={2.1} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>공복혈당</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft }}>목표: 100 mg/dL 미만으로 낮추기</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: T.warnSoft }}>
                  <Icon name="spark" size={17} color={T.warn} stroke={2.1} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>총콜레스테롤</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft }}>목표: 200 mg/dL 미만으로 낮추기</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button
            onClick={() => toast && toast('PDF 저장 기능 준비 중이에요', 'pdf')}
            style={{ width: '100%', height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#00B894,#00A382)', color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 8px 20px rgba(0,184,148,0.28)' }}
          >
            <Icon name="pdf" size={19} color="#fff" stroke={2} />
            PDF 저장하기
          </button>
          <button
            onClick={() => toast && toast('공유 기능 준비 중이에요', 'arrow')}
            style={{ width: '100%', height: 52, borderRadius: 14, background: '#fff', border: '1.5px solid ' + T.line, color: T.ink, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
          >
            <Icon name="arrow" size={19} color={T.inkMid} stroke={2} />
            공유하기
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: T.inkSoft, lineHeight: 1.7, margin: 0 }}>
          이 리포트는 AI 분석 결과로, 의학적 진단을 대체하지 않습니다.<br />정확한 진단은 의료 전문가에게 문의하세요.
        </p>
      </div>
    </div>
  );
}

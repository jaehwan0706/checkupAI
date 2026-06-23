import React, { useState, useEffect } from 'react';
import { T, STATUS, Icon, Badge, Card } from '../components/UI';
import api from '../api';

/* ─────────────────────────────────────────
   수치 행: 좌측 경고 바 + 진단 힌트 + 맥락 한줄
───────────────────────────────────────── */
function SummaryRow({ m, last }) {
  const s = STATUS[m.status] || STATUS['정상'];
  const isAlert = m.status === '주의' || m.status === '위험';

  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: `13px 16px 13px ${isAlert ? '20px' : '16px'}`,
      borderBottom: last ? 'none' : '1px solid ' + T.line,
    }}>
      {/* 좌측 경고 세로 바 */}
      {isAlert && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color }} />
      )}

      {/* 아이콘 */}
      <div style={{ width: 38, height: 38, borderRadius: 11, background: s.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={m.icon} size={20} color={s.color} stroke={2.1} />
      </div>

      {/* 이름 + 진단 힌트 + 맥락 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap' }}>{m.name}</span>
          {isAlert && m.diagHint && (
            <span style={{ fontSize: 10.5, color: s.color, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9 }}>
              — {m.diagHint}
            </span>
          )}
        </div>
        {m.hint && (
          <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 2, color: isAlert ? s.color : T.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {m.hint}
          </div>
        )}
      </div>

      {/* 수치 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginRight: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{m.value}</span>
        <span style={{ fontSize: 11, color: T.inkSoft, fontWeight: 600 }}>{m.unit}</span>
      </div>
      <Badge status={m.status} small />
    </div>
  );
}

/* ─────────────────────────────────────────
   블러 잠금
───────────────────────────────────────── */
function LockedPreview({ children, onClick }) {
  return (
    <div onClick={onClick} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid ' + T.line }}>
      <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,249,252,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(26,43,69,0.18)' }}>
          <Icon name="lock" size={20} color={T.warn} stroke={2} />
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────
   AI 총평 카드
───────────────────────────────────────── */
const WARN_MSGS = {
  '혈압':           '혈압이 정상 범위 상단에 있어요. 지금 관리하지 않으면 고혈압으로 발전할 수 있어요.',
  '공복혈당':       '혈당이 정상 범위 상단에 있어요. 지금 관리하지 않으면 당뇨 전단계 진입 가능성이 있어요.',
  '총콜레스테롤':   '콜레스테롤이 경계 수준이에요. 포화지방 섭취를 줄이면 개선할 수 있어요.',
  'LDL 콜레스테롤': 'LDL(나쁜) 콜레스테롤이 높아요. 동맥경화 위험이 서서히 높아지고 있어요.',
  'HDL 콜레스테롤': 'HDL(좋은) 콜레스테롤이 낮아요. 유산소 운동으로 높일 수 있어요.',
  'AST':            '간 수치(AST)가 정상 범위를 넘었어요. 음주량 조절과 식이 관리가 필요해요.',
  '간수치 ALT':     '간 수치(ALT)가 정상 범위를 넘었어요. 지방간 여부를 확인해 보세요.',
  '크레아티닌':     '크레아티닌이 높아요. 신장 기능 점검을 권장해요.',
};
const DANGER_MSGS = {
  '혈압':           '혈압이 고혈압 범위예요. 심뇌혈관 위험이 높으니 즉시 전문의 상담이 필요해요.',
  '공복혈당':       '혈당이 당뇨병 기준치를 초과했어요. 즉시 내분비내과 진료를 받아보세요.',
  '총콜레스테롤':   '콜레스테롤이 매우 높아요. 심혈관 질환 위험이 높으니 전문의 진료가 필요해요.',
  'LDL 콜레스테롤': 'LDL 콜레스테롤이 위험 수준이에요. 심장 질환 예방을 위해 즉시 관리가 필요해요.',
  'AST':            '간 수치(AST)가 위험 수준이에요. 즉시 간 전문의 진료를 받으세요.',
  '간수치 ALT':     '간 수치(ALT)가 위험 수준이에요. 즉시 간 전문의 진료를 받으세요.',
  '크레아티닌':     '신장 기능 수치가 위험 수준이에요. 즉시 신장내과 진료를 받으세요.',
};

function generateSummary(items) {
  const dangers  = items.filter(m => m.status === '위험');
  const warnings = items.filter(m => m.status === '주의');
  if (dangers.length > 0) {
    const d = dangers[0];
    return { text: DANGER_MSGS[d.name] || `${d.name} 수치가 위험 범위예요. 즉시 전문의 상담이 필요해요.`, bg: T.dangerSoft, color: T.danger, icon: 'bolt' };
  }
  if (warnings.length > 0) {
    const w = warnings[0];
    return { text: WARN_MSGS[w.name] || `${w.name} 수치에 주의가 필요해요. 지금 관리를 시작하세요.`, bg: T.warnSoft, color: T.warn, icon: 'info' };
  }
  return { text: '모든 수치가 정상 범위예요. 꾸준한 생활 관리로 현재 건강 상태를 잘 유지하고 있어요.', bg: T.greenSoft, color: T.ok, icon: 'check' };
}

function AiSummaryCard({ items }) {
  const s = generateSummary(items);
  return (
    <div style={{ padding: '14px 16px', borderRadius: 16, background: s.bg, border: `1.5px solid ${s.color}33`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon name={s.icon} size={17} color={s.color} stroke={2.3} />
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: s.color, marginBottom: 5, letterSpacing: '0.02em' }}>AI 한줄 총평</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, fontWeight: 600, color: s.color === T.ok ? '#2E7D55' : s.color }}>{s.text}</p>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────
   맥락 힌트 계산
───────────────────────────────────────── */
const DIAG_HINTS = {
  '혈압':           { '주의': '고혈압 전단계',       '위험': '고혈압 확인 필요' },
  '공복혈당':       { '주의': '당뇨 전단계 주의',    '위험': '당뇨 확인 필요' },
  '총콜레스테롤':   { '주의': '콜레스테롤 관리 필요', '위험': '심혈관 위험' },
  'LDL 콜레스테롤': { '주의': '심혈관 위험 주의',    '위험': '심장 질환 위험' },
  'HDL 콜레스테롤': { '주의': '운동으로 개선 가능',  '위험': '저HDL 확인 필요' },
  'AST':            { '주의': '간 기능 확인 필요',    '위험': '간 전문의 진료 필요' },
  '간수치 ALT':     { '주의': '지방간 가능성 확인',   '위험': '간 전문의 진료 필요' },
  '크레아티닌':     { '주의': '신장 기능 확인 필요',  '위험': '신장내과 진료 필요' },
};

function getHint(name, value, status) {
  if (status === '위험') {
    const m = { '혈압': '고혈압 범위예요 🚨', '공복혈당': '당뇨 기준치 초과예요 🚨', '총콜레스테롤': '높은 수치예요 🚨', 'LDL 콜레스테롤': '위험 수준이에요 🚨', 'HDL 콜레스테롤': '매우 낮아요 🚨', 'AST': '간 수치 위험이에요 🚨', '간수치 ALT': '간 수치 위험이에요 🚨', '크레아티닌': '신장 기능 위험이에요 🚨' };
    return m[name] || '위험 범위예요 🚨';
  }
  if (status === '주의') {
    const m = { '혈압': '정상 범위를 초과했어요 ⚠️', '공복혈당': '당뇨 전단계 경계예요 ⚠️', '총콜레스테롤': '경계 수준이에요 ⚠️', 'LDL 콜레스테롤': '높은 경계 수준이에요 ⚠️', 'HDL 콜레스테롤': '낮은 수준이에요 ⚠️', 'AST': '정상 범위를 초과했어요 ⚠️', '간수치 ALT': '정상 범위를 초과했어요 ⚠️', '크레아티닌': '경계 수준이에요 ⚠️' };
    return m[name] || '주의 범위예요 ⚠️';
  }
  // 정상 — 범위 내 위치 표현
  const pos = {
    '혈압': (v) => {
      const sys = parseInt(String(v).split('/')[0]);
      if (sys < 100) return '평균 이하';
      if (sys < 112) return '평균 수준';
      return '정상 상단';
    },
    '공복혈당': (v) => {
      if (v < 80) return '정상 하단';
      if (v < 90) return '평균 수준';
      return '정상 상단';
    },
    '총콜레스테롤': (v) => {
      if (v < 150) return '정상 하단';
      if (v < 175) return '평균 수준';
      return '정상 상단';
    },
    'LDL 콜레스테롤': (v) => {
      if (v < 70)  return '정상 하단';
      if (v < 100) return '평균 수준';
      return '정상 상단';
    },
    'HDL 콜레스테롤': (v) => {
      if (v >= 80) return '정상 상단';
      if (v >= 70) return '평균 수준';
      return '정상 하단';
    },
    'AST':          (v) => v <= 25 ? '평균 수준' : '정상 상단',
    '간수치 ALT':   (v) => v <= 25 ? '평균 수준' : '정상 상단',
    '크레아티닌':   (v) => v < 0.7 ? '정상 하단' : v < 1.0 ? '평균 수준' : '정상 상단',
  };
  return pos[name] ? pos[name](value) : '정상 범위 안에 있어요';
}

/* ─────────────────────────────────────────
   데이터 변환 (hint, diagHint 포함)
───────────────────────────────────────── */
const ICON_MAP = { '혈압': 'heart', '공복혈당': 'drop', '총콜레스테롤': 'spark', 'LDL 콜레스테롤': 'spark', 'HDL 콜레스테롤': 'spark', 'AST': 'flask', '간수치 ALT': 'flask', '크레아티닌': 'shield' };

function toMetrics(d) {
  const raw = [];
  if (d.systolicBp != null && d.diastolicBp != null) {
    const status = (d.systolicBp >= 140 || d.diastolicBp >= 90) ? '위험' : (d.systolicBp >= 120 || d.diastolicBp >= 80) ? '주의' : '정상';
    raw.push({ name: '혈압', value: `${d.systolicBp}/${d.diastolicBp}`, unit: 'mmHg', status });
  }
  if (d.fastingBloodSugar != null) {
    const status = d.fastingBloodSugar >= 126 ? '위험' : d.fastingBloodSugar >= 100 ? '주의' : '정상';
    raw.push({ name: '공복혈당', value: d.fastingBloodSugar, unit: 'mg/dL', status });
  }
  if (d.totalCholesterol != null) {
    const status = d.totalCholesterol >= 240 ? '위험' : d.totalCholesterol >= 200 ? '주의' : '정상';
    raw.push({ name: '총콜레스테롤', value: d.totalCholesterol, unit: 'mg/dL', status });
  }
  if (d.ldlCholesterol != null) {
    const status = d.ldlCholesterol >= 160 ? '위험' : d.ldlCholesterol >= 130 ? '주의' : '정상';
    raw.push({ name: 'LDL 콜레스테롤', value: d.ldlCholesterol, unit: 'mg/dL', status });
  }
  if (d.hdlCholesterol != null) {
    const status = d.hdlCholesterol < 40 ? '위험' : d.hdlCholesterol < 60 ? '주의' : '정상';
    raw.push({ name: 'HDL 콜레스테롤', value: d.hdlCholesterol, unit: 'mg/dL', status });
  }
  if (d.ast != null) {
    const status = d.ast > 80 ? '위험' : d.ast > 40 ? '주의' : '정상';
    raw.push({ name: 'AST', value: d.ast, unit: 'U/L', status });
  }
  if (d.alt != null) {
    const status = d.alt > 80 ? '위험' : d.alt > 40 ? '주의' : '정상';
    raw.push({ name: '간수치 ALT', value: d.alt, unit: 'U/L', status });
  }
  if (d.creatinine != null) {
    const status = d.creatinine > 1.2 ? '위험' : d.creatinine > 1.0 ? '주의' : '정상';
    raw.push({ name: '크레아티닌', value: d.creatinine, unit: 'mg/dL', status });
  }
  return raw.map(m => ({
    id:       m.name,
    icon:     ICON_MAP[m.name] || 'spark',
    hint:     getHint(m.name, m.value, m.status),
    diagHint: (DIAG_HINTS[m.name] || {})[m.status] || null,
    ...m,
  }));
}

/* ─────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────── */
export default function Report({ onPremium, toast }) {
  const [items, setItems]   = useState([]);
  const [date, setDate]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('lastCheckupId');
    const endpoint = id ? `/api/checkup/${id}` : '/api/checkup/latest';
    api.get(endpoint)
      .then(res => {
        const d = res.data?.data;
        if (!d) return;
        setDate(d.checkupDate || '');
        setItems(toMetrics(d));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const warnCount  = items.filter(m => m.status === '주의' || m.status === '위험').length;
  const displayDate = date ? new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const freeItems   = items.slice(0, 2);
  const lockedItems = items.slice(2);

  return (
    <div data-screen-label="AI 리포트" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>

      {/* ─ 헤더 ─ */}
      <div style={{ padding: '56px 20px 14px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.greenSoft, color: T.ok, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, marginBottom: 12 }}>무료 플랜</div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>내 건강 리포트</h1>
        {displayDate && <p style={{ margin: '8px 0 0', fontSize: 13, color: T.inkSoft }}>{displayDate} 검진 기준</p>}
        {loading ? (
          <div style={{ marginTop: 14, padding: '13px 15px', borderRadius: 14, background: T.bg, border: '1px solid ' + T.line, fontSize: 13.5, color: T.inkSoft, fontWeight: 600 }}>데이터를 불러오는 중...</div>
        ) : warnCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '13px 15px', borderRadius: 14, background: T.warnSoft, border: `1px solid ${T.warn}33` }}>
            <span style={{ fontSize: 17 }}>⚠️</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#9A6A12' }}>주의가 필요한 항목이 {warnCount}개 있어요</span>
          </div>
        ) : items.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '13px 15px', borderRadius: 14, background: T.greenSoft }}>
            <Icon name="check" size={17} color={T.green} stroke={2.6} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.ok }}>모든 수치가 정상 범위예요!</span>
          </div>
        ) : null}
      </div>

      {/* ─ 데이터 없음 ─ */}
      {!loading && items.length === 0 && (
        <div style={{ padding: '0 20px 28px' }}>
          <Card style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, marginBottom: 8 }}>검진 데이터가 없어요</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.inkMid, lineHeight: 1.6 }}>검진 수치를 입력하면 AI 리포트를 받을 수 있어요</p>
          </Card>
        </div>
      )}

      {/* ─ 데이터 있음 ─ */}
      {items.length > 0 && (
        <>
          {/* 1. 수치 요약 — 첫 2개 무료 공개 */}
          <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 2px 10px' }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>수치 요약</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.ok, background: T.greenSoft, padding: '2px 8px', borderRadius: 999 }}>무료 공개</span>
            </div>
            <Card pad={0} style={{ overflow: 'hidden' }}>
              {freeItems.map((m, i) => (
                <SummaryRow key={m.id} m={m} last={i === freeItems.length - 1} />
              ))}
            </Card>
          </div>

          {/* 2. AI 한줄 총평 */}
          <div style={{ padding: '12px 20px 0' }}>
            <AiSummaryCard items={items} />
          </div>

          {/* 3. 티저 태그 + 진행바 (버튼 없이) */}
          {lockedItems.length > 0 && (
            <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft, marginBottom: 9 }}>프리미엄에서 확인할 수 있어요</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {[
                    { icon: 'spark', label: '수치별 원인 분석' },
                    { icon: 'run',   label: '맞춤 운동 추천' },
                    { icon: 'food',  label: '식습관 가이드' },
                    { icon: 'cal',   label: '재검 계획' },
                    { icon: 'pdf',   label: 'PDF 저장' },
                  ].map((it, i) => (
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, background: '#fff', border: '1px solid ' + T.line, fontSize: 12.5, fontWeight: 700, color: T.ink }}>
                      <Icon name={it.icon} size={13} color={T.blue} stroke={2.1} />
                      {it.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. 구분선 */}
          {lockedItems.length > 0 && (
            <div style={{ padding: '14px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, height: 1, background: T.line }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 999, background: '#F0F2F5', margin: '0 10px' }}>
                  <span style={{ fontSize: 12 }}>🔒</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: T.blue }}>프리미엄 전용 콘텐츠</span>
                </div>
                <div style={{ flex: 1, height: 1, background: T.line }} />
              </div>
            </div>
          )}

          {/* 5. 블러 카드 2개 + 나머지 힌트 */}
          {lockedItems.length > 0 && (
            <div style={{ padding: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <LockedPreview onClick={onPremium}>
                <div style={{ background: '#fff' }}>
                  {lockedItems.slice(0, 2).map((m, i) => (
                    <SummaryRow key={m.id} m={m} last={i === Math.min(2, lockedItems.length) - 1} />
                  ))}
                </div>
              </LockedPreview>
              {lockedItems.length > 2 && (
                <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.inkSoft, padding: '2px 0' }}>
                  + {lockedItems.length - 2}개 항목 더 있어요
                </div>
              )}
            </div>
          )}

          {/* 6. 진행바 + 결제 버튼 — 맨 마지막 */}
          {lockedItems.length > 0 && (
            <div style={{ padding: '14px 20px 0' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.inkMid }}>총 {items.length}개 항목 중 {freeItems.length}개 확인 완료</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: T.blue }}>{freeItems.length}/{items.length}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: T.line, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: Math.round((freeItems.length / items.length) * 100) + '%', borderRadius: 999, background: `linear-gradient(90deg,${T.blue},${T.green})`, transition: 'width .4s ease' }} />
                </div>
              </div>
              <button onClick={onPremium} style={{ width: '100%', height: 50, borderRadius: 13, background: 'linear-gradient(135deg,#00B894,#00A382)', color: '#fff', fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 6px 16px rgba(0,184,148,0.28)' }}>
                <Icon name="lock" size={15} color="rgba(255,255,255,0.9)" stroke={2.2} />
                나머지 {lockedItems.length}개 항목 상세 분석 보기
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginLeft: 2 }}>· 1,900원</span>
              </button>
            </div>
          )}

          {/* 8. 면책 고지 */}
          <div style={{ margin: '20px 20px 28px', padding: 14, borderRadius: 14, background: '#EEF1F6', display: 'flex', gap: 10 }}>
            <Icon name="info" size={18} color={T.inkSoft} stroke={2} />
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: T.inkSoft }}>본 서비스는 의료 진단이 아닙니다. 검진 결과 해석을 돕기 위한 참고용 정보이며, 정확한 진단과 치료는 반드시 의료 전문가와 상담하세요.</p>
          </div>
        </>
      )}
    </div>
  );
}

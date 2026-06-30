import React, { useState, useEffect } from 'react';
import { T, STATUS, Icon, Badge, Card, Spinner } from '../components/UI';
import api from '../api';

/* ─────────────────────────────────────────
   수치 행
───────────────────────────────────────── */
function SummaryRow({ m, last }) {
  const s = STATUS[m.status] || STATUS['정상'];
  const isAlert = m.status === '주의' || m.status === '위험';
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
      padding: `13px 16px 13px ${isAlert ? '20px' : '16px'}`,
      borderBottom: last ? 'none' : '1px solid ' + T.line,
    }}>
      {isAlert && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color }} />}
      <div style={{ width: 38, height: 38, borderRadius: 11, background: s.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={m.icon} size={20} color={s.color} stroke={2.1} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
          <span style={{ fontSize: '0.9062rem', fontWeight: 700, color: T.ink, whiteSpace: 'nowrap' }}>{m.name}</span>
          {isAlert && m.diagHint && (
            <span style={{ fontSize: '0.6562rem', color: s.color, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9 }}>— {m.diagHint}</span>
          )}
        </div>
        {m.hint && (
          <div style={{ fontSize: '0.7188rem', fontWeight: 600, marginTop: 2, color: isAlert ? s.color : T.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.hint}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginRight: 10, flexShrink: 0 }}>
        <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{m.value}</span>
        <span style={{ fontSize: '0.6875rem', color: T.inkSoft, fontWeight: 600 }}>{m.unit}</span>
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
  '혈압': '혈압이 정상 범위 상단에 있어요. 지금 관리하지 않으면 고혈압으로 발전할 수 있어요.',
  '공복혈당': '혈당이 정상 범위 상단에 있어요. 지금 관리하지 않으면 당뇨 전단계 진입 가능성이 있어요.',
  '총콜레스테롤': '콜레스테롤이 경계 수준이에요. 포화지방 섭취를 줄이면 개선할 수 있어요.',
  'LDL 콜레스테롤': 'LDL(나쁜) 콜레스테롤이 높아요. 동맥경화 위험이 서서히 높아지고 있어요.',
  'HDL 콜레스테롤': 'HDL(좋은) 콜레스테롤이 낮아요. 유산소 운동으로 높일 수 있어요.',
  'AST': '간 수치(AST)가 정상 범위를 넘었어요. 음주량 조절과 식이 관리가 필요해요.',
  '간수치 ALT': '간 수치(ALT)가 정상 범위를 넘었어요. 지방간 여부를 확인해 보세요.',
  '크레아티닌': '크레아티닌이 높아요. 신장 기능 점검을 권장해요.',
};
const DANGER_MSGS = {
  '혈압': '혈압이 고혈압 범위예요. 심뇌혈관 위험이 높으니 즉시 전문의 상담이 필요해요.',
  '공복혈당': '혈당이 당뇨병 기준치를 초과했어요. 즉시 내분비내과 진료를 받아보세요.',
  '총콜레스테롤': '콜레스테롤이 매우 높아요. 심혈관 질환 위험이 높으니 전문의 진료가 필요해요.',
  'LDL 콜레스테롤': 'LDL 콜레스테롤이 위험 수준이에요. 심장 질환 예방을 위해 즉시 관리가 필요해요.',
  'AST': '간 수치(AST)가 위험 수준이에요. 즉시 간 전문의 진료를 받으세요.',
  '간수치 ALT': '간 수치(ALT)가 위험 수준이에요. 즉시 간 전문의 진료를 받으세요.',
  '크레아티닌': '신장 기능 수치가 위험 수준이에요. 즉시 신장내과 진료를 받으세요.',
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
        <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: s.color, marginBottom: 5, letterSpacing: '0.02em' }}>AI 한줄 총평</div>
        <p style={{ margin: 0, fontSize: '0.8438rem', lineHeight: 1.65, fontWeight: 600, color: s.color === T.ok ? '#2E7D55' : s.color }}>{s.text}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   맥락 힌트 계산
───────────────────────────────────────── */
const DIAG_HINTS = {
  '혈압':           { '주의': '고혈압 전단계',        '위험': '고혈압 확인 필요' },
  '공복혈당':       { '주의': '당뇨 전단계 주의',     '위험': '당뇨 확인 필요' },
  '총콜레스테롤':   { '주의': '콜레스테롤 관리 필요', '위험': '심혈관 위험' },
  'LDL 콜레스테롤': { '주의': '심혈관 위험 주의',     '위험': '심장 질환 위험' },
  'HDL 콜레스테롤': { '주의': '운동으로 개선 가능',   '위험': '저HDL 확인 필요' },
  'AST':            { '주의': '간 기능 확인 필요',     '위험': '간 전문의 진료 필요' },
  '간수치 ALT':     { '주의': '지방간 가능성 확인',    '위험': '간 전문의 진료 필요' },
  '크레아티닌':     { '주의': '신장 기능 확인 필요',   '위험': '신장내과 진료 필요' },
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
  const pos = {
    '혈압':           (v) => { const s = parseInt(String(v).split('/')[0]); return s < 100 ? '평균 이하' : s < 112 ? '평균 수준' : '정상 상단'; },
    '공복혈당':       (v) => v < 80 ? '정상 하단' : v < 90 ? '평균 수준' : '정상 상단',
    '총콜레스테롤':   (v) => v < 150 ? '정상 하단' : v < 175 ? '평균 수준' : '정상 상단',
    'LDL 콜레스테롤': (v) => v < 70  ? '정상 하단' : v < 100 ? '평균 수준' : '정상 상단',
    'HDL 콜레스테롤': (v) => v >= 80 ? '정상 상단' : v >= 70 ? '평균 수준' : '정상 하단',
    'AST':            (v) => v <= 25 ? '평균 수준' : '정상 상단',
    '간수치 ALT':     (v) => v <= 25 ? '평균 수준' : '정상 상단',
    '크레아티닌':     (v) => v < 0.7 ? '정상 하단' : v < 1.0 ? '평균 수준' : '정상 상단',
  };
  return pos[name] ? pos[name](value) : '정상 범위 안에 있어요';
}

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
    id: m.name, icon: ICON_MAP[m.name] || 'spark',
    hint: getHint(m.name, m.value, m.status),
    diagHint: (DIAG_HINTS[m.name] || {})[m.status] || null,
    ...m,
  }));
}

/* ─────────────────────────────────────────
   카테고리 탭 공통 컴포넌트
───────────────────────────────────────── */
const fmtShort = d => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

function CategoryEmpty({ emoji, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: '3.25rem', marginBottom: 2 }}>{emoji}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: T.ink }}>{title}</div>
      <div style={{ fontSize: '0.8438rem', color: T.inkSoft, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{sub}</div>
    </div>
  );
}

function AiAnalyzeBtn({ onPress, label, sub }) {
  return (
    <button onClick={onPress} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', borderRadius: 16, textAlign: 'left',
      background: 'linear-gradient(135deg,#00B894,#00A382)',
      boxShadow: '0 6px 18px rgba(0,184,148,0.28)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="spark" size={20} color="#fff" stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#fff' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7812rem', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{sub}</div>}
      </div>
      <Icon name="chevR" size={18} color="rgba(255,255,255,0.7)" />
    </button>
  );
}

function AiLoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
      <Spinner size={38} color={T.blue} stroke={3} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: T.ink }}>AI가 분석하고 있어요</div>
        <div style={{ fontSize: '0.8125rem', color: T.inkSoft, marginTop: 5 }}>잠시만 기다려주세요...</div>
      </div>
    </div>
  );
}

/* ─ 공통 번호 목록 ─ */
function NumberedList({ items, bg, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#fff' }}>{i + 1}</span>
          </div>
          <span style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.ink, fontWeight: 600 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

/* ─ 건강검진 AI 결과 ─ */
function CheckupAiDisplay({ data, onRetry }) {
  const scoreColor = data?.healthScore >= 80 ? T.ok : data?.healthScore >= 60 ? T.warn : T.danger;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data?.healthScore != null && (
        <div style={{ padding: '18px 16px', borderRadius: 14, background: `${scoreColor}15`, textAlign: 'center', border: `1.5px solid ${scoreColor}33` }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: scoreColor, marginBottom: 6 }}>AI 건강 점수</div>
          <div style={{ fontSize: '3.25rem', fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: '-0.02em' }}>{data.healthScore}</div>
          <div style={{ fontSize: '0.8125rem', color: T.inkSoft, marginTop: 4 }}>/ 100</div>
        </div>
      )}
      <div style={{ padding: '14px 16px', borderRadius: 14, background: T.blueSoft }}>
        <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.blue, marginBottom: 8 }}>AI 총평</div>
        <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.ink }}>{data?.summary}</div>
      </div>
      {(data?.riskItems || []).map((item, i) => {
        const sc = item.status === '위험' ? T.danger : item.status === '주의' ? T.warn : T.ok;
        const ss = item.status === '위험' ? T.dangerSoft : item.status === '주의' ? T.warnSoft : T.greenSoft;
        return (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: '#fff', border: `1.5px solid ${sc}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ padding: '2px 8px', borderRadius: 999, background: ss, fontSize: '0.6875rem', fontWeight: 800, color: sc }}>{item.status}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: T.ink }}>{item.name}</div>
              <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', fontWeight: 700, color: sc }}>{item.value}</div>
            </div>
            <div style={{ fontSize: '0.7812rem', color: T.inkMid, lineHeight: 1.65, marginBottom: item.action ? 8 : 0 }}>{item.reason}</div>
            {item.action && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, background: ss }}>
                <Icon name="spark" size={13} color={sc} stroke={2} />
                <span style={{ fontSize: '0.7812rem', fontWeight: 700, color: sc }}>{item.action}</span>
              </div>
            )}
          </div>
        );
      })}
      {data?.immediateActions?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.warnSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.warn, marginBottom: 10 }}>지금 실천할 것</div>
          <NumberedList items={data.immediateActions} color={T.warn} />
        </div>
      )}
      {data?.monthlyGoals?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.greenSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.ok, marginBottom: 10 }}>이번 달 목표</div>
          <NumberedList items={data.monthlyGoals} color={T.ok} />
        </div>
      )}
      {data?.nextCheckupRecommendation && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.blueSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.blue, marginBottom: 8 }}>다음 검진 권고</div>
          <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.ink }}>{data.nextCheckupRecommendation}</div>
        </div>
      )}
      <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, border: '1px solid ' + T.line, background: '#fff', fontSize: '0.8125rem', fontWeight: 700, color: T.inkSoft }}>
        <Icon name="spark" size={14} color={T.inkSoft} stroke={2} /> 다시 분석하기
      </button>
    </div>
  );
}

/* ─ 혈압·혈당 AI 결과 ─ */
function VitalsAiDisplay({ data, onRetry }) {
  const tColor = data?.trend === '상승' ? T.danger : data?.trend === '하강' ? T.ok : T.blue;
  const rColor = data?.riskLevel === '위험' ? T.danger : data?.riskLevel === '주의' ? T.warn : T.ok;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '14px 16px', borderRadius: 14, background: T.blueSoft }}>
        <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.blue, marginBottom: 8 }}>종합 요약</div>
        <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.ink }}>{data?.summary}</div>
      </div>
      {(data?.trend || data?.riskLevel) && (
        <div style={{ display: 'flex', gap: 8 }}>
          {data.trend && (
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 14, background: `${tColor}15`, textAlign: 'center' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: T.inkSoft, marginBottom: 4 }}>트렌드</div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: tColor }}>{data.trend}</div>
            </div>
          )}
          {data.riskLevel && (
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 14, background: `${rColor}15`, textAlign: 'center' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: T.inkSoft, marginBottom: 4 }}>위험도</div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: rColor }}>{data.riskLevel}</div>
            </div>
          )}
        </div>
      )}
      {data?.reason && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: '#fff', border: '1px solid ' + T.line }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.inkMid, marginBottom: 8 }}>원인 분석</div>
          <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.inkMid }}>{data.reason}</div>
        </div>
      )}
      {data?.immediateActions?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.warnSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.warn, marginBottom: 10 }}>지금 실천할 것</div>
          <NumberedList items={data.immediateActions} color={T.warn} />
        </div>
      )}
      {data?.monthlyGoals?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.greenSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.ok, marginBottom: 10 }}>이번 달 목표</div>
          <NumberedList items={data.monthlyGoals} color={T.ok} />
        </div>
      )}
      <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, border: '1px solid ' + T.line, background: '#fff', fontSize: '0.8125rem', fontWeight: 700, color: T.inkSoft }}>
        <Icon name="spark" size={14} color={T.inkSoft} stroke={2} /> 다시 분석하기
      </button>
    </div>
  );
}

/* ─ 약국봉투 AI 결과 ─ */
function PharmacyAiDisplay({ data, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '14px 16px', borderRadius: 14, background: T.blueSoft }}>
        <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.blue, marginBottom: 8 }}>처방약 요약</div>
        <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.ink }}>{data?.summary}</div>
      </div>
      {(data?.medications || []).map((med, i) => (
        <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: '#fff', border: '1px solid ' + T.line }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="flask" size={14} color={T.blue} stroke={2} />
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: T.ink }}>{med.name}</div>
          </div>
          {med.purpose && <div style={{ fontSize: '0.7812rem', color: T.inkMid, marginBottom: 5, lineHeight: 1.6 }}>📌 {med.purpose}</div>}
          {med.caution && <div style={{ fontSize: '0.7812rem', color: T.warn, fontWeight: 600, lineHeight: 1.6 }}>⚠️ {med.caution}</div>}
        </div>
      ))}
      {data?.interactions && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.warnSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.warn, marginBottom: 8 }}>약물 상호작용 주의</div>
          <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.ink }}>{data.interactions}</div>
        </div>
      )}
      {data?.immediateActions?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.greenSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.ok, marginBottom: 10 }}>복용 지침</div>
          <NumberedList items={data.immediateActions} color={T.ok} />
        </div>
      )}
      <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, border: '1px solid ' + T.line, background: '#fff', fontSize: '0.8125rem', fontWeight: 700, color: T.inkSoft }}>
        <Icon name="spark" size={14} color={T.inkSoft} stroke={2} /> 다시 분석하기
      </button>
    </div>
  );
}

/* ─ 병원진료 AI 결과 ─ */
function HospitalAiDisplay({ data, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '14px 16px', borderRadius: 14, background: T.blueSoft }}>
        <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.blue, marginBottom: 8 }}>진료 요약</div>
        <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.ink }}>{data?.summary}</div>
      </div>
      {data?.diagnosis && (
        <div style={{ padding: '12px 14px', borderRadius: 14, background: T.dangerSoft, border: `1px solid ${T.danger}33` }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.danger, marginBottom: 4 }}>진단</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: T.ink }}>{data.diagnosis}</div>
        </div>
      )}
      {data?.reason && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: '#fff', border: '1px solid ' + T.line }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.inkMid, marginBottom: 8 }}>원인 설명</div>
          <div style={{ fontSize: '0.8438rem', lineHeight: 1.75, color: T.inkMid }}>{data.reason}</div>
        </div>
      )}
      {data?.immediateActions?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.warnSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.warn, marginBottom: 10 }}>관리 방법</div>
          <NumberedList items={data.immediateActions} color={T.warn} />
        </div>
      )}
      {data?.monthlyGoals?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: T.greenSoft }}>
          <div style={{ fontSize: '0.7188rem', fontWeight: 800, color: T.ok, marginBottom: 10 }}>이번 달 목표</div>
          <NumberedList items={data.monthlyGoals} color={T.ok} />
        </div>
      )}
      <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, border: '1px solid ' + T.line, background: '#fff', fontSize: '0.8125rem', fontWeight: 700, color: T.inkSoft }}>
        <Icon name="spark" size={14} color={T.inkSoft} stroke={2} /> 다시 분석하기
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   혈압·혈당 탭
───────────────────────────────────────── */
function VitalsTab({ vitals, aiState, onAnalyze }) {
  if (vitals.length === 0) {
    return <CategoryEmpty emoji="🩺" title="혈압·혈당 기록이 없어요" sub={'혈압·혈당을 측정하고 기록하면\nAI가 트렌드를 분석해 드려요'} />;
  }
  const recent = vitals.slice(0, 5);
  const idle = !aiState?.loading && !aiState?.data && !aiState?.error;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card pad={16}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: T.ink, marginBottom: 12 }}>
          최근 기록 <span style={{ fontSize: '0.6875rem', color: T.inkSoft, fontWeight: 600 }}>{vitals.length}건</span>
        </div>
        {recent.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid ' + T.line }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.inkSoft, width: 38, flexShrink: 0 }}>{fmtShort(v.recordedDate)}</span>
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              {v.systolic != null && (
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: v.systolic >= 140 ? T.danger : v.systolic >= 120 ? T.warn : T.ok }}>
                  혈압 {v.systolic}/{v.diastolic ?? '—'} mmHg
                </span>
              )}
              {v.bloodSugar != null && (
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: v.bloodSugar >= 126 ? T.danger : v.bloodSugar >= 100 ? T.warn : T.ok }}>
                  혈당 {v.bloodSugar} mg/dL
                </span>
              )}
            </div>
          </div>
        ))}
        {vitals.length > 5 && (
          <div style={{ paddingTop: 8, fontSize: '0.75rem', color: T.inkSoft, textAlign: 'center', borderTop: '1px solid ' + T.line }}>+{vitals.length - 5}건 더 있어요</div>
        )}
      </Card>
      {idle && <AiAnalyzeBtn onPress={() => onAnalyze('daily')} label="AI 분석받기" sub="혈압·혈당 기록을 AI가 종합 분석해 드려요" />}
      {aiState?.loading && <AiLoadingState />}
      {!aiState?.loading && aiState?.error && (
        <div style={{ padding: '16px', borderRadius: 14, background: T.dangerSoft, fontSize: '0.8438rem', color: T.danger, fontWeight: 600, textAlign: 'center' }}>
          {aiState.error}
          <button onClick={() => onAnalyze('daily')} style={{ display: 'block', margin: '10px auto 0', fontSize: '0.8125rem', fontWeight: 700, color: T.danger, textDecoration: 'underline' }}>다시 시도</button>
        </div>
      )}
      {!aiState?.loading && aiState?.data && <VitalsAiDisplay data={aiState.data} onRetry={() => onAnalyze('daily')} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   약국봉투 / 병원진료 탭 (공통)
───────────────────────────────────────── */
function MedicalTab({ records, type, aiState, onAnalyze, emptyEmoji, emptyTitle, emptyDesc, analyzeLabel, analyzeSub }) {
  if (records.length === 0) {
    return <CategoryEmpty emoji={emptyEmoji} title={emptyTitle} sub={emptyDesc} />;
  }
  const recent = records.slice(0, 5);
  const idle = !aiState?.loading && !aiState?.data && !aiState?.error;
  const Display = type === 'pharmacy' ? PharmacyAiDisplay : HospitalAiDisplay;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card pad={16}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: T.ink, marginBottom: 12 }}>
          최근 기록 <span style={{ fontSize: '0.6875rem', color: T.inkSoft, fontWeight: 600 }}>{records.length}건</span>
        </div>
        {recent.map((r, i) => (
          <div key={i} style={{ padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid ' + T.line }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.7188rem', fontWeight: 700, color: T.inkSoft, flexShrink: 0, width: 38 }}>{fmtShort(r.recordedDate)}</span>
              <span style={{ fontSize: '0.8438rem', fontWeight: 700, color: T.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
            </div>
            {r.description && (
              <div style={{ fontSize: '0.75rem', color: T.inkSoft, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 46 }}>{r.description}</div>
            )}
          </div>
        ))}
        {records.length > 5 && (
          <div style={{ paddingTop: 8, fontSize: '0.75rem', color: T.inkSoft, textAlign: 'center', borderTop: '1px solid ' + T.line }}>+{records.length - 5}건 더 있어요</div>
        )}
      </Card>
      {idle && <AiAnalyzeBtn onPress={() => onAnalyze(type)} label={analyzeLabel} sub={analyzeSub} />}
      {aiState?.loading && <AiLoadingState />}
      {!aiState?.loading && aiState?.error && (
        <div style={{ padding: '16px', borderRadius: 14, background: T.dangerSoft, fontSize: '0.8438rem', color: T.danger, fontWeight: 600, textAlign: 'center' }}>
          {aiState.error}
          <button onClick={() => onAnalyze(type)} style={{ display: 'block', margin: '10px auto 0', fontSize: '0.8125rem', fontWeight: 700, color: T.danger, textDecoration: 'underline' }}>다시 시도</button>
        </div>
      )}
      {!aiState?.loading && aiState?.data && <Display data={aiState.data} onRetry={() => onAnalyze(type)} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   메인
───────────────────────────────────────── */
const TABS = ['건강검진', '혈압·혈당', '약국봉투', '병원진료'];

export default function Report({ onPremium, toast }) {
  const [tab, setTab]     = useState('건강검진');
  const [checkupItems, setCheckupItems] = useState([]);
  const [checkupDate, setCheckupDate]   = useState('');
  const [checkupId, setCheckupId]       = useState(null);
  const [vitals, setVitals]   = useState([]);
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiState, setAiState] = useState({ checkup: null, daily: null, pharmacy: null, hospital: null });
  const [isPremium, setIsPremium] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('lastCheckupId');
    Promise.all([
      api.get(id ? `/api/checkup/${id}` : '/api/checkup/latest').catch(() => null),
      api.get('/api/vitals/history').catch(() => null),
      api.get('/api/medical-records/history').catch(() => null),
      api.get('/api/user/me').catch(() => null),
    ]).then(([checkupRes, vitalsRes, medicalRes, userRes]) => {
      const d = checkupRes?.data?.data;
      if (d) {
        setCheckupDate(d.checkupDate || '');
        setCheckupItems(toMetrics(d));
        setCheckupId(d.id || null);
        if (d.id) {
          api.get(`/api/ai/report/${d.id}`).then(r => {
            const rd = r?.data?.data;
            console.log('[Report] AI 리포트 응답 isPaid:', rd?.isPaid, '| reportId:', rd?.reportId);
            if (rd?.isPaid) {
              setIsPaid(true);
              setAiState(prev => ({ ...prev, checkup: { loading: false, data: rd } }));
            }
          }).catch(err => {
            console.log('[Report] AI 리포트 없음 (정상):', err?.response?.status);
          });
        }
      }
      setVitals(vitalsRes?.data?.data || []);
      setMedicals(medicalRes?.data?.data || []);
      const expiry = userRes?.data?.data?.annualPassExpiry;
      if (expiry && new Date(expiry) > new Date()) setIsPremium(true);
    }).finally(() => setLoading(false));
  }, []);

  const pharmacyRecords = medicals.filter(m => m.type === 'PHARMACY');
  const hospitalRecords = medicals.filter(m => m.type === 'HOSPITAL');

  const runAiAnalysis = async (type) => {
    setAiState(prev => ({ ...prev, [type]: { loading: true } }));
    try {
      let res;
      if (type === 'checkup') {
        res = await api.post('/api/ai/analyze', { checkupId });
      } else {
        const endpoint = type === 'daily' ? '/api/ai/analyze/daily'
          : type === 'pharmacy' ? '/api/ai/analyze/medical?type=PHARMACY'
          : '/api/ai/analyze/medical?type=HOSPITAL';
        res = await api.post(endpoint);
      }
      setAiState(prev => ({ ...prev, [type]: { loading: false, data: res.data.data } }));
      if (type === 'checkup' && res.data.data?.isPaid) setIsPaid(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'AI 분석 중 오류가 발생했습니다';
      setAiState(prev => ({ ...prev, [type]: { loading: false, error: msg } }));
    }
  };

  const hasAccess   = isPremium || isPaid;
  const warnCount   = checkupItems.filter(m => m.status === '주의' || m.status === '위험').length;
  const displayDate = checkupDate ? new Date(checkupDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const freeItems   = hasAccess ? checkupItems : checkupItems.slice(0, 2);
  const lockedItems = hasAccess ? [] : checkupItems.slice(2);

  return (
    <div data-screen-label="AI 리포트" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>

      {/* ─ 헤더 ─ */}
      <div style={{ padding: '56px 20px 10px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: isPremium ? '#FFF3D6' : isPaid ? T.blueSoft : T.greenSoft, color: isPremium ? '#A0620A' : isPaid ? T.blue : T.ok, padding: '4px 10px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 800, marginBottom: 10 }}>{isPremium ? '프리미엄' : isPaid ? '건당 구매' : '무료 플랜'}</div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>내 건강 리포트</h1>
      </div>

      {/* ─ 탭 바 ─ */}
      <div className="nd-no-scrollbar" style={{ overflowX: 'auto', padding: '6px 20px 14px', display: 'flex', gap: 8 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flexShrink: 0, padding: '8px 15px', borderRadius: 999,
            fontSize: '0.8125rem', fontWeight: 700,
            background: tab === t ? T.blue : '#fff',
            color: tab === t ? '#fff' : T.inkMid,
            border: `1.5px solid ${tab === t ? T.blue : T.line}`,
            transition: 'all .15s ease',
          }}>{t}</button>
        ))}
      </div>

      {/* ─ 건강검진 탭 ─ */}
      {tab === '건강검진' && (
        <>
          <div style={{ padding: '0 20px 14px' }}>
            {displayDate && <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: T.inkSoft }}>{displayDate} 검진 기준</p>}
            {loading ? (
              <div style={{ padding: '13px 15px', borderRadius: 14, background: T.bg, border: '1px solid ' + T.line, fontSize: '0.8438rem', color: T.inkSoft, fontWeight: 600 }}>데이터를 불러오는 중...</div>
            ) : warnCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 15px', borderRadius: 14, background: T.warnSoft, border: `1px solid ${T.warn}33` }}>
                <span style={{ fontSize: '1.0625rem' }}>⚠️</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9A6A12' }}>주의가 필요한 항목이 {warnCount}개 있어요</span>
              </div>
            ) : checkupItems.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 15px', borderRadius: 14, background: T.greenSoft }}>
                <Icon name="check" size={17} color={T.green} stroke={2.6} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: T.ok }}>모든 수치가 정상 범위예요!</span>
              </div>
            ) : null}
          </div>

          {!loading && checkupItems.length === 0 && (
            <div style={{ padding: '0 20px 28px' }}>
              <Card style={{ textAlign: 'center', padding: '36px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: T.ink, marginBottom: 8 }}>검진 데이터가 없어요</div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.inkMid, lineHeight: 1.6 }}>검진 수치를 입력하면 AI 리포트를 받을 수 있어요</p>
              </Card>
            </div>
          )}

          {checkupItems.length > 0 && (
            <>
              <div style={{ padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 2px 10px' }}>
                  <span style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink }}>수치 요약</span>
                  {!hasAccess && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: T.ok, background: T.greenSoft, padding: '2px 8px', borderRadius: 999 }}>무료 공개</span>}
                </div>
                <Card pad={0} style={{ overflow: 'hidden' }}>
                  {freeItems.map((m, i) => <SummaryRow key={m.id} m={m} last={i === freeItems.length - 1} />)}
                </Card>
              </div>
              <div style={{ padding: '12px 20px 0' }}>
                <AiSummaryCard items={checkupItems} />
              </div>
              {checkupId && (
                <div style={{ padding: '12px 20px 0' }}>
                  {!aiState.checkup?.loading && !aiState.checkup?.data && !aiState.checkup?.error && (
                    <AiAnalyzeBtn onPress={() => runAiAnalysis('checkup')} label="AI 심층 분석받기" sub="건강 점수 · 위험항목 분석 · 맞춤 실천 목표" />
                  )}
                  {aiState.checkup?.loading && <AiLoadingState />}
                  {!aiState.checkup?.loading && aiState.checkup?.error && (
                    <div style={{ padding: '16px', borderRadius: 14, background: T.dangerSoft, fontSize: '0.8438rem', color: T.danger, fontWeight: 600, textAlign: 'center' }}>
                      {aiState.checkup.error}
                      <button onClick={() => runAiAnalysis('checkup')} style={{ display: 'block', margin: '10px auto 0', fontSize: '0.8125rem', fontWeight: 700, color: T.danger, textDecoration: 'underline' }}>다시 시도</button>
                    </div>
                  )}
                  {!aiState.checkup?.loading && aiState.checkup?.data && (
                    <CheckupAiDisplay data={aiState.checkup.data} onRetry={() => runAiAnalysis('checkup')} />
                  )}
                </div>
              )}
              {lockedItems.length > 0 && (
                <>
                  <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.7812rem', fontWeight: 700, color: T.inkSoft, marginBottom: 9 }}>프리미엄에서 확인할 수 있어요</div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {[{ icon: 'spark', label: '수치별 원인 분석' }, { icon: 'run', label: '맞춤 운동 추천' }, { icon: 'food', label: '식습관 가이드' }, { icon: 'cal', label: '재검 계획' }, { icon: 'pdf', label: 'PDF 저장' }].map((it, i) => (
                          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, background: '#fff', border: '1px solid ' + T.line, fontSize: '0.7812rem', fontWeight: 700, color: T.ink }}>
                            <Icon name={it.icon} size={13} color={T.blue} stroke={2.1} /> {it.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '14px 20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ flex: 1, height: 1, background: T.line }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 999, background: '#F0F2F5', margin: '0 10px' }}>
                        <span style={{ fontSize: '0.75rem' }}>🔒</span>
                        <span style={{ fontSize: '0.7812rem', fontWeight: 800, color: T.blue }}>프리미엄 전용 콘텐츠</span>
                      </div>
                      <div style={{ flex: 1, height: 1, background: T.line }} />
                    </div>
                  </div>
                  <div style={{ padding: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <LockedPreview onClick={onPremium}>
                      <div style={{ background: '#fff' }}>
                        {lockedItems.slice(0, 2).map((m, i) => <SummaryRow key={m.id} m={m} last={i === Math.min(2, lockedItems.length) - 1} />)}
                      </div>
                    </LockedPreview>
                    {lockedItems.length > 2 && (
                      <div style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 700, color: T.inkSoft, padding: '2px 0' }}>+ {lockedItems.length - 2}개 항목 더 있어요</div>
                    )}
                  </div>
                  <div style={{ padding: '14px 20px 0' }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.inkMid }}>총 {checkupItems.length}개 항목 중 {freeItems.length}개 확인 완료</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: T.blue }}>{freeItems.length}/{checkupItems.length}</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 999, background: T.line, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.round((freeItems.length / checkupItems.length) * 100) + '%', borderRadius: 999, background: `linear-gradient(90deg,${T.blue},${T.green})`, transition: 'width .4s ease' }} />
                      </div>
                    </div>
                    <button onClick={onPremium} style={{ width: '100%', height: 50, borderRadius: 13, background: 'linear-gradient(135deg,#00B894,#00A382)', color: '#fff', fontSize: '0.9062rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 6px 16px rgba(0,184,148,0.28)' }}>
                      <Icon name="lock" size={15} color="rgba(255,255,255,0.9)" stroke={2.2} />
                      나머지 {lockedItems.length}개 항목 상세 분석 보기
                      <span style={{ fontSize: '0.7812rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginLeft: 2 }}>· 1,900원</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ─ 혈압·혈당 탭 ─ */}
      {tab === '혈압·혈당' && (
        <div style={{ padding: '0 20px 32px' }}>
          {loading
            ? <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '0.8438rem', color: T.inkSoft }}>불러오는 중...</div>
            : <VitalsTab vitals={vitals} aiState={aiState.daily} onAnalyze={runAiAnalysis} />
          }
        </div>
      )}

      {/* ─ 약국봉투 탭 ─ */}
      {tab === '약국봉투' && (
        <div style={{ padding: '0 20px 32px' }}>
          {loading
            ? <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '0.8438rem', color: T.inkSoft }}>불러오는 중...</div>
            : <MedicalTab
                records={pharmacyRecords} type="pharmacy"
                aiState={aiState.pharmacy} onAnalyze={runAiAnalysis}
                emptyEmoji="💊" emptyTitle="약국봉투 기록이 없어요"
                emptyDesc={'약국봉투를 기록하면\nAI가 성분과 주의사항을 분석해 드려요'}
                analyzeLabel="AI 분석받기"
                analyzeSub="처방약 성분·주의사항·복용 관리법을 AI가 분석해 드려요"
              />
          }
        </div>
      )}

      {/* ─ 병원진료 탭 ─ */}
      {tab === '병원진료' && (
        <div style={{ padding: '0 20px 32px' }}>
          {loading
            ? <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '0.8438rem', color: T.inkSoft }}>불러오는 중...</div>
            : <MedicalTab
                records={hospitalRecords} type="hospital"
                aiState={aiState.hospital} onAnalyze={runAiAnalysis}
                emptyEmoji="🏥" emptyTitle="병원진료 기록이 없어요"
                emptyDesc={'병원 진료 내역을 기록하면\nAI가 진단 분석과 관리 방법을 알려드려요'}
                analyzeLabel="AI 분석받기"
                analyzeSub="진료 기록을 바탕으로 진단 분석과 관리법을 안내해 드려요"
              />
          }
        </div>
      )}

      {/* ─ 면책 고지 ─ */}
      <div style={{ margin: '4px 20px 28px', padding: 14, borderRadius: 14, background: '#EEF1F6', display: 'flex', gap: 10 }}>
        <Icon name="info" size={18} color={T.inkSoft} stroke={2} />
        <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.6, color: T.inkSoft }}>본 서비스는 의료 진단이 아닙니다. 검진 결과 해석을 돕기 위한 참고용 정보이며, 정확한 진단과 치료는 반드시 의료 전문가와 상담하세요.</p>
      </div>
    </div>
  );
}

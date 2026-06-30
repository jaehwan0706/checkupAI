import React, { useState, useEffect } from 'react';
import { T, STATUS, Icon, Card, Segmented } from '../components/UI';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import api from '../api';

/* ─────────────────────────────────────────
   유틸
───────────────────────────────────────── */
function calcAge(birth) {
  if (!birth) return null;
  const parts = birth.split(/[.\-/]/);
  if (parts.length < 3) return null;
  const [year, month, day] = parts.map(Number);
  if (!year || year < 1900 || year > new Date().getFullYear()) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return age > 0 && age < 120 ? age : null;
}
function calcHealthAge(a, s) { return s >= 80 ? a - 2 : s >= 60 ? a + 3 : a + 7; }
function calcDday(checkupDate) {
  if (!checkupDate) return null;
  const next = new Date(checkupDate); next.setFullYear(next.getFullYear() + 1); next.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((next - today) / 86400000);
}

/* ─────────────────────────────────────────
   건강 나이 카드
───────────────────────────────────────── */
function HealthAgeCard({ actualAge, healthAge, onNav }) {
  if (actualAge === null) return (
    <Card pad={16}>
      <div style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink, marginBottom: 6 }}>건강 나이</div>
      <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: T.inkMid, lineHeight: 1.6 }}>프로필에 생년월일을 입력하면 건강 나이를 확인할 수 있어요</p>
      <button onClick={() => onNav?.('profile')} style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.blue, display: 'flex', alignItems: 'center', gap: 4 }}>프로필 입력하기 <Icon name="chevR" size={14} color={T.blue} /></button>
    </Card>
  );
  if (healthAge === null) return (
    <Card pad={16}>
      <div style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink, marginBottom: 6 }}>건강 나이</div>
      <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: T.inkMid, lineHeight: 1.6 }}>검진 수치를 입력하면 건강 나이를 계산해 드려요</p>
      <button onClick={() => onNav?.('input')} style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.blue, display: 'flex', alignItems: 'center', gap: 4 }}>검진 수치 입력하기 <Icon name="chevR" size={14} color={T.blue} /></button>
    </Card>
  );
  const diff = healthAge - actualAge;
  const isWorse = diff > 0;
  const ageColor = isWorse ? T.danger : T.ok;
  return (
    <Card pad={16}>
      <div style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink, marginBottom: 14 }}>건강 나이</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '14px 0', borderRadius: 14, background: T.bg }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: T.inkSoft, marginBottom: 5 }}>실제 나이</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{actualAge}<span style={{ fontSize: '0.875rem', fontWeight: 600, marginLeft: 2 }}>세</span></div>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: T.inkSoft }}>vs</div>
        <div style={{ flex: 1, textAlign: 'center', padding: '14px 0', borderRadius: 14, background: isWorse ? T.dangerSoft : T.okSoft }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: ageColor, marginBottom: 5 }}>건강 나이</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: ageColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{healthAge}<span style={{ fontSize: '0.875rem', fontWeight: 600, marginLeft: 2 }}>세</span><span style={{ fontSize: '1rem', marginLeft: 3 }}>{isWorse ? '🔴' : '🟢'}</span></div>
        </div>
      </div>
      <div style={{ padding: '10px 12px', borderRadius: 11, background: isWorse ? T.dangerSoft : T.okSoft, marginBottom: 12 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: ageColor }}>
          {isWorse ? `실제 나이보다 ${diff}세 빠르게 노화 중이에요` : diff === 0 ? '실제 나이와 건강 나이가 같아요' : `실제 나이보다 ${-diff}세 더 젊어요!`}
        </span>
      </div>
      <button onClick={() => onNav?.('report')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, color: T.blue }}>
        건강 나이 줄이는 방법 보기 <Icon name="chevR" size={15} color={T.blue} />
      </button>
    </Card>
  );
}

/* ─────────────────────────────────────────
   D-day 카드
───────────────────────────────────────── */
function DdayCard({ dday, checkupDate, toast }) {
  if (checkupDate === null) return (
    <Card pad={16}>
      <div style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink, marginBottom: 6 }}>다음 건강검진</div>
      <p style={{ fontSize: '0.8125rem', color: T.inkMid, margin: 0, lineHeight: 1.6 }}>검진 데이터를 입력하면 다음 검진 D-day를 확인할 수 있어요</p>
    </Card>
  );
  const isOverdue = dday < 0, isToday = dday === 0;
  const ddayColor = isOverdue ? T.danger : isToday ? T.warn : T.blue;
  const ddaySoft  = isOverdue ? T.dangerSoft : isToday ? T.warnSoft : T.blueSoft;
  const nextDate  = new Date(checkupDate); nextDate.setFullYear(nextDate.getFullYear() + 1);
  const formatted = nextDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <Card pad={16}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink }}>다음 건강검진</div>
        <button onClick={() => toast?.('알림 기능 준비 중입니다', 'bell')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: T.blue, padding: '4px 10px', borderRadius: 999, background: T.blueSoft }}>
          <Icon name="bell" size={13} color={T.blue} stroke={2} /> 알림 설정
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: ddaySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="cal" size={26} color={ddayColor} stroke={1.9} />
        </div>
        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: ddayColor, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {isOverdue ? `D+${-dday}` : isToday ? 'D-DAY' : `D-${dday}`}
          </div>
          <div style={{ fontSize: '0.7812rem', color: T.inkSoft, marginTop: 4, fontWeight: 600 }}>
            {isOverdue ? '검진 권장일이 지났어요' : `${formatted} 권장`}
          </div>
        </div>
      </div>
      {isOverdue && (
        <div style={{ marginTop: 12, padding: '10px 13px', borderRadius: 11, background: T.warnSoft, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: '0.9375rem' }}>⚠️</span>
          <span style={{ fontSize: '0.7812rem', fontWeight: 700, color: T.warn }}>건강검진을 예약하는 것을 권장해요</span>
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────
   주간 건강 리포트 카드
───────────────────────────────────────── */
function WeeklyReportCard({ avgPct, onNav }) {
  if (avgPct === null) return (
    <Card pad={16}>
      <div style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink, marginBottom: 6 }}>주간 건강 리포트</div>
      <p style={{ fontSize: '0.8125rem', color: T.inkMid, margin: '0 0 12px', lineHeight: 1.6 }}>목표를 설정하면 주간 리포트를 볼 수 있어요</p>
      <button onClick={() => onNav?.('goals')} style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.blue, display: 'flex', alignItems: 'center', gap: 4 }}>목표 설정하러 가기 <Icon name="chevR" size={14} color={T.blue} /></button>
    </Card>
  );
  const msg = avgPct <= 40 ? '이번 주 조금 더 힘내봐요 💪' : avgPct <= 70 ? '절반 넘었어요! 잘 하고 있어요 👍' : '이번 주 목표 거의 다 왔어요 🎉';
  const barColor = avgPct <= 40 ? T.warn : avgPct <= 70 ? T.blue : T.ok;
  return (
    <Card pad={16}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: '0.8438rem', fontWeight: 800, color: T.ink }}>주간 건강 리포트</div>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: barColor }}>{avgPct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: T.line, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: avgPct + '%', borderRadius: 999, background: barColor, transition: 'width .4s ease' }} />
      </div>
      <div style={{ fontSize: '0.8438rem', fontWeight: 700, color: T.ink, marginBottom: 12 }}>{msg}</div>
      <button onClick={() => onNav?.('goals')} style={{ fontSize: '0.7812rem', fontWeight: 700, color: T.blue, display: 'flex', alignItems: 'center', gap: 4 }}>목표 자세히 보기 <Icon name="chevR" size={14} color={T.blue} /></button>
    </Card>
  );
}

/* ─────────────────────────────────────────
   맞춤 가이드 — 개인화 데이터 생성
───────────────────────────────────────── */
const STATUS_KO = { NORMAL: '정상', WARNING: '주의', DANGER: '위험' };

const TIP_MAP = {
  '혈당_WARNING': { icon: 'run',   badge: '혈당', color: T.warn, title: '식후 30분 걷기 🚶', desc: '혈당 스파이크를 효과적으로 줄여줘요' },
  '혈당_DANGER':  { icon: 'drop',  badge: '혈당', color: T.danger, title: '당류 섭취 즉시 줄이기', desc: '혈당 조절에 가장 빠른 효과예요' },
  '혈압_WARNING': { icon: 'food',  badge: '혈압', color: T.warn, title: '나트륨 하루 2g 이하 🧂', desc: '혈압을 자연스럽게 낮춰줘요' },
  '혈압_DANGER':  { icon: 'heart', badge: '혈압', color: T.danger, title: '저강도 유산소 운동', desc: '혈압 조절에 가장 효과적이에요' },
  '콜레스테롤_WARNING': { icon: 'drop', badge: '콜레스테롤', color: T.warn, title: '등푸른생선 주 2회 🐟', desc: 'LDL 콜레스테롤 개선에 효과적이에요' },
  '콜레스테롤_DANGER':  { icon: 'food', badge: '콜레스테롤', color: T.danger, title: '포화지방 식품 제한', desc: '콜레스테롤 수치가 빠르게 개선돼요' },
  '간수치(ALT)_WARNING': { icon: 'flask', badge: '간수치', color: T.warn, title: '음주 줄이기 🚫', desc: '간 수치 회복에 가장 효과적이에요' },
  '간수치(ALT)_DANGER':  { icon: 'flask', badge: '간수치', color: T.danger, title: '즉시 전문의 상담 권장', desc: '위험 범위입니다. 병원 방문을 권장해요' },
};
const DEFAULT_TIPS = [
  { icon: 'run',  badge: null, color: T.ok, title: '규칙적인 유산소 운동 🏃', desc: '현재 건강 상태 유지에 도움돼요' },
  { icon: 'food', badge: null, color: T.blue, title: '균형 잡힌 식단 🥗', desc: '다양한 영양소를 고르게 섭취하세요' },
  { icon: 'moon', badge: null, color: T.blue, title: '7~8시간 충분한 수면 😴', desc: '수면이 면역력과 대사를 지켜요' },
];

function getPersonalizedTips(metrics) {
  const abnormalTips = (metrics || [])
    .filter(m => m.status !== 'NORMAL')
    .sort((a, b) => (a.status === 'DANGER' ? -1 : 1))
    .flatMap(m => { const t = TIP_MAP[`${m.name}_${m.status}`]; return t ? [t] : []; });
  return [...abnormalTips, ...DEFAULT_TIPS].slice(0, 3);
}


/* ─────────────────────────────────────────
   맞춤 가이드 컴포넌트
───────────────────────────────────────── */
function TipCard({ tip }) {
  const soft = tip.color === T.danger ? T.dangerSoft : tip.color === T.warn ? T.warnSoft : tip.color === T.ok ? T.okSoft : T.blueSoft;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, background: '#fff', border: '1px solid ' + T.line }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={tip.icon} size={22} color={tip.color} stroke={2.1} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: T.ink }}>{tip.title}</span>
          {tip.badge && (
            <span style={{ fontSize: '0.625rem', fontWeight: 800, color: tip.color, background: soft, padding: '1px 6px', borderRadius: 999 }}>{tip.badge}</span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: T.inkSoft, lineHeight: 1.4 }}>{tip.desc}</span>
      </div>
    </div>
  );
}




function GuideBody({ metrics, onPremium, isPremium }) {
  const tips    = getPersonalizedTips(metrics);
  const hasData = metrics && metrics.length > 0;

  return (
    <>
      {/* AI 맞춤 배너 */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'linear-gradient(135deg,#00B894,#00A382)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="spark" size={17} color="rgba(255,255,255,0.9)" stroke={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>{hasData ? 'AI 맞춤 추천' : '맞춤 가이드'}</div>
            <p style={{ margin: 0, fontSize: '0.7812rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>
              {hasData ? '검진 수치를 분석해 아래 가이드를 추천해요.' : '검진 수치를 입력하면 맞춤 가이드를 받을 수 있어요.'}
            </p>
          </div>
        </div>
      </div>

      {/* 맞춤 가이드 카드 */}
      {hasData ? (
        <div style={{ padding: '12px 20px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isPremium ? (
            tips.map((tip, i) => <TipCard key={i} tip={tip} />)
          ) : (
            <>
              {/* 무료 카드 */}
              <TipCard tip={tips[0]} />

              {/* 잠긴 카드 2개 */}
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }} onClick={onPremium}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
                  {tips.slice(1).map((tip, i) => <TipCard key={i} tip={tip} />)}
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,249,252,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(26,43,69,0.18)' }}>
                    <Icon name="lock" size={20} color={T.warn} stroke={2} />
                  </div>
                </div>
              </div>

              {/* 프리미엄 CTA */}
              <button onClick={onPremium} style={{ width: '100%', height: 50, borderRadius: 14, background: 'linear-gradient(135deg,#00B894,#00A382)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(0,184,148,0.25)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(180deg,#F0B445,#E0982A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="crown" size={14} color="#3A2A06" stroke={2.2} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#fff' }}>AI 맞춤 가이드 전체 보기</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>1,900원</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ padding: '12px 20px 28px' }}>
          <Card style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: '0.9062rem', fontWeight: 700, color: T.ink, marginBottom: 6 }}>검진 수치를 입력하면</div>
            <div style={{ fontSize: '0.8438rem', fontWeight: 700, color: T.ink, marginBottom: 4 }}>맞춤 가이드를 받을 수 있어요</div>
          </Card>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────
   검진 트렌드 컴포넌트
───────────────────────────────────────── */
const METRIC_CONFIG = {
  '혈당':     { field: 'fastingBloodSugar', unit: 'mg/dL', normal: 100, label: '정상 100 미만', vitalField: 'bloodSugar',
                status: v => v >= 126 ? 'DANGER' : v >= 100 ? 'WARNING' : 'NORMAL' },
  '혈압':       { field: 'systolicBp',      unit: 'mmHg',  normal: 120, label: '정상 120 이하', vitalField: 'systolic',
                status: v => v >= 140 ? 'DANGER' : v >= 120 ? 'WARNING' : 'NORMAL' },
  '콜레스테롤': { field: 'totalCholesterol', unit: 'mg/dL', normal: 200, label: '정상 200 미만', vitalField: null,
                status: v => v >= 240 ? 'DANGER' : v >= 200 ? 'WARNING' : 'NORMAL' },
  '간수치':   { field: 'alt',               unit: 'U/L',   normal: 40,  label: '정상 40 이하',  vitalField: null,
                status: v => v > 80 ? 'DANGER' : v > 40 ? 'WARNING' : 'NORMAL' },
};

function CheckupTrends({ history, vitalsHistory, onPremium, onNav, isPremium }) {
  const [tab, setTab] = useState('혈압');

  const cfg = METRIC_CONFIG[tab];

  // Annual checkup points
  const annualPoints = (history || [])
    .filter(h => h[cfg.field] != null)
    .sort((a, b) => new Date(a.checkupDate) - new Date(b.checkupDate))
    .map(h => ({
      date:    new Date(h.checkupDate).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric' }),
      rawDate: new Date(h.checkupDate),
      annual:  h[cfg.field],
      daily:   null,
    }));

  // Daily vitals points (only for tabs with vitalField mapping)
  const dailyPoints = cfg.vitalField
    ? (vitalsHistory || [])
        .filter(v => v[cfg.vitalField] != null)
        .sort((a, b) => new Date(a.recordedDate) - new Date(b.recordedDate))
        .map(v => ({
          date:    new Date(v.recordedDate).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric' }),
          rawDate: new Date(v.recordedDate),
          annual:  null,
          daily:   v[cfg.vitalField],
        }))
    : [];

  // Merge by date label
  const byDate = new Map();
  [...annualPoints, ...dailyPoints].forEach(p => {
    if (!byDate.has(p.date)) byDate.set(p.date, { date: p.date, rawDate: p.rawDate, annual: null, daily: null });
    const e = byDate.get(p.date);
    if (p.annual != null) e.annual = p.annual;
    if (p.daily  != null) e.daily  = p.daily;
  });
  const data = [...byDate.values()].sort((a, b) => a.rawDate - b.rawDate);

  const annualEntries = data.filter(d => d.annual != null);
  const hasDailyData  = dailyPoints.length > 0;

  if (data.length < 2) {
    return (
      <div style={{ padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="trend" size={28} color={T.blue} stroke={1.9} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: T.ink, marginBottom: 6 }}>기록이 2개 이상이면</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.inkMid }}>트렌드를 볼 수 있어요</div>
        </div>
        <div style={{ padding: '10px 16px', borderRadius: 12, background: T.bg, border: '1px solid ' + T.line }}>
          <span style={{ fontSize: '0.7812rem', fontWeight: 700, color: T.inkSoft }}>
            검진 기록: {annualEntries.length}개 · 일일 기록: {dailyPoints.length}개
          </span>
        </div>
        <button onClick={() => onNav?.('input')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8438rem', fontWeight: 700, color: '#00B894', padding: '10px 18px', borderRadius: 12, background: T.greenSoft }}>
          검진 결과 입력하기 <Icon name="chevR" size={15} color="#00B894" stroke={2.2} />
        </button>
      </div>
    );
  }

  const lastAnnual = annualEntries[annualEntries.length - 1]?.annual;
  const lastVal    = lastAnnual ?? data[data.length - 1]?.daily;
  const delta      = annualEntries.length >= 2 ? lastAnnual - annualEntries[0].annual : null;
  const curStatus  = lastVal != null ? cfg.status(lastVal) : 'NORMAL';
  const s          = STATUS[STATUS_KO[curStatus]] || STATUS['정상'];
  const lineColor  = '#00B894';
  const allVals    = data.flatMap(d => [d.annual, d.daily].filter(v => v != null));
  const yMin = Math.floor(Math.min(...allVals, cfg.normal) * 0.93);
  const yMax = Math.ceil(Math.max(...allVals, cfg.normal) * 1.05);

  return (
    <>
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {Object.keys(METRIC_CONFIG).map(k => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '6px 13px', borderRadius: 999, fontSize: '0.7812rem', fontWeight: 700,
              background: tab === k ? T.blue : '#fff',
              color: tab === k ? '#fff' : T.inkSoft,
              border: '1.5px solid ' + (tab === k ? T.blue : T.line),
              transition: 'all .15s ease',
            }}>{k}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <Card pad={16}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: T.inkSoft, fontWeight: 600, marginBottom: 2 }}>최근 {tab}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: '1.625rem', fontWeight: 800, color: T.ink, letterSpacing: '-0.02em' }}>{lastVal}</span>
                <span style={{ fontSize: '0.7812rem', color: T.inkSoft, fontWeight: 600 }}>{cfg.unit}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: s.soft, fontSize: '0.7188rem', fontWeight: 800, color: s.color }}>
                {STATUS_KO[curStatus]}
              </div>
              {delta != null && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 700, color: delta > 0 ? T.danger : delta < 0 ? T.ok : T.inkSoft }}>
                  {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} 전체 기간 {delta > 0 ? '+' : ''}{delta} {cfg.unit}
                </div>
              )}
            </div>
          </div>

          {hasDailyData && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: 3, borderRadius: 999, background: lineColor }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: T.inkSoft }}>연간 검진</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: 2, borderRadius: 999, background: '#4CAF82', borderTop: '2px dashed #4CAF82' }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: T.inkSoft }}>일일 측정</span>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#E7ECF3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8A97AC', fontSize: '0.6875rem', fontWeight: 600 }} />
              <YAxis domain={[yMin, yMax]} axisLine={false} tickLine={false} tick={{ fill: '#B4BECC', fontSize: '0.625rem' }} width={42} />
              <ReferenceLine y={cfg.normal} stroke="#9DB4D6" strokeDasharray="5 4"
                label={{ value: cfg.label, position: 'insideTopRight', fill: '#9DB4D6', fontSize: '0.625rem', fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E7ECF3', fontSize: '0.75rem', boxShadow: '0 8px 20px rgba(26,43,69,0.12)' }}
                formatter={(v, name) => [`${v} ${cfg.unit}`, name === 'annual' ? '연간 검진' : '일일 측정']} />
              <Line type="monotone" dataKey="annual" name="annual" stroke={lineColor} strokeWidth={3}
                dot={{ r: 4.5, fill: '#fff', stroke: lineColor, strokeWidth: 2.5 }} activeDot={{ r: 6, fill: lineColor }}
                connectNulls={false} />
              {hasDailyData && (
                <Line type="monotone" dataKey="daily" name="daily" stroke="#6C5CE7" strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3.5, fill: '#fff', stroke: '#6C5CE7', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#6C5CE7' }}
                  connectNulls={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 연도별 트렌드 분석 */}
      <div style={{ padding: '12px 20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isPremium ? (
          <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 14, background: T.greenSoft, border: '1px solid #00B89433' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="trend" size={18} color="#00B894" stroke={2.1} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#00B894', marginBottom: 3 }}>연도별 트렌드 분석</div>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.6, color: T.inkMid }}>
                최근 3년간 {tab} 수치 변화와 AI가 분석한 건강 트렌드를 확인할 수 있어요.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }} onClick={onPremium}>
              <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 14, background: T.greenSoft, border: '1px solid #00B89433' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="trend" size={18} color="#00B894" stroke={2.1} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#00B894', marginBottom: 3 }}>연도별 트렌드 분석</div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.6, color: T.inkMid }}>
                      최근 3년간 {tab} 수치 변화와 AI가 분석한 건강 트렌드를 확인할 수 있어요.
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,249,252,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(26,43,69,0.18)' }}>
                  <Icon name="lock" size={20} color={T.warn} stroke={2} />
                </div>
              </div>
            </div>
            <button onClick={onPremium} style={{ width: '100%', height: 50, borderRadius: 14, background: 'linear-gradient(135deg,#00B894,#00A382)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(0,184,148,0.25)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(180deg,#F0B445,#E0982A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="crown" size={14} color="#3A2A06" stroke={2.2} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#fff' }}>AI 트렌드 분석 보기</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>· 1,900원</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   메인
───────────────────────────────────────── */
export default function Daily({ toast, onNav, initialMode = '맞춤 가이드' }) {
  const [mode, setMode]           = useState(initialMode);
  const [homeData, setHomeData]       = useState(null);
  const [checkupDate, setCheckupDate] = useState(null);
  const [goals, setGoals]             = useState([]);
  const [history, setHistory]         = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [isPremium, setIsPremium]     = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  useEffect(() => {
    Promise.all([
      api.get('/api/home').catch(() => null),
      api.get('/api/checkup/latest').catch(() => null),
      api.get('/api/goals').catch(() => null),
      api.get('/api/checkup').catch(() => null),
      api.get('/api/vitals').catch(() => null),
      api.get('/api/user/me').catch(() => null),
    ]).then(([homeRes, checkupRes, goalsRes, historyRes, vitalsRes, userRes]) => {
      setHomeData(homeRes?.data?.data || null);
      setCheckupDate(checkupRes?.data?.data?.checkupDate || null);
      setGoals(goalsRes?.data?.data || []);
      setHistory(historyRes?.data?.data || []);
      setVitalsHistory(vitalsRes?.data?.data || []);
      const expiry = userRes?.data?.data?.annualPassExpiry;
      if (expiry && new Date(expiry) > new Date()) setIsPremium(true);
    });
  }, []);

  const actualAge  = calcAge(homeData?.birthDate || user.birth);
  const score      = homeData?.healthScore ?? null;
  const healthAge  = (actualAge !== null && score !== null) ? calcHealthAge(actualAge, score) : null;
  const dday       = calcDday(checkupDate);
  const avgPct     = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + (g.pct || 0), 0) / goals.length) : null;
  const metrics    = homeData?.metrics || [];

  return (
    <div data-screen-label="건강" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '56px 20px 8px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>{user.name ? `${user.name}님의 건강 관리` : '건강 관리'}</h1>
        <p style={{ margin: '8px 0 0', fontSize: '0.8438rem', color: T.inkSoft }}>
          {mode === '맞춤 가이드' ? '내 검진 수치에 맞는 생활습관을 추천해요' : '연도별 검진 수치 변화를 확인하세요'}
        </p>
      </div>

      {/* 상단 세 카드 */}
      <div style={{ padding: '4px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HealthAgeCard actualAge={actualAge} healthAge={healthAge} onNav={onNav} />
        <DdayCard dday={dday} checkupDate={checkupDate} toast={toast} />
        <WeeklyReportCard avgPct={avgPct} onNav={onNav} />
      </div>

      {/* 맞춤 가이드 / 검진 트렌드 탭 */}
      <div style={{ padding: '16px 20px 0' }}>
        <Segmented items={['맞춤 가이드', '검진 트렌드']} value={mode} onChange={setMode} />
      </div>

      {mode === '맞춤 가이드'
        ? <GuideBody metrics={metrics} onPremium={() => onNav?.('premium')} isPremium={isPremium} />
        : <CheckupTrends history={history} vitalsHistory={vitalsHistory} onPremium={() => onNav?.('premium')} onNav={onNav} isPremium={isPremium} />
      }

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { T, Icon, Card, HealthMascot } from '../components/UI';
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
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: ageColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{healthAge}<span style={{ fontSize: '0.875rem', fontWeight: 600, marginLeft: 2 }}>세</span></div>
        </div>
      </div>
      <div style={{ padding: '10px 12px', borderRadius: 11, background: isWorse ? T.dangerSoft : T.okSoft }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: ageColor }}>
          {isWorse ? `실제 나이보다 ${diff}세 빠르게 노화 중이에요` : diff === 0 ? '실제 나이와 건강 나이가 같아요' : `실제 나이보다 ${-diff}세 더 젊어요!`}
        </span>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────
   D-day 한 줄 — 알림으로 대체되어 카드가 아닌 짧은 안내로 축소
───────────────────────────────────────── */
function DdayLine({ dday, checkupDate }) {
  if (checkupDate === null) return null;
  const isOverdue = dday < 0, isToday = dday === 0;
  const color = isOverdue ? T.danger : isToday ? T.warn : T.inkSoft;
  const nextDate  = new Date(checkupDate); nextDate.setFullYear(nextDate.getFullYear() + 1);
  const formatted = nextDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
      <Icon name="cal" size={14} color={color} stroke={2} />
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
        {isOverdue ? '건강검진 권장일이 지났어요' : isToday ? '오늘이 건강검진 권장일이에요' : `다음 건강검진 ${formatted} 권장 · D-${dday}`}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────
   오늘의 케어 현황 — 5개 카테고리 체크인 요약
───────────────────────────────────────── */
function TodayCheckinCard({ checkStatus }) {
  const entries = Object.values(checkStatus);
  if (entries.length === 0) return null;
  const total = entries.length;
  const checked = entries.filter(s => s.checkedToday).length;
  const maxStreak = Math.max(0, ...entries.map(s => s.streak || 0));
  const pct = Math.round((checked / total) * 100);
  const allDone = checked === total;
  return (
    <div style={{ borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#00B894,#00A382)' }}>
      <div style={{ position: 'absolute', right: -24, top: -24, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', right: 12, top: 10 }}>
        <HealthMascot mood={allDone ? 'happy' : checked > 0 ? 'neutral' : 'neutral'} size={56} />
      </div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>오늘의 케어 현황</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{checked}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>/ {total}개 실천 완료</span>
      </div>
      {maxStreak > 0 && <div style={{ marginTop: 4, fontSize: '0.75rem', fontWeight: 700, color: '#FFE8A3' }}>{maxStreak}일 연속</div>}
      <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginTop: 12 }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 999, background: '#fff', transition: 'width .4s ease' }} />
      </div>
      {allDone && <div style={{ marginTop: 10, fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>오늘 모든 습관을 실천했어요!</div>}
    </div>
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
  const msg = avgPct <= 40 ? '이번 주 조금 더 힘내봐요' : avgPct <= 70 ? '절반 넘었어요! 잘 하고 있어요' : '이번 주 목표 거의 다 왔어요';
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
const TIP_MAP = {
  '혈당_WARNING': { icon: 'run',   badge: '혈당', color: T.warn, title: '식후 30분 걷기', reason: '혈당 스파이크를 효과적으로 줄여줘요', steps: ['식사 직후 15~30분 가볍게 걷기', '매 끼니 후 습관처럼 실천하기'] },
  '혈당_DANGER':  { icon: 'drop',  badge: '혈당', color: T.danger, title: '당류 섭취 즉시 줄이기', reason: '혈당 조절에 가장 빠른 효과예요', steps: ['음료·디저트의 당류부터 줄이기', '정제 탄수화물 대신 잡곡·채소 위주로 식사하기'] },
  '혈압_WARNING': { icon: 'food',  badge: '혈압', color: T.warn, title: '나트륨 하루 2g 이하', reason: '혈압을 자연스럽게 낮춰줘요', steps: ['국물·가공식품 섭취 줄이기', '소금 대신 허브·향신료로 간하기'] },
  '혈압_DANGER':  { icon: 'heart', badge: '혈압', color: T.danger, title: '저강도 유산소 운동', reason: '혈압 조절에 가장 효과적이에요', steps: ['매일 30분 빠르게 걷기', '무리한 고강도 운동은 피하기'] },
  '콜레스테롤_WARNING': { icon: 'drop', badge: '콜레스테롤', color: T.warn, title: '등푸른생선 주 2회', reason: 'LDL 콜레스테롤 개선에 효과적이에요', steps: ['고등어·삼치 등 등푸른생선 주 2회 섭취하기'] },
  '콜레스테롤_DANGER':  { icon: 'food', badge: '콜레스테롤', color: T.danger, title: '포화지방 식품 제한', reason: '콜레스테롤 수치가 빠르게 개선돼요', steps: ['튀김·기름진 육류 섭취 줄이기', '올리브오일 등 불포화지방으로 대체하기'] },
  '간수치(ALT)_WARNING': { icon: 'flask', badge: '간수치', color: T.warn, title: '음주 줄이기', reason: '간 수치 회복에 가장 효과적이에요', steps: ['음주 빈도·양 줄이기', '주 2회 이상 금주일 지키기'] },
  '간수치(ALT)_DANGER':  { icon: 'flask', badge: '간수치', color: T.danger, title: '즉시 전문의 상담 권장', reason: '위험 범위입니다. 병원 방문을 권장해요', steps: ['가까운 병원에서 간 기능 정밀검사 받기'] },
};
const DEFAULT_TIPS = [
  { icon: 'run',  badge: null, color: T.ok, title: '규칙적인 유산소 운동', reason: '현재 건강 상태 유지에 도움돼요', steps: ['주 3회, 회당 30분 걷기나 가벼운 조깅하기'] },
  { icon: 'food', badge: null, color: T.blue, title: '균형 잡힌 식단', reason: '다양한 영양소를 고르게 섭취하세요', steps: ['매 끼니 채소·단백질·통곡물 골고루 챙기기'] },
  { icon: 'moon', badge: null, color: T.blue, title: '7~8시간 충분한 수면', reason: '수면이 면역력과 대사를 지켜요', steps: ['매일 비슷한 시간에 잠자리 들기'] },
];

function getPersonalizedTips(metrics) {
  const abnormalTips = (metrics || [])
    .filter(m => m.status !== 'NORMAL')
    .sort((a, b) => (a.status === 'DANGER' ? -1 : 1))
    .flatMap(m => { const t = TIP_MAP[`${m.name}_${m.status}`]; return t ? [t] : []; });
  return [...abnormalTips, ...DEFAULT_TIPS].slice(0, 3);
}


/* ─ 실천 스텝 번호 목록 ─ */
function StepsList({ steps, color }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#fff' }}>{i + 1}</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: T.inkMid, lineHeight: 1.5 }}>{step}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   맞춤 가이드 컴포넌트
───────────────────────────────────────── */
function TipCard({ tip, status, onToggleCheck }) {
  const [open, setOpen] = useState(false);
  const soft = tip.color === T.danger ? T.dangerSoft : tip.color === T.warn ? T.warnSoft : tip.color === T.ok ? T.okSoft : T.blueSoft;
  const checked = !!status?.checkedToday;
  const streak  = status?.streak || 0;
  return (
    <div style={{ borderRadius: 14, background: '#fff', border: '1px solid ' + T.line, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ width: 42, height: 42, borderRadius: 999, background: soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={tip.icon} size={22} color={tip.color} stroke={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: T.ink }}>{tip.title}</span>
            {tip.badge && (
              <span style={{ fontSize: '0.625rem', fontWeight: 800, color: tip.color, background: soft, padding: '1px 6px', borderRadius: 999, flexShrink: 0 }}>{tip.badge}</span>
            )}
            {streak > 0 && (
              <span style={{ fontSize: '0.625rem', fontWeight: 800, color: T.warn, flexShrink: 0 }}>{streak}일째</span>
            )}
          </div>
          {!open && tip.reason && (
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: T.inkSoft, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tip.reason}</div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          <Icon name={open ? 'chevU' : 'chevD'} size={16} color={T.inkSoft} stroke={2.2} />
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 14px 14px 68px' }}>
          {tip.reason && (
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: T.ink, lineHeight: 1.6, marginBottom: 8 }}>{tip.reason}</div>
          )}
          <StepsList steps={tip.steps} color={tip.color} />
          {onToggleCheck && (
            <button onClick={e => { e.stopPropagation(); onToggleCheck(); }} style={{
              width: '100%', height: 38, borderRadius: 10, fontSize: '0.8125rem', fontWeight: 700,
              background: checked ? T.okSoft : T.blue,
              color: checked ? T.ok : '#fff',
              border: checked ? '1.5px solid ' + T.ok : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {checked ? <>✓ 오늘 실천 완료</> : '오늘 실천했어요'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}




const CATEGORY_ICON  = { '혈당': 'drop', '혈압': 'heart', '콜레스테롤': 'drop', '간수치': 'flask', '전신': 'run' };
const SEVERITY_COLOR = { '위험': T.danger, '주의': T.warn, '정상': T.ok };

function GuideBody({ metrics, checkStatus = {}, onToggleCheck, onReady, dataLoaded }) {
  const hasData = metrics && metrics.length > 0;
  const [tips, setTips] = useState(() => getPersonalizedTips(metrics));
  const [loadingTips, setLoadingTips] = useState(hasData);

  useEffect(() => {
    if (!dataLoaded) return;
    if (!hasData) { onReady?.(); return; }
    setLoadingTips(true);
    api.post('/api/ai/guide')
      .then(guideRes => {
        const aiTips = guideRes.data?.data?.tips;
        if (aiTips && aiTips.length > 0) {
          setTips(aiTips.map(t => ({
            icon: CATEGORY_ICON[t.category] || 'spark',
            badge: t.category,
            color: SEVERITY_COLOR[t.severity] || T.blue,
            title: t.title,
            reason: t.reason,
            steps: t.steps,
          })));
        }
      })
      .catch(() => { /* 실패 시 기본 가이드 유지 */ })
      .finally(() => { setLoadingTips(false); onReady?.(); });
  }, [hasData, dataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* AI 맞춤 배너 */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'linear-gradient(135deg,#00B894,#00A382)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          {loadingTips ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: T.inkSoft, fontSize: '0.8438rem' }}>AI가 맞춤 가이드를 만들고 있어요...</div>
          ) : (
            tips.map((tip, i) => <TipCard key={i} tip={tip} status={checkStatus[tip.badge]} onToggleCheck={() => onToggleCheck(tip.badge)} />)
          )}
        </div>
      ) : (
        <div style={{ padding: '12px 20px 28px' }}>
          <Card style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="doc" size={26} color={T.blue} stroke={1.9} />
            </div>
            <div style={{ fontSize: '0.9062rem', fontWeight: 700, color: T.ink, marginBottom: 6 }}>검진 수치를 입력하면</div>
            <div style={{ fontSize: '0.8438rem', fontWeight: 700, color: T.ink, marginBottom: 4 }}>맞춤 가이드를 받을 수 있어요</div>
          </Card>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────
   메인
───────────────────────────────────────── */
export default function Daily({ onNav, focusGuide, onConsumeFocusGuide }) {
  const [homeData, setHomeData]       = useState(null);
  const [checkupDate, setCheckupDate] = useState(null);
  const [goals, setGoals]             = useState([]);
  const [checkStatus, setCheckStatus] = useState({}); // { [category]: { checkedToday, streak } }
  const [guideReady, setGuideReady]   = useState(false);
  const guideRef = useRef(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  useEffect(() => {
    if (!focusGuide || !guideReady) return;
    // behavior:'smooth'는 이 화면의 다른 리렌더링과 겹치며 애니메이션이 취소되는 경우가 있어 즉시 이동으로 처리한다
    guideRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    onConsumeFocusGuide?.();
  }, [focusGuide, guideReady, onConsumeFocusGuide]);

  const loadCheckStatus = () => {
    api.get('/api/guide/checkins')
      .then(res => {
        const list = res.data?.data;
        if (!list) return;
        const map = {};
        list.forEach(s => { map[s.category] = { checkedToday: s.checkedToday, streak: s.streak }; });
        setCheckStatus(map);
      })
      .catch(() => { /* 체크인 현황 조회 실패 — 배지 없이 진행 */ });
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/home').catch(() => null),
      api.get('/api/checkup/latest').catch(() => null),
      api.get('/api/goals').catch(() => null),
    ]).then(([homeRes, checkupRes, goalsRes]) => {
      setHomeData(homeRes?.data?.data || null);
      setCheckupDate(checkupRes?.data?.data?.checkupDate || null);
      setGoals(goalsRes?.data?.data || []);
    });
    loadCheckStatus();
  }, []);

  const toggleCheck = async (category) => {
    setCheckStatus(prev => {
      const cur = prev[category] || { checkedToday: false, streak: 0 };
      return { ...prev, [category]: { ...cur, checkedToday: !cur.checkedToday } };
    });
    try {
      const res = await api.post('/api/guide/checkins', null, { params: { category } });
      const status = res.data?.data;
      if (status) setCheckStatus(prev => ({ ...prev, [category]: { checkedToday: status.checkedToday, streak: status.streak } }));
    } catch {
      loadCheckStatus();
    }
  };

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
        <p style={{ margin: '8px 0 0', fontSize: '0.8438rem', color: T.inkSoft }}>내 검진 수치에 맞는 생활습관을 추천해요</p>
        <DdayLine dday={dday} checkupDate={checkupDate} />
      </div>

      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TodayCheckinCard checkStatus={checkStatus} />
        <HealthAgeCard actualAge={actualAge} healthAge={healthAge} onNav={onNav} />
        <WeeklyReportCard avgPct={avgPct} onNav={onNav} />
      </div>

      <div ref={guideRef}>
        <GuideBody metrics={metrics} checkStatus={checkStatus} onToggleCheck={toggleCheck} onReady={() => setGuideReady(true)} dataLoaded={homeData !== null} />
      </div>
    </div>
  );
}

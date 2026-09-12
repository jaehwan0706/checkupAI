import React, { useState, useEffect, useCallback } from 'react';
import { T, Icon, Card, Button, SubHeader, BottomSheet } from '../components/UI';
import MealCalendar from '../components/MealCalendar';
import api from '../api';

const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DOW = ['일','월','화','수','목','금','토'];

function fmtDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

/* ── 진행 바 ── */
function GoalBar({ pct, color }) {
  return (
    <div style={{ height: 8, borderRadius: 999, background: T.line, overflow: 'hidden', marginTop: 10 }}>
      <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 999, transition: 'width .3s ease' }} />
    </div>
  );
}

/* ─────────────────────────────────────────
   체크인 캘린더 (BEHAVIORAL 운동 목표 전용 — 변경 금지)
───────────────────────────────────────── */
function CheckInCalendar({ goal, onClose }) {
  const today = new Date();
  const todayStr = fmtDate(today);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [checkedSet, setCheckedSet] = useState(new Set());
  const [loadingCal, setLoadingCal] = useState(true);
  const [toggling,   setToggling]   = useState(false);

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const isTodayChecked = checkedSet.has(todayStr);

  useEffect(() => {
    setLoadingCal(true);
    api.get(`/api/goals/${goal.dbId}/checkins?month=${monthStr}`)
      .then(res => setCheckedSet(new Set(res.data?.data || [])))
      .catch(() => setCheckedSet(new Set()))
      .finally(() => setLoadingCal(false));
  }, [goal.dbId, monthStr]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const toggleToday = async () => {
    if (toggling) return;
    const wasChecked = isTodayChecked;
    setToggling(true);
    setCheckedSet(prev => { const s = new Set(prev); wasChecked ? s.delete(todayStr) : s.add(todayStr); return s; });
    try {
      await api.post(`/api/goals/${goal.dbId}/checkin`);
    } catch {
      setCheckedSet(prev => { const s = new Set(prev); wasChecked ? s.add(todayStr) : s.delete(todayStr); return s; });
    } finally {
      setToggling(false);
    }
  };

  const firstDow   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={goal.icon} size={20} color={T.green} stroke={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: T.ink }}>{goal.title} 체크인</div>
          <div style={{ fontSize: '0.75rem', color: T.inkSoft, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{goal.detail}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 10, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="chevL" size={16} color={T.inkSoft} />
        </button>
        <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: T.ink }}>{viewYear}년 {MONTHS_KO[viewMonth]}</span>
        <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 10, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="chevR" size={16} color={T.inkSoft} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DOW.map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, padding: '3px 0', color: i === 0 ? '#E74C3C' : i === 6 ? T.blue : T.inkSoft }}>{d}</div>
        ))}
      </div>
      {loadingCal ? (
        <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkSoft, fontSize: '0.875rem' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ aspectRatio: '1' }} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isChecked = checkedSet.has(dateStr);
            const isSun = i % 7 === 0;
            const isSat = i % 7 === 6;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 0' }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: isChecked ? T.green : isToday ? T.greenSoft : 'transparent', border: isToday && !isChecked ? `2px solid ${T.green}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isChecked
                    ? <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 900 }}>✓</span>
                    : <span style={{ fontSize: '0.8125rem', fontWeight: isToday ? 900 : 500, color: isToday ? T.green : isSun ? '#E74C3C' : isSat ? T.blue : T.ink }}>{day}</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isCurrentMonth && (
        <button onClick={toggleToday} disabled={toggling} style={{ width: '100%', height: 52, borderRadius: 14, marginTop: 18, background: isTodayChecked ? T.greenSoft : 'linear-gradient(135deg, #00B894, #00A382)', color: isTodayChecked ? T.green : '#fff', fontSize: '0.9375rem', fontWeight: 800, border: isTodayChecked ? `1.5px solid ${T.green}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: toggling ? 0.7 : 1, boxShadow: isTodayChecked ? 'none' : '0 4px 14px rgba(0,184,148,0.28)', transition: 'all .2s ease' }}>
          {isTodayChecked ? <><span style={{ fontSize: '1rem' }}>✓</span> 오늘 실천 완료 (탭하면 취소)</> : '오늘 실천했어요'}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   목표 상세 칩 (운동/수치 목표에 공용으로 사용)
───────────────────────────────────────── */
const EXERCISE_EMOJI = { '걷기': '🚶', '조깅': '🏃', '자전거': '🚴', '수영': '🏊' };

function GoalChip({ children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999, background: T.blueSoft, color: T.blue, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────
   기본 목표 (API/AI 미응답 시 폴백)
───────────────────────────────────────── */
const DEFAULT_GOALS = [
  { id: 'glu',  icon: 'drop', title: '혈당 관리',   detail: '공복혈당 102 → 99 이하로', pct: 60, ai: true, goalType: 'NUMERIC'    },
  { id: 'ex',   icon: 'run',  title: '운동',         detail: '주 3회 이상 유산소 운동',   pct: 33, ai: true, goalType: 'BEHAVIORAL' },
  { id: 'food', icon: 'food', title: '식단 기록',    detail: '매 끼니 기록하기',           pct: 0,  ai: true, goalType: 'DIETARY'    },
];

/* ─────────────────────────────────────────
   메인 — 목표는 AI가 자동으로 추천하며, 사용자는 수정/삭제할 수 없다
───────────────────────────────────────── */
export default function HealthGoal({ onNav, toast }) {
  const [goals, setGoals]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [calendarGoal, setCalendarGoal] = useState(null); // BEHAVIORAL 운동 체크인
  const [mealGoal, setMealGoal]       = useState(null);   // DIETARY 식단 기록

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/goals');
      const data = res.data?.data;
      if (data && data.length > 0) {
        setGoals(data);
        return;
      }
      // 저장된 목표가 없으면(첫 방문) AI가 운동·식단 목표를 검진 수치 기반으로 새로 생성한다
      let goals = DEFAULT_GOALS;
      try {
        const [exRes, dietRes] = await Promise.all([
          api.post('/api/ai/goals/exercise').catch(() => null),
          api.post('/api/ai/goals/dietary').catch(() => null),
        ]);
        const exRec = exRes?.data?.data;
        const dietRec = dietRes?.data?.data;
        goals = goals.map(g => {
          if (g.goalType === 'BEHAVIORAL' && exRec) {
            return { ...g, title: exRec.title || g.title, detail: exRec.detail || g.detail,
              exerciseType: exRec.exerciseType, frequencyPerWeek: exRec.frequencyPerWeek,
              durationMinutes: exRec.durationMinutes, intensity: exRec.intensity };
          }
          if (g.goalType === 'DIETARY' && dietRec) {
            return { ...g, title: dietRec.title || g.title, detail: dietRec.detail || g.detail };
          }
          return g;
        });
      } catch { /* AI 추천 실패 시 기본 목표로 진행 */ }
      setGoals(goals);
    } catch {
      setGoals(DEFAULT_GOALS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/api/goals', { goals });
      toast && toast('건강 목표가 저장되었어요', 'check');
      onNav('my');
    } catch {
      toast && toast('저장에 실패했어요', 'cross');
    } finally {
      setSaving(false);
    }
  };

  // 운동 체크인 캘린더 닫기 — 진행률 갱신
  const handleCalendarClose = () => { setCalendarGoal(null); loadGoals(); };
  // 식단 캘린더 닫기 — 진행률 갱신
  const handleMealClose = () => { setMealGoal(null); loadGoals(); };

  return (
    <div data-screen-label="건강 목표" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title="건강 목표 설정" onBack={() => onNav('my')} />

      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ display: 'flex', gap: 10, padding: '13px 15px', borderRadius: 14, background: 'linear-gradient(135deg,#00B894,#00A382)' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="spark" size={18} color="rgba(255,255,255,0.9)" stroke={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.7812rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>AI 추천 목표</div>
            <p style={{ margin: 0, fontSize: '0.7812rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>검진 수치를 분석해 맞춤 목표를 추천했어요. 목표는 AI가 자동으로 관리해요.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px 20px', textAlign: 'center', color: T.inkSoft, fontSize: '0.875rem' }}>AI가 목표를 준비하고 있어요...</div>
      ) : (
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {goals.map(g => {
            const done       = g.pct >= 100;
            const isDietary  = g.goalType === 'DIETARY';
            const isBehavioral = g.goalType === 'BEHAVIORAL';
            const isNumeric  = g.goalType === 'NUMERIC';
            const accentColor  = isDietary ? '#E67E22' : done ? T.green : T.blue;
            const accentSoft   = isDietary ? '#FFF3E0' : done ? T.greenSoft : T.blueSoft;
            const hasCalendar  = isBehavioral && g.dbId;
            const hasMealCal   = isDietary && g.dbId;

            return (
              <Card key={g.id} pad={16}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={g.icon} size={20} color={accentColor} stroke={2.1} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.9062rem', fontWeight: 800, color: T.ink }}>{g.title}</span>
                      {g.ai && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: T.blue, background: T.blueSoft, padding: '2px 6px', borderRadius: 999 }}>AI</span>}
                      {done && <span style={{ fontSize: '0.9375rem' }}>✅</span>}
                      {/* 우측 버튼 그룹 — 체크인/기록 진입만 있고 수정·삭제는 없음 */}
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {/* 운동 체크인 캘린더 버튼 */}
                        {hasCalendar && (
                          <button onClick={e => { e.stopPropagation(); setCalendarGoal(g); }}
                            style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name="cal" size={15} color={T.green} stroke={2} />
                          </button>
                        )}
                        {/* 식단 기록 캘린더 버튼 */}
                        {hasMealCal && (
                          <button onClick={e => { e.stopPropagation(); setMealGoal(g); }}
                            style={{ width: 30, height: 30, borderRadius: 8, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name="food" size={15} color="#E67E22" stroke={2} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* detail — 운동 칩이 있을 때는 숨김 */}
                    {!(isBehavioral && g.exerciseType) && (
                      <div style={{ fontSize: '0.7812rem', color: T.inkMid, marginTop: 3, lineHeight: 1.5 }}>{g.detail}</div>
                    )}
                  </div>
                </div>

                {/* 운동 칩 (exerciseType 있는 BEHAVIORAL — DIETARY 카드에는 표시 안 됨) */}
                {isBehavioral && !isDietary && g.exerciseType && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <GoalChip>{EXERCISE_EMOJI[g.exerciseType] || '🏃'} {g.exerciseType}</GoalChip>
                    {g.frequencyPerWeek && <GoalChip>주 {g.frequencyPerWeek}회</GoalChip>}
                    {g.durationMinutes  && <GoalChip>{g.durationMinutes}분</GoalChip>}
                    {g.intensity        && <GoalChip>{g.intensity}</GoalChip>}
                  </div>
                )}

                {/* 수치 목표 칩 (현재 → 목표) */}
                {isNumeric && (g.startValue != null || g.targetValue != null) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {g.startValue != null && <GoalChip>현재 {g.startValue}</GoalChip>}
                    {g.targetValue != null && <GoalChip>목표 {g.targetValue}</GoalChip>}
                  </div>
                )}

                <GoalBar pct={g.pct} color={accentColor} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                  <span style={{ fontSize: '0.7188rem', fontWeight: 700, color: done ? T.green : T.inkSoft }}>{done ? '목표 달성!' : '진행 중'}</span>
                  <span style={{ fontSize: '0.7188rem', fontWeight: 800, color: accentColor }}>{g.pct}%</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div style={{ padding: '20px 20px 28px' }}>
        <Button variant="primary" disabled={saving} onClick={handleSave}>
          {saving ? '저장 중...' : '저장하기'}
        </Button>
      </div>

      {/* 운동 체크인 캘린더 BottomSheet */}
      <BottomSheet open={!!calendarGoal} onClose={handleCalendarClose}>
        {calendarGoal && <CheckInCalendar goal={calendarGoal} onClose={handleCalendarClose} />}
      </BottomSheet>

      {/* 식단 기록 캘린더 BottomSheet */}
      <BottomSheet open={!!mealGoal} onClose={handleMealClose}>
        {mealGoal && <MealCalendar onClose={handleMealClose} />}
      </BottomSheet>
    </div>
  );
}

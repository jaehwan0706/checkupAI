import React, { useState, useEffect, useCallback } from 'react';
import { T, Icon, Card, Button, SubHeader, Modal, ConfirmModal, BottomSheet } from '../components/UI';
import api from '../api';

function GoalBar({ pct, color }) {
  return (
    <div style={{ height: 8, borderRadius: 999, background: T.line, overflow: 'hidden', marginTop: 10 }}>
      <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 999, transition: 'width .3s ease' }} />
    </div>
  );
}

function AddGoalModal({ open, onAdd, onClose }) {
  const [v, setV] = useState('');
  const submit = () => { if (v.trim()) { onAdd(v.trim()); setV(''); onClose(); } };
  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ margin: '0 0 14px', fontSize: '1.0625rem', fontWeight: 800, color: T.ink }}>직접 목표 추가</h3>
      <div style={{ display: 'flex', alignItems: 'center', height: 50, padding: '0 14px', borderRadius: 13, background: '#fff', border: '1.5px solid ' + T.line, marginBottom: 18 }}>
        <input value={v} placeholder="예: 하루 물 8잔 마시기"
          onChange={e => setV(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9375rem', fontWeight: 500, color: T.ink, fontFamily: 'inherit' }} />
      </div>
      <Button variant="primary" onClick={submit}>목표 추가</Button>
    </Modal>
  );
}

function EditGoalModal({ goal, onSave, onClose }) {
  const [title, setTitle]   = useState(goal.title);
  const [detail, setDetail] = useState(goal.detail);

  const submit = () => {
    if (!title.trim()) return;
    onSave({ ...goal, title: title.trim(), detail: detail.trim() || goal.detail });
  };

  return (
    <Modal open={true} onClose={onClose}>
      <h3 style={{ margin: '0 0 18px', fontSize: '1.0625rem', fontWeight: 800, color: T.ink }}>목표 수정</h3>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>목표 이름</div>
        <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 14px', borderRadius: 13, background: T.bg, border: '1.5px solid ' + T.line }}>
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9375rem', fontWeight: 500, color: T.ink, fontFamily: 'inherit' }} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>세부 내용</div>
        <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 14px', borderRadius: 13, background: T.bg, border: '1.5px solid ' + T.line }}>
          <input value={detail} onChange={e => setDetail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9375rem', fontWeight: 500, color: T.ink, fontFamily: 'inherit' }} />
        </div>
      </div>

      <Button variant="primary" onClick={submit}>수정 완료</Button>
    </Modal>
  );
}

/* ─────────────────────────────────────────
   체크인 캘린더 (행동형 목표 전용)
───────────────────────────────────────── */
const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DOW = ['일','월','화','수','목','금','토'];

function CheckInCalendar({ goal, onClose }) {
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

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
    // 낙관적 업데이트
    setCheckedSet(prev => {
      const s = new Set(prev);
      wasChecked ? s.delete(todayStr) : s.add(todayStr);
      return s;
    });
    try {
      await api.post(`/api/goals/${goal.dbId}/checkin`);
    } catch {
      // 실패 시 롤백
      setCheckedSet(prev => {
        const s = new Set(prev);
        wasChecked ? s.add(todayStr) : s.delete(todayStr);
        return s;
      });
    } finally {
      setToggling(false);
    }
  };

  // 캘린더 셀 구성 (첫 번째 요일 앞에 빈 칸 채우기)
  const firstDow   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* 목표 제목 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={goal.icon} size={20} color={T.green} stroke={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: T.ink }}>{goal.title} 체크인</div>
          <div style={{ fontSize: '0.75rem', color: T.inkSoft, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{goal.detail}</div>
        </div>
      </div>

      {/* 월 이동 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 10, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="chevL" size={16} color={T.inkSoft} />
        </button>
        <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: T.ink }}>{viewYear}년 {MONTHS_KO[viewMonth]}</span>
        <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 10, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="chevR" size={16} color={T.inkSoft} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DOW.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, padding: '3px 0',
            color: i === 0 ? '#E74C3C' : i === 6 ? T.blue : T.inkSoft,
          }}>{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      {loadingCal ? (
        <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkSoft, fontSize: '0.875rem' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ aspectRatio: '1' }} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday   = dateStr === todayStr;
            const isChecked = checkedSet.has(dateStr);
            const isSun = i % 7 === 0;
            const isSat = i % 7 === 6;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 0' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 999,
                  background: isChecked ? T.green : isToday ? T.greenSoft : 'transparent',
                  border: isToday && !isChecked ? `2px solid ${T.green}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isChecked ? (
                    <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 900 }}>✓</span>
                  ) : (
                    <span style={{
                      fontSize: '0.8125rem',
                      fontWeight: isToday ? 900 : 500,
                      color: isToday ? T.green : isSun ? '#E74C3C' : isSat ? T.blue : T.ink,
                    }}>{day}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 오늘 체크인 버튼 — 이번 달에만 표시 */}
      {isCurrentMonth && (
        <button
          onClick={toggleToday}
          disabled={toggling}
          style={{
            width: '100%', height: 52, borderRadius: 14, marginTop: 18,
            background: isTodayChecked ? T.greenSoft : 'linear-gradient(135deg, #00B894, #00A382)',
            color: isTodayChecked ? T.green : '#fff',
            fontSize: '0.9375rem', fontWeight: 800,
            border: isTodayChecked ? `1.5px solid ${T.green}` : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: toggling ? 0.7 : 1,
            boxShadow: isTodayChecked ? 'none' : '0 4px 14px rgba(0,184,148,0.28)',
            transition: 'all .2s ease',
          }}
        >
          {isTodayChecked
            ? <><span style={{ fontSize: '1rem' }}>✓</span> 오늘 실천 완료 (탭하면 취소)</>
            : '오늘 실천했어요'}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   기본 목표 (API 미응답 시 폴백)
───────────────────────────────────────── */
const DEFAULT_GOALS = [
  { id: 'glu',  icon: 'drop',  title: '혈당 관리', detail: '공복혈당 102 → 99 이하로', pct: 60,  ai: true, goalType: 'NUMERIC'    },
  { id: 'ex',   icon: 'run',   title: '운동',       detail: '주 3회 이상 유산소 운동',   pct: 33,  ai: true, goalType: 'BEHAVIORAL' },
  { id: 'food', icon: 'food',  title: '식습관',     detail: '정제탄수화물 줄이기',       pct: 100, ai: true, goalType: 'BEHAVIORAL' },
];

/* ─────────────────────────────────────────
   메인
───────────────────────────────────────── */
export default function HealthGoal({ onNav, toast }) {
  const [goals, setGoals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editGoal, setEditGoal]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [calendarGoal, setCalendarGoal] = useState(null);

  const loadGoals = useCallback(() => {
    api.get('/api/goals')
      .then(res => {
        const data = res.data?.data;
        setGoals(data && data.length > 0 ? data : DEFAULT_GOALS);
      })
      .catch(() => setGoals(DEFAULT_GOALS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const addGoal = title =>
    setGoals(g => [...g, { id: 'c' + Date.now(), icon: 'star', title, detail: '직접 추가한 목표', pct: 0, ai: false, goalType: 'BEHAVIORAL' }]);

  const handleEditSave = updated => {
    setGoals(g => g.map(goal => goal.id === updated.id ? updated : goal));
    setEditGoal(null);
  };

  const handleDelete = id => {
    setGoals(g => g.filter(goal => goal.id !== id));
    setDeleteTarget(null);
  };

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

  const toggleMenu = id => {
    setActiveMenu(prev => prev === id ? null : id);
    setDeleteTarget(null);
  };

  // 캘린더 닫을 때 진행률 갱신
  const handleCalendarClose = () => {
    setCalendarGoal(null);
    loadGoals();
  };

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
            <p style={{ margin: 0, fontSize: '0.7812rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>검진 수치를 분석해 맞춤 목표를 추천했어요.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px 20px', textAlign: 'center', color: T.inkSoft, fontSize: '0.875rem' }}>불러오는 중...</div>
      ) : (
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {goals.map(g => {
            const done      = g.pct >= 100;
            const color     = done ? T.green : T.blue;
            const menuOpen  = activeMenu === g.id;
            const deleteOpen = deleteTarget === g.id;
            const isBehavioral = g.goalType === 'BEHAVIORAL' && g.dbId;

            return (
              <Card key={g.id} pad={16}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: done ? T.greenSoft : T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={g.icon} size={20} color={done ? T.green : T.blue} stroke={2.1} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.9062rem', fontWeight: 800, color: T.ink }}>{g.title}</span>
                      {g.ai && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: T.blue, background: T.blueSoft, padding: '2px 6px', borderRadius: 999 }}>AI</span>}
                      {done && <span style={{ fontSize: '0.9375rem' }}>✅</span>}
                      {/* 우측 버튼 그룹 */}
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {/* 캘린더 버튼 — 행동형 + dbId 있는 카드만 */}
                        {isBehavioral && (
                          <button
                            onClick={e => { e.stopPropagation(); setCalendarGoal(g); setActiveMenu(null); }}
                            style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <Icon name="cal" size={15} color={T.green} stroke={2} />
                          </button>
                        )}
                        {/* 더보기 버튼 */}
                        <button
                          onClick={e => { e.stopPropagation(); toggleMenu(g.id); }}
                          style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: menuOpen ? T.bg : 'transparent', flexShrink: 0 }}
                        >
                          <Icon name="more" size={18} color={T.inkSoft} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7812rem', color: T.inkMid, marginTop: 3, lineHeight: 1.5 }}>{g.detail}</div>
                  </div>
                </div>

                <GoalBar pct={g.pct} color={color} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                  <span style={{ fontSize: '0.7188rem', fontWeight: 700, color: done ? T.green : T.inkSoft }}>{done ? '목표 달성!' : '진행 중'}</span>
                  <span style={{ fontSize: '0.7188rem', fontWeight: 800, color }}>{g.pct}%</span>
                </div>

                {/* 액션 메뉴 */}
                {menuOpen && !deleteOpen && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + T.line }}>
                    <button
                      onClick={() => { setEditGoal(g); setActiveMenu(null); }}
                      style={{ flex: 1, height: 38, borderRadius: 10, background: T.blueSoft, color: T.blue, fontSize: '0.8438rem', fontWeight: 700 }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(g.id); setActiveMenu(null); }}
                      style={{ flex: 1, height: 38, borderRadius: 10, background: T.dangerSoft, color: T.danger, fontSize: '0.8438rem', fontWeight: 700 }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </Card>
            );
          })}

          <button onClick={() => setAddOpen(true)} style={{ height: 52, borderRadius: 14, border: '1.5px dashed #C6D3E6', color: T.blue, fontSize: '0.9062rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff' }}>
            <Icon name="plus" size={18} color={T.blue} stroke={2.4} /> 직접 목표 추가
          </button>
        </div>
      )}

      <div style={{ padding: '20px 20px 28px' }}>
        <Button variant="primary" disabled={saving} onClick={handleSave}>
          {saving ? '저장 중...' : '저장하기'}
        </Button>
      </div>

      <AddGoalModal open={addOpen} onAdd={addGoal} onClose={() => setAddOpen(false)} />
      {editGoal && <EditGoalModal goal={editGoal} onSave={handleEditSave} onClose={() => setEditGoal(null)} />}
      <ConfirmModal
        open={deleteTarget !== null}
        title="목표 삭제"
        body="이 건강 목표를 삭제할까요?"
        confirmLabel="삭제"
        danger
        onConfirm={() => handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* 체크인 캘린더 BottomSheet */}
      <BottomSheet open={!!calendarGoal} onClose={handleCalendarClose}>
        {calendarGoal && <CheckInCalendar goal={calendarGoal} onClose={handleCalendarClose} />}
      </BottomSheet>
    </div>
  );
}

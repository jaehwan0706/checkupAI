import React, { useState, useEffect, useCallback } from 'react';
import { T, Icon } from './UI';
import api from '../api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DOW = ['일','월','화','수','목','금','토'];

function fmtDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

const MEAL_TYPES = [
  { key: 'BREAKFAST', label: '아침', emoji: '🌅' },
  { key: 'LUNCH',     label: '점심', emoji: '☀️' },
  { key: 'DINNER',    label: '저녁', emoji: '🌙' },
];

export default function MealCalendar({ onClose }) {
  const today = new Date();
  const todayStr = fmtDate(today);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [loggedDates, setLoggedDates] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [meals, setMeals] = useState([]);
  const [loadingCal, setLoadingCal] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [inputs, setInputs] = useState({ BREAKFAST: '', LUNCH: '', DINNER: '' });
  const [savingType, setSavingType] = useState(null);

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  // 월별 기록 날짜 로드
  useEffect(() => {
    setLoadingCal(true);
    api.get(`/api/meals?month=${monthStr}`)
      .then(res => {
        const data = res.data?.data || [];
        setLoggedDates(new Set(data.map(m => m.logDate)));
      })
      .catch(() => setLoggedDates(new Set()))
      .finally(() => setLoadingCal(false));
  }, [monthStr]);

  // 선택 날짜 끼니 로드
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingMeals(true);
    api.get(`/api/meals?date=${selectedDate}`)
      .then(res => setMeals(res.data?.data || []))
      .catch(() => setMeals([]))
      .finally(() => setLoadingMeals(false));
  }, [selectedDate]);

  const refreshAll = useCallback(async () => {
    const [monthRes, dateRes] = await Promise.all([
      api.get(`/api/meals?month=${monthStr}`).catch(() => ({ data: { data: [] } })),
      api.get(`/api/meals?date=${selectedDate}`).catch(() => ({ data: { data: [] } })),
    ]);
    setLoggedDates(new Set((monthRes.data?.data || []).map(m => m.logDate)));
    setMeals(dateRes.data?.data || []);
  }, [monthStr, selectedDate]);

  const saveTextMeal = async (mealType) => {
    const content = inputs[mealType].trim();
    if (!content || savingType) return;
    setSavingType(mealType);
    try {
      await api.post('/api/meals', null, { params: { date: selectedDate, mealType, content } });
      setInputs(i => ({ ...i, [mealType]: '' }));
      await refreshAll();
    } catch { /* 실패 시 무시 */ }
    finally { setSavingType(null); }
  };

  const saveImageMeal = async (mealType, file) => {
    if (!file || savingType) return;
    setSavingType(mealType);
    const form = new FormData();
    form.append('file', file);
    form.append('date', selectedDate);
    form.append('mealType', mealType);
    try {
      await api.post('/api/meals/image', form, { headers: { 'Content-Type': undefined } });
      await refreshAll();
    } catch { /* 실패 시 무시 */ }
    finally { setSavingType(null); }
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

  const formatDateKo = (d) => { if (!d) return ''; const [, m, day] = d.split('-'); return `${m}월 ${parseInt(day, 10)}일`; };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="food" size={20} color="#E67E22" stroke={2.1} />
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: T.ink }}>식단 기록</div>
          <div style={{ fontSize: '0.75rem', color: T.inkSoft, marginTop: 1 }}>날짜를 선택하고 끼니를 기록하세요</div>
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
          <div key={d} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, padding: '3px 0', color: i === 0 ? '#E74C3C' : i === 6 ? T.blue : T.inkSoft }}>{d}</div>
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
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasLog     = loggedDates.has(dateStr);
            const isSun = i % 7 === 0;
            const isSat = i % 7 === 6;
            return (
              <div key={i} onClick={() => setSelectedDate(dateStr)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 0', cursor: 'pointer' }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: isSelected ? '#E67E22' : isToday ? '#FFF3E0' : 'transparent', border: isToday && !isSelected ? '2px solid #E67E22' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: isToday || isSelected ? 900 : 500, color: isSelected ? '#fff' : isToday ? '#E67E22' : isSun ? '#E74C3C' : isSat ? T.blue : T.ink }}>{day}</span>
                </div>
                {hasLog && <div style={{ width: 4, height: 4, borderRadius: 999, background: '#E67E22', marginTop: 1 }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* 선택된 날짜 끼니 */}
      <div style={{ height: 1, background: T.line, margin: '14px 0' }} />
      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: T.ink, marginBottom: 12 }}>
        {formatDateKo(selectedDate)} 식단
      </div>

      {loadingMeals ? (
        <div style={{ textAlign: 'center', color: T.inkSoft, fontSize: '0.875rem', padding: '10px 0' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MEAL_TYPES.map(({ key, label, emoji }) => {
            const meal = meals.find(m => m.mealType === key);
            const isSaving = savingType === key;

            return (
              <div key={key} style={{ padding: '12px 14px', borderRadius: 13, background: meal ? '#FFFDF7' : T.bg, border: `1.5px solid ${meal ? '#FFD580' : T.line}` }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: T.ink, marginBottom: 8 }}>
                  {emoji} {label}
                  {meal && <span style={{ marginLeft: 8, fontSize: '0.6875rem', fontWeight: 700, color: '#E67E22', background: '#FFF3E0', padding: '2px 7px', borderRadius: 999 }}>기록됨</span>}
                </div>

                {meal ? (
                  /* 기록된 끼니 */
                  <div>
                    {meal.imageUrl && (
                      <img src={`${API_BASE}${meal.imageUrl}`} alt="식단 사진"
                        style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                    )}
                    {meal.content && (
                      <div style={{ fontSize: '0.875rem', color: T.ink, lineHeight: 1.5 }}>{meal.content}</div>
                    )}
                    {meal.aiAnalysis && (
                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#C0720A', background: '#FFF3E0', padding: '7px 10px', borderRadius: 8, lineHeight: 1.5 }}>
                        💡 {meal.aiAnalysis}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 빈 슬롯 — 입력 UI */
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input
                        value={inputs[key]}
                        onChange={e => setInputs(i => ({ ...i, [key]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && saveTextMeal(key)}
                        placeholder="먹은 음식을 입력하세요"
                        style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid ' + T.line, background: '#fff', fontSize: '0.875rem', color: T.ink, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <button
                        onClick={() => saveTextMeal(key)}
                        disabled={!inputs[key].trim() || !!savingType}
                        style={{ height: 40, padding: '0 14px', borderRadius: 10, background: inputs[key].trim() && !savingType ? '#E67E22' : T.line, color: inputs[key].trim() && !savingType ? '#fff' : T.inkSoft, fontSize: '0.8125rem', fontWeight: 700, transition: 'all .15s ease', flexShrink: 0 }}
                      >
                        {isSaving ? '...' : '저장'}
                      </button>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 36, borderRadius: 10, background: '#fff', border: '1.5px dashed ' + T.line, color: T.inkMid, fontSize: '0.8125rem', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1 }}>
                      📷 사진으로 기록하기
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        disabled={!!savingType}
                        onChange={e => { if (e.target.files[0]) saveImageMeal(key, e.target.files[0]); e.target.value = ''; }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

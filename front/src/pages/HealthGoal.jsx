import React, { useState, useEffect } from 'react';
import { T, Icon, Card, Button, SubHeader, Modal, ConfirmModal } from '../components/UI';
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

const DEFAULT_GOALS = [
  { id: 'glu',  icon: 'drop',  title: '혈당 관리', detail: '공복혈당 102 → 99 이하로', pct: 60, ai: true  },
  { id: 'ex',   icon: 'run',   title: '운동',       detail: '주 3회 이상 유산소 운동',   pct: 33, ai: true  },
  { id: 'food', icon: 'food',  title: '식습관',     detail: '정제탄수화물 줄이기',       pct: 100, ai: true },
];

export default function HealthGoal({ onNav, toast }) {
  const [goals, setGoals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editGoal, setEditGoal]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/api/goals')
      .then(res => {
        const data = res.data?.data;
        setGoals(data && data.length > 0 ? data : DEFAULT_GOALS);
      })
      .catch(() => setGoals(DEFAULT_GOALS))
      .finally(() => setLoading(false));
  }, []);

  const addGoal = title =>
    setGoals(g => [...g, { id: 'c' + Date.now(), icon: 'star', title, detail: '직접 추가한 목표', pct: 0, ai: false }]);

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
            const done  = g.pct >= 100;
            const color = done ? T.green : T.blue;
            const menuOpen   = activeMenu === g.id;
            const deleteOpen = deleteTarget === g.id;

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
                      {/* 더보기 버튼 */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleMenu(g.id); }}
                        style={{ marginLeft: 'auto', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: menuOpen ? T.bg : 'transparent', flexShrink: 0 }}
                      >
                        <Icon name="more" size={18} color={T.inkSoft} />
                      </button>
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
    </div>
  );
}

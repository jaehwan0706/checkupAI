import React, { useState, useEffect } from 'react';
import { T, Icon, Badge, Card, SubHeader } from '../components/UI';
import api from '../api';

const STATUS_MAP = { NORMAL: '정상', WARNING: '주의', DANGER: '위험' };

function scoreColor(score) {
  if (score >= 80) return T.green;
  if (score >= 60) return T.warn;
  return T.danger;
}

function statusFromScore(score) {
  if (score == null) return 'WARNING';
  if (score >= 80) return 'NORMAL';
  if (score >= 60) return 'WARNING';
  return 'DANGER';
}

export default function History({ onNav }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/checkup/history')
      .then(res => setRecords(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = d => {
    const dt = new Date(d);
    return `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}`;
  };

  return (
    <div data-screen-label="검진 기록" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg, position: 'relative' }}>
      <SubHeader title="내 검진 기록" onBack={() => onNav('my')} />
      <div style={{ padding: '12px 20px 28px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13.5, color: T.inkSoft }}>불러오는 중...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13.5, color: T.inkSoft }}>저장된 검진 기록이 없어요</div>
        ) : records.map((r, i) => {
          const score = r.healthScore;
          const st = STATUS_MAP[statusFromScore(score)];
          const isLatest = i === 0;
          return (
            <Card key={r.id || i}
              onClick={() => {
                if (isLatest) {
                  if (r.id) localStorage.setItem('lastCheckupId', String(r.id));
                  onNav('report');
                }
              }}
              pad={15}
              style={{ cursor: isLatest ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: T.blueSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: scoreColor(score || 0), lineHeight: 1 }}>{score ?? '—'}</span>
                <span style={{ fontSize: 9, color: T.blue, fontWeight: 600, marginTop: 1 }}>점</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmt(r.checkupDate)}</span>
                  {isLatest && <span style={{ fontSize: 10, fontWeight: 800, color: T.green, background: T.greenSoft, padding: '2px 7px', borderRadius: 999 }}>최신</span>}
                </div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>{r.institution || '직접 입력'}</div>
              </div>
              <Badge status={st} small />
              {isLatest && <Icon name="chevR" size={17} color="#C6D3E6" />}
            </Card>
          );
        })}
      </div>

      {/* FAB */}
      <button onClick={() => onNav('input')} style={{ position: 'absolute', right: 18, bottom: 22, width: 58, height: 58, borderRadius: 19, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px rgba(76,175,130,0.46)', zIndex: 5 }}>
        <Icon name="plus" size={28} color="#fff" stroke={2.6} />
      </button>
    </div>
  );
}

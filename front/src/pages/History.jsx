import React, { useState, useEffect, useMemo } from 'react';
import { T, Icon, Badge, Card } from '../components/UI';
import api from '../api';

const CATEGORIES = ['전체', '건강검진', '약국봉투', '병원진료', '혈압·혈당'];

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

const fmtDate = d => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}`;
};

// Dummy records for upload-based categories
const DUMMY_PHARMACY = [
  { id: 'p1', date: '2025-11-03', name: '아모잘탄정 외 2종', pharmacy: '한마음약국' },
  { id: 'p2', date: '2025-09-14', name: '리피토정 30정', pharmacy: '건강약국' },
];
const DUMMY_HOSPITAL = [
  { id: 'h1', date: '2025-12-10', name: '내과 진료', hospital: '서울내과의원' },
  { id: 'h2', date: '2025-08-22', name: '심장내과 진료', hospital: '세브란스병원' },
];

function bpColor(sys) {
  if (sys == null) return T.inkMid;
  if (sys < 120) return T.green;
  if (sys < 140) return T.warn;
  return T.danger;
}
function bsColor(bs) {
  if (bs == null) return T.inkMid;
  if (bs < 100) return T.green;
  if (bs < 126) return T.warn;
  return T.danger;
}

function CheckupCard({ r, isLatest, onNav }) {
  const score = r.healthScore;
  const st = STATUS_MAP[statusFromScore(score)];
  return (
    <Card
      onClick={isLatest ? () => { if (r.id) localStorage.setItem('lastCheckupId', String(r.id)); onNav('report'); } : undefined}
      pad={15}
      style={{ cursor: isLatest ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 13 }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 13, background: T.blueSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: scoreColor(score || 0), lineHeight: 1 }}>{score ?? '—'}</span>
        <span style={{ fontSize: 9, color: T.blue, fontWeight: 600, marginTop: 1 }}>점</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmtDate(r.checkupDate)}</span>
          {isLatest && <span style={{ fontSize: 10, fontWeight: 800, color: T.green, background: T.greenSoft, padding: '2px 7px', borderRadius: 999 }}>최신</span>}
        </div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>{r.institution || '직접 입력'}</div>
      </div>
      <Badge status={st} small />
      {isLatest && <Icon name="chevR" size={17} color="#C6D3E6" />}
    </Card>
  );
}

function VitalCard({ r }) {
  const hasBP = r.systolic != null;
  const hasBS = r.bloodSugar != null;
  return (
    <Card pad={15} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="drop" size={22} color="#F57C00" stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmtDate(r.recordedDate)}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          {hasBP && (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: bpColor(r.systolic) }}>
              혈압 {r.systolic}/{r.diastolic ?? r.diastolicBp ?? '—'} mmHg
            </span>
          )}
          {hasBS && (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: bsColor(r.bloodSugar) }}>
              혈당 {r.bloodSugar} mg/dL
            </span>
          )}
          {!hasBP && !hasBS && <span style={{ fontSize: 12.5, color: T.inkSoft }}>혈압·혈당 기록</span>}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#E65100', background: '#FFF3E0', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>혈압·혈당</span>
    </Card>
  );
}

function PharmacyCard({ r }) {
  return (
    <Card pad={15} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="flask" size={22} color="#9C27B0" stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmtDate(r.date)}</div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>{r.name} · {r.pharmacy}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#7B1FA2', background: '#F3E5F5', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>약국봉투</span>
    </Card>
  );
}

function HospitalCard({ r }) {
  return (
    <Card pad={15} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="doc" size={22} color={T.blue} stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmtDate(r.date)}</div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>{r.name} · {r.hospital}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: T.blueSoft, padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>병원진료</span>
    </Card>
  );
}

function EmptyState({ cat, onNav }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 60, height: 60, borderRadius: 20, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="doc" size={28} color={T.blue} stroke={1.8} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{cat} 기록이 없어요</div>
      <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6 }}>
        {(cat === '건강검진' || cat === '전체')
          ? '검진 결과를 입력하거나 PDF를 업로드해보세요'
          : '해당 카테고리의 기록을 추가해보세요'}
      </div>
      {(cat === '건강검진' || cat === '전체') && (
        <button
          onClick={() => onNav('input')}
          style={{ marginTop: 4, padding: '10px 22px', borderRadius: 12, background: T.blue, color: '#fff', fontSize: 14, fontWeight: 700 }}
        >
          기록 추가하기
        </button>
      )}
    </div>
  );
}

export default function History({ onNav }) {
  const [cat, setCat] = useState('전체');
  const [checkups, setCheckups] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/checkup/history').then(r => r.data.data || []).catch(() => []),
      api.get('/api/vitals').then(r => r.data.data || []).catch(() => []),
    ]).then(([c, v]) => {
      setCheckups(c);
      setVitals(v);
    }).finally(() => setLoading(false));
  }, []);

  const latestCheckupId = checkups.length > 0 ? checkups[0].id : null;

  const allRecords = useMemo(() => [
    ...checkups.map(r => ({ ...r, _type: 'checkup', _date: r.checkupDate })),
    ...vitals.map(r => ({ ...r, _type: 'vital', _date: r.recordedDate })),
    ...DUMMY_PHARMACY.map(r => ({ ...r, _type: 'pharmacy', _date: r.date })),
    ...DUMMY_HOSPITAL.map(r => ({ ...r, _type: 'hospital', _date: r.date })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date)), [checkups, vitals]);

  const records = useMemo(() => {
    switch (cat) {
      case '건강검진': return checkups.map(r => ({ ...r, _type: 'checkup' }));
      case '혈압·혈당': return vitals.map(r => ({ ...r, _type: 'vital' }));
      case '약국봉투':  return DUMMY_PHARMACY.map(r => ({ ...r, _type: 'pharmacy' }));
      case '병원진료':  return DUMMY_HOSPITAL.map(r => ({ ...r, _type: 'hospital' }));
      default: return allRecords;
    }
  }, [cat, checkups, vitals, allRecords]);

  return (
    <div data-screen-label="기록" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg, position: 'relative' }}>

      {/* 페이지 헤더 */}
      <div style={{ padding: '56px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>기록</h1>
        <button
          onClick={() => onNav('my')}
          style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.blueSoft, borderRadius: 12 }}
        >
          <Icon name="user" size={20} color={T.blue} stroke={2} />
        </button>
      </div>

      {/* 카테고리 필터 (가로 스크롤) */}
      <div className="nd-no-scrollbar" style={{ overflowX: 'auto', padding: '6px 20px 14px', display: 'flex', gap: 8 }}>
        {CATEGORIES.map(c => {
          const active = cat === c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 999,
                fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em',
                background: active ? T.blue : '#fff',
                color: active ? '#fff' : T.inkMid,
                border: `1.5px solid ${active ? T.blue : T.line}`,
                transition: 'all .15s ease',
              }}
            >{c}</button>
          );
        })}
      </div>

      {/* 건수 */}
      {!loading && records.length > 0 && (
        <div style={{ padding: '0 20px 8px', fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>
          총 {records.length}건
        </div>
      )}

      {/* 목록 */}
      <div style={{ padding: '0 20px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13.5, color: T.inkSoft }}>불러오는 중...</div>
        ) : records.length === 0 ? (
          <EmptyState cat={cat} onNav={onNav} />
        ) : (
          records.map((r, i) => {
            if (r._type === 'checkup')  return <CheckupCard  key={r.id ?? `c${i}`} r={r} isLatest={r.id === latestCheckupId} onNav={onNav} />;
            if (r._type === 'vital')    return <VitalCard    key={r.id ?? `v${i}`} r={r} />;
            if (r._type === 'pharmacy') return <PharmacyCard key={r.id} r={r} />;
            if (r._type === 'hospital') return <HospitalCard key={r.id} r={r} />;
            return null;
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => onNav('input')}
        style={{ position: 'absolute', right: 18, bottom: 22, width: 58, height: 58, borderRadius: 19, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px rgba(76,175,130,0.46)', zIndex: 5 }}
      >
        <Icon name="plus" size={28} color="#fff" stroke={2.6} />
      </button>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { T, Icon, Badge, Card, BottomSheet, Spinner } from '../components/UI';
import api from '../api';

const CATEGORIES = ['전체', '건강검진', '약국봉투', '병원진료', '혈압·혈당'];
const STATUS_MAP  = { NORMAL: '정상', WARNING: '주의', DANGER: '위험' };

/* ── helpers ── */
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

/* ── 건강검진 수치 정의 ── */
const CHECKUP_METRICS = [
  { key: 'systolicBp',        label: '수축기 혈압',    unit: 'mmHg',  kind: 'low',   t1: 120, t2: 140 },
  { key: 'diastolicBp',       label: '이완기 혈압',    unit: 'mmHg',  kind: 'low',   t1: 80,  t2: 90  },
  { key: 'fastingBloodSugar', label: '공복혈당',        unit: 'mg/dL', kind: 'low',   t1: 100, t2: 126 },
  { key: 'totalCholesterol',  label: '총 콜레스테롤',  unit: 'mg/dL', kind: 'low',   t1: 200, t2: 240 },
  { key: 'ldlCholesterol',    label: 'LDL 콜레스테롤', unit: 'mg/dL', kind: 'low',   t1: 130, t2: 160 },
  { key: 'hdlCholesterol',    label: 'HDL 콜레스테롤', unit: 'mg/dL', kind: 'high',  t1: 40,  t2: 60  },
  { key: 'ast',               label: 'AST',             unit: 'U/L',   kind: 'low',   t1: 41,  t2: 51  },
  { key: 'alt',               label: 'ALT',             unit: 'U/L',   kind: 'low',   t1: 41,  t2: 51  },
  { key: 'creatinine',        label: '크레아티닌',      unit: 'mg/dL', kind: 'range', lo: 0.6, hi: 1.2 },
  { key: 'height',            label: '키',              unit: 'cm',    kind: 'plain' },
  { key: 'weight',            label: '체중',            unit: 'kg',    kind: 'plain' },
];
function metricStatus(m, value) {
  if (value == null || m.kind === 'plain') return null;
  if (m.kind === 'low')   return value < m.t1 ? '정상' : (value < m.t2 ? '주의' : '위험');
  if (m.kind === 'high')  return value >= m.t2 ? '정상' : (value >= m.t1 ? '주의' : '위험');
  if (m.kind === 'range') return (value >= m.lo && value <= m.hi) ? '정상' : '주의';
  return null;
}
function bmiLabel(bmi) {
  if (bmi == null) return '';
  if (bmi < 18.5) return '저체중';
  if (bmi < 23)   return '정상';
  if (bmi < 25)   return '과체중';
  return '비만';
}
function bmiStatus(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return '주의';
  if (bmi < 23)   return '정상';
  if (bmi < 25)   return '주의';
  return '위험';
}

/* ── Modal 공통 Row ── */
function ModalRow({ label, value, unit, status, first, multiline }) {
  const colorMap = { '정상': T.ok, '주의': T.warn, '위험': T.danger };
  const vColor   = status ? colorMap[status] : T.ink;
  const border   = first ? 'none' : '1px solid ' + T.line;

  if (multiline) {
    return (
      <div style={{ padding: '11px 0', borderTop: border }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 5 }}>{label}</div>
        <div style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.6 }}>{value}</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderTop: border }}>
      <span style={{ flex: 1, fontSize: 13.5, color: T.inkMid, fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: vColor }}>
          {value}
          {unit && <span style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginLeft: 3 }}>{unit}</span>}
        </span>
        {status && <Badge status={status} small />}
      </div>
    </div>
  );
}

/* ── Modal 닫기 헤더 ── */
function ModalHeader({ icon, iconBg, iconColor, title, subtitle, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={22} color={iconColor} stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <button
        onClick={onClose}
        style={{ width: 34, height: 34, borderRadius: 999, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <Icon name="cross" size={17} color={T.inkSoft} stroke={2.2} />
      </button>
    </div>
  );
}

/* ── 혈압·혈당 상세 ── */
function VitalDetail({ r, onClose }) {
  const bpSt = (sys) => { if (!sys) return null; if (sys < 120) return '정상'; if (sys < 140) return '주의'; return '위험'; };
  const bsSt = (bs)  => { if (!bs)  return null; if (bs  < 100) return '정상'; if (bs  < 126) return '주의'; return '위험'; };
  return (
    <>
      <ModalHeader icon="drop" iconBg="#FFF3E0" iconColor="#F57C00" title="혈압·혈당" subtitle={fmtDate(r.recordedDate)} onClose={onClose} />
      <div>
        <ModalRow first label="측정일" value={fmtDate(r.recordedDate)} />
        {r.systolic  != null && <ModalRow label="수축기 혈압" value={r.systolic}   unit="mmHg"  status={bpSt(r.systolic)} />}
        {r.diastolic != null && <ModalRow label="이완기 혈압" value={r.diastolic}  unit="mmHg" />}
        {r.bloodSugar != null && <ModalRow label="혈당"       value={r.bloodSugar} unit="mg/dL" status={bsSt(r.bloodSugar)} />}
        {r.measuredAt && <ModalRow label="측정 시간" value={r.measuredAt} />}
        {r.memo       && <ModalRow label="메모" value={r.memo} multiline />}
      </div>
    </>
  );
}

/* ── 건강검진 상세 ── */
function CheckupDetail({ r, isLatest, onNav, onClose }) {
  const hasAny = CHECKUP_METRICS.some(m => r[m.key] != null);
  return (
    <>
      <ModalHeader
        icon="report" iconBg={T.blueSoft} iconColor={T.blue}
        title={fmtDate(r.checkupDate)}
        subtitle={r.institution || '직접 입력'}
        onClose={onClose}
      />
      {/* 건강점수 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: T.bg, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(r.healthScore || 0), lineHeight: 1 }}>{r.healthScore ?? '—'}</span>
          <span style={{ fontSize: 9, color: T.blue, fontWeight: 600 }}>점</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft }}>건강 점수</div>
          <Badge status={STATUS_MAP[statusFromScore(r.healthScore)]} small />
        </div>
        {isLatest && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: T.green, background: T.greenSoft, padding: '3px 9px', borderRadius: 999 }}>최신</span>
        )}
      </div>

      {/* 수치 목록 */}
      {hasAny && (
        <div>
          {r.bmi != null && (
            <ModalRow first label="BMI" value={`${r.bmi} (${bmiLabel(r.bmi)})`} status={bmiStatus(r.bmi)} />
          )}
          {CHECKUP_METRICS.map((m, idx) => {
            const val = r[m.key];
            if (val == null) return null;
            const isFirst = r.bmi == null && idx === 0;
            return (
              <ModalRow key={m.key} first={isFirst} label={m.label} value={val} unit={m.unit} status={metricStatus(m, val)} />
            );
          })}
        </div>
      )}

      {/* 최신 검진이면 리포트 버튼 */}
      {isLatest && (
        <button
          onClick={() => { if (r.id) localStorage.setItem('lastCheckupId', String(r.id)); onClose(); onNav('report'); }}
          style={{ width: '100%', marginTop: 20, height: 52, borderRadius: 15, background: T.blue, color: '#fff', fontSize: 15.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon name="spark" size={18} color="#fff" stroke={2} /> AI 리포트 보기
        </button>
      )}
    </>
  );
}

/* ── 약국봉투 상세 ── */
function PharmacyDetail({ r, onClose }) {
  const parts = r.description ? r.description.split(' | ') : [];
  return (
    <>
      <ModalHeader icon="flask" iconBg="#F3E5F5" iconColor="#9C27B0" title="약국봉투" subtitle={fmtDate(r.recordedDate)} onClose={onClose} />
      <div>
        <ModalRow first label="날짜" value={fmtDate(r.recordedDate)} />
        <ModalRow label="제목" value={r.title} />
        {parts.map((part, i) => {
          const sep = part.indexOf(': ');
          if (sep === -1) return <ModalRow key={i} label="내용" value={part} multiline />;
          return <ModalRow key={i} label={part.slice(0, sep)} value={part.slice(sep + 2)} multiline />;
        })}
      </div>
    </>
  );
}

/* ── 병원진료 상세 ── */
function HospitalDetail({ r, onClose }) {
  const parts = r.description ? r.description.split(' | ') : [];
  return (
    <>
      <ModalHeader icon="doc" iconBg={T.blueSoft} iconColor={T.blue} title="병원진료" subtitle={fmtDate(r.recordedDate)} onClose={onClose} />
      <div>
        <ModalRow first label="날짜" value={fmtDate(r.recordedDate)} />
        <ModalRow label="제목" value={r.title} />
        {parts.map((part, i) => {
          const sep = part.indexOf(': ');
          if (sep === -1) return <ModalRow key={i} label="내용" value={part} multiline />;
          return <ModalRow key={i} label={part.slice(0, sep)} value={part.slice(sep + 2)} multiline />;
        })}
      </div>
    </>
  );
}

/* ── 카드 컴포넌트 ── */
function CheckupCard({ r, isLatest, onOpen }) {
  const score = r.healthScore;
  const st    = STATUS_MAP[statusFromScore(score)];
  return (
    <Card onClick={() => onOpen(r)} pad={15} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}>
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
      <Icon name="chevR" size={17} color="#C6D3E6" />
    </Card>
  );
}

function VitalCard({ r, onOpen }) {
  const hasBP = r.systolic != null;
  const hasBS = r.bloodSugar != null;
  return (
    <Card onClick={() => onOpen(r)} pad={15} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="drop" size={22} color="#F57C00" stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmtDate(r.recordedDate)}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          {hasBP && <span style={{ fontSize: 12.5, fontWeight: 600, color: bpColor(r.systolic) }}>혈압 {r.systolic}/{r.diastolic ?? '—'} mmHg</span>}
          {hasBS && <span style={{ fontSize: 12.5, fontWeight: 600, color: bsColor(r.bloodSugar) }}>혈당 {r.bloodSugar} mg/dL</span>}
          {!hasBP && !hasBS && <span style={{ fontSize: 12.5, color: T.inkSoft }}>혈압·혈당 기록</span>}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#E65100', background: '#FFF3E0', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>혈압·혈당</span>
      <Icon name="chevR" size={17} color="#C6D3E6" />
    </Card>
  );
}

function PharmacyCard({ r, onOpen }) {
  return (
    <Card onClick={() => onOpen(r)} pad={15} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="flask" size={22} color="#9C27B0" stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmtDate(r.recordedDate)}</div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#7B1FA2', background: '#F3E5F5', padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>약국봉투</span>
      <Icon name="chevR" size={17} color="#C6D3E6" />
    </Card>
  );
}

function HospitalCard({ r, onOpen }) {
  return (
    <Card onClick={() => onOpen(r)} pad={15} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="doc" size={22} color={T.blue} stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmtDate(r.recordedDate)}</div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: T.blueSoft, padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>병원진료</span>
      <Icon name="chevR" size={17} color="#C6D3E6" />
    </Card>
  );
}

/* ── AI 분석 배너 ── */
function AiAnalysisBanner({ cat, onAnalyze }) {
  const type = cat === '혈압·혈당' ? 'daily' : cat === '약국봉투' ? 'pharmacy' : 'hospital';
  const sub = cat === '혈압·혈당'
    ? '혈압·혈당 기록을 AI가 종합 분석해 드려요'
    : cat === '약국봉투'
    ? '약국봉투 기록의 약 성분과 주의사항을 분석해 드려요'
    : '병원진료 기록을 바탕으로 관리 방법을 안내해 드려요';
  return (
    <div style={{ padding: '0 20px 10px' }}>
      <button
        onClick={() => onAnalyze(type)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: 16, textAlign: 'left',
          background: 'linear-gradient(135deg, #00B894, #00A382)',
          boxShadow: '0 6px 18px rgba(0,184,148,0.28)',
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="spark" size={20} color="#fff" stroke={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>AI 분석받기</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
        </div>
        <Icon name="chevR" size={18} color="rgba(255,255,255,0.7)" />
      </button>
    </div>
  );
}

/* ── AI 분석 결과 모달 내용 ── */
function AiResultContent({ modal, onClose }) {
  const typeLabel = modal?.type === 'daily' ? '혈압·혈당 AI 분석'
    : modal?.type === 'pharmacy' ? '약국봉투 AI 분석'
    : modal?.type === 'hospital' ? '병원진료 AI 분석'
    : '진료·처방 AI 분석';
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="spark" size={22} color={T.blue} stroke={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>AI 분석 결과</div>
          <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{typeLabel}</div>
        </div>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="cross" size={17} color={T.inkSoft} stroke={2.2} />
        </button>
      </div>

      {modal?.loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
          <Spinner size={38} color={T.blue} stroke={3} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>AI가 분석하고 있어요</div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 5 }}>잠시만 기다려주세요...</div>
          </div>
        </div>
      ) : modal?.error ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>😢</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 8 }}>분석 중 오류가 발생했어요</div>
          <div style={{ fontSize: 13, color: T.inkSoft }}>{modal.error}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 종합 요약 */}
          <div style={{ padding: '14px 16px', borderRadius: 14, background: T.blueSoft }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: T.blue, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>종합 요약</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.75, color: T.ink }}>{modal?.data?.summary}</div>
          </div>

          {/* 상세 분석 */}
          {(modal?.data?.details || []).map((d, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: '#fff', border: '1px solid ' + T.line }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: T.blue, flexShrink: 0 }} />
                <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{d.title}</div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.75, color: T.inkMid }}>{d.content}</div>
            </div>
          ))}

          {/* 관리 가이드 */}
          {modal?.data?.advice && (
            <div style={{ padding: '14px 16px', borderRadius: 14, background: T.warnSoft }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: T.warn, marginBottom: 8, letterSpacing: '0.04em' }}>관리 가이드</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.75, color: T.ink }}>{modal.data.advice}</div>
            </div>
          )}
        </div>
      )}
    </>
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
        {(cat === '건강검진' || cat === '전체') ? '검진 결과를 입력하거나 PDF를 업로드해보세요' : '입력 탭에서 기록을 추가해보세요'}
      </div>
      <button
        onClick={() => onNav('input')}
        style={{ marginTop: 4, padding: '10px 22px', borderRadius: 12, background: T.blue, color: '#fff', fontSize: 14, fontWeight: 700 }}
      >
        기록 추가하기
      </button>
    </div>
  );
}

/* ── Main ── */
export default function History({ onNav, toast }) {
  const [cat, setCat]         = useState('전체');
  const [checkups, setCheckups] = useState([]);
  const [vitals, setVitals]   = useState([]);
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [aiModal, setAiModal] = useState(null);

  const openAiAnalysis = async (type) => {
    const endpoint = type === 'daily'
      ? '/api/ai/analyze/daily'
      : type === 'pharmacy'
      ? '/api/ai/analyze/medical?type=PHARMACY'
      : type === 'hospital'
      ? '/api/ai/analyze/medical?type=HOSPITAL'
      : '/api/ai/analyze/medical';
    setAiModal({ type, loading: true });
    try {
      const res = await api.post(endpoint);
      const data = res.data.data;
      setAiModal({ type, loading: false, data });
    } catch (err) {
      const msg = err?.response?.data?.message || 'AI 분석 중 오류가 발생했습니다';
      setAiModal({ type, loading: false, error: msg });
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/checkup/history').then(r => r.data.data || []).catch(() => []),
      api.get('/api/vitals/history').then(r => r.data.data || []).catch(() => []),
      api.get('/api/medical-records/history').then(r => r.data.data || []).catch(() => []),
    ]).then(([c, v, m]) => {
      setCheckups(c);
      setVitals(v);
      setMedicals(m);
    }).finally(() => setLoading(false));
  }, []);

  const latestCheckupId = checkups.length > 0 ? checkups[0].id : null;

  const pharmacyRecords = useMemo(() => medicals.filter(m => m.type === 'PHARMACY'), [medicals]);
  const hospitalRecords = useMemo(() => medicals.filter(m => m.type === 'HOSPITAL'), [medicals]);

  const allRecords = useMemo(() => [
    ...checkups.map(r =>        ({ ...r, _type: 'checkup',  _date: r.checkupDate })),
    ...vitals.map(r =>          ({ ...r, _type: 'vital',    _date: r.recordedDate })),
    ...pharmacyRecords.map(r => ({ ...r, _type: 'pharmacy', _date: r.recordedDate })),
    ...hospitalRecords.map(r => ({ ...r, _type: 'hospital', _date: r.recordedDate })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date)), [checkups, vitals, pharmacyRecords, hospitalRecords]);

  const records = useMemo(() => {
    switch (cat) {
      case '건강검진': return checkups.map(r =>        ({ ...r, _type: 'checkup' }));
      case '혈압·혈당': return vitals.map(r =>         ({ ...r, _type: 'vital' }));
      case '약국봉투':  return pharmacyRecords.map(r => ({ ...r, _type: 'pharmacy' }));
      case '병원진료':  return hospitalRecords.map(r => ({ ...r, _type: 'hospital' }));
      default: return allRecords;
    }
  }, [cat, checkups, vitals, pharmacyRecords, hospitalRecords, allRecords]);

  const closeModal = () => setModal(null);

  return (
    <div data-screen-label="기록" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg, position: 'relative' }}>

      {/* 페이지 헤더 */}
      <div style={{ padding: '56px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>기록</h1>
        <button
          onClick={() => onNav('my')}
          style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.blueSoft, borderRadius: 12 }}
        >
          <Icon name="user" size={20} color={T.blue} stroke={2} />
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="nd-no-scrollbar" style={{ overflowX: 'auto', padding: '6px 20px 14px', display: 'flex', gap: 8 }}>
        {CATEGORIES.map(c => {
          const active = cat === c;
          return (
            <button key={c} onClick={() => setCat(c)} style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: 999,
              fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em',
              background: active ? T.blue : '#fff',
              color:      active ? '#fff' : T.inkMid,
              border: `1.5px solid ${active ? T.blue : T.line}`,
              transition: 'all .15s ease',
            }}>{c}</button>
          );
        })}
      </div>

      {/* AI 분석 배너 */}
      {!loading && ['혈압·혈당', '약국봉투', '병원진료'].includes(cat) && records.length > 0 && (
        <AiAnalysisBanner cat={cat} onAnalyze={openAiAnalysis} />
      )}

      {/* 건수 */}
      {!loading && records.length > 0 && (
        <div style={{ padding: '0 20px 8px', fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>총 {records.length}건</div>
      )}

      {/* 목록 */}
      <div style={{ padding: '0 20px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13.5, color: T.inkSoft }}>불러오는 중...</div>
        ) : records.length === 0 ? (
          <EmptyState cat={cat} onNav={onNav} />
        ) : (
          records.map((r, i) => {
            const key = r.id ?? `${r._type}${i}`;
            if (r._type === 'checkup')  return <CheckupCard  key={key} r={r} isLatest={r.id === latestCheckupId} onOpen={r => setModal({ ...r, _type: 'checkup' })} />;
            if (r._type === 'vital')    return <VitalCard    key={key} r={r} onOpen={r => setModal({ ...r, _type: 'vital' })} />;
            if (r._type === 'pharmacy') return <PharmacyCard key={key} r={r} onOpen={r => setModal({ ...r, _type: 'pharmacy' })} />;
            if (r._type === 'hospital') return <HospitalCard key={key} r={r} onOpen={r => setModal({ ...r, _type: 'hospital' })} />;
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

      {/* 상세 모달 */}
      <BottomSheet open={!!modal} onClose={closeModal}>
        {modal?._type === 'vital'    && <VitalDetail    r={modal} onClose={closeModal} />}
        {modal?._type === 'checkup'  && <CheckupDetail  r={modal} isLatest={modal.id === latestCheckupId} onNav={onNav} onClose={closeModal} />}
        {modal?._type === 'pharmacy' && <PharmacyDetail r={modal} onClose={closeModal} />}
        {modal?._type === 'hospital' && <HospitalDetail r={modal} onClose={closeModal} />}
      </BottomSheet>

      {/* AI 분석 결과 모달 */}
      <BottomSheet open={!!aiModal} onClose={() => !aiModal?.loading && setAiModal(null)}>
        {!!aiModal && <AiResultContent modal={aiModal} onClose={() => setAiModal(null)} />}
      </BottomSheet>
    </div>
  );
}

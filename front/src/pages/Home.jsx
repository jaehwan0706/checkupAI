import React, { useState, useEffect } from 'react';
import { T, STATUS, Icon, Badge, Card, Button, Modal } from '../components/UI';
import api from '../api';

function ScoreRing({ score = 72, size = 96 }) {
  const r = (size - 12) / 2, c = 2 * Math.PI * r, pct = score / 100;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth="9" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.92)" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>/ 100점</span>
      </div>
    </div>
  );
}

function MetricCard({ m, onClick }) {
  const s = STATUS[m.status] || STATUS['정상'];
  return (
    <Card onClick={onClick} pad={14} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: s.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={m.icon} size={19} color={s.color} stroke={2.1} />
        </div>
        {m.delta != null ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7188rem', fontWeight: 700, color: m.delta > 0 ? T.danger : m.delta < 0 ? T.ok : '#A6B1C2' }}>
              {m.delta > 0 ? '↑' : m.delta < 0 ? '↓' : '–'}{Math.abs(m.delta) > 0 ? Math.abs(m.delta) + (m.unit ? ' ' + m.unit : '') : ''}
            </div>
          </div>
        ) : (
          <span style={{ width: 9, height: 9, borderRadius: 999, background: s.dot }} />
        )}
      </div>
      <div style={{ fontSize: '0.8125rem', color: T.inkSoft, fontWeight: 600 }}>{m.label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: T.ink, letterSpacing: '-0.02em' }}>{m.value}</span>
        <span style={{ fontSize: '0.75rem', color: T.inkSoft, fontWeight: 600 }}>{m.unit}</span>
      </div>
      <div style={{ marginTop: 10 }}><Badge status={m.status} small /></div>
    </Card>
  );
}

function MetricModal({ m, onClose }) {
  if (!m) return null;
  const s = STATUS[m.status] || STATUS['정상'];
  return (
    <Modal open={!!m} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: s.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={m.icon} size={24} color={s.color} stroke={2.1} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: T.ink }}>{m.label}</div>
          {m.ref && <div style={{ fontSize: '0.75rem', color: T.inkSoft, marginTop: 2 }}>정상 범위 {m.ref}</div>}
        </div>
        <Badge status={m.status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '14px 16px', borderRadius: 14, background: s.soft, marginBottom: 14 }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{m.value}</span>
        <span style={{ fontSize: '0.8125rem', color: T.inkMid, fontWeight: 600 }}>{m.unit}</span>
      </div>
      <div style={{ display: 'flex', gap: 9, marginBottom: 20 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <Icon name="spark" size={15} color={T.blue} stroke={2.3} />
        </div>
        <div>
          <div style={{ fontSize: '0.7812rem', fontWeight: 800, color: T.blue, marginBottom: 4 }}>AI 해석</div>
          <p style={{ margin: 0, fontSize: '0.8438rem', lineHeight: 1.6, color: T.inkMid }}>{m.text}</p>
        </div>
      </div>
      <Button variant="primary" onClick={onClose}>확인</Button>
    </Modal>
  );
}


const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 인덱스: 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
const TIPS_BY_CATEGORY = {
  '혈당': [
    '이번 주 식후 30분 걷기 도전해보세요 🚶 혈당 조절에 효과적이에요',
    '물 8잔 마시기 💧 혈당 스파이크를 줄여줘요',
    '정제탄수화물 줄이기 🍚 흰쌀 대신 잡곡밥 어때요',
    '오늘 간식은 견과류로 🥜 혈당이 천천히 올라요',
    '주말 전 마지막 운동 💪 30분 유산소 어때요',
    '외식할 때 채소 먼저 🥗 혈당 조절에 도움돼요',
    '내일을 위해 7시간 수면 😴 수면 부족은 혈당을 높여요',
  ],
  '혈압': [
    '이번 주 나트륨 줄이기 도전 🧂 국물은 조금만',
    '오늘 30분 걷기 🚶 혈압 낮추는 가장 좋은 방법이에요',
    '바나나 하나 🍌 칼륨이 혈압 조절에 도움돼요',
    '심호흡 5번 🧘 스트레스가 혈압을 올려요',
    '오늘 커피는 1잔만 ☕ 카페인이 혈압을 높일 수 있어요',
    '주말엔 과음 주의 🍺 알코올은 혈압의 적이에요',
    '충분한 수면 😴 수면 부족은 혈압을 높여요',
  ],
  '간수치': [
    '이번 주 금주 도전 🚫 간 회복에 가장 효과적이에요',
    '물 충분히 마시기 💧 간 해독을 도와줘요',
    '튀긴 음식 줄이기 🍟 간에 부담을 줄여요',
    '오늘 커피 한 잔 ☕ 커피가 간 수치 개선에 도움돼요',
    '주말 음주 조심 ⚠️ 간이 회복 중이에요',
    '브로콜리 챙겨 드세요 🥦 간 건강에 좋아요',
    '충분한 수면 😴 잠이 간 회복을 도와요',
  ],
  '콜레스테롤': [
    '이번 주 등푸른생선 도전 🐟 LDL 콜레스테롤을 낮춰요',
    '오늘 견과류 한 줌 🥜 좋은 지방이 콜레스테롤 조절해요',
    '튀긴 음식 대신 구운 음식 🥗 포화지방 줄이기',
    '30분 유산소 운동 🏃 HDL 콜레스테롤을 높여요',
    '주말 고기 먹을 때 채소 곁들이기 🥬',
    '올리브오일 활용해보세요 🫒 좋은 지방이에요',
    '내일부터 한 주 식단 계획해보세요 📋',
  ],
  '기본': [
    '한 주 시작! 점심 후 10분 걷기 어때요? 🚶',
    '물 8잔 마시기 💧 혈액순환에 좋아요',
    '오늘 채소 반찬 하나 더 추가해보세요 🥦',
    '심호흡 5번이 스트레스를 줄여줘요 🧘',
    '오늘 30분 걷기 어때요? 🏃',
    '식사 속도를 늦춰보세요 🍽️',
    '오늘 7시간 이상 수면 챙기세요 😴',
  ],
};

const METRIC_TO_CATEGORY = {
  '혈당': '혈당', '혈압': '혈압', '콜레스테롤': '콜레스테롤',
  '간수치(ALT)': '간수치', '간수치 ALT': '간수치',
};

function DailyRecommendCard({ metrics, onNav }) {
  const [offset, setOffset] = useState(0);

  const base = new Date();
  const target = new Date(base);
  target.setDate(base.getDate() + offset);
  const dayOfWeek = target.getDay();
  const tipIdx = (dayOfWeek + 6) % 7;

  const dangers  = metrics.filter(m => m.status === '위험');
  const warnings = metrics.filter(m => m.status === '주의');
  const primary  = dangers[0] || warnings[0] || null;
  const category = primary ? (METRIC_TO_CATEGORY[primary.label] || '기본') : '기본';
  const rawTip   = TIPS_BY_CATEGORY[category][tipIdx];

  const dateHeader = `${target.getMonth() + 1}월 ${target.getDate()}일 ${DAYS[dayOfWeek]}`;

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: T.ink }}>오늘의 건강 추천</span>
      </div>

      <div style={{ background: 'linear-gradient(160deg,#fff 0%,#E8F8F5 100%)', borderRadius: 16, border: '1px solid #D4EFE9', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,184,148,0.08)' }}>
        {/* 헤더 */}
        <div style={{ padding: '13px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7188rem', fontWeight: 700, color: T.inkSoft }}>오늘의 건강 팁</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.inkMid }}>{dateHeader}</span>
            {offset !== 0 && (
              <button onClick={() => setOffset(0)} style={{ fontSize: '0.6875rem', fontWeight: 700, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                오늘로 돌아가기
              </button>
            )}
          </div>
        </div>

        {/* 팁 본문 */}
        <div style={{ padding: '14px 16px 12px' }}>
          <p style={{ margin: 0, fontSize: '1.0312rem', fontWeight: 800, color: T.ink, lineHeight: 1.55 }}>{rawTip}</p>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setOffset(o => o - 1)} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7812rem', fontWeight: 700, color: T.inkMid, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon name="chevL" size={13} color={T.inkMid} stroke={2.2} /> 이전 날
          </button>
          {primary ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7188rem', fontWeight: 700, color: T.blue, background: '#E3F8F3', border: '1px solid ' + T.blue + '44', padding: '3px 10px', borderRadius: 999 }}>
              {primary.label} 관리 중
            </span>
          ) : <div />}
          {offset < 0 ? (
            <button onClick={() => setOffset(o => o + 1)} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7812rem', fontWeight: 700, color: T.inkMid, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              다음 날 <Icon name="chevR" size={13} color={T.inkMid} stroke={2.2} />
            </button>
          ) : <div style={{ width: 56 }} />}
        </div>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

const STATUS_LABEL_MAP = { NORMAL: '정상', WARNING: '주의', DANGER: '위험' };
const ICON_MAP = { '혈압': 'heart', '혈당': 'drop', '콜레스테롤': 'spark', '간수치(ALT)': 'flask', '간수치 ALT': 'flask' };
const UNIT_MAP = { '혈압': 'mmHg', '혈당': 'mg/dL', '콜레스테롤': 'mg/dL', '간수치(ALT)': 'U/L', '간수치 ALT': 'U/L' };

export default function Home({ onNav, toast }) {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  });
  const [homeData, setHomeData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/home'),
      api.get('/api/checkup').catch(() => null),
      api.get('/api/notifications').catch(() => null),
    ]).then(([homeRes, historyRes, notifRes]) => {
      setHomeData(homeRes.data.data);
      const raw = historyRes?.data?.data || [];
      setHistory([...raw].sort((a, b) => new Date(b.checkupDate) - new Date(a.checkupDate)));
      const notifs = notifRes?.data?.data || [];
      setHasUnread(notifs.some(n => !n.read));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const score = homeData?.healthScore ?? null;
  const previousScore = homeData?.previousScore ?? null;
  const scoreDiff = (score !== null && previousScore !== null) ? score - previousScore : null;

  const METRIC_FIELD = {
    '혈압':        c => c?.systolicBp ?? null,
    '혈당':        c => c?.fastingBloodSugar ?? null,
    '콜레스테롤':  c => c?.totalCholesterol ?? null,
    '간수치(ALT)': c => c?.alt ?? null,
    '간수치 ALT':  c => c?.alt ?? null,
  };
  const latest = history[0] ?? null;
  const prev   = history[1] ?? null;

  const metrics = (homeData?.metrics || []).map(m => {
    const getter = METRIC_FIELD[m.name];
    let delta = null;
    if (getter && latest && prev) {
      const cur = getter(latest);
      const pre = getter(prev);
      if (cur != null && pre != null) delta = cur - pre;
    }
    return {
      id: m.name,
      icon: ICON_MAP[m.name] || 'spark',
      label: m.name,
      value: m.value,
      unit: UNIT_MAP[m.name] || '',
      status: STATUS_LABEL_MAP[m.status] || '정상',
      text: `${m.name} 수치가 ${STATUS_LABEL_MAP[m.status] === '정상' ? '정상 범위예요.' : '확인이 필요해요.'}`,
      delta,
    };
  });
  const warnCount = metrics.filter(m => m.status !== '정상').length;
  const name = (user.name || '').replace(/[^\p{L}\p{N}\s]/gu, '').trim() || '사용자';
  const hasWarn = warnCount > 0 && score !== null;
  const statusMsg = (loading || score === null)
    ? '오늘도 건강한 하루 보내세요'
    : hasWarn ? '주의가 필요한 항목이 있어요'
    : '모든 수치가 정상이에요 😊';

  return (
    <div data-screen-label="홈" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg, position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.ink, lineHeight: 1.2 }}>
            {name}님 👋
          </h1>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: hasWarn ? T.warn : T.inkSoft, marginTop: 5 }}>
            {hasWarn ? '⚠️ ' : ''}{statusMsg}
          </div>
        </div>
        <button onClick={() => onNav('notif-list')} style={{ width: 42, height: 42, borderRadius: 13, background: '#fff', border: '1px solid ' + T.line, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', marginTop: 4 }}>
          <Icon name="bell" size={21} color={T.inkMid} stroke={1.9} />
          {hasUnread && <span style={{ position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 999, background: T.danger, border: '1.5px solid #fff' }} />}
        </button>
      </div>

      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Hero card */}
        {loading ? (
          <div style={{ borderRadius: 22, padding: 24, background: 'linear-gradient(135deg, #00B894 0%, #00A382 100%)', boxShadow: '0 14px 34px rgba(0,184,148,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>데이터를 불러오는 중...</span>
          </div>
        ) : score === null ? (
          <Card style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: T.ink, marginBottom: 8 }}>아직 검진 데이터가 없어요</div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.inkMid, marginBottom: 20, lineHeight: 1.6 }}>첫 검진 결과를 입력하고 AI 분석을 받아보세요</p>
            <Button variant="primary" onClick={() => onNav('input')} icon="arrow">검진 수치 입력하기</Button>
          </Card>
        ) : (
          <div style={{ borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #00B894 0%, #00A382 100%)', boxShadow: '0 14px 34px rgba(0,184,148,0.32)' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <ScoreRing score={score} />
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: 999, fontSize: '0.7188rem', fontWeight: 700, color: '#fff' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.9)' }} />전체 건강 점수
                </div>
                <div style={{ marginTop: 10, fontSize: '0.9375rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{score}점 · {score >= 80 ? '건강해요' : score >= 60 ? '양호' : '주의 필요'}</div>
                <div style={{ marginTop: 3, fontSize: '0.7812rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                  {warnCount > 0 ? `${warnCount}가지 항목에서 주의가 필요해요` : '모든 항목이 정상이에요'}
                </div>
                {scoreDiff !== null && (
                  <div style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', padding: '3px 9px', borderRadius: 999 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreDiff >= 0 ? '#fff' : '#FFD8D3' }}>
                      {scoreDiff >= 0 ? '▲' : '▼'} 지난 검진보다 {scoreDiff >= 0 ? '+' : ''}{scoreDiff}점
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onNav('report')}
              style={{ marginTop: 14, display: 'block', textAlign: 'left', fontSize: '0.7812rem', fontWeight: 700, color: '#fff', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {score >= 80
                ? '이것만 하면 이번 달 85점 가능해요 →'
                : score >= 60
                ? '주의 항목 관리하면 10점 올릴 수 있어요 →'
                : '지금 바로 관리가 필요해요 →'}
            </button>
            {homeData?.lastCheckupDate && (
              <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="cal" size={15} color="rgba(255,255,255,0.7)" stroke={2} />
                <span style={{ fontSize: '0.7812rem', color: 'rgba(255,255,255,0.82)', fontWeight: 600 }}>마지막 검진일 · {formatDate(homeData.lastCheckupDate)}</span>
              </div>
            )}
          </div>
        )}

        <DailyRecommendCard metrics={metrics} onNav={onNav} />

        {metrics.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: T.ink }}>주요 수치</span>
              <button onClick={() => onNav('report')} style={{ fontSize: '0.7812rem', fontWeight: 600, color: T.blue, display: 'flex', alignItems: 'center', gap: 2 }}>
                전체보기 <Icon name="chevR" size={14} color={T.blue} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              {metrics.slice(0, 4).map(m => <MetricCard key={m.id} m={m} onClick={() => setModal(m)} />)}
            </div>
          </>
        )}
      </div>

<MetricModal m={modal} onClose={() => setModal(null)} />
    </div>
  );
}

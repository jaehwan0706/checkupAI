import React, { useState, useRef } from 'react';
import { T, STATUS, Icon, Badge, Card, Button, Segmented, Modal, Spinner } from '../components/UI';
import api from '../api';

const FIELD_DEFS = {
  height: { label: '키',             unit: 'cm',    normal: '—',                kind: 'plain' },
  weight: { label: '체중',           unit: 'kg',    normal: '—',                kind: 'plain' },
  sys:    { label: '수축기 혈압',    unit: 'mmHg',  normal: '120 mmHg 미만',    kind: 'low',   t1: 120, t2: 140 },
  dia:    { label: '이완기 혈압',    unit: 'mmHg',  normal: '80 mmHg 미만',     kind: 'low',   t1: 80,  t2: 90  },
  glu:    { label: '공복혈당',       unit: 'mg/dL', normal: '100 mg/dL 미만',   kind: 'low',   t1: 100, t2: 126 },
  tc:     { label: '총콜레스테롤',   unit: 'mg/dL', normal: '200 mg/dL 미만',   kind: 'low',   t1: 200, t2: 240 },
  ldl:    { label: 'LDL 콜레스테롤', unit: 'mg/dL', normal: '130 mg/dL 미만',   kind: 'low',   t1: 130, t2: 160 },
  hdl:    { label: 'HDL 콜레스테롤', unit: 'mg/dL', normal: '60 mg/dL 이상',    kind: 'high',  t1: 40,  t2: 60  },
  ast:    { label: 'AST',            unit: 'U/L',   normal: '40 U/L 이하',      kind: 'low',   t1: 41,  t2: 51  },
  alt:    { label: 'ALT',            unit: 'U/L',   normal: '40 U/L 이하',      kind: 'low',   t1: 41,  t2: 51  },
  cre:    { label: '크레아티닌',     unit: 'mg/dL', normal: '0.6 ~ 1.2 mg/dL', kind: 'range',  lo: 0.6, hi: 1.2 },
};

function statusOf(key, raw) {
  const d = FIELD_DEFS[key];
  if (!d || raw === '' || raw == null || isNaN(parseFloat(raw))) return null;
  const v = parseFloat(raw);
  if (d.kind === 'low')   return v < d.t1 ? '정상' : (v < d.t2 ? '주의' : '위험');
  if (d.kind === 'high')  return v >= d.t2 ? '정상' : (v >= d.t1 ? '주의' : '위험');
  if (d.kind === 'range') return (v >= d.lo && v <= d.hi) ? '정상' : '주의';
  return null;
}

function bmiOf(h, w) {
  const H = parseFloat(h), W = parseFloat(w);
  if (!H || !W) return null;
  const bmi = W / Math.pow(H / 100, 2);
  let status = '정상', label = '정상';
  if (bmi < 18.5)    { status = '주의'; label = '저체중'; }
  else if (bmi < 23) { status = '정상'; label = '정상';   }
  else if (bmi < 25) { status = '주의'; label = '과체중'; }
  else               { status = '위험'; label = '비만';   }
  return { value: bmi.toFixed(1), status, label };
}

function NumRow({ fieldKey, value, onChange }) {
  const d = FIELD_DEFS[fieldKey];
  const [focus, setFocus] = useState(false);
  const st = statusOf(fieldKey, value);
  const sc = st ? STATUS[st].color : null;
  const border = st ? sc : (focus ? T.blue : T.line);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{d.label}</div>
        {d.normal !== '—' && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>정상 {d.normal}</div>}
      </div>
      <div style={{ width: 142, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 12px', borderRadius: 12, background: '#fff',
          border: '1.5px solid ' + border, boxShadow: focus && !st ? '0 0 0 3px rgba(30,77,140,0.1)' : 'none', transition: 'all .15s ease' }}>
          <input value={value} inputMode="decimal" placeholder="입력" size={1}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, fontWeight: 700, color: st ? sc : T.ink, fontFamily: 'inherit', textAlign: 'right' }} />
          <span style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, flexShrink: 0 }}>{d.unit}</span>
        </div>
        <div style={{ height: 20, marginTop: 5, display: 'flex', justifyContent: 'flex-end' }}>
          {st && <Badge status={st} small />}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '0 2px 10px' }}>
        <Icon name={icon} size={17} color={T.blue} stroke={2.1} />
        <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{title}</span>
      </div>
      <Card pad={15} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>{children}</Card>
    </div>
  );
}

function DirectInput({ vals, setVals, onAnalyze, toast }) {
  const set = k => v => setVals(s => ({ ...s, [k]: v }));
  const bmi = bmiOf(vals.height, vals.weight);

  const toNumber = v => (v === '' || v == null ? undefined : Number(v));
  const buildPayload = () => ({
    checkupDate: vals.date,
    height: toNumber(vals.height),
    weight: toNumber(vals.weight),
    systolicBp: toNumber(vals.sys),
    diastolicBp: toNumber(vals.dia),
    fastingBloodSugar: toNumber(vals.glu),
    totalCholesterol: toNumber(vals.tc),
    ldlCholesterol: toNumber(vals.ldl),
    hdlCholesterol: toNumber(vals.hdl),
    ast: toNumber(vals.ast),
    alt: toNumber(vals.alt),
    creatinine: toNumber(vals.cre),
  });

  const save = async (showToast = true) => {
    try {
      const payload = buildPayload();
      if (!payload.checkupDate || !payload.height || !payload.weight) {
        toast('검진일, 키, 체중을 입력해주세요', 'cross');
        return null;
      }
      const res = await api.post('/api/checkup', payload);
      if (showToast) toast('검진 기록이 저장되었어요', 'check');
      if (res.data?.data?.id) localStorage.setItem('lastCheckupId', String(res.data.data.id));
      return res.data?.data;
    } catch {
      toast('저장에 실패했어요', 'cross');
      return null;
    }
  };

  const analyze = async () => {
    const saved = await save(false);
    if (saved) onAnalyze('직접 입력');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.inkMid, margin: '0 0 7px 2px' }}>검진일</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 14px', borderRadius: 14, background: '#fff', border: '1.5px solid ' + T.line }}>
          <Icon name="cal" size={19} color={T.blue} stroke={2} />
          <input type="date" value={vals.date} onChange={e => set('date')(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, color: T.ink, fontFamily: 'inherit' }} />
        </div>
      </div>

      <Section icon="body" title="신체계측">
        <NumRow fieldKey="height" value={vals.height} onChange={set('height')} />
        <NumRow fieldKey="weight" value={vals.weight} onChange={set('weight')} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 12, background: bmi ? STATUS[bmi.status].soft : T.bg }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: T.inkMid }}>BMI <span style={{ fontSize: 11.5, color: T.inkSoft }}>(자동 계산)</span></span>
          {bmi ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: STATUS[bmi.status].color }}>{bmi.value}</span>
              <Badge status={bmi.status} small />
              <span style={{ fontSize: 12, fontWeight: 700, color: STATUS[bmi.status].color }}>{bmi.label}</span>
            </span>
          ) : <span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 600 }}>키·체중 입력 시 표시</span>}
        </div>
      </Section>

      <Section icon="heart" title="혈압">
        <NumRow fieldKey="sys" value={vals.sys} onChange={set('sys')} />
        <NumRow fieldKey="dia" value={vals.dia} onChange={set('dia')} />
      </Section>
      <Section icon="drop" title="혈당">
        <NumRow fieldKey="glu" value={vals.glu} onChange={set('glu')} />
      </Section>
      <Section icon="spark" title="콜레스테롤">
        <NumRow fieldKey="tc"  value={vals.tc}  onChange={set('tc')}  />
        <NumRow fieldKey="ldl" value={vals.ldl} onChange={set('ldl')} />
        <NumRow fieldKey="hdl" value={vals.hdl} onChange={set('hdl')} />
      </Section>
      <Section icon="flask" title="간수치">
        <NumRow fieldKey="ast" value={vals.ast} onChange={set('ast')} />
        <NumRow fieldKey="alt" value={vals.alt} onChange={set('alt')} />
      </Section>
      <Section icon="shield" title="신장">
        <NumRow fieldKey="cre" value={vals.cre} onChange={set('cre')} />
      </Section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
        <Button variant="primary" onClick={analyze} icon="spark">AI 해석 받기</Button>
        <Button variant="outline" onClick={save}>임시저장</Button>
      </div>
    </div>
  );
}

function PdfUpload({ onAnalyze, onEdit, onHelp }) {
  const [file, setFile]         = useState(null);
  const [phase, setPhase]       = useState('idle');
  const [progress, setProgress] = useState(0);
  const [drag, setDrag]         = useState(false);
  const [extracted, setExtracted] = useState([]);
  const inputRef = useRef(null);

  const pickFile = f => { if (f) setFile({ name: f.name, size: f.size, raw: f }); };
  const onFileInput = e => pickFile(e.target.files && e.target.files[0]);
  const onDrop = e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files && e.dataTransfer.files[0]); };

  const extract = async () => {
    setPhase('loading'); setProgress(0);
    const started = Date.now();
    const iv = setInterval(() => {
      setProgress(Math.min(90, ((Date.now() - started) / 2400) * 90));
    }, 60);
    try {
      const fd = new FormData();
      fd.append('file', file.raw);
      const res = await api.post('/api/pdf/parse-and-save', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearInterval(iv);
      setProgress(100);
      if (res.data?.data) {
        const saved = res.data.data;
        localStorage.setItem('lastCheckupId', String(saved.id));
        setExtracted([
          saved.systolicBp && saved.diastolicBp ? { label: '혈압', value: `${saved.systolicBp}/${saved.diastolicBp}` } : null,
          saved.fastingBloodSugar ? { label: '공복혈당', value: String(saved.fastingBloodSugar) } : null,
          saved.totalCholesterol ? { label: '총콜레스테롤', value: String(saved.totalCholesterol) } : null,
          saved.alt ? { label: '간수치 ALT', value: String(saved.alt) } : null,
        ].filter(Boolean));
      }
      setTimeout(() => setPhase('done'), 200);
    } catch {
      clearInterval(iv);
      setProgress(100);
      setExtracted([]);
      setTimeout(() => setPhase('done'), 200);
    }
  };

  const reset = () => { setFile(null); setPhase('idle'); setProgress(0); };
  const fmtSize = b => b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

  if (phase === 'loading') return (
    <Card pad={24} style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Spinner size={40} color={T.blue} stroke={3} /></div>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>PDF를 분석하고 있어요...</div>
      <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 5 }}>검진 수치를 추출하는 중이에요</div>
      <div style={{ height: 8, borderRadius: 999, background: T.line, marginTop: 18, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg,#00B894,#00D4A8)', borderRadius: 999, transition: 'width .1s linear' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginTop: 8 }}>{Math.round(progress)}%</div>
    </Card>
  );

  if (phase === 'done') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card pad={18}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={18} color={T.green} stroke={2.8} />
          </div>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>수치 추출 완료!</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {extracted.length === 0 ? (
            <div style={{ padding: '12px 0', fontSize: 13.5, color: T.inkSoft }}>저장된 추출 결과가 없어요</div>
          ) : extracted.map((e, i) => (
            <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: i ? '1px solid ' + T.line : 'none' }}>
              <Icon name="check" size={17} color={T.green} stroke={2.6} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.inkMid }}>{e.label}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{e.value}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="primary" onClick={() => onAnalyze('PDF 분석')} icon="spark">확인 후 AI 해석 받기</Button>
        <Button variant="outline" onClick={onEdit}>수치 수정하기</Button>
      </div>
    </div>
  );

  if (file) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={onFileInput} style={{ display: 'none' }} />
      <Card pad={16} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="pdf" size={22} color={T.danger} stroke={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{fmtSize(file.size)}</div>
        </div>
        <button onClick={reset} style={{ width: 30, height: 30, borderRadius: 999, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cross" size={16} color={T.inkSoft} stroke={2.2} />
        </button>
      </Card>
      <Button variant="primary" onClick={extract} icon="spark">AI로 수치 추출하기</Button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={onFileInput} style={{ display: 'none' }} />
      <div onClick={() => inputRef.current && inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
        style={{ borderRadius: 18, border: '2px dashed ' + (drag ? T.blue : '#C6D3E6'), background: drag ? T.blueSoft : '#fff', padding: '34px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s ease' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 14px', borderRadius: 17, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="pdf" size={30} color={T.blue} stroke={1.9} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, lineHeight: 1.5 }}>건강보험공단 검진결과 PDF를<br />올려주세요</div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 6 }}>여기로 끌어다 놓거나 아래 버튼을 눌러주세요</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 20px', borderRadius: 12, background: T.blue, color: '#fff', fontSize: 14, fontWeight: 700 }}>
          <Icon name="plus" size={17} color="#fff" stroke={2.4} /> 파일 선택
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 14, background: '#EEF1F6' }}>
        <Icon name="info" size={18} color={T.inkSoft} stroke={2} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.inkMid }}>건강보험공단 → The건강보험 앱 → 검진결과에서 PDF를 받을 수 있어요.</p>
          <button onClick={onHelp} style={{ marginTop: 7, fontSize: 12.5, fontWeight: 700, color: T.blue, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="question" size={14} color={T.blue} stroke={2.1} /> PDF 받는 방법 자세히 보기
          </button>
        </div>
      </div>
    </div>
  );
}

function PdfHelpModal({ open, onClose }) {
  const steps = [
    '국민건강보험공단 앱 "The건강보험" 설치',
    '로그인 후 "건강검진" 메뉴 선택',
    '검진 결과 확인 후 PDF 저장',
    '검진AI 앱에서 PDF 업로드',
  ];
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="pdf" size={21} color={T.blue} stroke={2} />
        </div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.ink }}>PDF 받는 방법</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 999, background: T.blue, color: '#fff', fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: T.inkMid }}>{s}</span>
          </div>
        ))}
      </div>
      <Button variant="primary" onClick={onClose}>닫기</Button>
    </Modal>
  );
}

const DOC_CONFIGS = {
  medical: {
    label: '병원 진료 기록',
    emoji: '🏥',
    color: T.greenSoft,
    desc: '진단서, 소견서 사진을 찍으면 AI가 분석해줘요',
    sample: [
      '🏥 진단명: 급성 상기도 감염',
      '📝 주요 소견: 인후부 발적 및 부종',
      '👨‍⚕️ 권고사항: 충분한 수분, 3일 후 재진',
    ],
    result: {
      fields: [
        { label: '진단명',         value: '급성 상기도 감염' },
        { label: '주요 소견',      value: '인후부 발적 및 부종 관찰' },
        { label: '의사 권고사항',  value: '충분한 수분 섭취, 3일 후 재진' },
      ],
      ai: '충분한 휴식과 수분 섭취가 회복에 가장 중요해요',
    },
  },
  pharmacy: {
    label: '약국 봉투',
    emoji: '💊',
    color: T.warnSoft,
    desc: '약봉투 사진으로 복용법, 성분, 주의사항 확인',
    sample: [
      '💊 약 이름: 아목시실린 500mg',
      '📋 복용법: 1일 3회, 식후 30분',
      '⚠️ 주의사항: 음주 금지, 졸음 유발',
      '🔬 주요 성분: 아목시실린 (항생제)',
    ],
    result: {
      fields: [
        { label: '약 이름',  value: '아목시실린 500mg' },
        { label: '복용법',   value: '1일 3회, 식후 30분' },
        { label: '주의사항', value: '음주 금지, 졸음 유발 가능' },
        { label: '주요 성분', value: '아목시실린 (항생제 계열)' },
      ],
      ai: '항생제는 정해진 기간 동안 빠짐없이 복용해야 효과적이에요',
    },
  },
  prescription: {
    label: '처방전',
    emoji: '📝',
    color: '#F0ECFB',
    desc: '처방전 사진으로 약 성분과 상호작용 확인',
    result: {
      fields: [
        { label: '처방 약물',    value: '아목시실린 500mg / 이부프로펜 400mg / 판토프라졸 40mg' },
        { label: '약 상호작용', value: '처방된 약들 간 특별한 상호작용 없어요 ✅' },
      ],
      ai: '처방대로 복용하시고 증상이 악화되면 재진 받으세요',
    },
  },
};

const HUB_CARDS = [
  { id: 'pharmacy', emoji: '💊', label: '약국 봉투',      desc: '약봉투 사진으로 복용법, 성분, 주의사항 확인',         color: '#E8F8F5', camera: true,  half: true  },
  { id: 'medical',  emoji: '🏥', label: '병원 진료 기록', desc: '진단서, 소견서 사진을 찍으면 AI가 분석해줘요',        color: '#E8F8F5', camera: true,  half: true  },
  { id: 'checkup',  emoji: '📋', label: '건강검진 결과',  desc: '건강보험공단 검진 결과 PDF 또는 수치 직접 입력',      color: '#E8F8F5', camera: false, half: false },
  { id: 'vitals',   emoji: '📊', label: '혈압·혈당 기록', desc: '오늘 측정한 수치를 기록하면 변화 추이를 볼 수 있어요', color: '#E8F8F5', camera: false, half: false },
];

function Hub({ onSelect }) {
  const halfCards = HUB_CARDS.filter(c => c.half);
  const fullCards = HUB_CARDS.filter(c => !c.half);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {halfCards.map(c => (
          <Card key={c.id} onClick={() => onSelect(c.id)} pad={16}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 152 }}>
            <div style={{ width: 50, height: 50, borderRadius: 15, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              {c.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, marginBottom: 5 }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.45 }}>{c.desc}</div>
            </div>
            {c.camera && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, borderRadius: 10, background: c.color, fontSize: 12.5, fontWeight: 700, color: T.inkMid }}>
                📷 바로 찍기
              </div>
            )}
          </Card>
        ))}
      </div>
      {fullCards.map(c => (
        <Card key={c.id} onClick={() => onSelect(c.id)} pad={16}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {c.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 5 }}>{c.label}</div>
            <div style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.45 }}>{c.desc}</div>
          </div>
          <Icon name="chevR" size={20} color={T.inkSoft} stroke={2} />
        </Card>
      ))}
    </div>
  );
}

function DocumentCapture({ docType, toast }) {
  const cfg = DOC_CONFIGS[docType];
  const [imgSrc, setImgSrc] = useState(null);
  const [phase, setPhase]   = useState('idle');
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);

  const handleFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgSrc(URL.createObjectURL(f));
    e.target.value = '';
  };

  const analyze = () => { setPhase('loading'); setTimeout(() => setPhase('result'), 1500); };
  const reset   = () => { setImgSrc(null); setPhase('idle'); };

  if (phase === 'loading') return (
    <Card pad={24} style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Spinner size={40} color={T.blue} stroke={3} />
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>AI가 분석하고 있어요...</div>
      <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 5 }}>잠시만 기다려주세요</div>
    </Card>
  );

  if (phase === 'result') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card pad={18}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={18} color={T.green} stroke={2.8} />
          </div>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>분석 완료!</span>
        </div>
        {cfg.result.fields.map((f, i) => (
          <div key={f.label} style={{ padding: '11px 0', borderTop: i ? '1px solid ' + T.line : 'none' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.5 }}>{f.value}</div>
          </div>
        ))}
      </Card>
      <div style={{ display: 'flex', gap: 12, padding: 16, borderRadius: 16, background: T.blueSoft, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>🤖</span>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: T.blue, marginBottom: 5 }}>AI 한마디</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: T.inkMid, fontWeight: 500 }}>{cfg.result.ai}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="outline" onClick={() => toast('준비 중이에요', 'info')}>저장하기</Button>
        <Button variant="ghost" onClick={reset}>다시 분석하기</Button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*"                        onChange={handleFile} style={{ display: 'none' }} />
      {imgSrc ? (
        <>
          <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
            <img src={imgSrc} alt="선택된 사진" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
            <button onClick={reset} style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
              <Icon name="cross" size={16} color="#fff" stroke={2.3} />
            </button>
          </div>
          <Button variant="primary" onClick={analyze} icon="spark">AI 분석하기</Button>
        </>
      ) : (
        <>
          <div style={{ borderRadius: 18, border: '2px dashed #C6D3E6', background: '#fff', padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{cfg.emoji}</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{cfg.label} 사진을 올려주세요</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft }}>{cfg.desc}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => cameraRef.current?.click()} style={{ flex: 1, height: 54, borderRadius: 15, border: '1.5px solid ' + T.line, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: T.ink, cursor: 'pointer' }}>
              📷 카메라 촬영
            </button>
            <button onClick={() => galleryRef.current?.click()} style={{ flex: 1, height: 54, borderRadius: 15, border: '1.5px solid ' + T.line, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: T.ink, cursor: 'pointer' }}>
              🖼️ 갤러리
            </button>
          </div>
          {cfg.sample && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft, marginBottom: 8 }}>분석하면 이런 정보를 알 수 있어요</div>
              <div style={{ background: '#E8F8F5', borderRadius: 14, padding: '12px 14px', border: '1px solid #D4EFE9' }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: T.blue, background: '#fff', border: '1px solid ' + T.blue + '44', padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginBottom: 10 }}>예시</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {cfg.sample.map((item, i) => (
                    <div key={i} style={{ fontSize: 13, fontWeight: 600, color: T.inkMid }}>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VitalsRecord({ toast }) {
  const [phase, setPhase]   = useState('form');
  const [sys, setSys]       = useState('');
  const [dia, setDia]       = useState('');
  const [sugar, setSugar]   = useState('');
  const [time, setTime]     = useState('아침');
  const [memo, setMemo]     = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  const TIMES = ['아침', '점심', '저녁', '취침 전'];

  const loadHistory = async () => {
    try {
      const res = await api.get('/api/vitals');
      setHistory((res.data?.data || []).slice(0, 7));
    } catch { /* ignore */ }
  };

  React.useEffect(() => { loadHistory(); }, []);

  const bpStatus = (s, d) => {
    const sv = Number(s || 0), dv = Number(d || 0);
    if (!sv && !dv) return null;
    if (sv >= 140 || dv >= 90) return '위험';
    if (sv >= 120 || dv >= 80) return '주의';
    return '정상';
  };

  const save = async () => {
    if (!sys && !dia && !sugar) {
      toast('혈압 또는 혈당을 입력해주세요', 'cross');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/vitals', {
        systolic:    sys   ? Number(sys)   : null,
        diastolic:   dia   ? Number(dia)   : null,
        bloodSugar:  sugar ? Number(sugar) : null,
        measuredAt:  time,
        memo:        memo || null,
        recordedDate: new Date().toISOString().slice(0, 10),
      });
      toast('기록이 저장됐어요', 'check');
      setSys(''); setDia(''); setSugar(''); setMemo('');
      await loadHistory();
      setPhase('history');
    } catch {
      toast('저장에 실패했어요', 'cross');
    } finally {
      setSaving(false);
    }
  };

  if (phase === 'history') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card pad={18}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, background: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={18} color={T.green} stroke={2.8} />
          </div>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>최근 7일 기록</span>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: '8px 0', fontSize: 13.5, color: T.inkSoft }}>아직 기록이 없어요</div>
        ) : history.map((v, i) => {
          const st = (v.systolic && v.diastolic) ? bpStatus(v.systolic, v.diastolic) : null;
          const stColor = st === '위험' ? T.danger : st === '주의' ? T.warn : T.ok;
          const stSoft  = st === '위험' ? T.dangerSoft : st === '주의' ? T.warnSoft : T.okSoft;
          return (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: i ? '1px solid ' + T.line : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>{v.recordedDate} · {v.measuredAt}</div>
                {(v.systolic || v.diastolic) && (
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginTop: 2 }}>
                    {v.systolic}/{v.diastolic} <span style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 600 }}>mmHg</span>
                  </div>
                )}
                {v.bloodSugar && (
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.inkMid, marginTop: 1 }}>
                    혈당 {v.bloodSugar} <span style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft }}>mg/dL</span>
                  </div>
                )}
                {v.memo && <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 3 }}>{v.memo}</div>}
              </div>
              {st && (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: stColor, background: stSoft, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>
                  {st}
                </span>
              )}
            </div>
          );
        })}
      </Card>
      <Button variant="primary" onClick={() => setPhase('form')}>새 기록 추가</Button>
    </div>
  );

  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: T.blueSoft, border: '1px solid ' + T.blue + '22' }}>
        <Icon name="cal" size={18} color={T.blue} stroke={2} />
        <span style={{ fontSize: 14.5, fontWeight: 700, color: T.blue }}>{todayStr}</span>
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkMid, margin: '0 2px 8px' }}>측정 시간</div>
        <div style={{ display: 'flex', gap: 7 }}>
          {TIMES.map(t => (
            <button key={t} onClick={() => setTime(t)} style={{
              flex: 1, height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: time === t ? T.blue : '#fff',
              color: time === t ? '#fff' : T.inkSoft,
              border: '1.5px solid ' + (time === t ? T.blue : T.line),
              cursor: 'pointer', transition: 'all .15s ease',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <Section icon="heart" title="혈압 (mmHg)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 700, marginBottom: 5 }}>수축기 (위)</div>
            <div style={{ height: 50, borderRadius: 12, background: '#fff', border: '1.5px solid ' + T.line, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
              <input value={sys} inputMode="numeric" placeholder="120"
                onChange={e => setSys(e.target.value.replace(/\D/g, ''))}
                className="bp-input"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, color: T.ink, background: 'transparent', textAlign: 'right', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }} />
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 700, marginBottom: 5 }}>이완기 (아래)</div>
            <div style={{ height: 50, borderRadius: 12, background: '#fff', border: '1.5px solid ' + T.line, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
              <input value={dia} inputMode="numeric" placeholder="80"
                onChange={e => setDia(e.target.value.replace(/\D/g, ''))}
                className="bp-input"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, color: T.ink, background: 'transparent', textAlign: 'right', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }} />
            </div>
          </div>
        </div>
      </Section>

      <Section icon="drop" title="공복혈당 (mg/dL) — 선택">
        <div style={{ display: 'flex', alignItems: 'center', height: 50, borderRadius: 12, background: '#fff', border: '1.5px solid ' + T.line, padding: '0 12px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <input value={sugar} inputMode="numeric" placeholder="100"
            onChange={e => setSugar(e.target.value.replace(/\D/g, ''))}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, color: T.ink, background: 'transparent', textAlign: 'right', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }} />
          <span style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>mg/dL</span>
        </div>
      </Section>

      <Section icon="edit" title="메모 — 선택">
        <div style={{ borderRadius: 12, background: '#fff', border: '1.5px solid ' + T.line, padding: '10px 12px' }}>
          <textarea value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="예: 오늘 많이 걸었음, 카페인 섭취 후 등"
            rows={2}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: T.ink, background: 'transparent', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }} />
        </div>
      </Section>

      <Button variant="primary" onClick={save} disabled={saving} icon="check">
        {saving ? '저장 중...' : '저장하기'}
      </Button>

      {history.length > 0 && (
        <button onClick={() => setPhase('history')} style={{ fontSize: 13, fontWeight: 700, color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
          최근 기록 {history.length}개 보기 <Icon name="chevR" size={14} color={T.blue} />
        </button>
      )}
    </div>
  );
}

export default function Input({ onAnalyze, toast }) {
  const today = new Date().toISOString().slice(0, 10);
  const [screen, setScreen] = useState('hub');
  const [docType, setDocType] = useState(null);
  const [tab, setTab]   = useState('📄 PDF 업로드');
  const [help, setHelp] = useState(false);
  const [vals, setVals] = useState({ date: today, height: '', weight: '', sys: '', dia: '', glu: '', tc: '', ldl: '', hdl: '', ast: '', alt: '', cre: '' });

  const fillFromPdf = () => {
    setVals(s => ({ ...s, sys: '120', dia: '80', glu: '102', tc: '215', alt: '28' }));
    setTab('✏️ 직접 입력');
  };

  const goHub = () => setScreen('hub');

  const selectCard = id => {
    if (id === 'checkup') { setScreen('checkup'); }
    else if (id === 'vitals') { setScreen('vitals'); }
    else { setDocType(id); setScreen('document'); }
  };

  if (screen === 'hub') return (
    <div data-screen-label="검진 입력" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '56px 20px 4px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>건강 기록 입력</h1>
        <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.inkSoft }}>분석할 문서 종류를 선택하세요</p>
      </div>
      <div style={{ padding: '20px 20px 28px' }}>
        <Hub onSelect={selectCard} />
      </div>
    </div>
  );

  if (screen === 'vitals') return (
    <div data-screen-label="검진 입력" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '56px 20px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={goHub} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevL" size={24} color={T.inkMid} />
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>혈압·혈당 기록</h1>
      </div>
      <div style={{ padding: '14px 20px 28px' }}>
        <VitalsRecord toast={toast} />
      </div>
    </div>
  );

  if (screen === 'checkup') return (
    <div data-screen-label="검진 입력" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '56px 20px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={goHub} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevL" size={24} color={T.inkMid} />
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>건강검진 결과</h1>
      </div>
      <div style={{ padding: '12px 20px 0' }}>
        <Segmented items={['📄 PDF 업로드', '✏️ 직접 입력']} value={tab} onChange={setTab} small />
      </div>
      <div style={{ padding: '18px 20px 28px' }}>
        {tab === '📄 PDF 업로드'
          ? <PdfUpload onAnalyze={onAnalyze} onEdit={fillFromPdf} onHelp={() => setHelp(true)} />
          : <DirectInput vals={vals} setVals={setVals} onAnalyze={onAnalyze} toast={toast} />}
      </div>
      <PdfHelpModal open={help} onClose={() => setHelp(false)} />
    </div>
  );

  return (
    <div data-screen-label="검진 입력" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <div style={{ padding: '56px 20px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={goHub} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevL" size={24} color={T.inkMid} />
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>{DOC_CONFIGS[docType]?.label}</h1>
      </div>
      <div style={{ padding: '8px 20px 28px' }}>
        <DocumentCapture docType={docType} toast={toast} />
      </div>
    </div>
  );
}

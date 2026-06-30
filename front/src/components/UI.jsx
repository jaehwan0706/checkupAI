import React, { useState } from 'react';

/* ── Design tokens ── */
export const T = {
  blue:     '#00B894',
  blueDk:   '#00A382',
  blueSoft: '#E3F8F3',
  green:    '#4CAF82',
  greenSoft:'#E3F8F3',
  bg:       '#F8FAFB',
  card:     '#FFFFFF',
  ink:      '#2D3436',
  inkMid:   '#636E72',
  inkSoft:  '#8A97AC',
  line:     '#E8ECF0',
  ok:       '#00B894', okSoft: '#E3F8F3',
  warn:     '#D4920E', warnSoft: '#FEF3DC',
  danger:   '#E17055', dangerSoft: '#FCEAE5',
};

export const STATUS = {
  '정상': { color: T.ok,     soft: T.okSoft,     dot: '#3DA776', emoji: '✅' },
  '주의': { color: T.warn,   soft: T.warnSoft,   dot: '#E0982A', emoji: '⚠️' },
  '위험': { color: T.danger, soft: T.dangerSoft, dot: '#D9544B', emoji: '🚨' },
};

/* ── Icon ── */
export function Icon({ name, size = 24, color = 'currentColor', stroke = 2 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home:    <><path {...p} d="M3 10.5 12 3l9 7.5"/><path {...p} d="M5 9.5V20h14V9.5"/></>,
    plus:    <path {...p} d="M12 5v14M5 12h14"/>,
    report:  <><rect {...p} x="5" y="3" width="14" height="18" rx="2.5"/><path {...p} d="M9 8h6M9 12h6M9 16h3"/></>,
    trend:   <><path {...p} d="M4 16l4.5-5 3.5 3L20 7"/><path {...p} d="M15 7h5v5"/></>,
    pulse:   <><path {...p} d="M3 12h3.5l2-6 4 13 2.5-7H21"/></>,
    more:    <><circle cx="5" cy="12" r="1.6" fill={color} stroke="none"/><circle cx="12" cy="12" r="1.6" fill={color} stroke="none"/><circle cx="19" cy="12" r="1.6" fill={color} stroke="none"/></>,
    chevR:   <path {...p} d="M9 6l6 6-6 6"/>,
    chevL:   <path {...p} d="M15 6l-6 6 6 6"/>,
    chevD:   <path {...p} d="M6 9l6 6 6-6"/>,
    chevU:   <path {...p} d="M6 15l6-6 6 6"/>,
    check:   <path {...p} d="M5 12.5l4.5 4.5L19 7"/>,
    cross:   <path {...p} d="M6 6l12 12M18 6L6 18"/>,
    bell:    <><path {...p} d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path {...p} d="M10 20a2 2 0 0 0 4 0"/></>,
    spark:   <><path {...p} d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path {...p} d="M6.5 6.5l2.4 2.4M15.1 15.1l2.4 2.4M17.5 6.5l-2.4 2.4M8.9 15.1l-2.4 2.4"/></>,
    heart:   <path {...p} d="M12 20s-6.5-4.2-6.5-9A3.5 3.5 0 0 1 12 8.3 3.5 3.5 0 0 1 18.5 11c0 4.8-6.5 9-6.5 9Z"/>,
    drop:    <path {...p} d="M12 3.5s5.5 6 5.5 9.8A5.5 5.5 0 0 1 6.5 13.3C6.5 9.5 12 3.5 12 3.5Z"/>,
    pdf:     <><path {...p} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path {...p} d="M14 3v5h5"/></>,
    crown:   <path {...p} d="M4 18h16M4 18l-1-9 5 4 4-7 4 7 5-4-1 9"/>,
    settings:<><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M12 2v3M12 19v3M22 12h-3M5 12H2M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"/></>,
    food:    <><path {...p} d="M5 3v8M8 3v8M6.5 11v10M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4 .5-5-2.5-5Z"/><path {...p} d="M16 16v5"/></>,
    run:     <><circle {...p} cx="13" cy="4.5" r="1.8"/><path {...p} d="M5 21l3-5 3 1 1-4 3 3 3 1M9 11l3-2 3 1"/></>,
    moon:    <path {...p} d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>,
    lock:    <><rect {...p} x="5" y="10" width="14" height="10" rx="2"/><path {...p} d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    user:    <><circle {...p} cx="12" cy="8.5" r="3.7"/><path {...p} d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></>,
    mail:    <><rect {...p} x="3" y="5" width="18" height="14" rx="2.5"/><path {...p} d="M4 7l8 6 8-6"/></>,
    eye:     <><path {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle {...p} cx="12" cy="12" r="3"/></>,
    eyeoff:  <><path {...p} d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path {...p} d="M9.4 5.3A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.8M6.3 6.3A16 16 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3.2-.5"/></>,
    cal:     <><rect {...p} x="4" y="5" width="16" height="16" rx="2.5"/><path {...p} d="M4 9h16M8 3v4M16 3v4"/></>,
    edit:    <><path {...p} d="M5 19h3l9-9-3-3-9 9v3Z"/><path {...p} d="M14 6l3 3"/></>,
    logout:  <><path {...p} d="M15 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/><path {...p} d="M10 12h10M17 9l3 3-3 3M5 4h.01"/></>,
    question:<><circle {...p} cx="12" cy="12" r="9"/><path {...p} d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3"/><circle cx="12" cy="16.5" r="1" fill={color} stroke="none"/></>,
    info:    <><circle {...p} cx="12" cy="12" r="9"/><path {...p} d="M12 11v5"/><circle cx="12" cy="8" r="1" fill={color} stroke="none"/></>,
    arrow:   <path {...p} d="M5 12h14M13 6l6 6-6 6"/>,
    doc:     <><path {...p} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path {...p} d="M14 3v5h5M9 13h6M9 17h4"/></>,
    shield:  <><path {...p} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path {...p} d="M9 12l2 2 4-4"/></>,
    body:    <><circle {...p} cx="12" cy="4.5" r="2"/><path {...p} d="M12 7v8M7 10l5-1 5 1M9 21l3-6 3 6"/></>,
    flask:   <><path {...p} d="M9 3h6M10 3v6l-4.5 8a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9V3"/><path {...p} d="M7.5 15h9"/></>,
    star:    <path fill={color} stroke="none" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z"/>,
    bolt:    <path {...p} d="M13 3L5 13h6l-1 8 8-10h-6z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
}

/* ── Badge ── */
export function Badge({ status, small }) {
  const s = STATUS[status] || STATUS['정상'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.soft, color: s.color,
      fontSize: small ? 11 : 12.5, fontWeight: 700,
      padding: small ? '3px 8px' : '4px 10px', borderRadius: 999,
      letterSpacing: '-0.01em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />{status}
    </span>
  );
}

/* ── Card ── */
export function Card({ children, style, onClick, pad = 16 }) {
  return (
    <div onClick={onClick} style={{
      background: T.card, borderRadius: 16, padding: pad,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid ' + T.line, ...style,
    }}>{children}</div>
  );
}

/* ── Button ── */
export function Button({ children, onClick, variant = 'primary', style, icon, disabled }) {
  const variants = {
    primary: { background: T.blue,  color: '#fff', boxShadow: '0 8px 20px rgba(0,184,148,0.28)' },
    green:   { background: T.green, color: '#fff', boxShadow: '0 8px 20px rgba(76,175,130,0.3)' },
    ghost:   { background: T.blueSoft, color: T.blue, boxShadow: 'none' },
    gold:    { background: 'linear-gradient(180deg,#F0B445,#E0982A)', color: '#3A2A06', boxShadow: '0 10px 24px rgba(224,152,42,0.38)' },
    outline: { background: '#fff', color: T.inkMid, border: '1px solid ' + T.line, boxShadow: '0 1px 3px rgba(26,43,69,0.05)' },
    danger:  { background: T.danger, color: '#fff', boxShadow: 'none' },
  };
  const dis = disabled ? { background: '#C6D3E6', boxShadow: 'none', cursor: 'not-allowed', color: '#fff' } : {};
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      width: '100%', height: 54, borderRadius: 15, fontSize: '1.0312rem', fontWeight: 700, letterSpacing: '-0.01em',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'transform .12s ease', ...variants[variant], ...dis, ...style,
    }}
    onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.98)')}
    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >{children}{icon && <Icon name={icon} size={19} color="currentColor" />}</button>
  );
}

/* ── Segmented control ── */
export function Segmented({ items, value, onChange, small }) {
  return (
    <div style={{ display: 'flex', background: '#EAEFF5', borderRadius: 13, padding: 4, gap: 4 }}>
      {items.map(it => {
        const active = it === value;
        return (
          <button key={it} onClick={() => onChange(it)} style={{
            flex: 1, height: small ? 34 : 38, borderRadius: 10, fontSize: small ? 13 : 14, fontWeight: 700,
            letterSpacing: '-0.01em', color: active ? T.blue : T.inkSoft,
            background: active ? '#fff' : 'transparent',
            boxShadow: active ? '0 2px 6px rgba(26,43,69,0.1)' : 'none', transition: 'all .18s ease',
          }}>{it}</button>
        );
      })}
    </div>
  );
}

/* ── Toggle ── */
export function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 48, height: 29, borderRadius: 999, padding: 2, flexShrink: 0,
      background: on ? T.green : '#D5DCE6', transition: 'background .2s ease',
      display: 'flex', alignItems: 'center',
    }}>
      <span style={{
        width: 25, height: 25, borderRadius: 999, background: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
        transform: on ? 'translateX(19px)' : 'translateX(0)',
        transition: 'transform .2s cubic-bezier(.4,0,.2,1)',
        display: 'block',
      }} />
    </button>
  );
}

/* ── Sub-page header ── */
export function SubHeader({ title, onBack, right }) {
  return (
    <div style={{ padding: '56px 14px 8px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <button onClick={onBack} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevL" size={24} color={T.inkMid} />
      </button>
      <h1 style={{ flex: 1, margin: 0, fontSize: '1.1875rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>{title}</h1>
      {right}
    </div>
  );
}

/* ── Field ── */
export function Field({ label, type = 'text', placeholder, value, onChange, icon, error, suffix, inputMode, onEnter }) {
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  const realType = isPw ? (show ? 'text' : 'password') : type;
  const borderColor = error ? T.danger : (focus ? T.blue : T.line);
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: '0.7812rem', fontWeight: 700, color: T.inkMid, margin: '0 0 7px 2px' }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 14px', borderRadius: 14, background: '#fff',
        border: '1.5px solid ' + borderColor,
        boxShadow: focus && !error ? '0 0 0 4px rgba(30,77,140,0.1)' : (error ? '0 0 0 4px rgba(217,84,75,0.08)' : 'none'),
        transition: 'all .15s ease',
      }}>
        {icon && <Icon name={icon} size={19} color={error ? T.danger : (focus ? T.blue : '#A6B1C2')} stroke={2} />}
        <input
          type={realType} placeholder={placeholder} value={value} inputMode={inputMode}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9375rem', fontWeight: 500, color: T.ink, fontFamily: 'inherit' }}
        />
        {suffix && <span style={{ fontSize: '0.8125rem', color: T.inkSoft, fontWeight: 600, flexShrink: 0 }}>{suffix}</span>}
        {isPw && (
          <button onClick={() => setShow(s => !s)} style={{ flexShrink: 0, padding: 2 }}>
            <Icon name={show ? 'eye' : 'eyeoff'} size={19} color="#A6B1C2" stroke={1.9} />
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: '0.7188rem', color: T.danger, fontWeight: 600, margin: '6px 0 0 4px' }}>{error}</div>}
    </div>
  );
}

/* ── Spinner ── */
export function Spinner({ size = 28, color = '#fff', stroke = 3 }) {
  return (
    <span style={{ display: 'inline-block', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'hlspin .8s linear infinite' }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth={stroke} />
        <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      </svg>
    </span>
  );
}

/* ── Loading (alias for Spinner) ── */
export function Loading({ size = 36 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Spinner size={size} color={T.blue} stroke={3} />
    </div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,32,52,0.45)', backdropFilter: 'blur(2px)', animation: 'hlfade .2s ease' }} />
      <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: 22, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', animation: 'hlpop .26s cubic-bezier(.2,.9,.3,1.2)' }}>
        {children}
      </div>
    </div>
  );
}

/* ── ConfirmModal ── */
export function ConfirmModal({ open, title, body, confirmLabel = '확인', cancelLabel = '취소', danger, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: T.ink, letterSpacing: '-0.01em', textAlign: 'center' }}>{title}</h3>
      {body && <p style={{ margin: '10px 0 0', fontSize: '0.8438rem', color: T.inkMid, lineHeight: 1.55, textAlign: 'center' }}>{body}</p>}
      <div style={{ display: 'flex', gap: 9, marginTop: 22 }}>
        <button onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 14, background: T.bg, color: T.inkMid, fontSize: '0.9375rem', fontWeight: 700 }}>{cancelLabel}</button>
        <button onClick={onConfirm} style={{ flex: 1, height: 50, borderRadius: 14, background: danger ? T.danger : T.blue, color: '#fff', fontSize: '0.9375rem', fontWeight: 700 }}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

/* ── BottomSheet ── */
export function BottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,32,52,0.45)', backdropFilter: 'blur(2px)', animation: 'hlfade .2s ease' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: '26px 26px 0 0', padding: '10px 22px 30px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', animation: 'hlsheet .32s cubic-bezier(.2,.8,.2,1)', maxHeight: '88%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#E0E5EC', margin: '0 auto 16px' }} />
        {children}
      </div>
    </div>
  );
}

/* ── Toast ── */
export function Toast({ toast: t }) {
  if (!t) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 96, display: 'flex', justifyContent: 'center', zIndex: 300, pointerEvents: 'none', padding: '0 24px' }}>
      <div style={{ background: 'rgba(26,43,69,0.94)', color: '#fff', fontSize: '0.8438rem', fontWeight: 600, padding: '13px 18px', borderRadius: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.3)', animation: 'hltoast .3s cubic-bezier(.2,.9,.3,1.1)', display: 'flex', alignItems: 'center', gap: 9, maxWidth: '100%' }}>
        {t.icon && <Icon name={t.icon} size={17} color="#9DE0BE" stroke={2.3} />}
        <span>{t.msg}</span>
      </div>
    </div>
  );
}

/* ── BottomNav ── */
export function BottomNav({ active, onNav, onMore }) {
  const tabs = [
    { id: 'home',    label: '홈',    icon: 'home' },
    { id: 'input',   label: '입력',  icon: 'plus' },
    { id: 'report',  label: '리포트',icon: 'report' },
    { id: 'daily',   label: '건강',  icon: 'pulse' },
    { id: 'history', label: '기록',  icon: 'doc' },
  ];
  const historyScreens = ['history', 'premium', 'my', 'goals', 'notifications', 'consent', 'privacy', 'terms', 'profile'];
  const activeTab = historyScreens.includes(active) ? 'history' : (active === 'trends' ? 'daily' : active);
  return (
    <div style={{
      flexShrink: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderTop: '1px solid ' + T.line, padding: '8px 6px 30px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
    }}>
      {tabs.map(t => {
        const on = activeTab === t.id;
        return (
          <button key={t.id} onClick={() => onNav && onNav(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, padding: '4px 0', color: on ? T.blue : T.inkSoft,
          }}>
            <Icon name={t.icon} size={24} color={on ? T.blue : '#A6B1C2'} stroke={on ? 2.2 : 1.9} />
            <span style={{ fontSize: '0.6562rem', fontWeight: on ? 700 : 600, letterSpacing: '-0.01em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── ToastProvider (legacy shim – kept for any surviving import) ── */
export function ToastProvider() { return null; }

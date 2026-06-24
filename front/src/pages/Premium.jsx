import React, { useState } from 'react';
import { T, Icon, Button, Modal, Spinner } from '../components/UI';

const TOSS_CLIENT_KEY = 'test_ck_LlDJaYngroyvdyXpMqRX3ezGdRpX';

function loadTossScript() {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) { resolve(window.TossPayments); return; }
    const existing = document.querySelector('script[src*="tosspayments"]');
    if (existing) { existing.addEventListener('load', () => resolve(window.TossPayments)); return; }
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.onload = () => resolve(window.TossPayments);
    script.onerror = () => reject(new Error('Toss SDK load failed'));
    document.head.appendChild(script);
  });
}

function PlanFeature({ children, light }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <Icon name="check" size={15} color={light ? '#9DE0BE' : T.green} stroke={2.8} />
      <span style={{ fontSize: 13, fontWeight: 600, color: light ? '#fff' : T.ink }}>{children}</span>
    </div>
  );
}

export function PremiumLockModal({ open, onClose, onUpgrade }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 17, background: 'linear-gradient(180deg,#F0B445,#E0982A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 22px rgba(224,152,42,0.38)' }}>
          <Icon name="lock" size={26} color="#fff" stroke={2.1} />
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.ink }}>프리미엄 기능이에요</h3>
        <p style={{ margin: '10px 0 20px', fontSize: 13.5, color: T.inkMid, lineHeight: 1.6 }}>이 기능은 연간 패스에서 이용할 수 있어요. 지금 시작하고 모든 기능을 누려보세요.</p>
      </div>
      <Button variant="gold" onClick={onUpgrade} icon="crown">플랜 보기</Button>
      <button onClick={onClose} style={{ width: '100%', height: 48, marginTop: 6, fontSize: 14, fontWeight: 700, color: T.inkSoft }}>닫기</button>
    </Modal>
  );
}

export default function Premium({ onClose, toast, onNav }) {
  const [paying, setPaying] = useState(null); // null | 'single' | 'annual'

  const startPayment = async (type) => {
    if (paying) return;
    setPaying(type);
    try {
      const TossPayments = await loadTossScript();
      const toss = TossPayments(TOSS_CLIENT_KEY);
      const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
      const customerName = user.name || '검진AI 사용자';
      const origin = window.location.origin;

      if (type === 'single') {
        const checkupId = localStorage.getItem('lastCheckupId');
        if (!checkupId) {
          toast?.('먼저 검진 결과를 입력해주세요', 'info');
          setPaying(null);
          return;
        }
        const orderId = `ORDER-SINGLE-${checkupId}-${Date.now()}`;
        await toss.requestPayment('카드', {
          amount: 1900,
          orderId,
          orderName: '건강검진 AI 리포트',
          customerName,
          successUrl: origin,
          failUrl: origin,
        });
      } else {
        const orderId = `ORDER-ANNUAL-${Date.now()}`;
        await toss.requestPayment('카드', {
          amount: 9900,
          orderId,
          orderName: '건강검진AI 연간 패스',
          customerName,
          successUrl: origin,
          failUrl: origin,
        });
      }
    } catch (err) {
      const isCancelled = err?.code === 'USER_CANCEL' || err?.message === 'cancel' || err?.message?.includes('취소');
      if (!isCancelled) toast?.('결제를 시작할 수 없어요', 'bolt');
      setPaying(null);
    }
  };

  const BuyBtn = ({ type, children, style }) => (
    <button
      onClick={() => startPayment(type)}
      disabled={paying !== null}
      style={{ width: '100%', height: type === 'annual' ? 50 : 48, borderRadius: type === 'annual' ? 14 : 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: type === 'annual' ? 15.5 : 15, fontWeight: 800, opacity: paying ? 0.75 : 1, ...style }}
    >
      {paying === type ? <Spinner size={20} color={type === 'annual' ? '#3A2A06' : '#fff'} stroke={2.5} /> : children}
    </button>
  );

  return (
    <div data-screen-label="프리미엄" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 24px 0', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: 16, background: 'linear-gradient(180deg,#F0B445,#E0982A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 22px rgba(224,152,42,0.4)' }}>
          <Icon name="crown" size={27} color="#fff" stroke={2.1} />
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>내 건강, 제대로 알아봐요</h1>
        <p style={{ margin: '7px 0 0', fontSize: 13, color: T.inkSoft }}>AI가 분석한 나만의 건강 리포트</p>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 건당 해석 */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid ' + T.line, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>건당 해석</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: T.inkMid }}><b style={{ fontSize: 17, color: T.ink }}>1,900원</b> / 1회</span>
          </div>
          <div style={{ borderTop: '1px solid ' + T.line, paddingTop: 10, marginBottom: 14 }}>
            <PlanFeature>검진 결과 AI 상세 해석</PlanFeature>
            <PlanFeature>생활습관 개선 가이드</PlanFeature>
            <PlanFeature>PDF 리포트 저장 1회</PlanFeature>
          </div>
          <BuyBtn type="single" style={{ background: '#00B894', color: '#fff' }}>지금 해석받기</BuyBtn>
        </div>

        {/* 연간 패스 */}
        <div style={{ position: 'relative', borderRadius: 18, padding: 18, background: 'linear-gradient(160deg,#1E4D8C 0%,#163A6B 100%)', boxShadow: '0 16px 36px rgba(30,77,140,0.34)', border: '1.5px solid #F0B445' }}>
          <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(180deg,#F0B445,#E0982A)', color: '#3A2A06', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 999, boxShadow: '0 6px 14px rgba(224,152,42,0.4)', whiteSpace: 'nowrap' }}>👑 가장 인기</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>연간 패스</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}><b style={{ fontSize: 19, color: '#fff' }}>9,900원</b> / 년</span>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9DE0BE', marginTop: 4 }}>월 825원 · 건당보다 79% 저렴</div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.16)', paddingTop: 10, marginTop: 12, marginBottom: 14 }}>
            <PlanFeature light>무제한 AI 해석</PlanFeature>
            <PlanFeature light>연도별 트렌드 분석</PlanFeature>
            <PlanFeature light>일상 건강관리 AI 코치</PlanFeature>
            <PlanFeature light>PDF 리포트 무제한</PlanFeature>
            <PlanFeature light>가족 계정 1개 추가</PlanFeature>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>이번 달 2,847명이 선택했어요 ⭐ 4.9</div>
          <BuyBtn type="annual" style={{ background: 'linear-gradient(180deg,#F0B445,#E0982A)', color: '#3A2A06', boxShadow: '0 8px 18px rgba(224,152,42,0.36)' }}>연간 패스 시작하기</BuyBtn>
        </div>
      </div>

      <div style={{ padding: '16px 24px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: T.inkSoft, fontWeight: 600 }}>
            <Icon name="check" size={13} color={T.green} stroke={2.6} /> 구독 아님 · 연간 1회 결제
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: T.inkSoft, fontWeight: 600 }}>
            <Icon name="shield" size={13} color={T.green} stroke={2} /> 7일 이내 환불 가능
          </span>
        </div>
        {onNav && (
          <button onClick={() => { onClose(); onNav('premiumReport'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: T.blue, padding: '6px 0' }}>
            <Icon name="spark" size={14} color={T.blue} stroke={2.3} />
            샘플 AI 리포트 미리보기
            <Icon name="chevR" size={14} color={T.blue} />
          </button>
        )}
        <button onClick={onClose} disabled={paying !== null} style={{ fontSize: 13.5, fontWeight: 700, color: T.inkSoft, padding: 8, opacity: paying ? 0.5 : 1 }}>나중에 하기</button>
      </div>
    </div>
  );
}

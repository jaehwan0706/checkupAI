import React, { useState, useEffect, useCallback } from 'react';
import { T, Icon, SubHeader } from '../components/UI';
import api from '../api';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function NotificationList({ onNav, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/api/notifications')
      .then(res => {
        const list = res.data.data || [];
        setNotifications(list);
        onUnreadChange && onUnreadChange(list.some(n => !n.read));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [onUnreadChange]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    if (notifications.find(n => n.id === id)?.read) return;
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
        onUnreadChange && onUnreadChange(updated.some(n => !n.read));
        return updated;
      });
    } catch {}
  };

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  return (
    <div data-screen-label="알림" className="nd-no-scrollbar" style={{ flex: 1, overflow: 'auto', background: T.bg }}>
      <SubHeader title="알림" onBack={() => onNav('home')} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span style={{ fontSize: '0.8125rem', color: T.inkSoft }}>불러오는 중...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: T.bg, border: '1.5px solid ' + T.line, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={26} color={T.inkSoft} stroke={1.8} />
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: T.ink }}>알림이 없어요</div>
          <div style={{ fontSize: '0.8125rem', color: T.inkSoft }}>새로운 알림이 오면 여기에 표시돼요</div>
        </div>
      ) : (
        <div style={{ padding: '8px 0 32px' }}>
          {unread.length > 0 && (
            <>
              <div style={{ padding: '8px 20px 6px', fontSize: '0.75rem', fontWeight: 800, color: T.inkSoft }}>읽지 않은 알림</div>
              {unread.map(n => <NotifItem key={n.id} n={n} onRead={markRead} />)}
            </>
          )}
          {read.length > 0 && (
            <>
              <div style={{ padding: '16px 20px 6px', fontSize: '0.75rem', fontWeight: 800, color: T.inkSoft }}>읽은 알림</div>
              {read.map(n => <NotifItem key={n.id} n={n} onRead={markRead} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NotifItem({ n, onRead }) {
  return (
    <button
      onClick={() => onRead(n.id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 13,
        padding: '14px 20px', textAlign: 'left',
        background: n.read ? 'transparent' : '#EFF6FF',
        borderBottom: '1px solid ' + T.line,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0, marginTop: 1,
        background: n.read ? T.bg : T.blueSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="bell" size={18} color={n.read ? T.inkSoft : T.blue} stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: n.read ? 600 : 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {n.title}
          </span>
          {!n.read && (
            <span style={{ width: 8, height: 8, borderRadius: 999, background: T.blue, flexShrink: 0 }} />
          )}
        </div>
        <div style={{ fontSize: '0.8125rem', color: T.inkMid, marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
        <div style={{ fontSize: '0.7188rem', color: T.inkSoft, marginTop: 5 }}>{timeAgo(n.createdAt)}</div>
      </div>
    </button>
  );
}

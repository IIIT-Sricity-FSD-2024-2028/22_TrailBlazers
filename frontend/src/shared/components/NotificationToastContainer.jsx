import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  DollarSign, 
  CheckSquare, 
  Users, 
  Mic, 
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function NotificationToastContainer({ user, onNavigate, onRefreshBadge }) {
  const [activeToasts, setActiveToasts] = useState([]);
  const seenNotifIds = useRef(new Set());
  const timerMap = useRef(new Map());

  useEffect(() => {
    if (!user) {
      setActiveToasts([]);
      seenNotifIds.current.clear();
      timerMap.current.forEach(timer => clearTimeout(timer));
      timerMap.current.clear();
      return;
    }

    // Auto-expire any orphaned pending popups on load/refresh so no notifications are lost
    autoExpireOrphaned();

    // Poll for new POPUP_PENDING notifications
    pollPendingPopups();
    const interval = setInterval(pollPendingPopups, 5000);

    return () => {
      clearInterval(interval);
      timerMap.current.forEach(timer => clearTimeout(timer));
    };
  }, [user]);

  const autoExpireOrphaned = async () => {
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) return;
      const res = await fetch('/api/notifications/auto-expire', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.unreadCount !== undefined && onRefreshBadge) {
        onRefreshBadge(data.unreadCount);
      }
    } catch (err) {
      console.error('Error auto-expiring notifications:', err);
    }
  };

  const pollPendingPopups = async () => {
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) return;

      const res = await fetch('/api/notifications/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && Array.isArray(data.pendingPopups)) {
        for (const notif of data.pendingPopups) {
          if (!seenNotifIds.current.has(notif.id)) {
            seenNotifIds.current.add(notif.id);
            enqueueToast(notif);
          }
        }
      }
    } catch (err) {
      console.error('Error polling pending popups:', err);
    }
  };

  const enqueueToast = (notif) => {
    setActiveToasts(prev => [...prev, notif]);

    // Start 5-Second Expiration Timer (5000ms)
    const timer = setTimeout(() => {
      handleExpire(notif.id);
    }, 5000);

    timerMap.current.set(notif.id, timer);
  };

  const removeToastState = (id) => {
    if (timerMap.current.has(id)) {
      clearTimeout(timerMap.current.get(id));
      timerMap.current.delete(id);
    }
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. User Clicks "View / Action" (HANDLED)
  const handleViewAction = async (notif) => {
    removeToastState(notif.id);

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/notifications/${notif.id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'VIEW' })
      });
      const data = await res.json();
      if (data.unreadCount !== undefined && onRefreshBadge) {
        onRefreshBadge(data.unreadCount);
      }
    } catch (err) {
      console.error('Error handling notification view:', err);
    }

    // Navigate to authorized space
    const type = notif.type;
    const role = (user?.role || '').toUpperCase();

    if (type === 'OPERATIONAL_ISSUE' || type === 'TECHNICAL_ISSUE' || notif.entityType === 'ISSUE') {
      if (role === 'SUPER_ADMIN') onNavigate && onNavigate('super-admin-space');
      else if (role === 'DEPARTMENT_MANAGER') onNavigate && onNavigate('department-manager-space');
      else if (role === 'IT_SUPPORT') onNavigate && onNavigate('it-support-space');
      else if (role === 'EVENT_MANAGER') onNavigate && onNavigate('event-manager-space');
      else if (role === 'ONSITE_COORDINATOR') onNavigate && onNavigate('onsite-coordinator-space');
      else onNavigate && onNavigate('dashboard');
    } else if (type === 'QUOTATION_APPROVED' || type === 'QUOTATION_REJECTED' || notif.entityType === 'QUOTATION') {
      if (role === 'REVENUE') onNavigate && onNavigate('revenue-space');
      else if (role === 'DEPARTMENT_MANAGER') onNavigate && onNavigate('department-manager-space');
      else onNavigate && onNavigate('dashboard');
    } else {
      if (role === 'SUPER_ADMIN') onNavigate && onNavigate('super-admin-space');
      else if (role === 'DEPARTMENT_MANAGER') onNavigate && onNavigate('department-manager-space');
      else if (role === 'IT_SUPPORT') onNavigate && onNavigate('it-support-space');
      else if (role === 'EVENT_MANAGER') onNavigate && onNavigate('event-manager-space');
      else if (role === 'ONSITE_COORDINATOR') onNavigate && onNavigate('onsite-coordinator-space');
      else if (role === 'REVENUE') onNavigate && onNavigate('revenue-space');
      else onNavigate && onNavigate('dashboard');
    }
  };

  // 2. User Clicks Dismiss / ✕ (DISMISSED)
  const handleDismiss = async (id, e) => {
    if (e) e.stopPropagation();
    removeToastState(id);

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/notifications/${id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'DISMISS' })
      });
      const data = await res.json();
      if (data.unreadCount !== undefined && onRefreshBadge) {
        onRefreshBadge(data.unreadCount);
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  // 3. No Interaction for 5 Seconds -> EXPIRE -> Becomes MISSED (+1 Badge)
  const handleExpire = async (id) => {
    removeToastState(id);

    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/notifications/${id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'EXPIRE' })
      });
      const data = await res.json();
      if (data.unreadCount !== undefined && onRefreshBadge) {
        onRefreshBadge(data.unreadCount);
      }
    } catch (err) {
      console.error('Error expiring notification:', err);
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'QUOTATION_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'QUOTATION_REJECTED':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'OPERATIONAL_ISSUE':
      case 'TECHNICAL_ISSUE':
        return <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />;
      default:
        return <Bell className="w-5 h-5 text-purple-300" />;
    }
  };

  const getActionButtonLabel = (type, entityType) => {
    if (type === 'OPERATIONAL_ISSUE' || type === 'TECHNICAL_ISSUE' || entityType === 'ISSUE') {
      return 'View Issue';
    }
    if (type === 'QUOTATION_APPROVED' || type === 'QUOTATION_REJECTED' || entityType === 'QUOTATION') {
      return 'View Quotation';
    }
    if (type === 'NEW_EVENT_REQUEST') {
      return 'View Request';
    }
    return 'View Details';
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {activeToasts.map(notif => (
        <div
          key={notif.id}
          className="pointer-events-auto relative w-full bg-[#180E2E]/95 backdrop-blur-2xl text-white rounded-3xl p-4 shadow-2xl border border-purple-500/40 overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-2xl bg-white/10 border border-white/15 shrink-0">
                {getToastIcon(notif.type)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate leading-snug">
                  {notif.title}
                </h4>
                {notif.eventName && (
                  <p className="text-[10px] font-bold text-purple-300 truncate">
                    {notif.eventName}
                  </p>
                )}
              </div>
            </div>

            {/* Dismiss X Button */}
            <button
              onClick={(e) => handleDismiss(notif.id, e)}
              className="p-1.5 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Body */}
          <p className="mt-2 text-xs text-purple-100/90 font-medium line-clamp-2 leading-relaxed">
            {notif.message}
          </p>

          {/* Action Footer */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-purple-500/20">
            <span className="text-[10px] font-extrabold text-amber-300 animate-pulse">
              ⏱ 5s popup active
            </span>

            <button
              onClick={() => handleViewAction(notif)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
            >
              <span>{getActionButtonLabel(notif.type, notif.entityType)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5-Second Shrinking Visual Progress Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-950/40 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 transition-all duration-[5000ms] ease-linear w-0"
              style={{
                width: '100%',
                animation: 'shrinkWidth 5s linear forwards'
              }}
            />
          </div>
        </div>
      ))}

      {/* Inline CSS Animation keyframe for progress bar */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

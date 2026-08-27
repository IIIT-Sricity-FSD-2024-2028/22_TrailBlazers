import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  FileText, 
  DollarSign, 
  CheckSquare, 
  Users, 
  Mic, 
  HelpCircle, 
  Vote, 
  AlertTriangle, 
  Award, 
  BarChart3, 
  X,
  Sparkles,
  User,
  Calendar,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function NotificationPanel({ user, onNavigate, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) return;

      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('ffsd_token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('ffsd_token');
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        alert('Unable to clear notifications. Please try again.');
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
      alert('Unable to clear notifications. Please try again.');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (notif.isRead === 0) {
      handleMarkAsRead(notif.id);
    }
    
    if (onClose) onClose();

    const type = notif.type;
    const role = (user?.role || '').toUpperCase();
    const dept = (user?.department || '').toUpperCase();

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
    } else if (type === 'NEW_EVENT_REQUEST' || type === 'EVENT_READY_FOR_PREPARATION') {
      if (role === 'EVENT_MANAGER') onNavigate && onNavigate('event-manager-space');
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'QUOTATION_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'QUOTATION_REJECTED':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'NEW_EVENT_REQUEST':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'QUOTATION_SENT':
      case 'QUOTATION_UPDATED':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'EVENT_READY_FOR_PREPARATION':
      case 'EVENT_READY':
        return <CheckSquare className="w-4 h-4 text-purple-600" />;
      case 'COORDINATOR_ASSIGNED':
        return <Users className="w-4 h-4 text-teal-600" />;
      case 'SESSION_ASSIGNED':
        return <Mic className="w-4 h-4 text-indigo-600" />;
      case 'OPERATIONAL_ISSUE':
      case 'TECHNICAL_ISSUE':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'ANALYTICS_AVAILABLE':
        return <BarChart3 className="w-4 h-4 text-purple-700" />;
      default:
        return <Bell className="w-4 h-4 text-purple-600" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl border border-purple-200/80 rounded-3xl shadow-2xl shadow-purple-950/30 overflow-hidden z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Panel Header */}
      <div className="p-4 bg-gradient-to-r from-[#2A1B54] via-[#4C2882] to-[#1E1238] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-300" />
          <h3 className="text-xs font-black tracking-wider uppercase">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-extrabold text-purple-200 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] font-extrabold text-rose-300 hover:text-rose-100 transition flex items-center gap-1 cursor-pointer bg-white/10 px-2 py-1 rounded-full"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-600 shadow-2xs">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">You're all caught up!</h4>
            <p className="text-[11px] text-slate-400 font-medium">No new notifications.</p>
          </div>
        ) : (
          notifications.map(notif => {
            const isUnread = notif.isRead === 0;
            const isClientViewer = !user?.role || user?.role === 'ATTENDEE' || user?.role === 'CLIENT';
            const isRevenueSender = notif.senderRole === 'Revenue Team';

            const displaySenderName = (isRevenueSender && isClientViewer) ? 'Revenue Team' : (notif.senderName || 'System');
            const displaySenderRole = (isRevenueSender && isClientViewer) ? null : notif.senderRole;
            const eventName = notif.eventName;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-purple-50/80 ${
                  isUnread ? 'bg-purple-50/50 border-l-4 border-purple-600' : 'bg-white opacity-90'
                }`}
              >
                <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  {/* Sender Name & Role where available */}
                  {(displaySenderName || displaySenderRole) && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1">
                        <User className="w-3 h-3 text-purple-600 inline" />
                        {displaySenderName}
                      </span>
                      {displaySenderRole && (
                        <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 font-bold text-[9px] border border-purple-200">
                          {displaySenderRole}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Title & Time Ago */}
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs truncate ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-400 shrink-0">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  {/* Notification Message */}
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Event Name Tag where available */}
                  {eventName && (
                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        <Calendar className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[180px]">{eventName}</span>
                      </span>
                    </div>
                  )}
                </div>

                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-2.5 shadow-xs animate-pulse"></span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer with Clear Notifications Action */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-4">
        <span className="text-[10px] font-bold text-slate-400">
          {notifications.length} notification{notifications.length === 1 ? '' : 's'}
        </span>

        {notifications.length > 0 ? (
          <button
            onClick={handleClearAll}
            className="text-[11px] font-black text-rose-600 hover:text-rose-700 transition flex items-center gap-1 cursor-pointer hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear notifications</span>
          </button>
        ) : (
          <span className="text-[10px] font-extrabold text-purple-700">
            Wavevents Central Notifications
          </span>
        )}
      </div>

    </div>
  );
}

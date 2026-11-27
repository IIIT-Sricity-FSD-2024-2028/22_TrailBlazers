import { notificationsActions } from './notifications-slice';

const getHeaders = (getState) => {
  const token = getState().auth.token || localStorage.getItem('ffsd_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchNotificationsData = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) return { notifications: [], unreadCount: 0 };
    try {
      const res = await fetch('/api/notifications', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(
          notificationsActions.displayNotifications({
            notifications: data.notifications || [],
            unreadCount: data.unreadCount,
          })
        );
        return data;
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
    return { notifications: [], unreadCount: 0 };
  };
};

export const fetchPendingToasts = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) return [];
    try {
      const res = await fetch('/api/notifications/pending', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(notificationsActions.displayPendingToasts(data.pending || []));
        return data.pending || [];
      }
    } catch (err) {
      console.error('Error fetching pending notifications:', err);
    }
    return [];
  };
};

export const markNotificationReadAction = (id) => {
  return async (dispatch, getState) => {
    dispatch(notificationsActions.markAsRead(id));
    try {
      const token = getState().auth.token || localStorage.getItem('ffsd_token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
};

export const markAllNotificationsReadAction = () => {
  return async (dispatch, getState) => {
    dispatch(notificationsActions.markAllAsRead());
    try {
      const token = getState().auth.token || localStorage.getItem('ffsd_token');
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
};

export const clearAllNotificationsAction = () => {
  return async (dispatch, getState) => {
    dispatch(notificationsActions.clearAllNotifications());
    try {
      const token = getState().auth.token || localStorage.getItem('ffsd_token');
      const res = await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to clear notifications on server.');
      }
      return { success: true };
    } catch (err) {
      console.error('Error clearing notifications:', err);
      dispatch(notificationsActions.notificationsActionFailed(err.message));
      await dispatch(fetchNotificationsData());
      return { success: false, error: err.message };
    }
  };
};

export const autoExpireNotificationsAction = () => {
  return async (dispatch, getState) => {
    try {
      const token = getState().auth.token || localStorage.getItem('ffsd_token');
      if (!token) return;
      await fetch('/api/notifications/auto-expire', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error auto-expiring notifications:', err);
    }
  };
};

export const interactNotificationAction = (id, action) => {
  return async (dispatch, getState) => {
    dispatch(notificationsActions.removePendingToast(id));
    try {
      const token = getState().auth.token || localStorage.getItem('ffsd_token');
      const res = await fetch(`/api/notifications/${id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.unreadCount !== undefined) {
        dispatch(notificationsActions.setUnreadCount(data.unreadCount));
      }
      return data;
    } catch (err) {
      console.error(`Error performing notification ${action}:`, err);
      return null;
    }
  };
};

export { notificationsActions };



import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    notifications: [],
    pendingToasts: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    fetchNotificationsStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayNotifications(state, action) {
      state.notifications = action.payload.notifications || [];
      state.items = state.notifications;
      state.unreadCount = action.payload.unreadCount !== undefined ? action.payload.unreadCount : state.notifications.filter((n) => !n.read).length;
      state.loading = false;
      state.error = null;
    },
    displayPendingToasts(state, action) {
      state.pendingToasts = action.payload || [];
    },
    markAsRead(state, action) {
      const id = action.payload;
      state.notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true, isRead: 1 } : n));
      state.items = state.notifications;
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    markAllAsRead(state) {
      state.notifications = state.notifications.map((n) => ({ ...n, read: true, isRead: 1 }));
      state.items = state.notifications;
      state.unreadCount = 0;
    },
    clearAllNotifications(state) {
      state.notifications = [];
      state.items = [];
      state.unreadCount = 0;
    },
    notificationsActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const notificationsActions = notificationsSlice.actions;

export default notificationsSlice;


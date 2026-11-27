import { configureStore } from '@reduxjs/toolkit';
import authSlice from './auth-slice.js';
import eventsSlice from './events-slice.js';
import ticketsSlice from './tickets-slice.js';
import requestsSlice from './requests-slice.js';
import revenueSlice from './revenue-slice.js';
import operationsSlice from './operations-slice.js';
import usersSlice from './users-slice.js';
import issuesSlice from './issues-slice.js';
import notificationsSlice from './notifications-slice.js';
import analyticsSlice from './analytics-slice.js';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    events: eventsSlice.reducer,
    tickets: ticketsSlice.reducer,
    requests: requestsSlice.reducer,
    revenue: revenueSlice.reducer,
    operations: operationsSlice.reducer,
    users: usersSlice.reducer,
    issues: issuesSlice.reducer,
    notifications: notificationsSlice.reducer,
    analytics: analyticsSlice.reducer,
  },
});

export default store;


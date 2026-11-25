import { createSlice } from '@reduxjs/toolkit';

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    analyticsDashboard: null,
    eventAnalytics: null,
    comparisonData: null,
    activePolls: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchAnalyticsStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayAnalyticsDashboard(state, action) {
      state.analyticsDashboard = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayEventAnalytics(state, action) {
      state.eventAnalytics = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayComparisonData(state, action) {
      state.comparisonData = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayActivePolls(state, action) {
      state.activePolls = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    analyticsActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const analyticsActions = analyticsSlice.actions;

export default analyticsSlice;


import { createSlice } from '@reduxjs/toolkit';

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    analyticsDashboard: null,
    eventAnalytics: null,
    comparisonData: null,
    activePolls: [],
    feedbackPolls: [],
    activePollAnalytics: null,
    attendeeSurveys: [],
    sessionPolls: [],
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
    displayFeedbackPolls(state, action) {
      state.feedbackPolls = action.payload || [];
      state.activePollAnalytics = null;
      state.loading = false;
      state.error = null;
    },
    displayPollAnalytics(state, action) {
      state.activePollAnalytics = action.payload || null;
    },
    displayAttendeeSurveys(state, action) {
      state.attendeeSurveys = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    markAttendeeSurveySubmitted(state, action) {
      const pollId = action.payload;
      state.attendeeSurveys = state.attendeeSurveys.map((p) => (p.id === pollId ? { ...p, hasSubmitted: true } : p));
    },
    displaySessionPolls(state, action) {
      state.sessionPolls = action.payload || [];
    },
    analyticsActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const analyticsActions = analyticsSlice.actions;

export default analyticsSlice;


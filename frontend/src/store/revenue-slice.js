import { createSlice } from '@reduxjs/toolkit';

const revenueSlice = createSlice({
  name: 'revenue',
  initialState: {
    dashboardData: null,
    requestsList: [],
    clientsList: [],
    revenueEvents: [],
    refundMetrics: null,
    refundsList: [],
    activeRefundDetail: null,
    requestDetail: null,
    analyticsData: null,
    loading: false,
    error: null,
  },
  reducers: {
    fetchRevenueStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayDashboard(state, action) {
      state.dashboardData = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayRevenueRequests(state, action) {
      state.requestsList = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayClients(state, action) {
      state.clientsList = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayRevenueEvents(state, action) {
      state.revenueEvents = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayRequestDetail(state, action) {
      state.requestDetail = action.payload;
      state.loading = false;
    },
    displayRevenueAnalytics(state, action) {
      state.analyticsData = action.payload;
      state.loading = false;
    },
    displayRefundMetrics(state, action) {
      state.refundMetrics = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayRefundsList(state, action) {
      state.refundsList = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayRefundDetail(state, action) {
      state.activeRefundDetail = action.payload || null;
      state.loading = false;
      state.error = null;
    },
    updateRefundInList(state, action) {
      const updated = action.payload;
      if (!updated || !updated.id) return;
      state.refundsList = state.refundsList.map((ref) => (ref.id === updated.id ? { ...ref, ...updated } : ref));
    },
    revenueActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const revenueActions = revenueSlice.actions;

export default revenueSlice;

import { createSlice } from '@reduxjs/toolkit';

const requestsSlice = createSlice({
  name: 'requests',
  initialState: {
    requests: [],
    changeRequests: [],
    activeQuotation: null,
    eventStats: null,
    reportStatus: null,
    loading: false,
    error: null,
  },
  reducers: {
    fetchRequestsStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayRequests(state, action) {
      state.requests = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayChangeRequests(state, action) {
      state.changeRequests = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setActiveQuotation(state, action) {
      state.activeQuotation = action.payload;
      state.loading = false;
    },
    setEventStats(state, action) {
      state.eventStats = action.payload;
      state.loading = false;
    },
    setReportStatus(state, action) {
      state.reportStatus = action.payload;
      state.loading = false;
    },
    addEventRequest(state, action) {
      if (action.payload) {
        state.requests.unshift(action.payload);
      }
      state.loading = false;
    },
    updateEventRequestInList(state, action) {
      const updated = action.payload;
      if (!updated || !updated.id) return;
      state.requests = state.requests.map((req) => (req.id === updated.id ? { ...req, ...updated } : req));
    },
    requestsActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const requestsActions = requestsSlice.actions;

export default requestsSlice;


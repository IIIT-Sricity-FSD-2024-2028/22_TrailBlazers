import { createSlice } from '@reduxjs/toolkit';

const operationsSlice = createSlice({
  name: 'operations',
  initialState: {
    managerDashboard: null,
    managerEvents: [],
    coordinatorsList: [],
    activeWorkspace: null,
    coordinatorDashboard: null,
    coordinatorEvents: [],
    coordinatorWorkspace: null,
    coordinatorAttendees: [],
    coordinatorIssues: [],
    managerChangeRequests: [],
    cancellationPreview: null,
    verifiedTicket: null,
    checkInResult: null,
    loading: false,
    error: null,
  },
  reducers: {
    fetchOperationsStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayManagerDashboard(state, action) {
      state.managerDashboard = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayManagerEvents(state, action) {
      state.managerEvents = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayCoordinators(state, action) {
      state.coordinatorsList = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setActiveWorkspace(state, action) {
      state.activeWorkspace = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayCoordinatorDashboard(state, action) {
      state.coordinatorDashboard = action.payload;
      state.loading = false;
      state.error = null;
    },
    displayCoordinatorEvents(state, action) {
      state.coordinatorEvents = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setVerifiedTicket(state, action) {
      state.verifiedTicket = action.payload;
      state.loading = false;
    },
    setCheckInResult(state, action) {
      state.checkInResult = action.payload;
      state.loading = false;
    },
    displayCoordinatorWorkspace(state, action) {
      state.coordinatorWorkspace = action.payload || null;
      state.loading = false;
    },
    displayCoordinatorAttendees(state, action) {
      state.coordinatorAttendees = action.payload || [];
    },
    displayCoordinatorIssues(state, action) {
      state.coordinatorIssues = action.payload || [];
    },
    displayManagerChangeRequests(state, action) {
      state.managerChangeRequests = action.payload || [];
      state.loading = false;
    },
    setCancellationPreview(state, action) {
      state.cancellationPreview = action.payload || null;
    },
    operationsActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const operationsActions = operationsSlice.actions;

export default operationsSlice;


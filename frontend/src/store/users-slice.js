import { createSlice } from '@reduxjs/toolkit';

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    users: [],
    teamMembers: [],
    awaitingEvents: [],
    assignedEvents: [],
    hierarchyOverview: null,
    totalCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    fetchUsersStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayUsers(state, action) {
      state.users = action.payload || [];
      state.items = state.users;
      state.totalCount = (action.payload || []).length;
      state.loading = false;
      state.error = null;
    },
    displayTeamMembers(state, action) {
      state.teamMembers = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayAwaitingEvents(state, action) {
      state.awaitingEvents = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayAssignedEvents(state, action) {
      state.assignedEvents = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayHierarchyOverview(state, action) {
      state.hierarchyOverview = action.payload || null;
      state.loading = false;
      state.error = null;
    },
    updateUserInList(state, action) {
      const updated = action.payload;
      if (!updated || !updated.id) return;
      state.users = state.users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
    },
    addUserToList(state, action) {
      if (action.payload) {
        state.users.unshift(action.payload);
        state.totalCount += 1;
      }
    },
    usersActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const userActions = usersSlice.actions;
export const usersActions = usersSlice.actions;

export default usersSlice;

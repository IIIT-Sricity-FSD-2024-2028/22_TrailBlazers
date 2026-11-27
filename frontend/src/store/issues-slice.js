import { createSlice } from '@reduxjs/toolkit';

const issuesSlice = createSlice({
  name: 'issues',
  initialState: {
    items: [],
    issues: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchIssuesStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayIssues(state, action) {
      state.issues = action.payload || [];
      state.items = state.issues;
      state.loading = false;
      state.error = null;
    },
    updateIssueInList(state, action) {
      const updated = action.payload;
      if (!updated || !updated.id) return;
      state.issues = state.issues.map((iss) => (iss.id === updated.id ? { ...iss, ...updated } : iss));
      state.items = state.issues;
    },
    addIssueToList(state, action) {
      if (action.payload) {
        state.issues.unshift(action.payload);
        state.items = state.issues;
      }
    },
    issuesActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const issuesActions = issuesSlice.actions;

export default issuesSlice;


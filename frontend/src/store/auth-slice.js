import { createSlice } from '@reduxjs/toolkit';

const initialToken = typeof window !== 'undefined' && typeof localStorage !== 'undefined' 
  ? localStorage.getItem('ffsd_token') || null 
  : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: initialToken,
    isLoggedIn: Boolean(initialToken),
    loading: false,
    error: null,
  },
  reducers: {
    setAuthLoading(state, action) {
      state.loading = action.payload !== undefined ? action.payload : true;
      if (state.loading) state.error = null;
    },
    setAuthError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    loginSuccess(state, action) {
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const authActions = authSlice.actions;

export default authSlice;


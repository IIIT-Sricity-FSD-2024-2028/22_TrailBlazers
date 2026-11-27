import { authActions } from './auth-slice';
export { authActions };

export const fetchCurrentUser = (tokenArg) => {
  return async (dispatch, getState) => {
    const token = tokenArg || getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) {
      dispatch(authActions.logout());
      return null;
    }
    dispatch(authActions.setAuthLoading(true));
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(authActions.setUser(data.user));
        return data.user;
      } else {
        localStorage.removeItem('ffsd_token');
        dispatch(authActions.logout());
        return null;
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      dispatch(authActions.setAuthError(err.message || 'Network error verifying session'));
      return null;
    }
  };
};

export const loginUser = (credentials) => {
  return async (dispatch) => {
    dispatch(authActions.setAuthLoading(true));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) {
        localStorage.removeItem('ffsd_token');
        throw new Error(data.message || data.error || 'Failed to sign in.');
      }
      localStorage.setItem('ffsd_token', data.token);
      dispatch(authActions.loginSuccess({ user: data.user, token: data.token }));
      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      dispatch(authActions.setAuthError(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const registerUser = (registrationData) => {
  return async (dispatch) => {
    dispatch(authActions.setAuthLoading(true));
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to register account.');
      }
      if (data.token) {
        localStorage.setItem('ffsd_token', data.token);
        dispatch(authActions.loginSuccess({ user: data.user, token: data.token }));
      }
      return { success: true, data };
    } catch (err) {
      dispatch(authActions.setAuthError(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const verifyEmail = (code) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    dispatch(authActions.setAuthLoading(true));
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to verify email.');
      }
      if (data.user) {
        dispatch(authActions.setUser(data.user));
      }
      return { success: true, user: data.user };
    } catch (err) {
      dispatch(authActions.setAuthError(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const logoutUser = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('ffsd_token');
      dispatch(authActions.logout());
    }
  };
};

export const requestPasswordResetAction = (email) => {
  return async (dispatch) => {
    dispatch(authActions.setAuthLoading(true));
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to request reset code.');
      }
      dispatch(authActions.setAuthLoading(false));
      return { success: true, data };
    } catch (err) {
      dispatch(authActions.setAuthError(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const resetPasswordAction = ({ email, code, newPassword }) => {
  return async (dispatch) => {
    dispatch(authActions.setAuthLoading(true));
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password.');
      }
      dispatch(authActions.setAuthLoading(false));
      return { success: true, data };
    } catch (err) {
      dispatch(authActions.setAuthError(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const fetchAccessLogs = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) return [];
    try {
      const res = await fetch('/api/auth/access-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(authActions.displayAccessLogs(data.logs || []));
        return data.logs || [];
      }
    } catch (err) {
      console.error('Error fetching access logs:', err);
    }
    return [];
  };
};

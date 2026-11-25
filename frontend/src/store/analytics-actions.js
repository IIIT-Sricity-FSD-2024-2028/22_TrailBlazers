import { analyticsActions } from './analytics-slice';

const getHeaders = (getState) => {
  const token = getState().auth.token || localStorage.getItem('ffsd_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchAnalyticsDashboard = () => {
  return async (dispatch, getState) => {
    dispatch(analyticsActions.fetchAnalyticsStarted());
    try {
      const res = await fetch('/api/analytics/dashboard', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(analyticsActions.displayAnalyticsDashboard(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching analytics dashboard:', err);
      dispatch(analyticsActions.analyticsActionFailed(err.message));
    }
    return null;
  };
};

export const fetchEventAnalyticsById = (eventId) => {
  return async (dispatch, getState) => {
    if (!eventId) return null;
    try {
      const res = await fetch(`/api/analytics/events/${eventId}`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(analyticsActions.displayEventAnalytics(data.analytics || data));
        return data.analytics || data;
      }
    } catch (err) {
      console.error('Error fetching event analytics:', err);
    }
    return null;
  };
};

export const fetchAnalyticsComparison = (eventIds = []) => {
  return async (dispatch, getState) => {
    if (eventIds.length < 2) return null;
    try {
      const res = await fetch(`/api/analytics/compare?eventIds=${eventIds.join(',')}`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(analyticsActions.displayComparisonData(data));
        return data;
      }
    } catch (err) {
      console.error('Error comparing events:', err);
    }
    return null;
  };
};

export const fetchActiveFeedbackPolls = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/events/polls/my-active', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(analyticsActions.displayActivePolls(data.polls || []));
        return data.polls || [];
      }
    } catch (err) {
      console.error('Error loading feedback polls:', err);
    }
    return [];
  };
};

export const submitPollResponse = (pollId, optionIndex, isEventLevel = true) => {
  return async (dispatch, getState) => {
    try {
      const endpoint = isEventLevel ? `/api/events/polls/${pollId}/respond` : `/api/feedback/polls/${pollId}/respond`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ optionIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit response.');
      await dispatch(fetchActiveFeedbackPolls());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};


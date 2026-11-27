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

export const fetchEventFeedbackPolls = (eventId) => {
  return async (dispatch, getState) => {
    if (!eventId) {
      dispatch(analyticsActions.displayFeedbackPolls([]));
      return [];
    }
    dispatch(analyticsActions.fetchAnalyticsStarted());
    try {
      const res = await fetch(`/api/feedback/polls/event/${eventId}`, {
        headers: getHeaders(getState),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(analyticsActions.displayFeedbackPolls(data.polls || []));
        return data.polls || [];
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
      dispatch(analyticsActions.analyticsActionFailed(err.message));
    }
    return [];
  };
};

export const fetchPollAnalytics = (pollId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/feedback/polls/${pollId}/results`, {
        headers: getHeaders(getState),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(analyticsActions.displayPollAnalytics(data.analytics));
        return data.analytics;
      }
    } catch (err) {
      console.error('Error fetching poll analytics:', err);
    }
    return null;
  };
};

export const createFeedbackPollAction = (payload) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/feedback/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to save poll.');
      await dispatch(fetchEventFeedbackPolls(payload.eventId));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const publishFeedbackPollAction = (pollId, eventId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/feedback/polls/${pollId}/publish`, {
        method: 'POST',
        headers: getHeaders(getState),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Unable to publish poll.');
      if (eventId) await dispatch(fetchEventFeedbackPolls(eventId));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const closeFeedbackPollAction = (pollId, eventId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/feedback/polls/${pollId}/close`, {
        method: 'POST',
        headers: getHeaders(getState),
      });
      if (!res.ok) throw new Error('Unable to close poll.');
      if (eventId) await dispatch(fetchEventFeedbackPolls(eventId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const deleteFeedbackPollAction = (pollId, eventId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/feedback/polls/${pollId}`, {
        method: 'DELETE',
        headers: getHeaders(getState),
      });
      if (!res.ok) throw new Error('Unable to delete poll.');
      if (eventId) await dispatch(fetchEventFeedbackPolls(eventId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchAttendeeSurveys = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/feedback/polls/attendee/my-polls', {
        headers: getHeaders(getState),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.polls)) {
        dispatch(analyticsActions.displayAttendeeSurveys(data.polls));
        return data.polls;
      }
    } catch (err) {
      console.error('Error fetching attendee surveys:', err);
    }
    return [];
  };
};

export const submitAttendeeSurveyAction = (pollId, answers) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/feedback/polls/${pollId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if ((res.ok && data.success) || res.status === 409 || (data.message && data.message.includes('already submitted'))) {
        dispatch(analyticsActions.markAttendeeSurveySubmitted(pollId));
        return { success: true, data };
      }
      throw new Error(data.message || data.error || 'Failed to submit feedback response.');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const submitEventFeedbackAction = (eventId, { rating, comment }) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/events/${eventId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (res.ok || res.status === 409 || (data.message && data.message.includes('already submitted'))) {
        await dispatch(fetchEventAnalyticsById(eventId));
        return { success: true, data };
      }
      throw new Error(data.message || data.error || 'Failed to submit feedback.');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchSessionPolls = (eventId, sessionId) => {
  return async (dispatch, getState) => {
    if (!eventId || !sessionId) return [];
    try {
      const res = await fetch(`/api/events/${eventId}/sessions/${sessionId}/polls`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(analyticsActions.displaySessionPolls(data.polls || []));
        return data.polls || [];
      }
    } catch (err) {
      console.error('Error fetching session polls:', err);
    }
    return [];
  };
};

export const createSessionPollAction = (payload) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/events/polls/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create session poll.');
      await dispatch(fetchSessionPolls(payload.eventId, payload.sessionId));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export { analyticsActions };


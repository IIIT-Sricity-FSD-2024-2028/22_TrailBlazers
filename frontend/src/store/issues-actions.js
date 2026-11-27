import { issuesActions } from './issues-slice';

const getHeaders = (getState) => {
  const token = getState().auth.token || localStorage.getItem('ffsd_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchIssuesData = () => {
  return async (dispatch, getState) => {
    dispatch(issuesActions.fetchIssuesStarted());
    try {
      const res = await fetch('/api/hierarchy/issues', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(issuesActions.displayIssues(data.issues || []));
        return data.issues || [];
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      dispatch(issuesActions.issuesActionFailed(err.message));
    }
    return [];
  };
};

export const createTechnicalIssue = (dto) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/hierarchy/issues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to report issue.');
      if (data.issue) {
        dispatch(issuesActions.addIssueToList(data.issue));
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const assignIssueAction = (issueId, assignedUserId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/hierarchy/issues/${issueId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ assignedUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign issue.');
      await dispatch(fetchIssuesData());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const resolveIssueAction = (issueId, resolutionDetails) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/hierarchy/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ resolutionDetails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resolve issue.');
      await dispatch(fetchIssuesData());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const escalateIssueAction = (issueId, reason, target = 'manager') => {
  return async (dispatch, getState) => {
    try {
      const endpoint = target === 'admin' ? 'escalate-to-admin' : 'escalate-to-manager';
      const res = await fetch(`/api/hierarchy/issues/${issueId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to escalate issue.');
      await dispatch(fetchIssuesData());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export { issuesActions };



import { operationsActions } from './operations-slice';

const getHeaders = (getState) => {
  const token = getState().auth.token || localStorage.getItem('ffsd_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchManagerDashboard = () => {
  return async (dispatch, getState) => {
    dispatch(operationsActions.fetchOperationsStarted());
    try {
      const res = await fetch('/api/event-manager/dashboard', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayManagerDashboard(data));
        return data;
      }
    } catch (err) {
      console.error('Error loading manager dashboard:', err);
      dispatch(operationsActions.operationsActionFailed(err.message));
    }
    return null;
  };
};

export const fetchManagerEvents = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/event-manager/events', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayManagerEvents(data.events || []));
        return data.events || [];
      }
    } catch (err) {
      console.error('Error loading manager events:', err);
    }
    return [];
  };
};

export const fetchCoordinatorsList = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/event-manager/onsite-coordinators', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayCoordinators(data.coordinators || []));
        return data.coordinators || [];
      }
    } catch (err) {
      console.error('Error loading coordinators:', err);
    }
    return [];
  };
};

export const fetchEventWorkspaceDetails = (eventId) => {
  return async (dispatch, getState) => {
    if (!eventId) return null;
    try {
      const res = await fetch(`/api/event-manager/events/${eventId}`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.setActiveWorkspace(data.event || data));
        return data.event || data;
      }
    } catch (err) {
      console.error('Error loading event workspace:', err);
    }
    return null;
  };
};

export const markEventReadyAction = (eventId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/event-manager/events/${eventId}/ready`, {
        method: 'POST',
        headers: getHeaders(getState),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark event ready.');
      await dispatch(fetchManagerEvents());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const assignCoordinatorsAction = (eventId, coordinatorIds) => {
  return async (dispatch, getState) => {
    try {
      const ids = Array.isArray(coordinatorIds) ? coordinatorIds : [coordinatorIds];
      const res = await fetch(`/api/event-manager/events/${eventId}/assign-coordinator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ coordinatorUserIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to assign coordinators.');
      await dispatch(fetchEventWorkspaceDetails(eventId));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const updateEventConfigurationAction = (eventId, configForm) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/event-manager/events/${eventId}/configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(configForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update configuration.');
      await dispatch(fetchEventWorkspaceDetails(eventId));
      await dispatch(fetchManagerEvents());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchCoordinatorDashboard = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/onsite-coordinator/dashboard', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayCoordinatorDashboard(data));
        return data;
      }
    } catch (err) {
      console.error('Error loading coordinator dashboard:', err);
    }
    return null;
  };
};

export const fetchCoordinatorEvents = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/onsite-coordinator/events', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayCoordinatorEvents(data.events || []));
        return data.events || [];
      }
    } catch (err) {
      console.error('Error loading coordinator events:', err);
    }
    return [];
  };
};

export const verifyTicketOnsite = (eventId, ticketCode) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${eventId}/verify-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ searchTerm: ticketCode, ticketCode }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(operationsActions.setVerifiedTicket(data));
      }
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const checkInAttendee = (eventId, ticketCode) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${eventId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ ticketNumber: ticketCode, ticketCode }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(operationsActions.setCheckInResult(data));
      }
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchManagerChangeRequests = () => {
  return async (dispatch, getState) => {
    dispatch(operationsActions.fetchOperationsStarted());
    try {
      const res = await fetch('/api/change-requests/manager', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayManagerChangeRequests(data.changeRequests || []));
        return data.changeRequests || [];
      }
    } catch (err) {
      console.error('Error fetching manager change requests:', err);
      dispatch(operationsActions.operationsActionFailed(err.message));
    }
    return [];
  };
};

export const reviewChangeRequestAction = (id, { action, reviewComment }) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/change-requests/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ action, reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit review decision.');
      await dispatch(fetchManagerChangeRequests());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchCancellationPreviewAction = (eventId) => {
  return async (dispatch, getState) => {
    if (!eventId) return null;
    try {
      const res = await fetch(`/api/refunds/cancellation-preview/${eventId}`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.setCancellationPreview(data));
        return data;
      }
    } catch (err) {
      console.error('Failed to load cancellation preview:', err);
    }
    return null;
  };
};

export const cancelEventAction = (eventId, cancellationReason) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/refunds/cancel-event/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ cancellationReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to cancel event.');
      await dispatch(fetchManagerEvents());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Error occurred while cancelling event.' };
    }
  };
};

export const postponeEventAction = (eventId, payload) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/refunds/postpone-event/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to postpone event.');
      await dispatch(fetchManagerEvents());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Error occurred while postponing event.' };
    }
  };
};

export const fetchCoordinatorWorkspace = (reqId) => {
  return async (dispatch, getState) => {
    if (!reqId) return { success: false, error: 'Missing event ID.' };
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}`, {
        headers: getHeaders(getState),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load assigned event workspace.');
      dispatch(operationsActions.displayCoordinatorWorkspace(data));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to load event workspace.' };
    }
  };
};

export const fetchCoordinatorAttendees = (reqId, search = '') => {
  return async (dispatch, getState) => {
    if (!reqId) return [];
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}/attendees?search=${encodeURIComponent(search)}`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayCoordinatorAttendees(data.attendees || []));
        return data.attendees || [];
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
    return [];
  };
};

export const fetchCoordinatorIssues = (reqId) => {
  return async (dispatch, getState) => {
    if (!reqId) return [];
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}/issues`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(operationsActions.displayCoordinatorIssues(data.issues || []));
        return data.issues || [];
      }
    } catch (err) {
      console.error('Error fetching coordinator issues:', err);
    }
    return [];
  };
};

export const performCoordinatorMemberAction = (reqId, payload) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}/member-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `Failed to record ${payload.action}.`);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const updateCoordinatorEventStatusAction = (reqId, operationalStatus) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ operationalStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');
      await dispatch(fetchCoordinatorWorkspace(reqId));
      await dispatch(fetchCoordinatorDashboard());
      await dispatch(fetchCoordinatorEvents());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const reportCoordinatorIssueAction = (reqId, payload) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/onsite-coordinator/events/${reqId}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to report issue.');
      await dispatch(fetchCoordinatorIssues(reqId));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const updateCoordinatorIssueStatusAction = (reqId, issueId, status) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/onsite-coordinator/issues/${issueId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update issue status.');
      if (reqId) await dispatch(fetchCoordinatorIssues(reqId));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export { operationsActions };

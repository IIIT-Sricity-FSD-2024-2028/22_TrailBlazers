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

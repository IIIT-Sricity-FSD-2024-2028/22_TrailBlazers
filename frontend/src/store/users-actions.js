import { userActions, usersActions } from './users-slice';

const getHeaders = (getState) => {
  const token = getState().auth.token || localStorage.getItem('ffsd_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchUserData = () => {
  return async (dispatch, getState) => {
    dispatch(userActions.fetchUsersStarted());
    try {
      const res = await fetch('/api/users', {
        headers: getHeaders(getState),
      });
      if (!res.ok) {
        throw new Error('Unable to fetch users list.');
      }
      const data = await res.json();
      dispatch(userActions.displayUsers(data.users || []));
      return data.users || [];
    } catch (err) {
      console.error('Error fetching users:', err);
      dispatch(userActions.usersActionFailed(err.message));
      return [];
    }
  };
};

export const createUserAction = (userData) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create user.');
      if (data.user) {
        dispatch(userActions.addUserToList(data.user));
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const updateUserRoleAction = (userId, role) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user role.');
      if (data.user) {
        dispatch(userActions.updateUserInList(data.user));
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchDepartmentTeam = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/hierarchy/team', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(userActions.displayTeamMembers(data.members || []));
        return data.members || [];
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    }
    return [];
  };
};

export const fetchAwaitingEvents = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/hierarchy/events/awaiting-assignment', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(userActions.displayAwaitingEvents(data.events || []));
        return data.events || [];
      }
    } catch (err) {
      console.error('Error loading awaiting events:', err);
    }
    return [];
  };
};

export const fetchAssignedEvents = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/hierarchy/events/assigned', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(userActions.displayAssignedEvents(data.events || []));
        return data.events || [];
      }
    } catch (err) {
      console.error('Error loading assigned events:', err);
    }
    return [];
  };
};

export const fetchHierarchyOverview = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/hierarchy/overview', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(userActions.displayHierarchyOverview(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching hierarchy overview:', err);
    }
    return null;
  };
};

export const assignStaffToEventAction = (eventId, { eventManagerUserId, onsiteCoordinatorUserId }) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/hierarchy/events/${eventId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify({
          eventManagerUserId: eventManagerUserId || null,
          onsiteCoordinatorUserId: onsiteCoordinatorUserId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to assign staff.');
      await dispatch(fetchAwaitingEvents());
      await dispatch(fetchAssignedEvents());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const assignEventManagerAction = (eventId, managerId) => {
  return async (dispatch, getState) => {
    return dispatch(assignStaffToEventAction(eventId, { eventManagerUserId: managerId }));
  };
};

export const fetchUsersData = fetchUserData;

export const fetchStaffActivity = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/hierarchy/staff-activity', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff && Array.isArray(data.staff)) {
          dispatch(userActions.displayStaffList(data.staff));
          return data.staff;
        }
      }
    } catch (err) {
      console.error('Error fetching staff activity:', err);
    }
    return [];
  };
};

export const fetchStaffAvailability = ({ eventDate = '', startTime = '', endTime = '' } = {}) => {
  return async (dispatch, getState) => {
    try {
      const url = `/api/hierarchy/staff/availability?eventDate=${eventDate}&startTime=${startTime}&endTime=${endTime}`;
      const res = await fetch(url, { headers: getHeaders(getState) });
      if (res.ok) {
        const data = await res.json();
        dispatch(userActions.displayStaffAvailability(data.staff || []));
        return data.staff || [];
      }
    } catch (err) {
      console.error('Error fetching staff availability:', err);
    }
    return [];
  };
};

export const fetchEventAttendeesAction = (eventId, queryParams = {}) => {
  return async (dispatch, getState) => {
    if (!eventId) return { success: false, error: 'Missing event ID.' };
    try {
      const params = new URLSearchParams();
      if (queryParams.search) params.append('search', queryParams.search);
      if (queryParams.status && queryParams.status !== 'ALL') params.append('status', queryParams.status);
      if (queryParams.ticketStatus && queryParams.ticketStatus !== 'ALL') params.append('ticketStatus', queryParams.ticketStatus);
      if (queryParams.checkedIn && queryParams.checkedIn !== 'ALL') params.append('checkedIn', queryParams.checkedIn);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/hierarchy/events/${encodeURIComponent(eventId)}/attendees${qs}`, {
        headers: getHeaders(getState),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to fetch attendees (${res.status})`);
      }
      const data = await res.json();
      dispatch(userActions.displayEventAttendees(data));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Unable to retrieve attendee records.' };
    }
  };
};

export { userActions, usersActions };



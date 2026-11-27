import { ticketsActions } from './tickets-slice';
import { eventsActions } from './events-slice';

export const fetchMyTickets = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) return [];
    dispatch(ticketsActions.fetchTicketsStarted());
    try {
      const res = await fetch('/api/tickets/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(ticketsActions.displayTickets(data.tickets || []));
        return data.tickets || [];
      } else {
        throw new Error('Failed to load tickets');
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      dispatch(ticketsActions.ticketsActionFailed(err.message));
      return [];
    }
  };
};

export const fetchMyRefunds = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) return [];
    try {
      const res = await fetch('/api/refunds/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(ticketsActions.displayRefunds(data.refunds || []));
        return data.refunds || [];
      }
    } catch (err) {
      console.error('Error loading refunds:', err);
    }
    return [];
  };
};

export const registerTicket = (payload) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    dispatch(ticketsActions.fetchTicketsStarted());
    try {
      const res = await fetch('/api/tickets/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to register ticket.');
      }
      if (data.ticket) {
        dispatch(ticketsActions.addBookedTicket(data.ticket));
      }
      // If event was returned or available count changed, update event list
      if (data.event) {
        dispatch(eventsActions.updateEventInList(data.event));
      }
      return { success: true, data };
    } catch (err) {
      dispatch(ticketsActions.ticketsActionFailed(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const claimTicketRefund = (ticketId, reason = 'Attendee requested 100% ticket refund') => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    dispatch(ticketsActions.fetchTicketsStarted());
    try {
      const res = await fetch('/api/refunds/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticketId, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit refund claim.');
      }
      await dispatch(fetchMyRefunds());
      await dispatch(fetchMyTickets());
      return { success: true, data };
    } catch (err) {
      dispatch(ticketsActions.ticketsActionFailed(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const retainTicket = (refundId) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    dispatch(ticketsActions.fetchTicketsStarted());
    try {
      const res = await fetch(`/api/refunds/${refundId}/retain-ticket`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to retain ticket.');
      }
      await dispatch(fetchMyRefunds());
      await dispatch(fetchMyTickets());
      return { success: true, data };
    } catch (err) {
      dispatch(ticketsActions.ticketsActionFailed(err.message));
      return { success: false, error: err.message };
    }
  };
};


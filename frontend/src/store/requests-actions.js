import { requestsActions } from './requests-slice';

export const fetchClientRequests = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) return [];
    dispatch(requestsActions.fetchRequestsStarted());
    try {
      const res = await fetch('/api/event-requests/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(requestsActions.displayRequests(data.requests || []));
        return data.requests || [];
      } else {
        throw new Error('Failed to load client requests.');
      }
    } catch (err) {
      console.error('Error fetching client requests:', err);
      dispatch(requestsActions.requestsActionFailed(err.message));
      return [];
    }
  };
};

export const fetchClientChangeRequests = () => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token) return [];
    try {
      const res = await fetch('/api/change-requests/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(requestsActions.displayChangeRequests(data.changeRequests || []));
        return data.changeRequests || [];
      }
    } catch (err) {
      console.error('Error loading change requests:', err);
    }
    return [];
  };
};

export const submitEventProposal = (proposalData) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    dispatch(requestsActions.fetchRequestsStarted());
    try {
      const res = await fetch('/api/event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(proposalData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit proposal.');
      }
      if (data.request) {
        dispatch(requestsActions.addEventRequest(data.request));
      }
      return { success: true, data };
    } catch (err) {
      dispatch(requestsActions.requestsActionFailed(err.message));
      return { success: false, error: err.message };
    }
  };
};

export const fetchQuotationByRequestId = (eventRequestId) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token || !eventRequestId) return null;
    dispatch(requestsActions.fetchRequestsStarted());
    try {
      const res = await fetch(`/api/client/quotations/request/${eventRequestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(requestsActions.setActiveQuotation(data));
        return data;
      } else {
        throw new Error('Failed to load quotation.');
      }
    } catch (err) {
      dispatch(requestsActions.requestsActionFailed(err.message));
      return null;
    }
  };
};

export const acceptQuotationAction = (quotationId, dto = {}) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch(`/api/client/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to accept quotation.');
      if (data.quotation) {
        dispatch(requestsActions.setActiveQuotation(data.quotation));
      }
      await dispatch(fetchClientRequests());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const negotiateQuotationAction = (quotationId, dto = {}) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch(`/api/client/quotations/${quotationId}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to submit negotiation request.');
      if (data.quotation) {
        dispatch(requestsActions.setActiveQuotation(data.quotation));
      }
      await dispatch(fetchClientRequests());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const rejectQuotationAction = (quotationId) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch(`/api/client/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to reject quotation.');
      if (data.quotation) {
        dispatch(requestsActions.setActiveQuotation(data.quotation));
      }
      await dispatch(fetchClientRequests());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const payQuotationAdvanceAction = (quotationId, dto) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch(`/api/client/quotations/${quotationId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to process payment.');
      await dispatch(fetchClientRequests());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const submitChangeRequestAction = (dto) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch('/api/change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to submit change request.');
      await dispatch(fetchClientChangeRequests());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchEventStats = (eventId) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token || !eventId) return null;
    try {
      const res = await fetch(`/api/event-requests/${eventId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(requestsActions.setEventStats(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching event stats:', err);
    }
    return null;
  };
};

export const fetchReportStatus = (eventId) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    if (!token || !eventId) return null;
    try {
      const res = await fetch(`/api/event-requests/${eventId}/report-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(requestsActions.setReportStatus(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching report status:', err);
    }
    return null;
  };
};

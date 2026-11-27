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

export const submitRevenueInquiryAction = (payload) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch('/api/revenue/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit revenue inquiry.');
      dispatch(requestsActions.setRevenueInquiry(data.inquiry));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const uploadBannerImageAction = (file) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const bodyData = new FormData();
      bodyData.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: bodyData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'File upload failed');
      dispatch(requestsActions.setUploadedBannerUrl(data.file?.url || null));
      return { success: true, url: data.file?.url, data };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to upload event banner image.' };
    }
  };
};

export const exportEventAnalyticsReportAction = (eventId, eventName) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch(`/api/event-requests/${eventId}/export-analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let errMsg = 'Failed to export event analytics report';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {
          // not json
        }
        throw new Error(errMsg);
      }
      const disposition = res.headers.get('Content-Disposition') || '';
      let filename = '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      } else {
        const cleanName = (eventName || 'Event')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        filename = `Wavevents_Event_Analytics_${cleanName}_${eventId}.pdf`;
      }
      const blob = await res.blob();
      return { success: true, blob, filename };
    } catch (err) {
      return { success: false, error: err.message || 'Error downloading analytics report' };
    }
  };
};

export const requestContractRefundAction = ({ quotationId, eventId, reason = 'Client requested contract refund' }) => {
  return async (dispatch, getState) => {
    const token = getState().auth.token || localStorage.getItem('ffsd_token');
    try {
      const res = await fetch('/api/refunds/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quotationId, eventId, reason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to submit refund claim.');
      }
      await dispatch(fetchClientRequests());
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export { requestsActions };

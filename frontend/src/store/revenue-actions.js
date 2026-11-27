import { revenueActions } from './revenue-slice';

const getHeaders = (getState) => {
  const token = getState().auth.token || localStorage.getItem('ffsd_token');
  const role = getState().auth.user?.role || 'REVENUE';
  const headers = { 'x-role': role };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchRevenueDashboard = () => {
  return async (dispatch, getState) => {
    dispatch(revenueActions.fetchRevenueStarted());
    try {
      const res = await fetch('/api/revenue/dashboard', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayDashboard(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching revenue dashboard:', err);
      dispatch(revenueActions.revenueActionFailed(err.message));
    }
    return null;
  };
};

export const fetchRevenueRequests = (query = {}) => {
  return async (dispatch, getState) => {
    try {
      const params = new URLSearchParams();
      if (query.search) params.append('search', query.search);
      if (query.status && query.status !== 'ALL') params.append('status', query.status);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/revenue/event-requests${qs}`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayRevenueRequests(data.requests || []));
        return data.requests || [];
      }
    } catch (err) {
      console.error('Error fetching revenue requests:', err);
    }
    return [];
  };
};

export const fetchRevenueClients = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/revenue/clients', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayClients(data.clients || []));
        return data.clients || [];
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
    return [];
  };
};

export const fetchRefundMetrics = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/refunds/metrics', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayRefundMetrics(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching refund metrics:', err);
    }
    return null;
  };
};

export const fetchRefundsList = (filters = {}) => {
  return async (dispatch, getState) => {
    dispatch(revenueActions.fetchRevenueStarted());
    try {
      const params = new URLSearchParams();
      if (filters.customerType && filters.customerType !== 'ALL') params.append('customerType', filters.customerType);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.eventId && filters.eventId !== 'ALL') params.append('eventId', filters.eventId);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/refunds${qs}`, {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayRefundsList(data.refunds || []));
        return data.refunds || [];
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
      dispatch(revenueActions.revenueActionFailed(err.message));
    }
    return [];
  };
};

export const approveRefundAction = (refundId, payloadOrAmount, notes = '') => {
  return async (dispatch, getState) => {
    try {
      const token = getState().auth.token || localStorage.getItem('ffsd_token');
      const body = typeof payloadOrAmount === 'object'
        ? payloadOrAmount
        : { approvedAmount: payloadOrAmount, notes };
      const res = await fetch(`/api/refunds/${refundId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-role': 'REVENUE',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve refund.');
      await dispatch(fetchRefundMetrics());
      await dispatch(fetchRefundsList());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchRevenueAnalytics = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/revenue/analytics', { headers: getHeaders(getState) });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayRevenueAnalytics(data.analytics));
        return data.analytics;
      }
    } catch (err) {
      console.error('Error fetching revenue analytics:', err);
    }
    return null;
  };
};

export const fetchRequestDetail = (reqId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/revenue/event-requests/${reqId}`, { headers: getHeaders(getState) });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayRequestDetail(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching request detail:', err);
    }
    return null;
  };
};

export const saveQuotationDraftAction = (quotationPayload) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/revenue/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
        body: JSON.stringify(quotationPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message) ? data.message.join('; ') : (data.message || data.error || 'Failed to save quotation draft.');
        throw new Error(errorMsg);
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const sendQuotationAction = (qtnId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/revenue/quotations/${qtnId}/send`, {
        method: 'POST',
        headers: getHeaders(getState),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message) ? data.message.join('; ') : (data.message || data.error || 'Failed to dispatch quotation to client.');
        throw new Error(errorMsg);
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const escalateEventAction = (eventId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/revenue/event-requests/${eventId}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(getState),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to escalate event to Event Management.');
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const rejectRefundAction = (refundId, payloadOrReason) => {
  return async (dispatch, getState) => {
    try {
      const token = getState().auth.token || localStorage.getItem('ffsd_token');
      const body = typeof payloadOrReason === 'object'
        ? payloadOrReason
        : { reason: payloadOrReason, rejectionReason: payloadOrReason };
      const res = await fetch(`/api/refunds/${refundId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-role': 'REVENUE',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject refund.');
      await dispatch(fetchRefundMetrics());
      await dispatch(fetchRefundsList());
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const fetchRevenueEvents = () => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch('/api/hierarchy/revenue/events', {
        headers: getHeaders(getState),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(revenueActions.displayRevenueEvents(data.events || []));
        return data.events || [];
      }
    } catch (err) {
      console.error('Error fetching revenue events:', err);
    }
    return [];
  };
};

export const fetchRefundDetailsAction = (refundId) => {
  return async (dispatch, getState) => {
    if (!refundId) return { success: false, error: 'Missing refund ID.' };
    try {
      const res = await fetch(`/api/refunds/${refundId}`, {
        headers: getHeaders(getState),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to fetch refund details.');
      dispatch(revenueActions.displayRefundDetail(data));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Error loading refund details.' };
    }
  };
};

export const startRefundReviewAction = (refundId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/refunds/${refundId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders(getState) },
        body: JSON.stringify({ notes: 'Review started by Revenue Specialist' }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Failed to update review status.');
      await dispatch(fetchRefundDetailsAction(refundId));
      await dispatch(fetchRefundMetrics());
      await dispatch(fetchRefundsList());
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const saveRefundDeductionsAction = (refundId, { deductionAmount, deductionReason }) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/refunds/${refundId}/deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders(getState) },
        body: JSON.stringify({ deductionAmount: Number(deductionAmount), deductionReason }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Failed to save deductions.');
      await dispatch(fetchRefundDetailsAction(refundId));
      await dispatch(fetchRefundsList());
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const processRefundAction = (refundId) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/refunds/${refundId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders(getState) },
        body: JSON.stringify({ notes: 'Settlement initiated through payment gateway/bank' }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Failed to mark as processing.');
      await dispatch(fetchRefundDetailsAction(refundId));
      await dispatch(fetchRefundMetrics());
      await dispatch(fetchRefundsList());
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export const completeRefundAction = (refundId, payload) => {
  return async (dispatch, getState) => {
    try {
      const res = await fetch(`/api/refunds/${refundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders(getState) },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Failed to complete refund.');
      await dispatch(fetchRefundDetailsAction(refundId));
      await dispatch(fetchRefundMetrics());
      await dispatch(fetchRefundsList());
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
};

export { revenueActions };


/**
 * WEvents API Client
 * Replaces localStorage mock data with real NestJS backend calls.
 * Base URL: http://localhost:3000
 *
 * Usage:
 *   const events = await ApiClient.events.getAll();
 *   const event = await ApiClient.events.getOne('e1');
 *   await ApiClient.events.create(data, 'superuser');
 */

const API_BASE = 'http://localhost:3000';

// ─── Core fetch helper ────────────────────────────────────────────────────────
async function apiFetch(method, path, role, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(role ? { role } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status} ${res.statusText}`;
    throw new Error(Array.isArray(msg) ? msg.join('; ') : msg);
  }
  return data;
}

// ─── API Client ───────────────────────────────────────────────────────────────
const ApiClient = {

  // ── Events ─────────────────────────────────────────────────────────────────
  events: {
    getAll: (role, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch('GET', `/events${qs ? `?${qs}` : ''}`, role);
    },
    getOne: (id, role) => apiFetch('GET', `/events/${id}`, role),
    getStats: (role, managerId) => {
      const qs = managerId ? `?managerId=${managerId}` : '';
      return apiFetch('GET', `/events/stats/dashboard${qs}`, role);
    },
    create: (data, role = 'superuser') => apiFetch('POST', '/events', role, data),
    update: (id, data, role = 'superuser') => apiFetch('PUT', `/events/${id}`, role, data),
    patch: (id, data, role = 'superuser') => apiFetch('PATCH', `/events/${id}`, role, data),
    delete: (id, role = 'superuser') => apiFetch('DELETE', `/events/${id}`, role),
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    getAll: (role = 'superuser', filterRole) => {
      const qs = filterRole ? `?role=${filterRole}` : '';
      return apiFetch('GET', `/users${qs}`, role);
    },
    getOne: (id, role = 'superuser') => apiFetch('GET', `/users/${id}`, role),
    getStats: (role = 'superuser') => apiFetch('GET', '/users/stats', role),
    create: (data, role = 'superuser') => apiFetch('POST', '/users', role, data),
    update: (id, data, role = 'superuser') => apiFetch('PATCH', `/users/${id}`, role, data),
    delete: (id, role = 'superuser') => apiFetch('DELETE', `/users/${id}`, role),
  },

  // ── RSVPs ──────────────────────────────────────────────────────────────────
  rsvps: {
    getAll: (role, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch('GET', `/rsvps${qs ? `?${qs}` : ''}`, role);
    },
    getMy: (email) => apiFetch('GET', `/rsvps/my?email=${encodeURIComponent(email)}`, 'enduser'),
    getOne: (id, role) => apiFetch('GET', `/rsvps/${id}`, role),
    create: (data) => apiFetch('POST', '/rsvps', 'enduser', data),
    update: (id, data, role) => apiFetch('PATCH', `/rsvps/${id}`, role, data),
    checkIn: (ticketCode, role = 'osc') => apiFetch('POST', `/rsvps/checkin/${ticketCode}`, role),
    cancel: (id, role = 'enduser') => apiFetch('DELETE', `/rsvps/${id}`, role),
  },

  // ── Pending Requests ───────────────────────────────────────────────────────
  pendingRequests: {
    getAll: (role = 'superuser', status) => {
      const qs = status ? `?status=${status}` : '';
      return apiFetch('GET', `/pending-requests${qs}`, role);
    },
    getOne: (id, role = 'superuser') => apiFetch('GET', `/pending-requests/${id}`, role),
    create: (data, role = 'enduser') => apiFetch('POST', '/pending-requests', role, data),
    review: (id, decision, managerId, managerName, rejectionReason, role = 'superuser') =>
      apiFetch('PATCH', `/pending-requests/${id}/review`, role, { decision, managerId, managerName, rejectionReason }),
    delete: (id, role = 'superuser') => apiFetch('DELETE', `/pending-requests/${id}`, role),
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    getAll: (role, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch('GET', `/notifications${qs ? `?${qs}` : ''}`, role);
    },
    getUnreadCount: (role) => apiFetch('GET', '/notifications/unread-count', role),
    create: (data, role = 'osc') => apiFetch('POST', '/notifications', role, data),
    update: (id, data, role) => apiFetch('PATCH', `/notifications/${id}`, role, data),
    resolve: (id, role) => apiFetch('PATCH', `/notifications/${id}/resolve`, role),
    delete: (id, role = 'superuser') => apiFetch('DELETE', `/notifications/${id}`, role),
  },

  // ── Teams ──────────────────────────────────────────────────────────────────
  teams: {
    getAll: (role, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch('GET', `/teams${qs ? `?${qs}` : ''}`, role);
    },
    getStats: (eventId, role) => apiFetch('GET', `/teams/${eventId}/stats`, role),
    getOne: (id, role) => apiFetch('GET', `/teams/${id}`, role),
    create: (data, role = 'superuser') => apiFetch('POST', '/teams', role, data),
    update: (id, data, role) => apiFetch('PATCH', `/teams/${id}`, role, data),
    delete: (id, role = 'superuser') => apiFetch('DELETE', `/teams/${id}`, role),
  },
};

// Make globally available
window.ApiClient = ApiClient;

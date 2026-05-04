/* ==============================
   HOME PAGE — home.js
   Loads events from backend API, filtered by logged-in manager's ID.
   ============================== */

const API_BASE = 'http://localhost:3000';

let editEventIdx = -1;
let rawEvents = [];
let events    = [];
let waiting   = [];

// ── Get the logged-in event manager from localStorage ─────────────────────
function getCurrentManager() {
  try {
    return JSON.parse(localStorage.getItem('wevents_user')) || null;
  } catch { return null; }
}

// ── Fetch events from backend filtered by managerId ───────────────────────
async function fetchEvents() {
  const manager = getCurrentManager();
  if (!manager) { console.warn('No manager logged in'); return []; }

  try {
    const res = await fetch(`${API_BASE}/events`, {
      headers: { role: 'eventmanager' }
    });
    const all = await res.json();
    // Filter to only this manager's events
    return all.filter(e => e.managerId === manager.id);
  } catch (err) {
    console.error('Failed to load events from backend:', err);
    return [];
  }
}

// ── Fetch pending requests from backend ───────────────────────────────────
async function fetchPendingRequests() {
  try {
    const res = await fetch(`${API_BASE}/pending-requests`, {
      headers: { role: 'eventmanager' }
    });
    return await res.json();
  } catch { return []; }
}

// ── Approve a pending request ──────────────────────────────────────────────
async function approveRequest(requestId, eventId) {
  const manager = getCurrentManager();
  if (!manager) return;
  try {
    await fetch(`${API_BASE}/pending-requests/${requestId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', role: 'eventmanager' },
      body: JSON.stringify({
        decision: 'approved',
        managerId: manager.id,
        managerName: manager.name
      })
    });
    toast('Event approved — status changed to Upcoming ✅', '#10b981');
    await render();
  } catch (err) {
    toast('Approval failed: ' + err.message, '#ef4444');
  }
}

// ── Reject a pending request ───────────────────────────────────────────────
async function rejectRequest(requestId) {
  const reason = prompt('Enter rejection reason (optional):') || 'Not approved at this time.';
  try {
    await fetch(`${API_BASE}/pending-requests/${requestId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', role: 'eventmanager' },
      body: JSON.stringify({ decision: 'rejected', rejectionReason: reason })
    });
    toast('Request rejected', '#ef4444');
    await render();
  } catch (err) {
    toast('Rejection failed: ' + err.message, '#ef4444');
  }
}

// ── Load + shape data ─────────────────────────────────────────────────────
async function loadData() {
  const [allEvents, pendingReqs] = await Promise.all([fetchEvents(), fetchPendingRequests()]);

  // Active events (upcoming / live / completed)
  events = allEvents
    .filter(e => e.status !== 'pending' && e.status !== 'rejected')
    .map(e => ({
      _id:      e.id,
      status:   e.status === 'live' ? 'live' : 'upcoming',
      title:    e.title,
      client:   e.clientName || e.domain || 'Client',
      date:     e.date,
      location: e.location || e.venue || '',
      people:   (e.capacity || 0) + ' Expected'
    }));

  // Waiting list = pending requests from backend
  waiting = pendingReqs
    .filter(r => r.status === 'Pending')
    .map(r => ({
      _id:       r.id,        // pending-request ID
      eventId:   r.eventId,
      title:     r.name,
      client:    r.client,
      date:      r.date,
      location:  r.location,
      people:    (r.expected || 0) + ' Expected',
      submitted: 'Pending review'
    }));
}

function renderStats() {
  const live = events.filter(e => e.status === 'live').length;
  document.getElementById('stats-container').innerHTML = `
    <div class="stat-card"><div class="stat-title">Total Allocated</div><div class="stat-value">${events.length}</div></div>
    <div class="stat-card"><div class="stat-title">Live Events</div><div class="stat-value green">${live}</div></div>
    <div class="stat-card"><div class="stat-title">Upcoming</div><div class="stat-value orange">${events.length - live}</div></div>
    <div class="stat-card"><div class="stat-title">Waiting List</div><div class="stat-value blue">${waiting.length}</div></div>`;
}

function renderEvents() {
  const c = document.getElementById('events-container');
  if (!events.length) {
    c.innerHTML = '<p style="color:#64748b;padding:16px 0">No events allocated to you yet.</p>';
    return;
  }
  c.innerHTML = events.map((e, i) => `
    <div class="ev-card">
      <div class="ev-top">
        <div class="ev-left">
          <span class="badge ${e.status}">${e.status === 'live' ? 'Event Live' : 'Upcoming'}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-edit" onclick="openEventModal(${i})"><i class="fa-solid fa-pen"></i>Edit</button>
          <button class="btn btn-danger" onclick="deleteEventById('${e._id}')"><i class="fa-solid fa-trash"></i>Delete</button>
        </div>
      </div>
      <div class="ev-title">${e.title}</div>
      <div class="client">${e.client}</div>
      <div class="info-grid">
        <div class="info-item"><i class="fa-regular fa-calendar"></i><div>${e.date}</div></div>
        <div class="info-item"><i class="fa-solid fa-location-dot"></i><div>${e.location}</div></div>
        <div class="info-item"><i class="fa-solid fa-users"></i><div>${e.people}</div></div>
      </div>
      ${e.status === 'live' ? `<button class="btn btn-primary" onclick="location.href='dashboard.html'"><i class="fa-solid fa-table-columns"></i>View Dashboard</button>` : ''}
    </div>`).join('');
}

function renderWaiting() {
  const c = document.getElementById('waiting-list');
  if (!waiting.length) { c.innerHTML = '<p style="color:#64748b">No pending requests.</p>'; return; }
  c.innerHTML = waiting.map((w) => `
    <div class="w-card">
      <span class="badge pending">Pending Approval</span>
      <div class="w-title">${w.title}</div>
      <div class="w-detail"><i class="fa-solid fa-building" style="color:#94a3b8"></i>${w.client}</div>
      <div class="w-detail"><i class="fa-regular fa-calendar" style="color:#94a3b8"></i>${w.date}</div>
      <div class="w-detail"><i class="fa-solid fa-location-dot" style="color:#94a3b8"></i>${w.location}</div>
      <div class="w-detail"><i class="fa-solid fa-users" style="color:#94a3b8"></i>${w.people}</div>
      <div class="w-detail"><i class="fa-regular fa-clock" style="color:#94a3b8"></i>${w.submitted}</div>
      <button class="accept-btn" onclick="approveRequest('${w._id}', '${w.eventId || ''}')"><i class="fa-solid fa-check"></i> Accept Event</button>
      <button class="reject-btn" onclick="rejectRequest('${w._id}')"><i class="fa-solid fa-xmark"></i> Reject</button>
    </div>`).join('');
}

function openEventModal(i) {
  editEventIdx = i;
  document.getElementById('em-title').textContent = i < 0 ? 'Add Event' : 'Edit Event';
  const e = i < 0 ? {} : events[i];
  document.getElementById('f-title').value    = e.title    || '';
  document.getElementById('f-client').value   = e.client   || '';
  document.getElementById('f-date').value     = e.date     || '';
  document.getElementById('f-location').value = e.location || '';
  document.getElementById('f-people').value   = e.people   || '';
  document.getElementById('f-status').value   = e.status   || 'upcoming';
  document.getElementById('f-progress').value = e.progress || '';
  document.getElementById('event-modal').classList.add('open');
}

async function saveEvent() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { toast('Event title is required', '#ef4444'); return; }

  if (editEventIdx >= 0) {
    const ev = events[editEventIdx];
    try {
      await fetch(`${API_BASE}/events/${ev._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', role: 'eventmanager' },
        body: JSON.stringify({
          title,
          date:     document.getElementById('f-date').value,
          location: document.getElementById('f-location').value,
          capacity: parseInt(document.getElementById('f-people').value) || 100,
          status:   document.getElementById('f-status').value
        })
      });
      toast('Event updated ✅');
    } catch (err) {
      toast('Update failed: ' + err.message, '#ef4444');
    }
  }

  closeModal('event-modal');
  await render();
}

async function deleteEventById(id) {
  if (!confirm('Delete this event?')) return;
  try {
    await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: { role: 'eventmanager' }
    });
    toast('Deleted', '#ef4444');
    await render();
  } catch (err) {
    toast('Delete failed: ' + err.message, '#ef4444');
  }
}

async function render() {
  await loadData();
  renderStats();
  renderEvents();
  renderWaiting();
}

// ── Init ──────────────────────────────────────────────────────────────────
initNav();
render();
/* ==============================
   HOME PAGE — home.js
   ============================== */

let editEventIdx = -1;

function getGlobal() { return JSON.parse(localStorage.getItem('wevents_data')) || []; }
function setGlobal(data) { localStorage.setItem('wevents_data', JSON.stringify(data)); }

let rawEvents = [];
let events = [];
let waiting = [];

function loadData() {
  rawEvents = getGlobal();
  
  events = rawEvents.filter(e => e.status !== 'pending' && e.status !== 'Waiting' && e.status !== 'draft').map(e => ({
    _id: e.id,
    status: (e.status === 'upcoming' || e.status === 'live') ? 'live' : 'upcoming',
    progress: '',
    title: e.title,
    client: e.domain || e.managerName || 'System Admin',
    date: e.date,
    location: e.location,
    people: (e.capacity || 0) + ' Expected'
  }));
  
  waiting = rawEvents.filter(e => e.status === 'pending' || e.status === 'Waiting').map(e => ({
    _id: e.id,
    title: e.title,
    client: e.domain || e.managerName || 'System Admin',
    date: e.date,
    location: e.location,
    people: (e.capacity || 0) + ' Expected',
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
  if (!events.length) { c.innerHTML = '<p style="color:#64748b;padding:16px 0">No events yet.</p>'; return; }
  c.innerHTML = events.map((e, i) => `
    <div class="ev-card">
      <div class="ev-top">
        <div class="ev-left">
          <span class="badge ${e.status}">${e.status === 'live' ? 'Event Live' : 'Upcoming'}</span>
          ${e.progress ? `<span style="font-size:13px;color:#6b7280">${e.progress}</span>` : ''}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-edit" onclick="openEventModal(${i})"><i class="fa-solid fa-pen"></i>Edit</button>
          <button class="btn btn-danger" onclick="deleteEvent(${i})"><i class="fa-solid fa-trash"></i>Delete</button>
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
  if (!waiting.length) { c.innerHTML = '<p style="color:#64748b">No pending events.</p>'; return; }
  /* NOTE: Edit button removed from waiting cards as requested */
  c.innerHTML = waiting.map((w, i) => `
    <div class="w-card">
      <span class="badge pending">Pending Allocation</span>
      <div class="w-title">${w.title}</div>
      <div class="w-detail"><i class="fa-solid fa-building" style="color:#94a3b8"></i>${w.client}</div>
      <div class="w-detail"><i class="fa-regular fa-calendar" style="color:#94a3b8"></i>${w.date}</div>
      <div class="w-detail"><i class="fa-solid fa-location-dot" style="color:#94a3b8"></i>${w.location}</div>
      <div class="w-detail"><i class="fa-solid fa-users" style="color:#94a3b8"></i>${w.people}</div>
      <div class="w-detail"><i class="fa-regular fa-clock" style="color:#94a3b8"></i>${w.submitted}</div>
      <button class="accept-btn" onclick="acceptWaiting(${i})"><i class="fa-solid fa-check"></i> Accept Event</button>
      <button class="reject-btn" onclick="rejectWaiting(${i})"><i class="fa-solid fa-xmark"></i> Reject</button>
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

function saveEvent() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { toast('Event title is required', '#ef4444'); return; }
  
  if (editEventIdx >= 0) {
    const ev = events[editEventIdx];
    const idx = rawEvents.findIndex(e => String(e.id) === String(ev._id));
    if (idx !== -1) {
      rawEvents[idx].title = title;
      rawEvents[idx].domain = v('f-client');
      rawEvents[idx].date = v('f-date');
      rawEvents[idx].location = v('f-location');
      rawEvents[idx].capacity = parseInt(v('f-people')) || 100;
      rawEvents[idx].status = v('f-status') === 'live' ? 'upcoming' : 'upcoming';
      setGlobal(rawEvents);
    }
  } else {
    rawEvents.unshift({
      id: 'e' + Date.now(),
      title: title,
      domain: v('f-client'),
      date: v('f-date'),
      location: v('f-location'),
      capacity: parseInt(v('f-people')) || 100,
      status: v('f-status') === 'live' ? 'upcoming' : 'upcoming',
      managerName: 'System Admin',
      stats: { rsvps: 0, checkins: 0, engagement: 0, rating: 0, qa: 0 }
    });
    setGlobal(rawEvents);
  }
  
  closeModal('event-modal');
  render();
  toast(editEventIdx >= 0 ? 'Event updated ✅' : 'Event added ✅');
}

function deleteEvent(i) {
  if (!confirm('Delete this event?')) return;
  const evId = events[i]._id;
  rawEvents = rawEvents.filter(e => String(e.id) !== String(evId));
  setGlobal(rawEvents);
  render();
  toast('Deleted', '#ef4444');
}

function acceptWaiting(i) {
  const w = waiting[i];
  const idx = rawEvents.findIndex(e => String(e.id) === String(w._id));
  if (idx !== -1) {
    rawEvents[idx].status = 'upcoming';
    setGlobal(rawEvents);
  }
  render();
  toast('Accepted & moved to Allocated ✅', '#10b981');
}

function rejectWaiting(i) {
  if (!confirm('Reject this event?')) return;
  const w = waiting[i];
  const idx = rawEvents.findIndex(e => String(e.id) === String(w._id));
  if (idx !== -1) {
    rawEvents[idx].status = 'rejected';
    setGlobal(rawEvents);
  }
  render();
  toast('Rejected', '#ef4444');
}

function render() { loadData(); renderStats(); renderEvents(); renderWaiting(); }

// Init
initNav();
render();

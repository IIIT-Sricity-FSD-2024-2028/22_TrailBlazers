/* ═══════════════════════════════════════════════════════════════
   api-loader.js  –  Attendee Frontend Data Layer
   Fetches ALL data from the NestJS backend (http://localhost:3000)
   No localStorage. Attendee identity comes from URL params passed
   by the login page, then propagated via URL through all pages.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const API_BASE = 'http://localhost:3000';

// ─── Read logged-in attendee identity ────────────────────────────────────────
// Priority: URL params → sessionStorage (set during login redirect)
// When URL params are present, they are persisted to sessionStorage so identity
// survives across all page navigations within the same browser session.
function getAttendeeFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const urlEmail  = p.get('email')  || '';
  const urlUserId = p.get('userId') || '';
  const urlName   = p.get('name')   || '';

  // If URL has email, save it to sessionStorage so other pages can use it
  if (urlEmail) {
    sessionStorage.setItem('attendee_email',  urlEmail);
    sessionStorage.setItem('attendee_userId', urlUserId);
    sessionStorage.setItem('attendee_name',   urlName);
  }

  // Fallback to sessionStorage when URL params are missing
  return {
    userId: urlUserId || sessionStorage.getItem('attendee_userId') || '',
    email:  urlEmail  || sessionStorage.getItem('attendee_email')  || '',
    name:   urlName   || sessionStorage.getItem('attendee_name')   || 'Guest',
  };
}

// Build the URL query string to forward to the next page
function attendeeParams() {
  const a = getAttendeeFromUrl();
  if (!a.email) return '';
  return `?userId=${encodeURIComponent(a.userId)}&email=${encodeURIComponent(a.email)}&name=${encodeURIComponent(a.name)}`;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const ICONS = {
  calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  location: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  people:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

// ─── Category → image mapping ────────────────────────────────────────────────
const DOMAIN_IMAGES = {
  'Tech Conferences':    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80',
  'Workshops':          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
  'Startup Events':     'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  'Cultural Events':    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80',
  'Sports':             'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80',
  'Business Summits':   'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&q=80',
  'default':            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
};

// ─── Core API helper ─────────────────────────────────────────────────────────
async function apiFetch(path, role = 'attendee') {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { role } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[api-loader] Failed to fetch ${path}:`, err.message);
    return null;
  }
}

// ─── Format date from ISO string ─────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'Date TBD';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

// ─── Build event card HTML ────────────────────────────────────────────────────
function buildEventCard(event, isRsvpd = false, isPast = false) {
  const imgUrl    = DOMAIN_IMAGES[event.domain] || DOMAIN_IMAGES['default'];
  const dateStr   = formatDate(event.date);
  const attendees = event.attendees ?? 0;
  const capacity  = event.capacity ?? '—';
  const domain    = event.domain || 'Event';

  const badgeClass = isPast ? 'badge-dark' : 'badge-white';
  const badgeText  = isPast ? 'Past Event' : domain;

  let actionsHtml = '';
  if (!isPast) {
    if (isRsvpd) {
      actionsHtml = `
        <button class="btn-rsvpd api-rsvpd-btn" data-event-id="${event.id}" data-event-title="${event.title}">RSVP'd</button>
        <button class="btn-details api-details-btn" data-event-id="${event.id}">Details</button>`;
    } else {
      actionsHtml = `
        <button class="btn-attend api-attend-btn" data-event-id="${event.id}" data-event-title="${event.title}">Attend</button>
        <button class="btn-details api-details-btn" data-event-id="${event.id}">Details</button>`;
    }
  }

  return `
    <article class="event-card api-event-card" role="listitem" data-event-id="${event.id}" data-domain="${domain}">
      <div class="card-image" style="background-image:url('${imgUrl}');" aria-hidden="true">
        <span class="card-badge ${badgeClass}">${badgeText}</span>
        ${isPast ? '<span class="card-badge badge-white">Past Event</span>' : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${event.title}</h3>
        <p class="card-desc">${event.description || ''}</p>
        <ul class="card-meta" aria-label="Event details">
          <li class="meta-item">
            <span class="meta-icon" aria-hidden="true">${ICONS.calendar}</span>
            <span>${dateStr}</span>
          </li>
          <li class="meta-item">
            <span class="meta-icon" aria-hidden="true">${ICONS.location}</span>
            <span>${event.location || 'Venue TBD'}</span>
          </li>
          <li class="meta-item">
            <span class="meta-icon" aria-hidden="true">${ICONS.people}</span>
            <span>${attendees} / ${capacity} attendees</span>
          </li>
        </ul>
        ${actionsHtml ? `<div class="card-actions">${actionsHtml}</div>` : ''}
      </div>
    </article>`;
}

// ─── Navigate within attendee/ keeping attendee params in URL ─────────────────────
function navTo(page) {
  window.location.href = page + attendeeParams();
}

// ─── Store event details for detail/RSVP pages (temp data, cleared on RSVP confirm) ──
function storeEventForDetail(event) {
  sessionStorage.setItem('detail_event_id',       event.id);
  sessionStorage.setItem('detail_event_title',    event.title);
  sessionStorage.setItem('detail_event_date',     formatDate(event.date));
  sessionStorage.setItem('detail_event_location', event.location || '');
  sessionStorage.setItem('detail_event_attendees',`${event.attendees ?? 0} / ${event.capacity ?? '—'} attendees`);
  sessionStorage.setItem('detail_event_badge',    event.domain || 'Event');
  sessionStorage.setItem('detail_event_desc',     event.description || '');
  sessionStorage.setItem('detail_event_img',      DOMAIN_IMAGES[event.domain] || DOMAIN_IMAGES['default']);
}

function storeEventForRSVP(event) {
  sessionStorage.setItem('rsvp_event_id',       event.id);
  sessionStorage.setItem('rsvp_event',          event.title);
  sessionStorage.setItem('rsvp_event_date',     formatDate(event.date));
  sessionStorage.setItem('rsvp_event_location', event.location || '');
  sessionStorage.setItem('rsvp_event_attendees',`${event.attendees ?? 0} / ${event.capacity ?? '—'} attendees`);
  sessionStorage.setItem('rsvp_event_badge',    event.domain || 'Event');
  sessionStorage.setItem('rsvp_event_img',      DOMAIN_IMAGES[event.domain] || DOMAIN_IMAGES['default']);
  sessionStorage.removeItem('otp_verified');
  // Store attendee email from URL so RSVP form and script8/script9 can use it
  const { email, name } = getAttendeeFromUrl();
  sessionStorage.setItem('rsvp_email', email);
  sessionStorage.setItem('rsvp_name_prefill', name);
}

// ─── Attach action button handlers ───────────────────────────────────────────
function attachCardHandlers(container, events) {
  if (!container) return;

  container.addEventListener('click', (e) => {
    // Details button
    const detailsBtn = e.target.closest('.api-details-btn');
    if (detailsBtn) {
      const eventId = detailsBtn.dataset.eventId;
      const ev = events.find(x => x.id === eventId);
      if (ev) { storeEventForDetail(ev); navTo('index4.html'); }
      return;
    }

    // Attend (RSVP) button — show invitation warning modal
    const attendBtn = e.target.closest('.api-attend-btn');
    if (attendBtn) {
      const eventId = attendBtn.dataset.eventId;
      const ev = events.find(x => x.id === eventId);
      if (!ev) return;
      showRsvpModal(ev);
      return;
    }

    // RSVP'd button — go to detail
    const rsvpdBtn = e.target.closest('.api-rsvpd-btn');
    if (rsvpdBtn) {
      const eventId = rsvpdBtn.dataset.eventId;
      const ev = events.find(x => x.id === eventId);
      if (ev) { storeEventForDetail(ev); navTo('index4.html'); }
      return;
    }
  });
}

// ─── Invitation / RSVP Modal ─────────────────────────────────────────────────
function showRsvpModal(event) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s ease;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:14px;padding:32px;width:90%;max-width:420px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);text-align:center;font-family:Inter,sans-serif;transform:scale(0.95);transition:transform 0.2s ease;';
  modal.innerHTML = `
    <div style="margin-bottom:16px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
    <h3 style="margin:0 0 12px;color:#0f172a;font-size:20px;">Invitation Only Warning</h3>
    <p style="color:#475569;font-size:15px;line-height:1.5;margin-bottom:24px;">This event is for people who are invited. Others may not attend.</p>
    <label style="display:flex;align-items:flex-start;gap:12px;margin-bottom:28px;cursor:pointer;text-align:left;">
      <input type="checkbox" id="rsvp-modal-check" style="width:20px;height:20px;cursor:pointer;flex-shrink:0;margin-top:2px;">
      <span style="font-size:14.5px;color:#0f172a;font-weight:500;">I accept and understand these conditions.</span>
    </label>
    <div style="display:flex;gap:12px;">
      <button id="rsvp-modal-cancel" style="flex:1;padding:12px;border:1px solid #cbd5e1;background:#fff;color:#475569;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;">Cancel</button>
      <button id="rsvp-modal-continue" disabled style="flex:1;padding:12px;border:none;background:#f97316;color:#fff;border-radius:8px;font-weight:600;font-size:15px;cursor:not-allowed;opacity:0.5;">Continue</button>
    </div>`;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.transform = 'scale(1)'; });

  const checkbox    = modal.querySelector('#rsvp-modal-check');
  const continueBtn = modal.querySelector('#rsvp-modal-continue');
  const cancelBtn   = modal.querySelector('#rsvp-modal-cancel');

  function close() {
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    setTimeout(() => overlay.remove(), 200);
  }

  checkbox.addEventListener('change', () => {
    continueBtn.disabled = !checkbox.checked;
    continueBtn.style.opacity = checkbox.checked ? '1' : '0.5';
    continueBtn.style.cursor  = checkbox.checked ? 'pointer' : 'not-allowed';
  });

  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  continueBtn.addEventListener('click', () => {
    if (!continueBtn.disabled) {
      storeEventForRSVP(event);
      navTo('index7.html');
    }
  });
}

// ─── Load skeleton placeholder ────────────────────────────────────────────────
function showSkeleton(container, count = 3) {
  if (!container) return;
  container.innerHTML = Array(count).fill(`
    <div class="event-card" style="background:#f8f8f8;border-radius:12px;overflow:hidden;animation:pulse 1.5s infinite;">
      <div style="height:160px;background:#e5e7eb;"></div>
      <div style="padding:16px;">
        <div style="height:16px;background:#e5e7eb;border-radius:4px;margin-bottom:10px;width:70%;"></div>
        <div style="height:12px;background:#e5e7eb;border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:12px;background:#e5e7eb;border-radius:4px;width:50%;"></div>
      </div>
    </div>`).join('');
}

// ─── INDEX 1: Home Page ──────────────────────────────────────────────────────
async function loadHomePage() {
  const upcomingGrid = document.getElementById('upcoming-grid');
  const liveGrid     = document.getElementById('live-grid');

  if (!upcomingGrid && !liveGrid) return;

  showSkeleton(upcomingGrid, 3);
  showSkeleton(liveGrid, 3);

  const { email } = getAttendeeFromUrl();

  // Fetch upcoming + live events in parallel from events.json, plus this attendee's RSVPs
  const [upcomingEvents, liveEvents, myRsvps] = await Promise.all([
    apiFetch('/events?status=upcoming', 'attendee'),
    apiFetch('/events?status=live',     'attendee'),
    email
      ? apiFetch(`/rsvps/my?email=${encodeURIComponent(email)}`, 'attendee')
      : Promise.resolve([]),
  ]);

  const rsvpedIds    = new Set((myRsvps || []).map(r => r.eventId));
  const allForHandlers = [...(upcomingEvents || []), ...(liveEvents || [])];

  // ── Section 1: Upcoming events ──
  const upcoming = (upcomingEvents || []).slice(0, 3);
  if (upcomingGrid) {
    upcomingGrid.innerHTML = upcoming.length
      ? upcoming.map(e => buildEventCard(e, rsvpedIds.has(e.id), false)).join('')
      : '<p style="color:#717182;padding:16px;">No upcoming events at the moment.</p>';
    attachCardHandlers(upcomingGrid, allForHandlers);
  }

  // ── Section 2: Live / Ongoing events ──
  const live = (liveEvents || []).slice(0, 3);
  if (liveGrid) {
    liveGrid.innerHTML = live.length
      ? live.map(e => buildEventCard(e, rsvpedIds.has(e.id), false)).join('')
      : '<p style="color:#717182;padding:16px;">No ongoing events right now.</p>';
    attachCardHandlers(liveGrid, allForHandlers);
  }
}


// ─── INDEX 2: Browse Page ────────────────────────────────────────────────────
async function loadBrowsePage() {
  const grid         = document.getElementById('browse-grid');
  const resultsCount = document.getElementById('results-count');
  if (!grid) return;

  showSkeleton(grid, 6);

  const { email } = getAttendeeFromUrl();

  // ── Only fetch upcoming + live events from events.json (no pending/rejected) ──
  const [upcomingEvents, liveEvents, myRsvps] = await Promise.all([
    apiFetch('/events?status=upcoming', 'attendee'),
    apiFetch('/events?status=live',     'attendee'),
    email
      ? apiFetch(`/rsvps/my?email=${encodeURIComponent(email)}`, 'attendee')
      : Promise.resolve([]),
  ]);

  const allEvents = [
    ...(upcomingEvents || []),
    ...(liveEvents     || []),
  ];

  if (!allEvents.length) {
    grid.innerHTML = '<p style="color:#717182;padding:16px;">Could not load events. Make sure the backend is running.</p>';
    return;
  }

  const rsvpedIds  = new Set((myRsvps || []).map(r => r.eventId));
  let allEventsData = allEvents;

  function renderGrid(events) {
    if (resultsCount) resultsCount.textContent = `${events.length} event${events.length !== 1 ? 's' : ''} found`;
    grid.innerHTML = events.length
      ? events.map(e => buildEventCard(e, rsvpedIds.has(e.id), false)).join('')
      : '<p style="color:#717182;padding:16px;">No events match your search.</p>';
    attachCardHandlers(grid, allEventsData);
  }

  renderGrid(allEvents);

  // ── Search & filter ──────────────────────────────────────────────────────
  const searchInput    = document.getElementById('search-events');
  const filterCategory = document.getElementById('filter-category');

  function applyFilters() {
    const query     = (searchInput?.value || '').toLowerCase();
    const catFilter = (filterCategory?.querySelector('.filter-label')?.textContent || 'All Categories');
    let filtered    = allEventsData;

    if (query) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        (e.description || '').toLowerCase().includes(query) ||
        (e.location || '').toLowerCase().includes(query)
      );
    }
    if (catFilter !== 'All Categories') {
      filtered = filtered.filter(e => e.domain === catFilter);
    }
    renderGrid(filtered);
  }

  searchInput?.addEventListener('input', applyFilters);

  // Category dropdown
  const categories = [...new Set(allEvents.map(e => e.domain).filter(Boolean))];
  if (filterCategory) {
    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown';
    dropdown.style.cssText = 'position:absolute;top:110%;left:0;min-width:180px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.08);z-index:100;display:none;';

    const allOpt = document.createElement('div');
    allOpt.textContent = 'All Categories';
    allOpt.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:14px;';
    allOpt.addEventListener('click', () => {
      filterCategory.querySelector('.filter-label').textContent = 'All Categories';
      dropdown.style.display = 'none';
      applyFilters();
    });
    dropdown.appendChild(allOpt);

    categories.forEach(cat => {
      const opt = document.createElement('div');
      opt.textContent = cat;
      opt.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:14px;';
      opt.addEventListener('mouseover', () => opt.style.background = '#f8f6f2');
      opt.addEventListener('mouseout',  () => opt.style.background = '');
      opt.addEventListener('click', () => {
        filterCategory.querySelector('.filter-label').textContent = cat;
        dropdown.style.display = 'none';
        applyFilters();
      });
      dropdown.appendChild(opt);
    });

    filterCategory.style.position = 'relative';
    filterCategory.appendChild(dropdown);
    filterCategory.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => { dropdown.style.display = 'none'; });
  }
}

// ─── INDEX 3: My Events Page ─────────────────────────────────────────────────
async function loadMyEventsPage() {
  const upcomingGrid  = document.getElementById('upcoming-cards');
  const completedGrid = document.getElementById('completed-cards');
  if (!upcomingGrid) return;

  showSkeleton(upcomingGrid, 2);

  // getAttendeeFromUrl() checks URL params first, then sessionStorage fallback
  const { email } = getAttendeeFromUrl();

  if (!email) {
    // No identity found — show empty state (not a sign-in error)
    upcomingGrid.innerHTML = '<p style="color:#717182;padding:16px;">No events yet. Browse events and RSVP to see them here!</p>';
    if (completedGrid) completedGrid.innerHTML = '<p style="color:#717182;padding:16px;">No past events attended yet.</p>';
    return;
  }

  // Fetch this attendee's RSVPs from rsvps.json + all events from events.json
  const [myRsvps, allEvents] = await Promise.all([
    apiFetch(`/rsvps/my?email=${encodeURIComponent(email)}`, 'attendee'),
    apiFetch('/events', 'attendee'),
  ]);

  if (!myRsvps || !allEvents) {
    upcomingGrid.innerHTML = '<p style="color:#717182;padding:16px;">Could not load your events. Make sure the backend is running.</p>';
    return;
  }

  const eventMap = {};
  allEvents.forEach(e => { eventMap[e.id] = e; });

  const myEvents = myRsvps.map(r => eventMap[r.eventId]).filter(Boolean);
  const upcoming = myEvents.filter(e => ['upcoming', 'live'].includes(e.status));
  const past     = myEvents.filter(e => e.status === 'completed');

  const tabUpcoming = document.getElementById('tab-upcoming');
  if (tabUpcoming) tabUpcoming.textContent = `Upcoming (${upcoming.length})`;

  if (upcomingGrid) {
    upcomingGrid.innerHTML = upcoming.length
      ? upcoming.map(e => buildEventCard(e, true, false)).join('')
      : '<p style="color:#717182;padding:16px;">You have no upcoming events. Browse and RSVP to an event!</p>';
    attachCardHandlers(upcomingGrid, allEvents);
  }

  if (completedGrid) {
    completedGrid.innerHTML = past.length
      ? past.map(e => buildEventCard(e, false, true)).join('')
      : '<p style="color:#717182;padding:16px;">No past events attended yet.</p>';
    attachCardHandlers(completedGrid, allEvents);
  }
}

// ─── PAGE DETECTION & INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index1.html';

  if (page === 'index1.html' || page === '') {
    loadHomePage();
  } else if (page === 'index2.html') {
    loadBrowsePage();
  } else if (page === 'index3.html') {
    loadMyEventsPage();
  }
});
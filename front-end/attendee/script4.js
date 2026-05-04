/* ══════════════════════════════════════════
   script4.js  –  Event Detail (index4.html)

   GATE LOGIC:
   • Sessions / Live Poll are LOCKED unless attendee has RSVP'd for this event
   • RSVP status is checked via rsvps.json through the backend API
   • Quick Action "View Ticket" → index9.html
   • Quick Action "Join Session" → index5.html (live polls, Q&A, feedback)
   ══════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {

  /* ─────────────────────────────────────
     Get attendee identity from URL params or sessionStorage
  ───────────────────────────────────── */
  function getParams() { return window.location.search || ''; }
  function getAttendee() {
    const p = new URLSearchParams(window.location.search);
    return {
      email: p.get('email') || sessionStorage.getItem('attendee_email') || '',
      name:  p.get('name')  || sessionStorage.getItem('attendee_name')  || '',
    };
  }

  const { email } = getAttendee();
  const eventId   = sessionStorage.getItem('detail_event_id') || '';

  /* ─────────────────────────────────────
     Dynamically populate event data from sessionStorage
  ───────────────────────────────────── */
  const evTitle     = sessionStorage.getItem('detail_event_title');
  const evDate      = sessionStorage.getItem('detail_event_date');
  const evLocation  = sessionStorage.getItem('detail_event_location');
  const evAttendees = sessionStorage.getItem('detail_event_attendees');
  const evBadge     = sessionStorage.getItem('detail_event_badge');
  const evDesc      = sessionStorage.getItem('detail_event_desc');

  if (evTitle) {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) heroTitle.textContent = evTitle;
    document.title = evTitle + ' – Wevents.com';
  }
  if (evBadge) {
    const heroBadge = document.querySelector('.hero-badge');
    if (heroBadge) heroBadge.textContent = evBadge;
  }
  if (evDesc) {
    const aboutText = document.querySelector('.card-body-text');
    if (aboutText) aboutText.textContent = evDesc;
  }
  if (evDate) {
    const dateValues = document.querySelectorAll('#detail-datetime .detail-value');
    if (dateValues.length > 0) dateValues[0].textContent = evDate;
  }
  if (evLocation) {
    const locValues = document.querySelectorAll('#detail-location .detail-value');
    if (locValues.length > 0) locValues[0].textContent = evLocation;
  }
  if (evAttendees) {
    const attValues = document.querySelectorAll('#detail-attendance .detail-value');
    if (attValues.length > 0) attValues[0].textContent = evAttendees;
  }

  /* ─────────────────────────────────────
     Check RSVP status via backend (rsvps.json)
     instead of relying on the sessionStorage otp_verified flag
     (which gets cleared after the confirmation page)
  ───────────────────────────────────── */
  let isRSVPd = sessionStorage.getItem('otp_verified') === 'true'; // instant flag

  if (!isRSVPd && email && eventId) {
    try {
      const res = await fetch(`http://localhost:3000/rsvps/my?email=${encodeURIComponent(email)}`, {
        headers: { role: 'attendee' }
      });
      if (res.ok) {
        const myRsvps = await res.json();
        isRSVPd = myRsvps.some(r => r.eventId === eventId && r.status !== 'cancelled');
      }
    } catch { /* backend unreachable – keep isRSVPd = false */ }
  }

  /* ─────────────────────────────────────
     Show RSVP banner or unlock sessions
  ───────────────────────────────────── */
  if (!isRSVPd) {
    showRSVPBanner();
    lockSessions();
  } else {
    hideRSVPBanner();
    unlockSessions();
  }

  function showRSVPBanner() {
    const banner = document.createElement('div');
    banner.id = 'rsvp-banner';
    banner.style.cssText = `
      background: #fff7ed;
      border: 1px solid rgba(249,115,22,0.25);
      border-radius: 10px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 16px 24px 0;
      flex-wrap: wrap;
    `;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style="font-size:14px;color:#0f172a;font-weight:500;">
          Register for this event to access sessions and live polls.
        </span>
      </div>
      <button id="banner-rsvp-btn" style="
        background:#f97316;color:#fff;border:none;border-radius:8px;
        padding:8px 18px;font-size:14px;font-weight:600;cursor:pointer;
        white-space:nowrap;flex-shrink:0;
      ">RSVP Now</button>
    `;

    const hero = document.querySelector('.event-hero, .session-hero, .hero-section, header');
    const main = document.querySelector('.main-area, main, .main-content');
    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(banner, hero.nextSibling);
    } else if (main) {
      main.insertBefore(banner, main.firstChild);
    }

    document.getElementById('banner-rsvp-btn')?.addEventListener('click', () => {
      const title = document.querySelector('h1, .event-title, .session-title')?.textContent || evTitle || 'Event';
      sessionStorage.setItem('rsvp_event', title);
      sessionStorage.removeItem('otp_verified');
      window.location.href = 'index7.html' + getParams();
    });
  }

  function hideRSVPBanner() {
    document.getElementById('rsvp-banner')?.remove();
  }

  function lockSessions() {
    const sessionItems = document.querySelectorAll(
      '.session-item, .schedule-item, .timeline-item, .session-card, .event-session'
    );

    sessionItems.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative;';
      item.parentNode.insertBefore(wrapper, item);
      wrapper.appendChild(item);

      const overlay = document.createElement('div');
      overlay.className = 'session-lock-overlay';
      overlay.style.cssText = `
        position:absolute; inset:0;
        background: rgba(244,237,226,0.78);
        backdrop-filter: blur(2px);
        border-radius: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
      `;
      overlay.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style="font-size:12px;font-weight:600;color:#f97316;">RSVP to unlock</span>
        </div>`;

      overlay.addEventListener('click', () => {
        const title = document.querySelector('h1, .event-title, .session-title')?.textContent || evTitle || 'Event';
        sessionStorage.setItem('rsvp_event', title);
        sessionStorage.removeItem('otp_verified');
        window.location.href = 'index7.html' + getParams();
      });

      wrapper.appendChild(overlay);
    });

    lockLiveButtons();
  }

  function lockLiveButtons() {
    const liveButtons = document.querySelectorAll(
      '[id*="live"], [id*="join"], [id*="participate"], .btn-join, .btn-live-session'
    );
    liveButtons.forEach(btn => {
      btn.disabled = true;
      btn.title = 'Complete RSVP to access live sessions';
      btn.style.opacity = '0.45';
      btn.style.cursor  = 'not-allowed';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        alert('Please complete RSVP to access this session.');
      });
    });
  }

  function unlockSessions() {
    const chip = document.createElement('div');
    chip.style.cssText = `
      background:#dcfce7; color:#16a34a; border:1px solid rgba(22,163,74,0.25);
      border-radius:10px; padding:10px 20px;
      display:flex; align-items:center; gap:8px;
      margin:16px 24px 0; font-size:13.5px; font-weight:500;
    `;
    chip.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      You're registered! You can now access all sessions and live polls.`;

    const hero = document.querySelector('.event-hero, .session-hero, .hero-section, header');
    const main = document.querySelector('.main-area, main, .main-content');
    if (hero?.parentNode) hero.parentNode.insertBefore(chip, hero.nextSibling);
    else if (main) main.insertBefore(chip, main.firstChild);

    document.querySelectorAll('[id*="live"],[id*="join"],[id*="participate"]').forEach(el => {
      el.disabled = false;
      el.style.opacity = '';
      el.style.cursor  = '';
    });
  }

  /* ─────────────────────────────────────
     Navigation
  ───────────────────────────────────── */
  document.getElementById('btn-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    history.length > 1 ? history.back() : (window.location.href = 'index1.html' + getParams());
  });

  /* ─────────────────────────────────────
     Quick Actions
  ───────────────────────────────────── */

  // "View Ticket" / Check-in → show ticket confirmation page (not RSVP)
  const btnCheckin = document.getElementById('btn-checkin');
  if (btnCheckin) {
    btnCheckin.addEventListener('click', function() {
      if (this.disabled) return;
      // Go to ticket confirmation page with params
      window.location.href = 'index9.html' + getParams();
    });
  }

  // "Join Live Session" → index5.html (polls, Q&A, feedback)
  document.querySelectorAll('[id*="live"],[id*="join-session"],[id*="participate"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isRSVPd) {
        alert('Please complete RSVP to access live sessions.');
        return;
      }
      window.location.href = 'index5.html' + getParams();
    });
  });

  // RSVP button in the page body (if present)
  document.getElementById('btn-rsvp')?.addEventListener('click', () => {
    const title = document.querySelector('h1,.event-title')?.textContent || evTitle || 'Event';
    sessionStorage.setItem('rsvp_event', title);
    sessionStorage.removeItem('otp_verified');
    window.location.href = 'index7.html' + getParams();
  });

  /* ── Sidebar navigation (forward URL params) ── */
  document.getElementById('sidebar-home')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index1.html' + getParams();
  });
  document.getElementById('sidebar-browse')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index2.html' + getParams();
  });
  document.getElementById('sidebar-myevents')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index3.html' + getParams();
  });
  document.getElementById('nav-home')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index1.html' + getParams();
  });
  document.getElementById('nav-browse')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index2.html' + getParams();
  });
  document.getElementById('nav-myevents')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index3.html' + getParams();
  });
});
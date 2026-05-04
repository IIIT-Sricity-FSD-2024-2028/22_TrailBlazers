/* ═══════════════════════════════════════════════════════════
   app.js  –  Shared functionality for all Wevents.com pages
   Pure Vanilla JavaScript – no libraries, no frameworks
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Utility ── */
function qs(sel, ctx = document)  { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

/* ─────────────────────────────────────
   GLOBAL CSS OVERRIDES
   Forces badge inline on every page
   ───────────────────────────────────── */
function injectGlobalOverrides() {
  const style = document.createElement('style');
  style.id = 'app-global-overrides';
  style.textContent = `
    /* ── Force notif-badge inline (never absolute) ── */
    .notif-badge {
      position: static !important;
      top: auto !important;
      right: auto !important;
      display: inline-flex !important;
      margin-left: 3px !important;
      vertical-align: middle !important;
    }
    .header-nav-item, .header-btn {
      position: static !important;
    }
    /* ── Panel shared styles ── */
    .app-panel {
      position: fixed;
      top: 68px; right: 12px;
      background: #fff;
      border: 1px solid rgba(0,0,0,0.10);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.14);
      z-index: 999;
      overflow: hidden;
      display: none;
    }
    .app-panel.open {
      display: block;
      animation: panelSlide 150ms ease;
    }
    @keyframes panelSlide {
      from { opacity:0; transform:translateY(-6px); }
      to   { opacity:1; transform:none; }
    }
    .app-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid rgba(0,0,0,0.08);
      font-size: 15px; color: #0f172a; font-weight: 600;
    }
    .app-panel-header button {
      background: none; border: none; cursor: pointer; font-size: 14px;
      color: #717182; padding: 2px 6px; border-radius: 4px;
    }
    .app-panel-header button:hover { background: #f3f3f5; }
    .app-panel-list { list-style: none; margin: 0; padding: 4px 0; }
    .app-panel-list li {
      transition: background 120ms;
    }
    .app-panel-list li:hover { background: #f8f6f2; }
    .app-panel-list li button, .app-panel-list li a {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 16px; width: 100%; text-align: left;
      font-family: inherit; font-size: 13px; color: #0f172a;
      background: none; border: none; cursor: pointer;
      text-decoration: none; line-height: 1.45;
    }
  `;
  if (!document.getElementById('app-global-overrides')) document.head.appendChild(style);
}

/* ─────────────────────────────────────
   NAVIGATION (sidebar + brand)
   ───────────────────────────────────── */
function initNavigation() {
  const NAV_MAP = { home: 'index1.html', browse: 'index2.html', myevents: 'index3.html' };

  Object.entries(NAV_MAP).forEach(([key, page]) => {
    ['sidebar-' + key, 'nav-' + key].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (window.location.href.includes(page)) {
        qsa('.sidebar-link, .sidebar-nav a').forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        el.classList.add('active');
        el.setAttribute('aria-current', 'page');
      }
      el.addEventListener('click', (e) => { e.preventDefault(); window.location.href = page; });
    });
  });

  qsa('.brand-name').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => { window.location.href = 'index1.html'; });
  });
}

/* ─────────────────────────────────────
   Close all open panels helper
   ───────────────────────────────────── */
function closeAllPanels() {
  qsa('.app-panel.open').forEach(p => p.classList.remove('open'));
}

/* ─────────────────────────────────────
   NOTIFICATIONS PANEL
   – Clickable items redirect to relevant pages
   ───────────────────────────────────── */
function initNotifications() {
  const btn = qs('#nav-notifications') || qs('#hdr-notifications');
  if (!btn) return;

  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.className = 'app-panel';
  panel.style.width = '340px';
  panel.innerHTML = `
    <div class="app-panel-header">
      <span>Notifications</span>
      <button id="notif-close" aria-label="Close">✕</button>
    </div>
    <ul class="app-panel-list">
      <li style="background:#fff7ed;">
        <a href="index4.html" style="gap:10px;">
          <span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:#f97316;margin-top:5px;"></span>
          <div>
            <p style="margin:0;font-weight:500;">Your RSVP for <b>Tech Innovation Summit</b> is confirmed!</p>
            <span style="font-size:11.5px;color:#717182;margin-top:2px;display:block;">2 hours ago</span>
          </div>
        </a>
      </li>
      <li style="background:#fff7ed;">
        <a href="index4.html" style="gap:10px;">
          <span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:#f97316;margin-top:5px;"></span>
          <div>
            <p style="margin:0;font-weight:500;">Reminder: <b>Digital Marketing Workshop</b> starts tomorrow</p>
            <span style="font-size:11.5px;color:#717182;margin-top:2px;display:block;">5 hours ago</span>
          </div>
        </a>
      </li>
      <li>
        <a href="index2.html" style="gap:10px;">
          <span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:transparent;margin-top:5px;"></span>
          <div>
            <p style="margin:0;font-weight:500;">New recommendation: <b>Cybersecurity Summit 2026</b></p>
            <span style="font-size:11.5px;color:#717182;margin-top:2px;display:block;">Yesterday</span>
          </div>
        </a>
      </li>
      <li>
        <a href="index3.html" style="gap:10px;">
          <span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:transparent;margin-top:5px;"></span>
          <div>
            <p style="margin:0;font-weight:500;">You attended <b>AI & Machine Learning Workshop</b></p>
            <span style="font-size:11.5px;color:#717182;margin-top:2px;display:block;">2 days ago</span>
          </div>
        </a>
      </li>
    </ul>`;
  document.body.appendChild(panel);

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = panel.classList.contains('open');
    closeAllPanels();
    if (!isOpen) panel.classList.add('open');
  });
  panel.querySelector('#notif-close')?.addEventListener('click', () => panel.classList.remove('open'));
  panel.addEventListener('click', (e) => e.stopPropagation());
}

/* ─────────────────────────────────────
   PROFILE PANEL
   – Shows mock user data
   ───────────────────────────────────── */
function initProfileMenu() {
  const btn = qs('#nav-profile') || qs('#hdr-profile');
  if (!btn) return;

  const panel = document.createElement('div');
  panel.id = 'profile-panel';
  panel.className = 'app-panel';
  panel.style.width = '280px';
  panel.innerHTML = `
    <div style="padding:20px 16px 14px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(0,0,0,0.08);">
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;">RS</div>
      <div>
        <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">Rahul Sharma</p>
        <p style="margin:2px 0 0;font-size:12.5px;color:#717182;">rahul.sharma@email.com</p>
      </div>
    </div>
    <div style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.06);">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#717182;padding:4px 0;">
        <span>Events attended</span><span id="stat-attended" style="font-weight:600;color:#0f172a;">2</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#717182;padding:4px 0;">
        <span>Upcoming RSVPs</span><span id="stat-upcoming" style="font-weight:600;color:#0f172a;">2</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#717182;padding:4px 0;">
        <span>Member since</span><span style="font-weight:600;color:#0f172a;">Jan 2025</span>
      </div>
    </div>
    <ul class="app-panel-list" style="padding:4px 0;">
      <li><a href="index3.html">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717182" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>My Events</span>
      </a></li>
      <li><a href="#" id="pm-settings" style="color:#0f172a;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717182" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>Settings</span>
      </a></li>
      <li style="border-top:1px solid rgba(0,0,0,0.06);margin-top:2px;">
        <a href="#" id="pm-logout" style="color:#ef4444;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Sign Out</span>
        </a>
      </li>
    </ul>`;
  document.body.appendChild(panel);

  function updateProfileStats() {
    const rsvpEvents = JSON.parse(localStorage.getItem('rsvp_events') || '[]');
    
    // Simulate exactly what index3.html does
    const staticElTitles = ['tech innovation', 'startup'];
    const validDynamic = new Set();

    rsvpEvents.forEach(ev => {
      if (!ev || !ev.title) return;
      const lower = ev.title.trim().toLowerCase();
      // Partial match overlapping static events
      const overlapsStatic = staticElTitles.some(t => t.includes(lower) || lower.includes(t));
      if (!overlapsStatic) {
        validDynamic.add(lower);
      }
    });

    const upcomingCount = staticElTitles.length + validDynamic.size;
    
    const countEl = panel.querySelector('#stat-upcoming');
    if (countEl) countEl.textContent = upcomingCount;
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateProfileStats();
    const isOpen = panel.classList.contains('open');
    closeAllPanels();
    if (!isOpen) panel.classList.add('open');
  });

  panel.addEventListener('click', (e) => e.stopPropagation());

  /* ── Settings button ── */
  panel.querySelector('#pm-settings')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAllPanels();
    showGlobalToast('Settings page coming soon!');
  });

  panel.querySelector('#pm-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Sign out of Wevents.com?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '../lp/index.html';
    }
  });
}

/* ─────────────────────────────────────
   Close panels on outside click
   ───────────────────────────────────── */
function initClickOutside() {
  document.addEventListener('click', closeAllPanels);
}

/* ─────────────────────────────────────
   RESET: Clear dynamic RSVP data ONCE per browser session.
   - Fresh tab / page refresh → clears old data (2 defaults)
   - During session navigation → new RSVPs persist
   Uses a sessionStorage flag ('session_initialized') to
   distinguish first-load from in-session navigation.
   sessionStorage auto-clears when the tab/browser closes,
   so the next visit always starts fresh.
   ───────────────────────────────────── */
function resetRSVPState() {
  if (!sessionStorage.getItem('session_initialized')) {
    localStorage.removeItem('rsvp_events');
    localStorage.removeItem('did_reset_rsvps_fix');
    sessionStorage.setItem('session_initialized', 'true');
  }
}

/* ─────────────────────────────────────
   Force RSVP status on buttons application-wide
   ───────────────────────────────────── */
function syncRSVPButtons() {
  const rsvpEvents = JSON.parse(localStorage.getItem('rsvp_events') || '[]');
  const staticElTitles = ['tech innovation', 'startup'];
  const allRSVPs = new Set(staticElTitles);
  
  rsvpEvents.forEach(ev => {
    if (ev && typeof ev.title === 'string' && ev.title.trim().length > 2) {
      allRSVPs.add(ev.title.trim().toLowerCase());
    }
  });

  document.querySelectorAll('.event-card').forEach(card => {
    const titleEl = card.querySelector('.card-title');
    if (!titleEl) return;
    const title = titleEl.textContent.trim().toLowerCase();
    
    // Strict overlap check
    const isRSVPd = Array.from(allRSVPs).some(t => {
      if (!t || t.length < 3) return false;
      return t === title || title.includes(t) || t.includes(title);
    });

    if (isRSVPd) {
      // Find Attend button
      const attendBtn = card.querySelector('.btn-attend');
      if (attendBtn) {
        // Clone to strip existing event listeners (prevents going to index7.html)
        const newBtn = attendBtn.cloneNode(true);
        newBtn.textContent = "RSVP'd";
        newBtn.className = "btn-rsvpd";
        newBtn.id = newBtn.id.replace('attend-', 'rsvp-');
        
        // Instead of RSVP flow, just go to event detail page
        newBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = 'index4.html';
        });
        
        attendBtn.parentNode.replaceChild(newBtn, attendBtn);
      }
    }
  });
}

/* ─────────────────────────────────────
   Global toast (reusable)
   ───────────────────────────────────── */
function showGlobalToast(msg) {
  let t = document.getElementById('global-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'global-toast';
    t.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:#0f172a; color:#fff; font-size:13px; font-weight:500;
      padding:10px 20px; border-radius:8px;
      box-shadow:0 4px 14px rgba(0,0,0,0.20); z-index:9999;
      opacity:0; transition:opacity 200ms; pointer-events:none;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

/* ─────────────────────────────────────
   INIT on every page
   ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Always reset RSVP state to the 2 default events on page load
  resetRSVPState();

  injectGlobalOverrides();
  initNavigation();
  initNotifications();
  initProfileMenu();
  initClickOutside();
  
  // Sync all buttons to correctly display RSVP state globally
  syncRSVPButtons();
});

/* ═══════════════════════════════════════════════════════════
   app.js  –  Shared functionality for all Wevents.com pages
   Data is fetched from the NestJS backend – no localStorage.
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Utility ── */
function qs(sel, ctx = document)  { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

/* ─────────────────────────────────────
   GLOBAL CSS OVERRIDES
   ───────────────────────────────────── */
function injectGlobalOverrides() {
  const style = document.createElement('style');
  style.id = 'app-global-overrides';
  style.textContent = `
    .notif-badge {
      position: static !important;
      top: auto !important;
      right: auto !important;
      display: inline-flex !important;
      margin-left: 3px !important;
      vertical-align: middle !important;
    }
    .header-nav-item, .header-btn { position: static !important; }
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
    .app-panel-list li { transition: background 120ms; }
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
      <li>
        <a href="index2.html" style="gap:10px;">
          <span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:transparent;margin-top:5px;"></span>
          <div>
            <p style="margin:0;font-weight:500;">Browse upcoming events on Wevents.com</p>
            <span style="font-size:11.5px;color:#717182;margin-top:2px;display:block;">Just now</span>
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
   – Loads real user data from backend
   ───────────────────────────────────── */
function initProfileMenu() {
  const btn = qs('#nav-profile') || qs('#hdr-profile');
  if (!btn) return;

  const ATTENDEE_EMAIL = 'rahul.sharma@gmail.com';

  const panel = document.createElement('div');
  panel.id = 'profile-panel';
  panel.className = 'app-panel';
  panel.style.width = '280px';
  panel.innerHTML = `
    <div style="padding:20px 16px 14px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(0,0,0,0.08);">
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;" id="profile-avatar">RS</div>
      <div>
        <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;" id="profile-name">Rahul Sharma</p>
        <p style="margin:2px 0 0;font-size:12.5px;color:#717182;" id="profile-email">${ATTENDEE_EMAIL}</p>
      </div>
    </div>
    <div style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.06);">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#717182;padding:4px 0;">
        <span>Upcoming RSVPs</span><span id="stat-upcoming" style="font-weight:600;color:#0f172a;">—</span>
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
      <li style="border-top:1px solid rgba(0,0,0,0.06);margin-top:2px;">
        <a href="#" id="pm-logout" style="color:#ef4444;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Sign Out</span>
        </a>
      </li>
    </ul>`;
  document.body.appendChild(panel);

  // Load real RSVP count from backend
  async function updateProfileStats() {
    try {
      const res = await fetch(`http://localhost:3000/rsvps/my?email=${encodeURIComponent(ATTENDEE_EMAIL)}`, { headers: { role: 'attendee' } });
      if (res.ok) {
        const rsvps = await res.json();
        const upcoming = (rsvps || []).filter(r => r.status !== 'cancelled').length;
        const el = panel.querySelector('#stat-upcoming');
        if (el) el.textContent = upcoming;
      }
    } catch { /* backend offline */ }
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

  panel.querySelector('#pm-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Sign out of Wevents.com?')) {
      sessionStorage.clear();
      window.location.href = '../landing-page/index.html';
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
  injectGlobalOverrides();
  initNavigation();
  initNotifications();
  initProfileMenu();
  initClickOutside();
});
/* ═══════════════════════════════════════
   script3.js  –  My Events (index3.html)
   ═══════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────
     My Events page always shows exactly 2
     hardcoded upcoming events (Tech Innovation
     + Startup). Dynamic RSVP events are added
     only during the active session and cleared
     on page refresh (no backend persistence).
  ───────────────────────────────────── */
  const upcomingGrid = document.querySelector('#panel-upcoming .cards-grid');
  const tabUpcoming  = document.getElementById('tab-upcoming');

  // Load any session-added RSVP events (from the current browsing session)
  const rsvpEvents = JSON.parse(localStorage.getItem('rsvp_events') || '[]');

  // Collect all existing static card titles
  const existingTitles = [];
  if (upcomingGrid) {
    upcomingGrid.querySelectorAll('.card-title').forEach(el => {
      existingTitles.push(el.textContent.trim().toLowerCase());
    });
  }

  function titleAlreadyExists(title) {
    const lower = title.toLowerCase();
    return existingTitles.some(t => t.includes(lower) || lower.includes(t));
  }

  // If there are any dynamically RSVP'd events in this session, add them
  rsvpEvents.forEach(ev => {
    if (!upcomingGrid || !ev || !ev.title) return;
    if (titleAlreadyExists(ev.title)) return;
    existingTitles.push(ev.title.toLowerCase());

    const article = document.createElement('article');
    article.className = 'event-card';
    article.setAttribute('role', 'listitem');
    article.setAttribute('data-event-title', ev.title);
    article.style.cursor = 'pointer';
    article.innerHTML = `
      <div class="card-image" style="background-image:url('${ev.img}');" aria-hidden="true">
        <span class="card-badge badge-white">${ev.badge}</span>
      </div>
      <div class="card-body">
        <h2 class="card-title">${ev.title}</h2>
        <ul class="card-meta" aria-label="Event details">
          <li class="meta-item">
            <span class="meta-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <span>${ev.date}</span>
          </li>
          <li class="meta-item">
            <span class="meta-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <span>${ev.location}</span>
          </li>
          <li class="meta-item">
            <span class="meta-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <span>${ev.attendees} attendees</span>
          </li>
        </ul>
        <div class="card-actions">
          <button class="btn-rsvpd">RSVP'd</button>
        </div>
      </div>`;

    upcomingGrid.appendChild(article);
  });

  // Update the Upcoming count in the tab
  if (tabUpcoming && upcomingGrid) {
    const count = upcomingGrid.querySelectorAll('.event-card').length;
    tabUpcoming.textContent = `Upcoming (${count})`;
  }

  /* ─────────────────────────────────────
     Tab switching
  ───────────────────────────────────── */
  const tabBtns   = document.querySelectorAll('.tab-trigger, .tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('tab-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('tab-active');
      btn.setAttribute('aria-selected', 'true');

      const target = btn.getAttribute('aria-controls');
      tabPanels.forEach(panel => {
        panel.style.display = panel.id === target ? '' : 'none';
        panel.hidden = (panel.id !== target);
      });
    });
  });

  // Show first tab on load
  tabPanels.forEach((p, i) => {
    p.style.display = i === 0 ? '' : 'none';
    p.hidden = i !== 0;
  });

  /* ─────────────────────────────────────
     Click on ANY event card → Event Detail
  ───────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.event-card');
    if (!card) return;

    // If the user clicked the RSVP'd button itself, just stay
    if (e.target.closest('.btn-rsvpd')) return;

    const title     = card.querySelector('.card-title')?.textContent || 'Event';
    const metaItems = card.querySelectorAll('.meta-item') || [];
    const dateText  = metaItems[0]?.textContent.trim() || '';
    const locText   = metaItems[1]?.textContent.trim() || '';
    const attText   = metaItems[2]?.textContent.trim() || '';
    const badge     = card.querySelector('.card-badge')?.textContent || 'Event';
    const desc      = card.querySelector('.card-desc')?.textContent || '';
    const imgDiv    = card.querySelector('.card-image');
    const imgUrl    = imgDiv ? (getComputedStyle(imgDiv).backgroundImage || '').replace(/url\(['"]?|['"]?\)/g, '') : '';

    sessionStorage.setItem('detail_event_title', title);
    sessionStorage.setItem('detail_event_date', dateText);
    sessionStorage.setItem('detail_event_location', locText);
    sessionStorage.setItem('detail_event_attendees', attText);
    sessionStorage.setItem('detail_event_badge', badge);
    sessionStorage.setItem('detail_event_desc', desc);
    sessionStorage.setItem('detail_event_img', imgUrl);

    window.location.href = 'index4.html';
  });

  /* ─────────────────────────────────────
     Script for Q&A tab interactions (index5)
  ───────────────────────────────────── */
  initQAPanel();
  initFeedbackPanel();
});

/* ── Q&A submit – adds user's question inline ── */
function initQAPanel() {
  const form    = document.getElementById('qa-form');
  const input   = document.getElementById('qa-input');
  const qaList  = document.getElementById('qa-list');
  if (!form || !input || !qaList) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const item = document.createElement('div');
    item.className = 'qa-item';
    item.style.cssText = 'background:#fff7ed;border:1px solid rgba(249,115,22,0.2);border-radius:10px;padding:14px 16px;';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <p style="font-size:14px;font-weight:500;color:#0f172a;line-height:1.5;margin:0;">${text}</p>
        <button class="qa-upvote" data-votes="0" style="display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:1px solid rgba(0,0,0,0.1);border-radius:6px;padding:4px 8px;cursor:pointer;min-width:40px;color:#717182;font-size:12px;font-weight:600;">▲<span>0</span></button>
      </div>
      <p style="font-size:12px;color:#f97316;margin:6px 0 0;">Asked by You · Just now</p>`;
    qaList.insertBefore(item, qaList.firstChild);
    input.value = '';
  });

  // Upvote buttons (delegate)
  qaList.addEventListener('click', (e) => {
    const btn = e.target.closest('.qa-upvote');
    if (!btn) return;
    const current = parseInt(btn.dataset.votes || '0', 10);
    btn.dataset.votes = current + 1;
    btn.querySelector('span').textContent = current + 1;
    btn.style.color = '#f97316';
    btn.style.borderColor = 'rgba(249,115,22,0.35)';
  });
}

/* ── Feedback star rating + submit ── */
function initFeedbackPanel() {
  const stars   = document.querySelectorAll('.star-btn');
  const form    = document.getElementById('feedback-form');
  let selectedStar = 0;

  stars.forEach(btn => {
    btn.addEventListener('mouseenter', () => highlightStars(parseInt(btn.dataset.star)));
    btn.addEventListener('mouseleave', () => highlightStars(selectedStar));
    btn.addEventListener('click', () => {
      selectedStar = parseInt(btn.dataset.star);
      highlightStars(selectedStar);
    });
  });

  function highlightStars(n) {
    stars.forEach(b => {
      b.style.color = parseInt(b.dataset.star) <= n ? '#f97316' : '#e5e7eb';
    });
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit-feedback');
    if (submitBtn) {
      submitBtn.textContent = '✓ Feedback Submitted!';
      submitBtn.style.background = '#16a34a';
      submitBtn.disabled = true;
    }
  });
}

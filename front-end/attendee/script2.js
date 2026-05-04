/* ════════════════════════════════════════════
   script2.js  –  Browse Events (index2.html)
   ════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────
     RSVP reset is handled globally in app.js
     (once per session via resetRSVPState).
  ───────────────────────────────────── */

  const cards        = Array.from(document.querySelectorAll('.event-card'));
  const searchInput  = document.getElementById('search-events');
  const resultsCount = document.getElementById('results-count');
  const filterCat    = document.getElementById('filter-category');
  const filterDate   = document.getElementById('filter-dates');
  const filterLoc    = document.getElementById('filter-location');

  /* ── Custom dropdown builder ── */
  const CATEGORIES = ['All Categories','Technology','Marketing','Design','Business','Health'];
  const DATES      = ['Any Date','Today','This Week','This Month','Next Month'];
  const LOCATIONS  = ['All Locations','Maharashtra','Telangana','Gujarat','Karnataka','Delhi','Tamil Nadu','Rajasthan','West Bengal','Kerala','Uttar Pradesh'];

  function buildDropdown(triggerEl, options, onSelect) {
    if (!triggerEl) return;
    const panel = document.createElement('div');
    panel.className = 'custom-dropdown-panel';
    panel.innerHTML = options.map(o =>
      `<button class="dropdown-opt" data-value="${o}">${o}</button>`
    ).join('');

    if (!document.getElementById('dd-style')) {
      const style = document.createElement('style');
      style.id = 'dd-style';
      style.textContent = `
        .custom-dropdown-panel{position:absolute;z-index:500;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:6px 0;box-shadow:0 6px 20px rgba(0,0,0,.12);min-width:160px;display:none;}
        .custom-dropdown-panel.open{display:block;animation:ddSlide 120ms ease;}
        @keyframes ddSlide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
        .dropdown-opt{display:block;width:100%;text-align:left;padding:9px 16px;font-size:13.5px;font-family:inherit;background:none;border:none;cursor:pointer;color:#0f172a;transition:background 100ms;}
        .dropdown-opt:hover{background:#f8f6f2;}
        .dropdown-opt.selected{color:#f97316;font-weight:600;}
      `;
      document.head.appendChild(style);
    }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;display:inline-block;';
    triggerEl.parentNode.insertBefore(wrapper, triggerEl);
    wrapper.appendChild(triggerEl);
    wrapper.appendChild(panel);

    panel.querySelectorAll('.dropdown-opt')[0]?.classList.add('selected');

    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-dropdown-panel').forEach(p => {
        if (p !== panel) p.classList.remove('open');
      });
      panel.classList.toggle('open');
    });
    panel.addEventListener('click', (e) => {
      const opt = e.target.closest('.dropdown-opt');
      if (!opt) return;
      panel.querySelectorAll('.dropdown-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const labelEl = triggerEl.querySelector('.filter-label');
      if (labelEl) labelEl.textContent = opt.dataset.value;
      panel.classList.remove('open');
      onSelect(opt.dataset.value);
      e.stopPropagation();
    });
    document.addEventListener('click', () => panel.classList.remove('open'));
  }

  let activeCategory = 'All Categories';
  let activeDate     = 'Any Date';
  let activeLocation = 'All Locations';

  buildDropdown(filterCat,  CATEGORIES, v => { activeCategory = v; applyFilters(); });
  buildDropdown(filterDate, DATES,      v => { activeDate     = v; applyFilters(); });
  buildDropdown(filterLoc,  LOCATIONS,  v => { activeLocation = v; applyFilters(); });

  /* ── Live search ── */
  searchInput?.addEventListener('input', applyFilters);

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const desc  = card.querySelector('.card-desc')?.textContent.toLowerCase()  || '';
      const badge = card.querySelector('.card-badge')?.textContent.toLowerCase() || '';
      const meta  = card.querySelector('.card-meta')?.textContent.toLowerCase()  || '';
      const state = (card.dataset.state || '').toLowerCase();

      const matchSearch   = !query || title.includes(query) || desc.includes(query) || meta.includes(query);
      const matchCategory = activeCategory === 'All Categories' || badge.includes(activeCategory.toLowerCase());
      const matchLocation = activeLocation === 'All Locations'  || state === activeLocation.toLowerCase();

      const ok = matchSearch && matchCategory && matchLocation;

      card.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    if (resultsCount) resultsCount.textContent = `${visible} event${visible !== 1 ? 's' : ''} found`;
  }

  /* ─────────────────────────────────────
     "Attend" → RSVP flow (index7)
     "Details" → Event Detail (index4)
  ───────────────────────────────────── */
  document.querySelectorAll('[id^="attend-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.event-card');
      const title     = card?.querySelector('.card-title')?.textContent || 'Event';
      const metaItems = card?.querySelectorAll('.meta-item') || [];
      const dateText  = metaItems[0]?.textContent.trim() || '';
      const locText   = metaItems[1]?.textContent.trim() || '';
      const attText   = metaItems[2]?.textContent.trim() || '';
      const badge     = card?.querySelector('.card-badge')?.textContent || 'Event';
      const imgDiv    = card?.querySelector('.card-image');
      const imgUrl    = imgDiv ? (imgDiv.style.backgroundImage || '').replace(/url\(['"]?|['"]?\)/g, '') : '';

      sessionStorage.setItem('rsvp_event', title);
      sessionStorage.setItem('rsvp_event_date', dateText);
      sessionStorage.setItem('rsvp_event_location', locText);
      sessionStorage.setItem('rsvp_event_attendees', attText);
      sessionStorage.setItem('rsvp_event_badge', badge);
      sessionStorage.setItem('rsvp_event_img', imgUrl);
      sessionStorage.removeItem('otp_verified');
      window.location.href = 'index7.html';
    });
  });

  document.querySelectorAll('[id^="details-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.event-card');
      const title     = card?.querySelector('.card-title')?.textContent || 'Event';
      const metaItems = card?.querySelectorAll('.meta-item') || [];
      const dateText  = metaItems[0]?.textContent.trim() || '';
      const locText   = metaItems[1]?.textContent.trim() || '';
      const attText   = metaItems[2]?.textContent.trim() || '';
      const badge     = card?.querySelector('.card-badge')?.textContent || 'Event';
      const desc      = card?.querySelector('.card-desc')?.textContent || '';
      const imgDiv    = card?.querySelector('.card-image');
      const imgUrl    = imgDiv ? (imgDiv.style.backgroundImage || '').replace(/url\(['"]?|['"]?\)/g, '') : '';

      sessionStorage.setItem('detail_event_title', title);
      sessionStorage.setItem('detail_event_date', dateText);
      sessionStorage.setItem('detail_event_location', locText);
      sessionStorage.setItem('detail_event_attendees', attText);
      sessionStorage.setItem('detail_event_badge', badge);
      sessionStorage.setItem('detail_event_desc', desc);
      sessionStorage.setItem('detail_event_img', imgUrl);
      window.location.href = 'index4.html';
    });
  });

  /* ── Sidebar ── */
  document.getElementById('sidebar-home')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index1.html';
  });
  document.getElementById('sidebar-myevents')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index3.html';
  });

  applyFilters();
});
/* ═══════════════════════════════════════
   script3.js  –  My Events (index3.html)
   Event rendering is handled entirely by api-loader.js.
   This script handles only UI: tab switching & navigation.
   ═══════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────
     Tab switching (Upcoming ↔ Past)
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
     Sidebar navigation (forward URL params)
  ───────────────────────────────────── */
  function getParams() { return window.location.search || ''; }

  document.getElementById('nav-home')?.addEventListener('click', e => {
    e.preventDefault(); window.location.href = 'index1.html' + getParams();
  });
  document.getElementById('nav-browse')?.addEventListener('click', e => {
    e.preventDefault(); window.location.href = 'index2.html' + getParams();
  });
  document.getElementById('nav-myevents')?.addEventListener('click', e => {
    e.preventDefault(); window.location.href = 'index3.html' + getParams();
  });
  document.getElementById('sidebar-home')?.addEventListener('click', e => {
    e.preventDefault(); window.location.href = 'index1.html' + getParams();
  });
  document.getElementById('sidebar-browse')?.addEventListener('click', e => {
    e.preventDefault(); window.location.href = 'index2.html' + getParams();
  });
  document.getElementById('sidebar-myevents')?.addEventListener('click', e => {
    e.preventDefault(); window.location.href = 'index3.html' + getParams();
  });

});

/* ── Q&A submit – adds user's question inline ── */
function initQAPanel() {
  const form   = document.getElementById('qa-form');
  const input  = document.getElementById('qa-input');
  const qaList = document.getElementById('qa-list');
  if (!form || !input || !qaList) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const item = document.createElement('div');
    item.className = 'qa-item';
    item.style.cssText = 'background:#fff7ed;border:1px solid rgba(249,115,22,0.2);border-radius:10px;padding:14px 16px;position:relative;';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <p style="font-size:14px;font-weight:500;color:#0f172a;line-height:1.5;margin:0;">${text}</p>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="qa-upvote" data-votes="0" style="display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:1px solid rgba(0,0,0,0.1);border-radius:6px;padding:4px 8px;cursor:pointer;min-width:40px;color:#717182;font-size:12px;font-weight:600;">▲<span>0</span></button>
          <button class="qa-delete" title="Delete question" style="background:none;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:4px 8px;cursor:pointer;color:#ef4444;font-size:14px;line-height:1;" aria-label="Delete question">🗑</button>
        </div>
      </div>
      <p style="font-size:12px;color:#f97316;margin:6px 0 0;">Asked by You · Just now</p>`;
    qaList.insertBefore(item, qaList.firstChild);
    input.value = '';
  });

  qaList.addEventListener('click', (e) => {
    const upvoteBtn = e.target.closest('.qa-upvote');
    if (upvoteBtn) {
      const current = parseInt(upvoteBtn.dataset.votes || '0', 10);
      upvoteBtn.dataset.votes = current + 1;
      upvoteBtn.querySelector('span').textContent = current + 1;
      upvoteBtn.style.color = '#f97316';
      upvoteBtn.style.borderColor = 'rgba(249,115,22,0.35)';
      return;
    }
    const deleteBtn = e.target.closest('.qa-delete');
    if (deleteBtn) {
      const qaItem = deleteBtn.closest('.qa-item');
      qaItem.style.transition = 'opacity 0.3s, transform 0.3s';
      qaItem.style.opacity = '0';
      qaItem.style.transform = 'translateX(20px)';
      setTimeout(() => qaItem.remove(), 300);
    }
  });
}

/* ── Feedback star rating + submit ── */
function initFeedbackPanel() {
  const stars = document.querySelectorAll('.star-btn');
  const form  = document.getElementById('feedback-form');
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

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit-feedback');
    const comment   = document.getElementById('feedback-comment')?.value?.trim() || '';

    if (!selectedStar) {
      alert('Please select a star rating before submitting.');
      return;
    }

    // Read logged-in attendee from localStorage
    let user = {};
    try { user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('wevents_user') || '{}'); } catch(_) {}

    // Read event context from sessionStorage (set when attendee joins session)
    const eventId = sessionStorage.getItem('active_event_id') ||
                    sessionStorage.getItem('rsvp_event_id')    ||
                    new URLSearchParams(window.location.search).get('eventId') || 'e1';

    const payload = {
      eventId,
      attendeeId:    user.id    || 'guest_' + Date.now(),
      attendeeEmail: user.email || sessionStorage.getItem('rsvp_email') || 'guest@wevents.com',
      rating:        selectedStar,
      comment,
    };

    if (submitBtn) {
      submitBtn.textContent = 'Submitting…';
      submitBtn.disabled    = true;
    }

    try {
      const res = await fetch('http://localhost:3000/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', role: 'attendee' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Backend error: ' + res.status);
      }

      const saved = await res.json();
      console.log('[Feedback] ✅ Saved to backend:', saved);

      if (submitBtn) {
        submitBtn.textContent = '✓ Feedback Submitted!';
        submitBtn.style.background = '#16a34a';
      }
    } catch (err) {
      console.error('[Feedback] POST failed:', err);
      if (submitBtn) {
        submitBtn.textContent = 'Submit Feedback';
        submitBtn.disabled    = false;
        submitBtn.style.background = '';
      }
      alert('Could not save feedback: ' + err.message);
    }
  });
}
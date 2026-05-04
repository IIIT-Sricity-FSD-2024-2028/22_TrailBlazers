/* ═════════════════════════════════════════════════
   script6.js  –  Live Poll – Results (index6.html)
   ═════════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Load Poll Results Dynamically ── */
  const API_BASE = 'http://localhost:3000';
  
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  async function loadActivePollResults() {
    const pollCardBody = document.querySelector('#poll-results-card .poll-card-body');
    if (!pollCardBody) return;

    try {
      const res = await fetch(`${API_BASE}/polls?status=open`, {
        headers: { role: 'attendee' }
      });
      if (!res.ok) throw new Error('Failed to fetch polls');
      const polls = await res.json();
      
      if (!Array.isArray(polls) || !polls.length) {
        pollCardBody.innerHTML = '<p class="poll-question">No active poll results at this time.</p>';
        return;
      }

      const poll = polls[0];
      const lastVoted = sessionStorage.getItem('last_voted_option');
      let totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
      
      let html = `
        <h3 class="poll-question">${escapeHtml(poll.question)}</h3>
        <p class="poll-total-votes">Total votes: ${totalVotes}</p>
        <ol class="results-list" aria-label="Poll results">
      `;

      poll.options.forEach((opt, idx) => {
        const votes = opt.votes || 0;
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
        
        const isVoted = (opt.label === lastVoted);
        const itemClass = isVoted ? 'result-item result-item--voted' : 'result-item';
        const labelClass = isVoted ? 'result-label result-label--voted' : 'result-label';
        const fillClass = isVoted ? 'progress-fill progress-fill--voted' : 'progress-fill';
        const labelText = isVoted ? `${escapeHtml(opt.label)} (Your vote)` : escapeHtml(opt.label);

        html += `
          <li class="${itemClass}" id="result-${idx}">
            <div class="result-meta-row">
              <span class="${labelClass}">${labelText}</span>
              <span class="result-count">${votes} (${percentage}%)</span>
            </div>
            <div class="progress-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="${percentage}%">
              <div class="${fillClass}" style="width: 0%;" data-target="${percentage}%"></div>
            </div>
          </li>
        `;
      });
      
      html += `</ol>`;
      pollCardBody.innerHTML = html;

      // Animate progress bars
      const fills = pollCardBody.querySelectorAll('.progress-fill');
      fills.forEach(fill => {
        const target = fill.getAttribute('data-target');
        fill.getBoundingClientRect(); // Trigger reflow
        requestAnimationFrame(() => {
          fill.style.transition = 'width 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)';
          fill.style.width = target;
        });
      });
      
    } catch (err) {
      console.warn('[Poll Results] Error loading data:', err.message);
    }
  }

  loadActivePollResults();


  /* ── Tab switching ── */
  const tabBtns   = document.querySelectorAll('.tab-btn');
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
      });
    });
  });

  tabPanels.forEach((p, i) => { p.style.display = i === 0 ? '' : 'none'; });

  /* ── Back button ── */
  document.getElementById('btn-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index5.html';
  });

  /* ─────────────────────────────────────
     Q&A Panel – submit + upvote
  ───────────────────────────────────── */
  const qaForm  = document.getElementById('qa-form');
  const qaInput = document.getElementById('qa-input');
  const qaList  = document.getElementById('qa-list');

  qaForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = qaInput.value.trim();
    if (!text) return;

    const item = document.createElement('div');
    item.className = 'qa-item';
    item.style.cssText = 'background:#fff7ed;border:1px solid rgba(249,115,22,0.2);border-radius:10px;padding:14px 16px;position:relative;';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <p style="font-size:14px;font-weight:500;color:#0f172a;line-height:1.5;margin:0;">${text}</p>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="qa-upvote" data-votes="0"
            style="display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:1px solid rgba(0,0,0,.1);border-radius:6px;padding:4px 8px;cursor:pointer;min-width:40px;color:#717182;font-size:12px;font-weight:600;">
            ▲<span>0</span>
          </button>
          <button class="qa-delete" title="Delete question" style="background:none;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:4px 8px;cursor:pointer;color:#ef4444;font-size:14px;line-height:1;" aria-label="Delete question">🗑</button>
        </div>
      </div>
      <p style="font-size:12px;color:#f97316;margin:6px 0 0;">Asked by You · Just now</p>`;
    if (qaList) qaList.insertBefore(item, qaList.firstChild);
    qaInput.value = '';
  });

  // Upvote & delete delegation
  qaList?.addEventListener('click', (e) => {
    // Upvote — one vote per question only
    const upvoteBtn = e.target.closest('.qa-upvote');
    if (upvoteBtn) {
      if (upvoteBtn.dataset.voted === 'true') return;
      upvoteBtn.dataset.voted = 'true';
      const n = parseInt(upvoteBtn.dataset.votes || '0', 10) + 1;
      upvoteBtn.dataset.votes = n;
      upvoteBtn.querySelector('span').textContent = n;
      upvoteBtn.style.color       = '#f97316';
      upvoteBtn.style.borderColor = 'rgba(249,115,22,0.35)';
      upvoteBtn.style.cursor      = 'default';
      upvoteBtn.title             = 'You already voted';
      return;
    }
    // Delete
    const deleteBtn = e.target.closest('.qa-delete');
    if (deleteBtn) {
      const qaItem = deleteBtn.closest('.qa-item');
      qaItem.style.transition = 'opacity 0.3s, transform 0.3s';
      qaItem.style.opacity = '0';
      qaItem.style.transform = 'translateX(20px)';
      setTimeout(() => qaItem.remove(), 300);
    }
  });

  /* ─────────────────────────────────────
     Feedback Panel – star rating + submit
  ───────────────────────────────────── */
  const stars   = document.querySelectorAll('.star-btn');
  const fbForm  = document.getElementById('feedback-form');
  let selectedStar = 0;

  function highlightStars(n) {
    stars.forEach(b => {
      b.style.color = parseInt(b.dataset.star) <= n ? '#f97316' : '#e5e7eb';
    });
  }

  stars.forEach(btn => {
    btn.addEventListener('mouseenter', () => highlightStars(parseInt(btn.dataset.star)));
    btn.addEventListener('mouseleave', () => highlightStars(selectedStar));
    btn.addEventListener('click', () => {
      selectedStar = parseInt(btn.dataset.star);
      highlightStars(selectedStar);
    });
  });

  fbForm?.addEventListener('submit', async (e) => {
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

    // Read event context from sessionStorage or URL
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
});
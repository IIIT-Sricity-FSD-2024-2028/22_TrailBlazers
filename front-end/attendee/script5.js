/* ═══════════════════════════════════════════════
   script5.js  –  Live Poll – Voting (index5.html)
   ═══════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

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

  /* Show first panel */
  tabPanels.forEach((p, i) => { p.style.display = i === 0 ? '' : 'none'; });

  /* ── Load active poll from backend and render options ── */
  const pollForm  = document.getElementById('poll-form');
  const submitBtn = document.getElementById('btn-submit-vote');
  const API_BASE = 'http://localhost:3000';

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('wevents_user') || '{}');
    } catch (_) {
      return {};
    }
  }

  function getAttendeeIdentity() {
    const params = new URLSearchParams(window.location.search);
    const user = getStoredUser();
    const email = params.get('email') ||
                  sessionStorage.getItem('rsvp_email') ||
                  sessionStorage.getItem('attendee_email') ||
                  user.email ||
                  '';
    const attendeeId = params.get('userId') ||
                       sessionStorage.getItem('rsvp_attendee_id') ||
                       sessionStorage.getItem('attendee_userId') ||
                       user.id ||
                       (email ? email.split('@')[0] : '');
    const name = params.get('name') ||
                 sessionStorage.getItem('rsvp_name') ||
                 sessionStorage.getItem('attendee_name') ||
                 user.name ||
                 'You';
    return { email, attendeeId, name };
  }

  function getActiveEventId() {
    return sessionStorage.getItem('active_event_id') ||
           sessionStorage.getItem('rsvp_event_id') ||
           new URLSearchParams(window.location.search).get('eventId') ||
           'e1';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  }

  async function loadActivePoll() {
    const pollQuestion = document.querySelector('.poll-question');
    const pollOptions  = document.getElementById('poll-options');
    if (!pollQuestion || !pollOptions) return;

    try {
      const res   = await fetch(`${API_BASE}/polls?status=open`, {
        headers: { role: 'attendee' }
      });
      if (!res.ok) throw new Error('Failed to fetch polls');
      const polls = await res.json();
      if (!Array.isArray(polls) || !polls.length) {
        pollQuestion.textContent = 'No active poll at this time.';
        return;
      }

      const poll = polls[0]; // use the first open poll
      pollForm.dataset.pollId = poll.id;

      // Render question
      pollQuestion.textContent = poll.question;

      // Render real options from backend — use data-label to avoid HTML entity encoding issues
      pollOptions.innerHTML = poll.options.map((opt, i) => `
        <label class="radio-label" for="opt-${i}">
          <input class="radio-input" type="radio" name="poll" id="opt-${i}"
                 value="opt-${i}" data-label="${escapeHtml(opt.label)}" />
          <span class="radio-dot" aria-hidden="true"></span>
          <span class="radio-text">${escapeHtml(opt.label)}</span>
        </label>
      `).join('');

      // Re-attach highlight listeners after re-rendering
      document.querySelectorAll('.radio-label').forEach(label => {
        label.addEventListener('click', () => {
          document.querySelectorAll('.radio-label').forEach(l => l.classList.remove('selected'));
          label.classList.add('selected');
        });
      });

      console.log('[Poll] Loaded poll:', poll.id, '-', poll.question);
    } catch (err) {
      console.warn('[Poll] Could not load from backend, using static options:', err.message);
    }
  }

  loadActivePoll();

  /* ── Poll form submission ── */
  pollForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selected = pollForm.querySelector('input[type="radio"]:checked');
    if (!selected) {
      showInlineError('Please select an option before voting.');
      return;
    }
    clearInlineError();

    // pollId from dynamic load above; fallback to sessionStorage or URL param
    const pollId        = pollForm.dataset.pollId ||
                          sessionStorage.getItem('active_poll_id') ||
                          new URLSearchParams(window.location.search).get('pollId') || '';
    const attendee = getAttendeeIdentity();
    const attendeeEmail = attendee.email || 'attendee@wevents.com';
    const attendeeId    = attendee.attendeeId || 'guest_' + Date.now();
    // Read raw label from data-label attribute to avoid HTML entity encoding issues (&amp; etc.)
    const optionLabel   = selected.dataset.label || selected.value;

    if (submitBtn) {
      submitBtn.textContent = 'Submitting…';
      submitBtn.disabled = true;
    }

    if (!pollId) {
      console.warn('[Poll] No pollId found — cannot save to backend. Navigating anyway.');
      showInlineError('No active poll was found. Please refresh and try again.');
      if (submitBtn) { submitBtn.textContent = 'Submit Vote'; submitBtn.disabled = false; }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', role: 'attendee' },
        body: JSON.stringify({
          voterEmail:  attendeeEmail,
          option:      optionLabel,
          attendeeId:  attendeeId,
        })
      });

      if (!res.ok && res.status !== 409) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Vote failed. Please try again.');
      }

      const result = await res.json().catch(() => ({}));
      console.log('[Poll] ✅ Vote saved. Response:', result.response || result);
    } catch (err) {
      console.warn('[Poll] Vote was not saved:', err.message);
      showInlineError(err.message || 'Vote failed. Please try again.');
      if (submitBtn) { submitBtn.textContent = 'Submit Vote'; submitBtn.disabled = false; }
      return;
    }

    // Navigate to results page
    sessionStorage.setItem('last_voted_option', optionLabel);
    setTimeout(() => { window.location.href = 'index6.html'; }, 300);
  });


  /* ── Radio highlight on selection ── */
  document.querySelectorAll('.radio-label').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.radio-label').forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
    });
  });

  /* ── Inline error helper ── */
  function showInlineError(msg) {
    let err = document.getElementById('poll-error');
    if (!err) {
      err = document.createElement('p');
      err.id = 'poll-error';
      err.style.cssText = 'color:#ef4444; font-size:13px; margin-top:-8px;';
      submitBtn?.parentNode.insertBefore(err, submitBtn);
    }
    err.textContent = msg;
  }
  function clearInlineError() {
    document.getElementById('poll-error')?.remove();
  }

  function showQaError(msg) {
    let err = document.getElementById('qa-error');
    const askBtn = document.getElementById('btn-ask');
    if (!err) {
      err = document.createElement('p');
      err.id = 'qa-error';
      err.style.cssText = 'color:#ef4444; font-size:13px; margin:0;';
      askBtn?.closest('div')?.insertAdjacentElement('afterend', err);
    }
    err.textContent = msg;
  }

  function clearQaError() {
    document.getElementById('qa-error')?.remove();
  }

  /* ── Back button ── */
  document.getElementById('btn-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    history.length > 1 ? history.back() : (window.location.href = 'index4.html');
  });

  /* ── Load existing questions from backend on page load ── */
  const qaForm  = document.getElementById('qa-form');
  const qaInput = document.getElementById('qa-input');
  const qaList  = document.getElementById('qa-list');

  function renderQnaItem(q, isNew = false) {
    const item = document.createElement('div');
    item.className = 'qa-item';
    item.dataset.questionId = q.id || '';
    item.style.cssText = `background:${isNew ? '#fff7ed' : '#f8f6f2'};border:1px solid ${isNew ? 'rgba(249,115,22,0.2)' : 'rgba(0,0,0,0.06)'};border-radius:10px;padding:14px 16px;position:relative;`;
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <p style="font-size:14px;font-weight:500;color:#0f172a;line-height:1.5;margin:0;">${escapeHtml(q.question)}</p>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="qa-upvote" data-votes="0"
            style="display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:1px solid rgba(0,0,0,.1);border-radius:6px;padding:4px 8px;cursor:pointer;min-width:40px;color:#717182;font-size:12px;font-weight:600;">
            ▲<span>0</span>
          </button>
          ${isNew ? `<button class="qa-delete" title="Delete question" style="background:none;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:4px 8px;cursor:pointer;color:#ef4444;font-size:14px;line-height:1;" aria-label="Delete question">🗑</button>` : `<button class="qa-delete" title="Delete question" style="background:none;border:1px solid rgba(239,68,68,0.2);border-radius:6px;padding:4px 8px;cursor:pointer;color:#ef4444;font-size:13px;line-height:1;opacity:0.7;" aria-label="Delete question">🗑</button>`}
        </div>
      </div>
      <p style="font-size:12px;color:#f97316;margin:6px 0 0;">Asked by ${escapeHtml(q.askedBy || 'You')} · ${isNew ? 'Just now' : new Date(q.createdAt).toLocaleTimeString()}</p>
      ${q.answer ? `<div style="background:#f0fdf4;border-radius:8px;padding:10px;font-size:13px;color:#166534;border-left:3px solid #22c55e;margin-top:8px;"><strong>Answer:</strong> ${escapeHtml(q.answer)}</div>` : '<p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">Awaiting answer…</p>'}
    `;
    return item;
  }

  async function loadExistingQna() {
    if (!qaList) return;
    const eventId = getActiveEventId();
    try {
      const res = await fetch(`${API_BASE}/qna?eventId=${eventId}`, {
        headers: { role: 'attendee' }
      });
      if (!res.ok) return;
      const questions = await res.json();

      // Always clear static HTML mock items and replace with real backend data
      qaList.innerHTML = '';

      if (!Array.isArray(questions) || !questions.length) {
        qaList.innerHTML = '<p style="font-size:13px;color:#94a3b8;text-align:center;padding:16px 0;">No questions yet. Be the first to ask!</p>';
        return;
      }

      questions.forEach(q => qaList.appendChild(renderQnaItem(q, false)));
    } catch (err) {
      console.warn('[Q&A] Could not load existing questions:', err.message);
    }
  }

  loadExistingQna();

  // Allow pressing Enter in the question input to submit (since we removed the <form> element)
  qaInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('btn-ask')?.click();
    }
  });

  document.getElementById('btn-ask')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const text = qaInput?.value.trim();
    if (!text) return;

    const attendee = getAttendeeIdentity();
    const askBtn = document.getElementById('btn-ask');
    clearQaError();

    // Use fallback email — don't block if not set
    const askedByEmail = attendee.email || 'attendee@wevents.com';

    if (askBtn) {
      askBtn.textContent = 'Asking...';
      askBtn.disabled = true;
    }

    let saved;
    try {
      const res = await fetch(`${API_BASE}/qna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', role: 'attendee' },
        body: JSON.stringify({
          eventId: getActiveEventId(),
          question: text,
          askedBy: askedByEmail,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Question could not be saved. Please try again.');
      }

      saved = await res.json();
      console.log('[Q&A] ✅ Question saved to backend:', saved);
    } catch (err) {
      console.warn('[Q&A] Question was not saved:', err.message);
      showQaError(err.message || 'Question could not be saved. Please try again.');
      if (askBtn) {
        askBtn.textContent = 'Ask';
        askBtn.disabled = false;
      }
      return;
    }

    // Remove "no questions" placeholder if present
    const placeholder = qaList?.querySelector('p');
    if (placeholder && !placeholder.classList.contains('qa-item')) placeholder.remove();

    // Render new question at the top using shared helper
    const newItem = renderQnaItem({
      id: saved.id,
      question: text,
      askedBy: attendee.name || askedByEmail,
      answer: null,
      createdAt: new Date().toISOString(),
    }, true);

    if (qaList) qaList.insertBefore(newItem, qaList.firstChild);
    qaInput.value = '';
    if (askBtn) {
      askBtn.textContent = 'Ask';
      askBtn.disabled = false;
    }
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
      const qnaId  = qaItem?.dataset.questionId;

      // Animate out first for instant feedback
      qaItem.style.transition = 'opacity 0.3s, transform 0.3s';
      qaItem.style.opacity = '0';
      qaItem.style.transform = 'translateX(20px)';

      // Call backend DELETE
      if (qnaId) {
        fetch(`${API_BASE}/qna/${qnaId}`, {
          method: 'DELETE',
          headers: { role: 'attendee' },
        })
          .then(res => {
            if (!res.ok) console.warn('[Q&A] Delete returned status', res.status, 'for', qnaId);
            else console.log('[Q&A] ✅ Deleted from backend:', qnaId);
          })
          .catch(err => console.warn('[Q&A] Delete request failed:', err.message));
      }

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

  document.getElementById('btn-submit-feedback')?.addEventListener('click', async (e) => {
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


  /* ── Sidebar navigation ── */
  document.getElementById('nav-home')?.addEventListener('click', (e) => {
    e.preventDefault(); navTo('index1.html');
  });
  document.getElementById('nav-browse')?.addEventListener('click', (e) => {
    e.preventDefault(); navTo('index2.html');
  });
  document.getElementById('nav-myevents')?.addEventListener('click', (e) => {
    e.preventDefault(); navTo('index3.html');
  });
});

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

  /* ── Poll form submission → go to results page ── */
  const pollForm   = document.getElementById('poll-form');
  const submitBtn  = document.getElementById('btn-submit-vote');

  pollForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const selected = pollForm.querySelector('input[type="radio"]:checked');
    if (!selected) {
      showInlineError('Please select an option before voting.');
      return;
    }
    clearInlineError();
    // Animate button
    if (submitBtn) {
      submitBtn.textContent = 'Submitting…';
      submitBtn.disabled = true;
    }
    setTimeout(() => { window.location.href = 'index6.html'; }, 600);
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

  /* ── Back button ── */
  document.getElementById('btn-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    history.length > 1 ? history.back() : (window.location.href = 'index4.html');
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
    item.style.cssText = 'background:#fff7ed;border:1px solid rgba(249,115,22,0.2);border-radius:10px;padding:14px 16px;';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <p style="font-size:14px;font-weight:500;color:#0f172a;line-height:1.5;margin:0;">${text}</p>
        <button class="qa-upvote" data-votes="0"
          style="display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:1px solid rgba(0,0,0,.1);border-radius:6px;padding:4px 8px;cursor:pointer;min-width:40px;color:#717182;font-size:12px;font-weight:600;">
          ▲<span>0</span>
        </button>
      </div>
      <p style="font-size:12px;color:#f97316;margin:6px 0 0;">Asked by You · Just now</p>`;
    if (qaList) qaList.insertBefore(item, qaList.firstChild);
    qaInput.value = '';
  });

  // Upvote delegation — one vote per question only
  qaList?.addEventListener('click', (e) => {
    const btn = e.target.closest('.qa-upvote');
    if (!btn) return;
    if (btn.dataset.voted === 'true') return; // Already voted
    btn.dataset.voted = 'true';
    const n = parseInt(btn.dataset.votes || '0', 10) + 1;
    btn.dataset.votes = n;
    btn.querySelector('span').textContent = n;
    btn.style.color       = '#f97316';
    btn.style.borderColor = 'rgba(249,115,22,0.35)';
    btn.style.cursor      = 'default';
    btn.title             = 'You already voted';
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

  fbForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit-feedback');
    if (submitBtn) {
      submitBtn.textContent = '✓ Feedback Submitted!';
      submitBtn.style.background = '#16a34a';
      submitBtn.disabled = true;
    }
  });


  /* ── Sidebar navigation ── */
  document.getElementById('nav-home')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index1.html';
  });
  document.getElementById('nav-browse')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index2.html';
  });
  document.getElementById('nav-myevents')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = 'index3.html';
  });
});

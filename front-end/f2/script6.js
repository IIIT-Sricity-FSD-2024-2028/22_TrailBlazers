/* ═════════════════════════════════════════════════
   script6.js  –  Live Poll – Results (index6.html)
   ═════════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Animate progress bars on load ── */
  const fills = document.querySelectorAll('.progress-fill');
  fills.forEach(fill => {
    const target = fill.style.width;   // e.g. "36.8%"
    fill.style.width = '0%';           // start from 0
    // Trigger reflow so transition fires
    fill.getBoundingClientRect();
    requestAnimationFrame(() => {
      fill.style.transition = 'width 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)';
      fill.style.width = target;
    });
  });

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
});

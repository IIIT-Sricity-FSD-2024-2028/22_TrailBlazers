/* ════════════════════════════════════════════
   script8.js  –  OTP Verification (index8.html)
   ════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const slots    = Array.from(document.querySelectorAll('.otp-slot'));
  const form     = document.getElementById('otp-form');
  const verifyBtn= document.getElementById('btn-verify');
  const resendBtn= document.getElementById('btn-resend');
  const backBtn  = document.getElementById('btn-back');
  const closeBtn = document.getElementById('btn-close-dialog');
  const phoneEl  = document.querySelector('.verify-phone');

  /* ── Show the phone from session ── */
  const phone = sessionStorage.getItem('rsvp_phone');
  if (phone && phoneEl) phoneEl.textContent = phone;

  /* ── OTP slot auto-advance & backspace ── */
  slots.forEach((slot, i) => {
    slot.addEventListener('input', () => {
      slot.value = slot.value.replace(/\D/g, '').slice(-1);
      slot.style.borderColor = slot.value ? 'var(--orange, #f97316)' : '';
      if (slot.value && i < slots.length - 1) slots[i + 1].focus();
    });

    slot.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!slot.value && i > 0) {
          slots[i - 1].value = '';
          slots[i - 1].focus();
        } else {
          slot.value = '';
          slot.style.borderColor = '';
        }
      }
      if (e.key === 'ArrowLeft'  && i > 0)              slots[i - 1].focus();
      if (e.key === 'ArrowRight' && i < slots.length-1) slots[i + 1].focus();
    });

    slot.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      pasted.split('').slice(0, slots.length).forEach((ch, j) => {
        if (slots[j]) { slots[j].value = ch; slots[j].style.borderColor = '#f97316'; }
      });
      const nextIndex = Math.min(pasted.length, slots.length - 1);
      slots[nextIndex].focus();
    });
  });

  /* ── Resend Code with 60-second countdown ── */
  let resendTimer = null;
  function startResendCooldown() {
    let seconds = 60;
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.style.opacity = '0.5';
      resendBtn.style.cursor  = 'not-allowed';
    }
    const updateLabel = () => {
      if (resendBtn) resendBtn.textContent = `Resend Code (${seconds}s)`;
    };
    updateLabel();
    resendTimer = setInterval(() => {
      seconds--;
      updateLabel();
      if (seconds <= 0) {
        clearInterval(resendTimer);
        if (resendBtn) {
          resendBtn.textContent = 'Resend Code';
          resendBtn.disabled = false;
          resendBtn.style.opacity = '';
          resendBtn.style.cursor  = '';
        }
      }
    }, 1000);
  }

  resendBtn?.addEventListener('click', () => {
    slots.forEach(s => { s.value = ''; s.style.borderColor = ''; });
    slots[0]?.focus();
    clearError();
    showToast('A new code has been sent to your phone.');
    startResendCooldown();
  });

  /* ── Form submission ── */
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = slots.map(s => s.value).join('');

    if (code.length < slots.length) {
      showError('Please enter all 6 digits of the OTP.');
      return;
    }
    clearError();

    // Animate button
    if (verifyBtn) {
      verifyBtn.textContent = 'Verifying…';
      verifyBtn.disabled = true;
    }

    // In a real app you'd POST to a backend here.
    // For demo: any 6-digit code is accepted.
    setTimeout(() => {
      sessionStorage.setItem('otp_verified', 'true');
      sessionStorage.setItem('rsvp_confirmed', 'true');

      // ── Save RSVP'd event to localStorage so My Events can show it ──
      const eventTitle = sessionStorage.getItem('rsvp_event') || 'Tech Innovation Summit';
      const eventDate  = sessionStorage.getItem('rsvp_event_date') || 'Sun, Mar 15, 2026 • 9:00 AM – 6:00 PM';
      const eventLoc   = sessionStorage.getItem('rsvp_event_location') || 'Bengaluru International Convention Centre';
      const eventAtt   = sessionStorage.getItem('rsvp_event_attendees') || '342 / 500';
      const eventBadge = sessionStorage.getItem('rsvp_event_badge') || 'Technology';
      const eventImg   = sessionStorage.getItem('rsvp_event_img') || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80';

      const events = JSON.parse(localStorage.getItem('rsvp_events') || '[]');
      // Avoid duplicates
      const alreadyAdded = events.some(e => e.title === eventTitle);
      if (!alreadyAdded) {
        events.push({
          title:    eventTitle,
          date:     eventDate,
          location: eventLoc,
          attendees: eventAtt,
          img:      eventImg,
          badge:    eventBadge,
          rsvpedAt: new Date().toISOString()
        });
        localStorage.setItem('rsvp_events', JSON.stringify(events));
      }

      window.location.href = 'index9.html';
    }, 800);
  });

  /* ── Back button ── */
  backBtn?.addEventListener('click', () => {
    window.location.href = 'index7.html';
  });
  closeBtn?.addEventListener('click', () => {
    window.location.href = 'index4.html';
  });

  /* ── Helper: inline error ── */
  function showError(msg) {
    let el = document.getElementById('otp-error');
    if (!el) {
      el = document.createElement('p');
      el.id = 'otp-error';
      el.style.cssText = 'color:#ef4444; font-size:13px; text-align:center; margin-top:-4px;';
      form.insertBefore(el, form.querySelector('.form-actions'));
    }
    el.textContent = msg;
  }
  function clearError() { document.getElementById('otp-error')?.remove(); }

  /* ── Toast ── */
  function showToast(msg) {
    let t = document.getElementById('otp-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'otp-toast';
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

  /* ── Focus first slot on load ── */
  slots[0]?.focus();
});

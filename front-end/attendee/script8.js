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

  /* ── Read attendee email from URL param first, then sessionStorage ── */
  const urlParams   = new URLSearchParams(window.location.search);
  const urlEmail    = urlParams.get('email') || '';
  const urlName     = urlParams.get('name')  || '';
  // Ensure sessionStorage is populated for script8 backend call
  if (urlEmail && !sessionStorage.getItem('rsvp_email')) {
    sessionStorage.setItem('rsvp_email', urlEmail);
  }
  if (urlName && !sessionStorage.getItem('rsvp_name')) {
    sessionStorage.setItem('rsvp_name', urlName);
  }

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
    // For demo: any 6-digit code is accepted — then we RSVP via backend.
    setTimeout(async () => {
      const eventId    = sessionStorage.getItem('rsvp_event_id');
      const attendeeName  = sessionStorage.getItem('rsvp_name');
      const attendeeEmail = sessionStorage.getItem('rsvp_email');
      const attendeePhone = sessionStorage.getItem('rsvp_phone');

      try {
        const res = await fetch('http://localhost:3000/rsvps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', role: 'attendee' },
          body: JSON.stringify({
            eventId,
            name:  attendeeName,
            email: attendeeEmail,
            phone: attendeePhone
          })
        });

        if (res.ok) {
          const data = await res.json();
          // Store ticket code for confirmation page
          sessionStorage.setItem('rsvp_ticket_code', data.ticketCode || '');
          sessionStorage.setItem('otp_verified', 'true');
          sessionStorage.setItem('rsvp_confirmed', 'true');
          window.location.href = 'index9.html' + window.location.search;
        } else if (res.status === 409) {
          // Already RSVP'd — still let them see the confirmation
          sessionStorage.setItem('otp_verified', 'true');
          sessionStorage.setItem('rsvp_confirmed', 'true');
          window.location.href = 'index9.html' + window.location.search;
        } else {
          const err = await res.json().catch(() => ({}));
          showError(err.message || 'RSVP failed. Please try again.');
          if (verifyBtn) { verifyBtn.textContent = 'Verify OTP'; verifyBtn.disabled = false; }
        }
      } catch (fetchErr) {
        console.warn('RSVP backend not reachable — proceeding in demo mode');
        sessionStorage.setItem('otp_verified', 'true');
        sessionStorage.setItem('rsvp_confirmed', 'true');
        window.location.href = 'index9.html' + window.location.search;
      }
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
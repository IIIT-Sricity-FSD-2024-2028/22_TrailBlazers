/* ═══════════════════════════════════════════════════
   script9.js  –  Event Ticket Confirmation (index9.html)

   After the user closes the ticket, redirect to Event
   Detail (index4) so they can now access sessions.
   ═══════════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Guard: if arrived without completing OTP, bounce back ── */
  const isVerified = sessionStorage.getItem('otp_verified') === 'true';
  const isRsvpConfirmed = sessionStorage.getItem('rsvp_confirmed') === 'true';

  if (!isVerified && !isRsvpConfirmed) {
    window.location.href = 'index7.html';
    return;
  }

  /* ── Pre-fill contact details from sessionStorage ── */
  const email = sessionStorage.getItem('rsvp_email');
  const phone = sessionStorage.getItem('rsvp_phone');

  const emailVal    = document.querySelector('#contact-email .contact-val');
  const phoneVal    = document.querySelector('#contact-phone .contact-val');
  const confirmNote = document.querySelector('.confirm-note');

  if (email && emailVal)    emailVal.textContent    = email;
  if (phone && phoneVal)    phoneVal.textContent    = phone;
  if (email && confirmNote) confirmNote.textContent = `A confirmation email has been sent to ${email}`;

  /* ── Animate success icon on load ── */
  const icon = document.querySelector('.success-icon-wrap');
  if (icon) {
    icon.style.transform  = 'scale(0)';
    icon.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { icon.style.transform = 'scale(1)'; })
    );
  }

  /* ── Download Ticket (print) ── */
  document.getElementById('btn-download')?.addEventListener('click', () => {
    window.print();
  });

  /* ── Close → go to My Events (event now listed there) ── */
  function closeAndEnterEvent() {
    sessionStorage.removeItem('rsvp_name');
    sessionStorage.removeItem('rsvp_email');
    sessionStorage.removeItem('rsvp_phone');
    window.location.href = 'index3.html';
  }

  document.getElementById('btn-close-action')?.addEventListener('click', closeAndEnterEvent);
  document.getElementById('btn-close-dialog')?.addEventListener('click', closeAndEnterEvent);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAndEnterEvent();
  });

  /* ── Print styles ── */
  const ps = document.createElement('style');
  ps.textContent = `
    @media print {
      body { background: white; }
      .dialog-wrapper { display: block; padding: 0; }
      .dialog { box-shadow:none; border:none; max-width:100%; margin:0; padding:16px; }
      .dialog-close, .ticket-actions, .confirm-note { display: none; }
    }
  `;
  document.head.appendChild(ps);
});
